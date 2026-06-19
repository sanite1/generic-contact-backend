// Silence the noisy `url.parse()` deprecation (DEP0169) emitted by the MongoDB
// driver's internals during connection negotiation. It is third-party and
// harmless; every other warning is passed through unchanged.
const _emitWarning = process.emitWarning.bind(process);
process.emitWarning = ((warning: unknown, ...args: unknown[]) => {
  const opts = args[0];
  const code =
    (opts && typeof opts === "object" && (opts as { code?: string }).code) ||
    (typeof args[2] === "string" ? (args[2] as string) : (args[1] as string));
  if (code === "DEP0169") return;
  return (_emitWarning as (...a: unknown[]) => void)(warning, ...args);
}) as typeof process.emitWarning;

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
  // Uncaught exceptions leave the process in an undefined state — not safe to continue.
  setTimeout(() => process.exit(1), 1000);
});

process.on("unhandledRejection", (reason) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  const code = (reason as NodeJS.ErrnoException)?.code;

  const RECOVERABLE_CODES = [
    "ECONNRESET",
    "ECONNREFUSED",
    "ETIMEDOUT",
    "EPIPE",
    "EAI_AGAIN",
    "EADDRNOTAVAIL",
    "ENETUNREACH",
    "EHOSTUNREACH",
    "ENOTFOUND",
    "ECONNABORTED",
    "ERR_SOCKET_CONNECTION_TIMEOUT",
  ];

  const isRecoverable =
    (code && RECOVERABLE_CODES.includes(code)) ||
    RECOVERABLE_CODES.some((c) => message.includes(c));

  if (isRecoverable) {
    console.error(
      `UNHANDLED REJECTION (recoverable — ${code || "no code"}):`,
      message,
    );
    return;
  }

  console.error("UNHANDLED REJECTION (non-recoverable):", reason);
  setTimeout(() => process.exit(1), 1000);
});

import dotenv from "dotenv";
dotenv.config();
import { connectDb } from "./config/db";
import { validateEnv } from "./config/validateEnv";
import logger from "./config/logger";
import app from "./app";

// ── Validate environment variables ──
validateEnv();

const PORT = process.env.PORT || 4000;

// ── Connect database ── (fire-and-forget, not awaited)
connectDb();

app.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
});
