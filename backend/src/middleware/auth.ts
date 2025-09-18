import type{ NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { createResponse } from '../utils/helperFunctions.ts';
import { PrismaClient } from '@prisma/client/edge';
import type { IUser } from '../types/interfaces.ts';

declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

const prisma = new PrismaClient();

export async function auth(req: Request, res: Response, next: NextFunction) {
    try {
        const { token } = req.cookies;
        if (!token) {
            throw new Error("No token provided. Please login again.");
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("JWT_SECRET is not defined in environment variables.");
        }

        const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload;

        if (!decoded || typeof decoded === 'string' || !decoded.userId) {
            throw new Error("Invalid token payload.");
        }

        const userId = decoded.userId;

        const user: IUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            throw new Error("User not found. Please login again.");
        }

        req.user = user;
        next();

    } catch (error: any) {
        console.error("Error caught:", error.message, "\nStack:", error.stack);

        const response = createResponse(
            error.message || "Unexpected error during authentication",
            null
        );

        if (!res.headersSent) {
            res.status(401).json(response);
        }
    }
}
