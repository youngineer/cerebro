import type { IBackendResponse, IResearchServices } from "../types/interfaces";
import { BACKEND_URL, HEADER } from "../utils/constants";


class ResearchService implements IResearchServices {
    async getResearchList(): Promise<IBackendResponse> {
        const url: string = BACKEND_URL + "/research";
        const request: Request = new Request(url, {
            method: 'GET',
            credentials: 'include',
            headers: HEADER
        });

        try {
            const response: Response = await fetch(request);
            const data: IBackendResponse = await response.json();

            if(!response.ok) throw new Error(data?.message || "Error fetching research list");
            return data;
        } catch (error: any) {
            return {
                message: error,
                content: null
            }
        }
    }

    async getUserResearchList(id: string): Promise<IBackendResponse> {
        const url: string = BACKEND_URL + "/user/" + id;
        const request: Request = new Request(url, {
            method: 'GET',
            credentials: 'include',
            headers: HEADER
        });

        try {
            const response: Response = await fetch(request);
            const data: IBackendResponse = await response.json();

            if(!response.ok) throw new Error(data?.message || "Error fetching research list");
            return data;
        } catch (error: any) {
            return {
                message: error,
                content: null
            }
        }
    }

    async getResearch(researchId: string): Promise<IBackendResponse> {
        const url: string = BACKEND_URL + `/research/${researchId}`;
        const request: Request = new Request(url, {
            method: 'GET',
            credentials: 'include',
            headers: HEADER
        });
        try {
            const response: Response = await fetch(request);
            const data: IBackendResponse = await response.json();

            if(!response.ok) throw new Error(data?.message || "Error fetching research");

            return data;
        } catch (error: any) {
            return {
                message: error,
                content: null
            }
        }
    }

    async postResearch(query: string): Promise<IBackendResponse> {
        const url: string = BACKEND_URL + `/research`;
        const request: Request = new Request(url, {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify({ query: query }),
            headers: HEADER
        });
        try {
            const response: Response = await fetch(request);
            const data: IBackendResponse = await response.json();

            if(!response.ok) throw new Error(data?.message || "Error fetching research");

            return data;
        } catch (error: any) {
            return {
                message: error,
                content: null
            }
        }
    }
}


export default new ResearchService();