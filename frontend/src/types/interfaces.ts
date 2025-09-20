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