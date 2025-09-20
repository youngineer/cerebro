import { PrismaClient } from '@prisma/client';
import type { IApiResponse, IArticle, IResearchServices, IServiceResponse } from "../types/interfaces.ts";
import { getEnvVar } from "../utils/helperFunctions.ts";
import { AI_PROMPT, NEWSAPI_URL } from "../utils/constants.ts";
import puppeteer from 'puppeteer';
import researchProcessingQueue from '../configs/queue.ts';

const prisma = new PrismaClient();


export class ResearchServices implements IResearchServices {

    async postResearch(userId: string, payload: string[]): Promise<IServiceResponse> {
        if(payload.length < 1 || payload.every(content => content.trim() === "")) {
            return {
                success: false,
                message: "Empty query received",
                content: null
            }
        }

        let topic: string = payload[0]!;
        for(let i = 1; i < payload.length; ++i) {
            topic += " ";
            topic += payload[i];
        }

        try {
            const researchTopic = await prisma.researchTopic.create({
                data: {
                    topic: topic,
                    userId: userId
                }
            });

            await prisma.workflowLog.create({
                data: {
                    researchTopicId: researchTopic.id,
                    step: "1",
                    message: `Research initiation commenced for the topic: ${topic}.`
                }
            });

            // Queue the background job
            const job = await researchProcessingQueue.add(topic, {
                researchTopicId: researchTopic.id,
                payload,
                userId
            });

            return {
                success: true,
                message: "Research queued for processing",
                content: { 
                    researchTopicId: researchTopic.id, 
                    jobId: job.id,
                    status: "PENDING"
                }
            }
        } catch (error: any) {
            return {
                success: false,
                message: error.message || "An error occurred during research",
                content: null
            }
        }
            
    }

    async executeResearch(researchTopicId: string, payload: string[], userId: string): Promise<IServiceResponse> {
        try {
            const articleObj: Partial<IArticle>[] = await this.getNewsContent(payload);
            await prisma.workflowLog.create({
                data: {
                    researchTopicId: researchTopicId,
                    step: "2",
                    message: `Relevant articles for the query have been successfully retrieved.`
                }
            });
            const fullContent: string[] = articleObj.map((article) => article.description || "");
            
            if (fullContent.length === 0 || fullContent.every(content => content.trim() === "")) {
                return {
                    success: false,
                    message: "No article content was successfully extracted",
                    content: null
                };
            }

            await prisma.researchTopic.update({
                where: {
                    id: researchTopicId
                },
                data: {
                    status: 'IN_PROGRESS'
                }
            })

            await prisma.workflowLog.create({
                data: {
                    researchTopicId: researchTopicId,
                    step: "3",
                    message: `Full articles have been successfully fetched for the query.`
                }
            });

            const aiResponse: string = await this.getAiResponse(payload, fullContent);

            let aiResponseJson;
            try {
                aiResponseJson = JSON.parse(aiResponse);
            } catch (err: any) {
                const startIdx = aiResponse.indexOf('{');
                const endIdx = aiResponse.lastIndexOf('}') + 1;

                if (startIdx === -1 || endIdx === 0) {
                    throw new Error("No valid JSON found in AI response");
                }

                const rawJson = aiResponse.slice(startIdx, endIdx);
                
                try {
                    aiResponseJson = JSON.parse(rawJson);
                } catch (parseErr: any) {
                    throw new Error("Failed to parse AI response JSON: " + parseErr.message);
                }
            }

            await prisma.workflowLog.create({
                data: {
                    researchTopicId: researchTopicId,
                    step: "4",
                    message: `Successfully completed the generation of summaries and tokenization.`
                }
            });

            await prisma.researchTopic.update({
                where: {
                    id: researchTopicId
                },
                data: {
                    status: "COMPLETED"
                }
            });

            // Ensure we have valid data for the database
            const summaries = aiResponseJson?.summaries || aiResponseJson?.overallSummary || "No summary available";
            const keywords = aiResponseJson?.keywords || [];

            const researchResult = await prisma.researchResult.create({
                data: {
                    researchTopicId: researchTopicId,
                    summaries: summaries,
                    keywords: keywords
                }
            })
            
            return {
                success: true,
                message: "Research completed successfully",
                content: researchResult
            }
        } catch (error: any) {
            return {
                success: false,
                message: error.message || "An error occurred during research",
                content: null
            }
        }
    }

    async getTopics(): Promise<IServiceResponse> {
        try {
            const topics = await prisma.researchTopic.findMany({
                orderBy: {
                    createdAt: 'desc'
                },
                select: {
                    id: true,
                    topic: true,
                    status: true,
                    createdAt: true
                }
            });

            if (!topics || topics.length < 1) {
                return {
                    success: false,
                    message: "No topics added yet",
                    content: null
                }
            }

            return {
                success: true,
                message: "Topics fetched successfully!",
                content: topics
            }
        } catch (error: any) {
            return { 
                success: false, 
                message: error.message || "Error fetching topics", 
                content: null 
            };
        }
    }

