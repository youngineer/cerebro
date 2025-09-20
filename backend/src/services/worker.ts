import { redisConnection } from "../configs/queue.ts";
import researchServices from "./researchServices.ts";
import { PrismaClient } from "@prisma/client";
import type { IJob } from "../types/interfaces.ts";
import { Worker, Job } from 'bullmq';

const prisma = new PrismaClient();

const worker = new Worker('process research', 
  async job => {
    
    try {
        await prisma.researchTopic.update({
            where: { id: job.data.researchTopicId },
            data: { status: "IN_PROGRESS" }
        });

        await prisma.workflowLog.create({
            data: {
                researchTopicId: job.data.researchTopicId,
                step: "WORKER_START",
                message: `Background job ${job.id} started processing.`
            }
        });

        // Execute the research pipeline
        const result = await researchServices.executeResearch(
            job.data.researchTopicId, 
            job.data.payload, 
            job.data.userId
        );

        await prisma.workflowLog.create({
            data: {
                researchTopicId: job.data.researchTopicId,
                step: "WORKER_COMPLETE",
                message: `Background job ${job.id} completed successfully.`
            }
        });

        return result;
    } catch (err: any) {
        
        await prisma.researchTopic.update({
            where: { id: job.data.researchTopicId },
            data: { status: "FAILED" }
        });
        
        await prisma.workflowLog.create({
            data: {
                researchTopicId: job.data.researchTopicId,
                step: "WORKER_ERROR",
                message: `Background job ${job.id} failed: ${err.message}`
            }
        });
        
        throw err;
    }
  },
  { connection: redisConnection }
)

// Add event listeners for monitoring
worker.on('failed', (job, err) => {
    // Log critical errors only
    if (err.message.includes('ECONNREFUSED') || err.message.includes('timeout')) {
        console.error(`Worker connection error for job ${job?.id}:`, err.message);
    }
});

worker.on('error', (err) => {
    console.error('Worker error:', err.message);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await worker.close();
    await prisma.$disconnect();
    process.exit(0);
});
