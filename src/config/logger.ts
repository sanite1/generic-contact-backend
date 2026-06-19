/**
 * Lightweight console-backed logger that mirrors the winston API used across
 * the reference architecture (`logger.info/warn/error(message, meta?)`).
 *
 * Kept dependency-free on purpose so this contact backend stays slim. If you
 * later need file transports / log rotation, swap this module for the winston
 * implementation from the brief — every call site already uses this signature.
 */

type Meta = Record<string, unknown>;

const timestamp = () => new Date().toISOString();

const format = (level: string, message: string, meta?: Meta) => {
  const metaString =
    meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  return `${timestamp()} [${level}]: ${message}${metaString}`;
};

const logger = {
  info: (message: string, meta?: Meta) =>
    console.log(format("info", message, meta)),
  warn: (message: string, meta?: Meta) =>
    console.warn(format("warn", message, meta)),
  error: (message: string, meta?: Meta) =>
    console.error(format("error", message, meta)),
  debug: (message: string, meta?: Meta) => {
    if (process.env.LOG_LEVEL === "debug") {
      console.debug(format("debug", message, meta));
    }
  },
};

export default logger;
