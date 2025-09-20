import dotenv from 'dotenv'
dotenv.config()

export function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not defined in the environment variables.`);
  }
  return value;
};