import express from 'express'
import type { Request, Response, Router } from "express";
import { auth } from '../middleware/auth.ts';
import { createResponse } from '../utils/helperFunctions.ts';
import researchServices from '../services/researchServices.ts';


const researchController: Router = express.Router();


researchController.post("/research", auth, async(req: Request, resp: Response): Promise<void>  => {
    try {
        const {query} = req?.body;
        const op = await researchServices.postResearch(query);

        resp.status(200).json(createResponse("Sucess", op));
    } catch (error: any) {
        console.error("Error caught:", error.message, "\nStack:", error.stack);
        resp.status(500).json(createResponse(error, null));
    }
});



export default researchController;