import type { Request, Response, Router } from "express";
import express from 'express'
import type { IBackendResponse, IServiceResponse } from "../types/interfaces.ts";
import authService, { AuthService } from "../services/authServices.ts";
import { createResponse } from "../utils/helperFunctions.ts";


const authController: Router = express.Router();


authController.post("/auth/signup", async (req: Request, resp: Response): Promise<void> => {
    try {
        const serviceResponse: IServiceResponse = await authService.signup(req?.body);

        if(!serviceResponse?.success) throw new Error(serviceResponse?.message);

        resp.status(201).json(createResponse(serviceResponse?.message, null));

    } catch (error: any) {
        console.error(error);
        resp.status(500).json(createResponse(error, null));
    }
});


authController.post("/auth/login", async(req: Request, resp: Response) => {
    try {
        const serviceResponse: IServiceResponse = await authService.login(req?.body);
        if(!serviceResponse?.success) throw new Error(serviceResponse?.message);
        
        const token = serviceResponse?.content?.token;
        resp.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000
        });

        resp.status(200).json(createResponse(serviceResponse?.message, null));
    } catch (error: any) {
        console.error(error);
        resp.status(500).json(createResponse(error, null));
    }
})


authController.get("/auth/logout", async(req: Request, resp: Response): Promise<void> => {
    try {
        resp.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        resp.status(200).json(createResponse("Logout successful!", null));
    } catch (error: any) {
        resp.status(500).json(createResponse("Logout failed", null));
    }
})


export default authController;