
import type { IBackendResponse, IUser } from "../types/interfaces.ts";

export function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not defined in the environment variables.`);
  }
  return value;
};


export function createResponse(message: string, content: any): IBackendResponse {
  return {
    message: message,
    content: content
  }
}



