
import { Queue } from "bullmq";
import { connection } from "../db/redisconnect.db.js"


export const redisQueue = new Queue( "TaskQueue", {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 5000
        },
        removeOnComplete: { count: 1000 }, // keep last 1000, don't grow forever
        removeOnFail: { count: 1000 }
    }
} )