    async getResearch(researchId?: string | null): Promise<IServiceResponse> {
        try {
            if (!researchId) {
                return {
                    success: false,
                    message: "Research ID is required",
                    content: null
                }
            }

            const research = await prisma.researchTopic.findUnique({
                where: {
                    id: researchId
                },
                select: {
                    id: true,
                    topic: true,
                    status: true,
                    createdAt: true,
                    logs: {
                        orderBy: { createdAt: 'asc' }
                    },
                    result: true,
                    user: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            });


            if (!research) {
                return {
                    success: false,
                    message: "Research not found",
                    content: null
                }
            }

            return {
                success: true,
                message: "Research fetched successfully!",
                content: research
            }
        } catch (error: any) {
            return { 
                success: false, 
                message: error.message || "Error fetching research", 
                content: null 
            };
        }
    }

    private async getNewsContent(query: string[]): Promise<Partial<IArticle>[]> {
        let keywords: string = query[0]!;
        for (let i = 1; i < query.length; ++i) {
            keywords += "%" + query[i];
        }

        try {
            const newsApiKey: string = getEnvVar("NEWSAPI_APIKEY");

            const url: string = NEWSAPI_URL + keywords;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    "Authorization": `Bearer ${newsApiKey}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) throw new Error("Error fetching data from NewsAPI");

            const data = await response.json() as IApiResponse;

            if (data && Array.isArray(data.articles)) {
                
                const articleObj: Partial<IArticle>[] = await Promise.allSettled(
                    data.articles.map(async (article: IArticle) => {
                        const description = await this.fetchNews(article.url, article.description || "");

                        return {
                            publishedAt: article.publishedAt,
                            title: article.title,
                            url: article.url,
                            description: description
                        };
                    })
                ).then(results => 
                    results
                        .filter(result => result.status === 'fulfilled')
                        .map(result => (result as PromiseFulfilledResult<Partial<IArticle>>).value)
                );

                return articleObj;
            } else {
                throw new Error('Articles not found or malformed');
            }

        } catch (error: any) {
            throw new Error("Failed to fetch news content");
        }
    }

    private async fetchNews(url: string, targetText: string): Promise<string> {
        let browser;
        try {
            browser = await puppeteer.launch({ 
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
            });
            const page = await browser.newPage();
            
            page.setDefaultNavigationTimeout(10000); // max exec time
            page.setDefaultTimeout(10000);
            
            // avoid bot detection
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

            // navigate with timeout and error handling
            try {
                await page.goto(url, { 
                    waitUntil: "domcontentloaded",
                    timeout: 10000
                });
            } catch (navigationError: any) {
                return targetText; // Return original description if navigation fails
            }

            // extract article content using common selectors
            const articleText = await page.evaluate(() => {
                const doc = (globalThis as any).document;
                
                // common article content selectors
                const selectors = [
                    'article',
                    '[role="article"]',
                    '.article-content',
                    '.post-content',
                    '.entry-content',
                    '.content',
                    'main p',
                    '.article-body',
                    '.story-body',
                    '.article-text'
                ];

                for (const selector of selectors) {
                    const element = doc.querySelector(selector);
                    if (element && element.textContent && element.textContent.trim().length > 100) {
                        return element.textContent.trim();
                    }
                }

                // fallback
                const paragraphs = doc.querySelectorAll('p');
                const texts: string[] = [];
                
                for (let i = 0; i < paragraphs.length; i++) {
                    const p = paragraphs[i];
                    const txt = p.textContent?.trim();
                    if (txt && txt.length > 50) {
                        texts.push(txt);
                    }
                }

                return texts.length > 0 ? texts.join(" ") : "";
            });

            return articleText || targetText;
        } catch (error: any) {
            return targetText;
        } finally {
            if (browser) {
                try {
                    await browser.close();
                } catch (closeError) {
                    // Silent error handling for browser cleanup
                }
            }
        }
    }

    private async getAiResponse(query: string[], content: string[]): Promise<string> {
        try {
            let targetTopic: string = query[0]!;
            for(let i = 1; i < query.length; ++i) {
                targetTopic += " " + query[i];
            }

            const prompt: string = AI_PROMPT + `Research topic: ${targetTopic}
            content: ${content}`;
            
            const apiKey = getEnvVar("OPENROUTER_APIKEY");
            
            // abortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

            const requestBody = {
                model: 'deepseek/deepseek-chat-v3.1:free',
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ]
            };

            const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost:3000',
                    'X-Title': 'Cerebro Research Service'
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });

            clearTimeout(timeoutId); // Clear the timeout if request completes

            if(!aiResponse.ok) {
                const errorText = await aiResponse.text();
                throw new Error(`Error fetching ai response: ${aiResponse.status} ${aiResponse.statusText} - ${errorText}`);
            }

            const data = await aiResponse.json() as any;
            
            if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
                return data.choices[0].message.content;
            } else {
                throw new Error("Invalid response format from OpenRouter API");
            }

        } catch (error: any) {
            if (error.name === 'AbortError') {
                throw new Error("AI API request timed out. Please try again.");
            }
            throw error;
        }
    }

}


export default new ResearchServices();