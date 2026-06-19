import { Request, Response, NextFunction } from "express";
import ApiError from "../errors/apiError";
import logger from "../config/logger";

/**
 * In-memory rate limiter. The reference architecture backs this with Redis and
 * falls back to memory; this contact backend keeps things dependency-free and
 * uses memory only. The public API (`rateLimiter` + `strictRateLimiter`) is
 * identical, so swapping in the Redis version later requires no call-site
 * changes. Both fail OPEN on internal error.
 */

interface MemoryEntry {
  count: number;
  resetTime: number;
}

const memoryStore: Record<string, MemoryEntry> = {};

setInterval(
  () => {
    const now = Date.now();
    for (const key in memoryStore) {
      if (memoryStore[key].resetTime < now) delete memoryStore[key];
    }
  },
  5 * 60 * 1000,
);

const checkRateLimit = (key: string, maxRequests: number, windowMs: number) => {
  const now = Date.now();
  if (!memoryStore[key] || memoryStore[key].resetTime < now) {
    memoryStore[key] = { count: 1, resetTime: now + windowMs };
    return { allowed: true, current: 1, resetAt: memoryStore[key].resetTime };
  }
  memoryStore[key].count++;
  return {
    allowed: memoryStore[key].count <= maxRequests,
    current: memoryStore[key].count,
    resetAt: memoryStore[key].resetTime,
  };
};

type KeyStrategy = "ip" | "user" | "user+ip";

const resolveKey = (
  req: Request,
  prefix: string,
  strategy: KeyStrategy,
): string => {
  const ip = req.ip || req.headers["x-forwarded-for"]?.toString() || "unknown";
  const user = (req as any).user;
  const userId = user?.id?.toString() || user?._id?.toString();
  switch (strategy) {
    case "user":
      return `${prefix}:${userId || ip}`;
    case "user+ip":
      return `${prefix}:${userId || "anon"}:${ip}`;
    default:
      return `${prefix}:${ip}`;
  }
};

export const rateLimiter = (maxRequests = 500, windowMs = 15 * 60 * 1000) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = resolveKey(req, "global", "ip");
    try {
      const result = checkRateLimit(key, maxRequests, windowMs);
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader(
        "X-RateLimit-Remaining",
        Math.max(0, maxRequests - result.current),
      );
      res.setHeader("X-RateLimit-Reset", Math.ceil(result.resetAt / 1000));
      if (!result.allowed) {
        logger.warn(`Global rate limit exceeded`, {
          key,
          current: result.current,
          limit: maxRequests,
        });
        return next(
          new ApiError(429, "Too many requests — please try again later"),
        );
      }
      next();
    } catch (err) {
      logger.error(
        `Rate limiter error: ${err instanceof Error ? err.message : "Unknown"}`,
      );
      next(); // fail open
    }
  };
};

export const strictRateLimiter = (options: {
  prefix: string;
  maxRequests: number;
  windowMs: number;
  keyStrategy?: KeyStrategy;
  message?: string;
}) => {
  const {
    prefix,
    maxRequests,
    windowMs,
    keyStrategy = "user",
    message,
  } = options;
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = resolveKey(req, prefix, keyStrategy);
    try {
      const result = checkRateLimit(key, maxRequests, windowMs);
      res.setHeader(`X-RateLimit-${prefix}-Limit`, maxRequests);
      res.setHeader(
        `X-RateLimit-${prefix}-Remaining`,
        Math.max(0, maxRequests - result.current),
      );
      res.setHeader(
        `X-RateLimit-${prefix}-Reset`,
        Math.ceil(result.resetAt / 1000),
      );
      if (!result.allowed) {
        logger.warn(`Strict rate limit exceeded: ${prefix}`, {
          key,
          current: result.current,
          limit: maxRequests,
        });
        return next(
          new ApiError(
            429,
            message ||
              `Too many ${prefix} requests — please wait before trying again`,
          ),
        );
      }
      next();
    } catch (err) {
      logger.error(
        `Strict rate limiter (${prefix}) error: ${err instanceof Error ? err.message : "Unknown"}`,
      );
      next(); // fail open
    }
  };
};
