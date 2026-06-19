import express from "express";
import cors from "cors";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import { requestLogger } from "./middlewares/requestLogger";
import { rateLimiter } from "./middlewares/rateLimiter";
import ApiError from "./errors/apiError";
import userRoutes from "./routes/user.routes";
import companyRoutes from "./routes/company.routes";
import contactRoutes from "./routes/contact.routes";

const app = express();

// ── Ignore stray Socket.IO polling ──
// This backend has no Socket.IO. Frontends that ship socket.io-client will keep
// probing /socket.io/...; short-circuit those quietly so they don't spam the
// logger and 404 error pipeline. (Root cause is the frontend — disable its
// socket client to stop the requests entirely.)
app.use((req, res, next) => {
  if (req.path.startsWith("/socket.io")) {
    res.status(404).end();
    return;
  }
  next();
});

// ── Body parsing ──
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── CORS ── (open to any origin; admin routes are protected by Bearer tokens,
// not cookies, so wildcard origin without credentials is safe)
app.use(cors({ origin: "*" }));

// ── Request logging ──
app.use(requestLogger);

// ── Global IP rate limiting ── (env-tunable)
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX) || 1000;
const RATE_LIMIT_WINDOW_MS =
  Number(process.env.RATE_LIMIT_WINDOW_MS) || 5 * 60 * 1000;
app.use(rateLimiter(RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS));

// ── Health check ──
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "contact-backend",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ── Route mounting (prefix lives ONLY here) ──
app.use("/api/users", userRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/contact", contactRoutes);

// ── 404 handler (funnels into the error pipeline) ──
app.all("*", (req, _res, next) => {
  next(new ApiError(404, `Can't find ${req.originalUrl} on the server!`));
});

// ── Global error handler — MUST be last ──
app.use(globalErrorHandler);

export default app;
