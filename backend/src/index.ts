import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { getEnvVar } from './utils/helperFunctions.ts';
import authController from './controllers/authController.ts';
import * as dotenv from 'dotenv';
import researchController from './controllers/researchController.ts';

dotenv.config({ quiet: true});


const PORT: string = getEnvVar("BACKEND_PORT");

const app: express.Application = express();
app.use(
    cors({
        credentials: true, 
        origin: getEnvVar("FRONTEND_URL" )
    })
);

app.use(express.json());
app.use(cookieParser());


app.use(authController);
app.use(researchController);


(async function main(): Promise<void> {
    try {
        app.listen(PORT, () => {
            console.log(`Successfully listening on port: ${PORT}`);
        });
    } catch(e) {
        console.error(`Error while connecting to db: ${e}`);
        process.exit(1);
    }
})();