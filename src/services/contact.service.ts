import ApiError from "../errors/apiError";
import ApiResponse from "../errors/apiResponse";
import PaginatedResponse from "../errors/paginatedResponse";
import {
  IContactMessagesQuery,
  ISubmitContactRequest,
  ContactStatus,
} from "../interfaces/contact.interface";
import { ICompanyProfile } from "../interfaces/company.interface";
import CompanyProfile from "../models/CompanyProfile";
import ContactMessage from "../models/ContactMessage";
import defaultTransporter, {
  createCompanyTransporter,
} from "../services/nodemailer/nodemailer";
import {
  sendContactAutoReplyMail,
  sendContactNotificationMail,
} from "../services/nodemailer/mail.service";

const DEFAULT_AUTH_EMAIL = process.env.AUTH_EMAIL || "";

/** Picks the company's own transport when SMTP creds exist, else the default. */
const resolveMailer = (company: ICompanyProfile) => {
  if (
    company.smtp &&
    company.smtp.host &&
    company.smtp.user &&
    company.smtp.pass
  ) {
    return {
      mailer: createCompanyTransporter(company.smtp),
      senderAddress: company.smtp.user,
    };
  }
  return { mailer: defaultTransporter, senderAddress: DEFAULT_AUTH_EMAIL };
};

/** Turns arbitrary metadata into label/value rows for the notification email. */
const metadataToFields = (metadata?: Record<string, any>) => {
  if (!metadata) return [];
  return Object.entries(metadata).map(([key, value]) => ({
    label: key,
    value: typeof value === "string" ? value : JSON.stringify(value),
  }));
};

export const submitContactService = async (
  companyId: string,
  data: ISubmitContactRequest,
) => {
  const company = await CompanyProfile.findById(companyId);
  if (!company) throw new ApiError(404, "Company not found");
  if (!company.isActive) {
    throw new ApiError(
      403,
      "This company is not accepting messages at the moment",
    );
  }

  // Persist first — the message is the source of truth even if email fails.
  const saved = await ContactMessage.create({
    companyId: company._id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    subject: data.subject,
    message: data.message,
    metadata: data.metadata || {},
  });

  const { mailer, senderAddress } = resolveMailer(company);
  const from = `"${company.fromName || company.name}" <${senderAddress}>`;
  const submittedAt = new Date().toISOString();

  // Both emails are awaited (not fire-and-forget): on serverless the function
  // instance is frozen the moment the response is sent, so un-awaited sends get
  // killed before the SMTP handshake completes. The mail helpers swallow their
  // own errors, so a failed send still won't break this request.
  await Promise.all([
    // 1) Notify the company (Reply-To set to the sender so they can reply directly).
    sendContactNotificationMail(mailer, from, company.contactEmail, {
      companyName: company.name,
      name: data.name,
      email: data.email,
      phone: data.phone,
      subject: data.subject,
      message: data.message,
      submittedAt,
      fields: metadataToFields(data.metadata),
      logoUrl: company.branding?.logoUrl,
      primaryColor: company.branding?.primaryColor,
    }),

    // 2) Auto-reply to the sender confirming receipt.
    sendContactAutoReplyMail(
      mailer,
      from,
      data.email,
      {
        companyName: company.name,
        name: data.name,
        message: data.message,
        logoUrl: company.branding?.logoUrl,
        primaryColor: company.branding?.primaryColor,
        supportEmail: company.supportEmail || company.contactEmail,
        autoReplyMessage: company.autoReplyMessage,
      },
      company.replyToEmail || company.contactEmail,
    ),
  ]);

  return new ApiResponse(201, "Message received", { id: saved._id });
};

export const listMessagesService = async (
  companyId: string,
  query: IContactMessagesQuery,
) => {
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 20;

  const filter: Record<string, any> = { companyId };
  if (query.status) filter.status = query.status;

  const [items, totalItems] = await Promise.all([
    ContactMessage.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    ContactMessage.countDocuments(filter),
  ]);

  return PaginatedResponse.build(
    items.map((m) => m.toJSON()),
    totalItems,
    page,
    pageSize,
    "Messages retrieved successfully",
  );
};

export const getMessageService = async (id: string) => {
  const message = await ContactMessage.findById(id);
  if (!message) throw new ApiError(404, "Message not found");
  return new ApiResponse(200, "Message found", message.toJSON());
};

export const updateMessageStatusService = async (
  id: string,
  status: ContactStatus,
) => {
  const message = await ContactMessage.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true },
  );
  if (!message) throw new ApiError(404, "Message not found");
  return new ApiResponse(200, "Message status updated", message.toJSON());
};
