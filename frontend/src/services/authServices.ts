import type { IAuthServices, IBackendResponse, ILoginRequest, ISignupRequest } from "../types/interfaces";
import { BACKEND_URL, HEADER } from "../utils/constants";


const BASE_URL = BACKEND_URL + "/auth";


class AuthService implements IAuthServices {
    async signup(signupPayload: ISignupRequest): Promise<string> {
        const url = BASE_URL + "/signup";
        const request: Request = new Request(url, {
            method: 'POST',
            body: JSON.stringify(signupPayload),
            headers: HEADER,
            credentials: 'include',
        });

        try {
            const response: Response = await fetch(request);
            const data: IBackendResponse = await response.json();

            if(!response.ok) {
                return Promise.reject(data.message || 'Signup failed. Please try again');
            } else {
                return data.message;
            }
        } catch (error: any) {
            return Promise.reject(error);
        }
    }

    async login(loginPayload: ILoginRequest): Promise<IBackendResponse> {
        const url = BASE_URL + "/login";
        const request: Request = new Request(url, {
            method: 'POST',
            body: JSON.stringify(loginPayload),
            headers: HEADER,
            credentials: 'include',
        });

        try {
            const response: Response = await fetch(request);
            const data: IBackendResponse = await response.json();

            if(!response.ok) {
                return Promise.reject(data.message || 'Login failed. Please try again');
            } else {
                return {
                    message: data.message,
                    content: data.content
                }
            }
        } catch (error: any) {
            return Promise.reject(error);
        }
    }

    async logout(): Promise<string> {
        const url = BASE_URL + "/logout";
        const request: Request = new Request(url, {
            method: "GET",
            headers: HEADER,
            credentials: 'include'
        });

        try {
            const response: Response = await fetch(request);
            const data: IBackendResponse = await response.json();

            if(!response.ok) {
                return Promise.reject(data.message || 'Logout failed. Please try again');
            } else {
                return data.message;
            }
        } catch (error) {
            return Promise.reject(error);
        }
    }
};


export default new AuthService();