import type { UUID } from "node:crypto";

export interface ILoginRequest {
    email: string;
    password: string
}

export interface IUser extends ISignupRequest{
    id: string
}


export interface ISignupRequest extends ILoginRequest{
    name: string | null;
}


export interface IServiceResponse extends IBackendResponse {
    success: boolean;
}


export interface IBackendResponse {
    message: string;
    content: any;
}


export interface IJob {
    researchTopicId: string;
    payload: string[];
    userId: string
}


export interface IResearchServices {
    executeResearch(researchTopicId: string, payload: string[], userId: string): Promise<any>;
    postResearch(userId: string, payload: string[]): Promise<IServiceResponse>;
    getTopics(): Promise<IServiceResponse>;
    getResearch(researchId?: string | null): Promise<IServiceResponse>;
}


export interface IArticle {
  source: object;
  author: string | null;
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string;
}

export interface IApiResponse {
  status: string;
  totalResults: number;
  articles: IArticle[];
}
