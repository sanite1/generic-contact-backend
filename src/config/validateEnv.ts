import logger from "./logger";

interface EnvVariable {
  name: string;
  required: boolean;
  phase: string;
}

const envVariables: EnvVariable[] = [
  { name: "NODE_ENV", required: false, phase: "1" },
  { name: "PORT", required: false, phase: "1" },
  { name: "MONGODB_URI", required: true, phase: "1" },
  { name: "JWT_SECRET", required: true, phase: "1" },
  // Default SMTP transport — used whenever a company profile has no SMTP creds.
  { name: "AUTH_EMAIL", required: true, phase: "1" },
  { name: "AUTH_PASS", required: true, phase: "1" },
  { name: "SMTP_HOST", required: false, phase: "1" },
  { name: "SMTP_PORT", required: false, phase: "1" },
  { name: "DEFAULT_FROM_NAME", required: false, phase: "1" },
  { name: "DOMAIN_NAME", required: false, phase: "1" },
  { name: "CORS_ORIGINS", required: false, phase: "1" },
  // Optional third-party keys (only used by the inherited user/auth feature).
  { name: "CLOUD_NAME", required: false, phase: "2" },
  { name: "CLOUDINARY_API_KEY", required: false, phase: "2" },
  { name: "CLOUDINARY_API_SECRET", required: false, phase: "2" },
];

export const validateEnv = (): void => {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const envVar of envVariables) {
    const value = process.env[envVar.name];
    if (!value || value.trim() === "" || value.trim() === "xxx") {
      if (envVar.required) missing.push(envVar.name);
      else warnings.push(`${envVar.name} (Phase ${envVar.phase})`);
    }
  }

  if (warnings.length > 0) {
    logger.warn(
      `Optional env variables not configured: ${warnings.join(", ")}`,
    );
  }

  if (missing.length > 0) {
    logger.error(
      `FATAL: Missing required environment variables: ${missing.join(", ")}`,
    );
    logger.error(
      "Server cannot start. Please check your .env file against .env.example",
    );
    process.exit(1);
  }

  logger.info("Environment variables validated successfully");
};
