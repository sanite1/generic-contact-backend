import { createTransport, Transporter } from "nodemailer";
import hbs from "nodemailer-express-handlebars";
import path from "path";
import logger from "../../config/logger";

/**
 * Email transport layer.
 *
 * - `transporter` is the DEFAULT shared transport, built from the AUTH_EMAIL /
 *   AUTH_PASS env credentials. It is used whenever a company profile has no SMTP
 *   credentials of its own.
 * - `createCompanyTransporter()` builds a per-company transport from credentials
 *   stored on the company profile, so mail can originate from the company's own
 *   domain when they provide one.
 *
 * Every transporter gets the Handlebars compile plugin attached so the
 * `template` + `context` mail options render to HTML the same way.
 */

const TEMPLATES_DIR = path.resolve("src/services/nodemailer/templates");

const handlebarOptions = {
  viewEngine: {
    partialsDir: TEMPLATES_DIR,
    defaultLayout: "",
  },
  viewPath: TEMPLATES_DIR,
};

const attachHbs = (t: Transporter): Transporter => {
  t.use("compile", hbs(handlebarOptions));
  return t;
};

export interface SmtpCredentials {
  host: string;
  port: number;
  secure?: boolean;
  user: string;
  pass: string;
}

// ── Default shared transporter (env-configured) ──
const transporter = attachHbs(
  createTransport({
    host: process.env.SMTP_HOST || "smtp.zoho.com",
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
      user: process.env.AUTH_EMAIL,
      pass: process.env.AUTH_PASS,
    },
    tls: { rejectUnauthorized: false },
  }),
);

transporter.verify((error) => {
  if (error)
    logger.error("Default SMTP connection error", { message: error.message });
  else logger.info("Default SMTP server is ready to send messages");
});

/**
 * Build a transporter from a company's own SMTP credentials. Not verified up
 * front (we don't want a bad company config to spam logs on boot) — failures
 * surface when a mail is actually sent.
 */
export const createCompanyTransporter = (
  smtp: SmtpCredentials,
): Transporter => {
  return attachHbs(
    createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure ?? smtp.port === 465,
      auth: { user: smtp.user, pass: smtp.pass },
      tls: { rejectUnauthorized: false },
    }),
  );
};

export default transporter;
