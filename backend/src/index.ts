import { PrismaClient } from '@prisma/client'; // or from your custom location
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function testConnection() {
  try {
    const users = await prisma.user.findMany(); // Example query, assuming you have a `user` table
    console.log(users);
  } catch (error) {
    console.error('Error connecting to the database:', error);
  } finally {
    await prisma.$disconnect(); // Close the Prisma connection
  }
}

testConnection();
