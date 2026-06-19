/**
 * Seeds a pre-verified admin user so you can log in and obtain a JWT
 * immediately, bypassing the email-verification flow.
 *
 * Usage:  npm run seed
 * Configure via env (with sensible defaults):
 *   SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_FIRSTNAME,
 *   SEED_ADMIN_LASTNAME, SEED_ADMIN_PHONE
 */
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import * as bcrypt from "bcrypt";
import { connectDb } from "../config/db";
import User from "../models/User";
import logger from "../config/logger";

const SALT_ROUNDS = 13;

const run = async () => {
  await connectDb();

  const email = (
    process.env.SEED_ADMIN_EMAIL || "admin@example.com"
  ).toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";
  const firstname = process.env.SEED_ADMIN_FIRSTNAME || "Admin";
  const lastname = process.env.SEED_ADMIN_LASTNAME || "User";
  const phoneNumber = process.env.SEED_ADMIN_PHONE || "0000000000";

  const existing = await User.findOne({ email });
  if (existing) {
    // Make sure the existing account is a usable admin.
    existing.role = "admin";
    existing.verified = true;
    existing.isActive = true;
    await existing.save();
    logger.info(
      `Admin already existed — ensured verified admin role: ${email}`,
    );
    await mongoose.disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  await User.create({
    firstname,
    lastname,
    email,
    phoneNumber,
    password: hashedPassword,
    role: "admin",
    verified: true,
    isActive: true,
  });

  logger.info(`Seeded admin user: ${email}`);
  logger.warn("If you used the default password, change it after first login.");
  await mongoose.disconnect();
};

run().catch((err) => {
  logger.error("Seed failed", {
    message: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
