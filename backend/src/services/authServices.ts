import type { IBackendResponse, IServiceResponse, IUser } from "../types/interfaces.ts";
import validator from "validator";
import { hashSync, compareSync } from "bcrypt";
import { PrismaClient } from "../generated/prisma/edge.js";
import jwt from "jsonwebtoken";
import { getEnvVar } from "../utils/helperFunctions.ts";
import * as dotenv from 'dotenv';

dotenv.config({ quiet: true});


interface ILoginRequest {
    email: string;
    password: string
}


interface ISignupRequest extends ILoginRequest{
    name: string;
}

interface IAuthService {
    signup(payload: ISignupRequest): Promise<IServiceResponse>;
    login(payload: ILoginRequest): Promise<IServiceResponse>;
}


const prisma = new PrismaClient();

export class AuthService implements IAuthService {
    async signup(payload: ISignupRequest): Promise<IServiceResponse> {
        try {
            const { name, email, password } = payload;
            if(!validator.isEmail(email)) throw new Error("Invalid email");
            if(!validator.isStrongPassword(password)) throw new Error("Invalid password");
            
            const passwordHash: string = hashSync(password, 12);
            const user = await prisma.user.create({
                data: {
                    name: name,
                    email: email,
                    password: passwordHash,
                },
            });

            return {
                success: true,
                message: "User created successfully",
                content: user,
            };

        } catch (error: any) {
            console.error("Error caught:", error.message, "\nStack:", error.stack);
            return {
                success: false,
                message: error,
                content: null
            }
        }
    }

    async login(payload: ILoginRequest): Promise<IServiceResponse> {
        try {
            const { email, password } = payload;
            const user: IUser = await prisma.user.findUniqueOrThrow({
                where: {
                    email: email
                }
            });

            if(!user) throw new Error("Email not registered");

            const dbPassword: string = user?.password;
            const isPasswordCorrect: boolean = compareSync(password, dbPassword);

            if(!isPasswordCorrect) throw new Error("Invalid credentials");
            
            const jwtSecret: string = getEnvVar("JWT_SECRET");
            const token: string = jwt.sign({ userId: user?.id }, jwtSecret, { expiresIn: '1h' });

            return {
                success: true,
                message: "Login successful!",
                content: {
                    token: token,
                    user: user
                }
            }
        } catch (error: any) {
            console.error("Error caught:", error.message, "\nStack:", error.stack);
            return {
                success: false,
                message: error,
                content: null
            }
        }
    }
}


const authService = new AuthService();
export default authService;