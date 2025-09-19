import { PrismaClient } from '@prisma/client';
import type { IApiResponse, IArticle, IResearchServices, IServiceResponse } from "../types/interfaces.ts";
import { getEnvVar } from "../utils/helperFunctions.ts";
import { AI_PROMPT, NEWSAPI_URL } from "../utils/constants.ts";
import puppeteer from 'puppeteer';


const prisma = new PrismaClient();


export class ResearchServices implements IResearchServices {

    async postResearch(payload: string[]): Promise<IServiceResponse> {
        try {
            const articleObj: Partial<IArticle>[] = await this.getNewsContent(payload);
            const fullContent: string[] = articleObj.map((article) => article.description || "");
            
            if (fullContent.length === 0 || fullContent.every(content => content.trim() === "")) {
                return {
                    success: false,
                    message: "No article content was successfully extracted",
                    content: null
                };
            }

            const aiResponse = await this.getAiResponse(payload, fullContent);
            
            return {
                success: true,
                message: "Research completed successfully",
                content: aiResponse
            }
        } catch (error: any) {
            console.error("Error caught:", error.message, "\nStack:", error.stack);
            return {
                success: false,
                message: error.message || "An error occurred during research",
                content: null
            }
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
            console.error("Error in getNewsContent:", error);
            throw new Error(error.message);
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
                console.warn(`Navigation failed for ${url}:`, navigationError.message);
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
            console.error("Error caught:", error.message, "\nStack:", error.stack);
            return targetText;
        } finally {
            if (browser) {
                try {
                    await browser.close();
                } catch (closeError) {
                    console.warn("Error closing browser:", closeError);
                }
            }
        }
    }

    private async getAiResponse(query: string[], content: string[]) {
        try {
            let targetTopic: string = query[0]!;
            for(let i = 1; i < query.length; ++i) {
                targetTopic += " " + query[i];
            }

            const prompt: string = AI_PROMPT + `Research topic: ${targetTopic}
            content: ${content}`;
            
            console.log(`Prompt length: ${prompt.length} characters`);
            
            const apiKey = getEnvVar("OPENROUTER_APIKEY");
            
            // abortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

            const requestBody = {
                model: 'meta-llama/llama-3.3-8b-instruct:free',
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ]
                // max_tokens: 1000,
                // temperature: 0.7
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
                console.error(`OpenRouter API Error: ${aiResponse.status} ${aiResponse.statusText}`);
                console.error(`Error response body:`, errorText);
                throw new Error(`Error fetching ai response: ${aiResponse.status} ${aiResponse.statusText} - ${errorText}`);
            }

            const data = await aiResponse.json();
            return data;

        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.error("AI API request timed out after 30 seconds");
                throw new Error("AI API request timed out. Please try again.");
            }
            console.error("Error in getAiResponse:", error.message, "\nStack:", error.stack);
            throw error;
        }
    }

}


export default new ResearchServices();