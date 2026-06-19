import { createTransport, Transporter } from "nodemailer";
import ApiError from "../../errors/apiError";
import { IUser } from "../../interfaces/user.interface";
import transporter from "./nodemailer";
import logger from "../../config/logger";

const DOMAIN_NAME = process.env.DOMAIN_NAME;
const DEFAULT_FROM_NAME = process.env.DEFAULT_FROM_NAME || "Contact";
const DEFAULT_FROM = `"${DEFAULT_FROM_NAME}" <${process.env.AUTH_EMAIL}>`;

export interface MailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

/**
 * The ONE choke point for sending mail. Everything else is a thin wrapper.
 *
 * @param mailer        which transporter to use (default shared, or a per-company one)
 * @param from          RFC "Name <email>" from-header
 * @param to            recipient
 * @param subject       subject line
 * @param template      handlebars template name (e.g. "./contactautoreply", NO extension)
 * @param context       object injected into the {{...}} placeholders
 * @param throwOnError  true only for critical mail; otherwise failures are swallowed
 * @param replyTo       optional Reply-To header
 * @param attachments   optional attachments
 */
export const sendTemplateMail = async (
  mailer: Transporter,
  from: string,
  to: string,
  subject: string,
  template: string,
  context: Record<string, any>,
  throwOnError: boolean = false,
  replyTo?: string,
  attachments?: MailAttachment[],
) => {
  const mailOptions: Record<string, any> = {
    from,
    to,
    subject,
    template,
    context,
  };
  if (replyTo) mailOptions.replyTo = replyTo;
  if (attachments && attachments.length > 0)
    mailOptions.attachments = attachments;
  try {
    await mailer.sendMail(mailOptions);
    logger.info(`Email sent: "${subject}" to ${to}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Failed to send email: "${subject}" to ${to}`, { error: msg });
    if (throwOnError) throw new ApiError(500, `Error sending email: ${msg}`);
    // else swallow — a failed email never breaks the calling flow
  }
};

// ───────────────────────── Contact feature ─────────────────────────

export interface ContactNotificationContext {
  companyName: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  submittedAt: string;
  fields?: { label: string; value: string }[]; // extra metadata rows
  logoUrl?: string;
  primaryColor?: string;
}

/** Notifies the COMPANY that a new message arrived. Sender's email is set as Reply-To. */
export const sendContactNotificationMail = async (
  mailer: Transporter,
  from: string,
  to: string,
  context: ContactNotificationContext,
) => {
  const subject = context.subject
    ? `New contact message: ${context.subject}`
    : `New contact message from ${context.name}`;
  await sendTemplateMail(
    mailer,
    from,
    to,
    subject,
    "./contactnotification",
    context,
    false,
    context.email, // reply straight to the sender
  );
};

export interface ContactAutoReplyContext {
  companyName: string;
  name: string;
  message: string;
  logoUrl?: string;
  primaryColor?: string;
  supportEmail?: string;
  autoReplyMessage?: string;
}

/** Auto-reply to the SENDER confirming the company received their message. */
export const sendContactAutoReplyMail = async (
  mailer: Transporter,
  from: string,
  to: string,
  context: ContactAutoReplyContext,
  replyTo?: string,
) => {
  await sendTemplateMail(
    mailer,
    from,
    to,
    `${context.companyName}: We've received your message`,
    "./contactautoreply",
    context,
    false,
    replyTo,
  );
};

// ───────────────────── Inherited user/auth feature ─────────────────────

export const sendVerificationMail = async (userInfo: IUser) => {
  await sendTemplateMail(
    transporter,
    DEFAULT_FROM,
    userInfo.email,
    "Verify your email",
    "./verifyemail",
    {
      name: userInfo.lastname,
      email: userInfo.email,
      url: `${DOMAIN_NAME}/verify/${userInfo._id}/${userInfo.verificationToken}`,
    },
    true,
  );
};

export const sendforgotPasswordMail = async (userInfo: IUser) => {
  await sendTemplateMail(
    transporter,
    DEFAULT_FROM,
    userInfo.email,
    "Reset your password",
    "./passwordreset",
    {
      name: userInfo.lastname,
      url: `${DOMAIN_NAME}/reset-password/${userInfo._id}/${userInfo.resetToken}`,
    },
    true,
  );
};

export const sendInvoiceMail = async (
  file: { path: string; filename: string },
  email: string,
  user: string,
) => {
  const mailOptions = {
    from: user,
    to: email,
    subject: "Invoice",
    text: "Please find the attached PDF.",
    attachments: [
      {
        filename: file.filename,
        href: file.path,
        contentType: "application/pdf",
      },
    ],
  };
  try {
    const emailTransporter = createTransport({
      service: "gmail",
      auth: { user: process.env.AUTH_EMAIL, pass: process.env.AUTH_PASS },
    });
    await emailTransporter.sendMail(mailOptions);
  } catch (error) {
    throw new ApiError(500, "Error Sending email");
  }
};
