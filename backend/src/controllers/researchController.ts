import express from 'express'
import type { Request, Response, Router } from "express";
import { auth } from '../middleware/auth.ts';
import { createResponse } from '../utils/helperFunctions.ts';
import researchServices from '../services/researchServices.ts';
import type { IServiceResponse } from '../types/interfaces.ts';
import type { tryCatch } from 'bullmq';


const researchController: Router = express.Router();


researchController.post("/research", auth, async(req: Request, resp: Response): Promise<void>  => {
    try {
        const query = req?.body.query;
        const userID = req?.user?.id;
        const serviceResponse: IServiceResponse = await researchServices.postResearch(userID, query);

        resp.status(200).json(createResponse(serviceResponse?.message, serviceResponse));
    } catch (error: any) {
        console.error("Error caught:", error.message, "\nStack:", error.stack);
        resp.status(500).json(createResponse(error, null));
    }
});


researchController.get("/research", auth, async(req: Request, resp: Response) => {
    try {
        const serviceResponse: IServiceResponse = await researchServices.getTopics();

        resp.status(200).json(createResponse(serviceResponse?.message, serviceResponse?.content));
    } catch (error: any) {
        console.error("Error caught:", error.message, "\nStack:", error.stack);
        resp.status(500).json(createResponse(error, null));
    }
});


researchController.get("/research/:researchId", auth, async(req: Request, resp: Response) => {
    const researchId: string = req.params.researchId!;
    try {
        const serviceResponse: IServiceResponse = await researchServices.getResearch(researchId);

        resp.status(200).json(createResponse(serviceResponse?.message, serviceResponse?.content));
    } catch (error: any) {
        console.error("Error caught:", error.message, "\nStack:", error.stack);
        resp.status(500).json(createResponse(error, null));
    }
});


researchController.get("/user/:userId", auth, async(req: Request, resp: Response) => {
    const userId: string = req?.params.userId!;
    try {
        const serviceResponse: IServiceResponse = await researchServices.getUserTopics(userId);

        resp.status(200).json(createResponse(serviceResponse?.message, serviceResponse?.content));
    } catch (error: any) {
        console.error("Error caught:", error.message, "\nStack:", error.stack);
        resp.status(500).json(createResponse(error, null));
    }
})



export default researchController;


    