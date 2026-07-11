
import { Redis } from "ioredis";

export const connection = {
    host: process.env.REDIS_HOST as string,
    port: Number( process.env.REDIS_PORT as string ),
}

export const redis = new Redis( process.env.REDIS_URL as string );