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