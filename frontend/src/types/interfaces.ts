export interface ILoginRequest {
    email: string;
    password: string;
}

export interface ISignupRequest extends ILoginRequest {
    name: string;
    confirmPassword: string;
}

export interface IAlertInfo {
    isError: boolean;
    message: string
}


export interface IBackendResponse {
    message: string;
    content: any
}


export interface IAuthServices {
    signup(payload: ISignupRequest): Promise<string>;
    login(payload: ILoginRequest): Promise<IBackendResponse>;
    logout(): Promise<string>;
}


export interface IResearchListDTO {
    id: string;
    status: string;
    topic: string;
    createdAt: Date
}


export interface IResearchServices {
    getResearchList(): Promise<IBackendResponse>;
    getResearch(researchId: string): Promise<IBackendResponse>;
}

export interface ResearchTopic {
    id: string;
    userId: string;
    topic: string;
    status: string;
    createdAt: string;
    logs: ILog[];
    result: IResult;
    user: IUser;
}

export interface ILog {
    id: string;
    step: string;
    message: string;
    createdAt: string;
    researchTopicId: string;
}

export interface IResult {
    id: string;
    summaries: string | ISummary[];
    keywords: string[];
    createdAt: string;
    researchTopicId: string;
}

export interface ISummary {
    title: string;
    summary: string;
}

export interface IUser {
    id: string;
    name: string;
}

export interface IResearchResponse {
    message: string;
    content: ResearchTopic;
}
