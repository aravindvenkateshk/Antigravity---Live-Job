import { Redis } from "@upstash/redis";

let redis: Redis;

export function getRedis(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UpstashToken;
    if (!url || !token) {
      throw new Error(
        "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set in environment variables."
      );
    }
    redis = new Redis({ url, token });
  }
  return redis;
}
