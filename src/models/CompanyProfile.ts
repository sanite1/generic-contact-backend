import { Schema, model } from "mongoose";
import { ICompanyProfile } from "../interfaces/company.interface";

const smtpSchema = new Schema(
  {
    host: { type: String, required: true, trim: true },
    port: { type: Number, required: true },
    secure: { type: Boolean, default: true },
    user: { type: String, required: true, trim: true },
    pass: { type: String, required: true },
  },
  { _id: false },
);

const brandingSchema = new Schema(
  {
    logoUrl: { type: String, default: "" },
    primaryColor: { type: String, default: "" },
    websiteUrl: { type: String, default: "" },
  },
  { _id: false },
);

const companyProfileSchema = new Schema<ICompanyProfile>(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    contactEmail: { type: String, required: true, lowercase: true, trim: true },
    fromName: { type: String, trim: true },
    replyToEmail: { type: String, lowercase: true, trim: true },
    supportEmail: { type: String, lowercase: true, trim: true },
    autoReplyMessage: { type: String, default: "" },
    branding: { type: brandingSchema, default: () => ({}) },
    smtp: { type: smtpSchema, required: false },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        // Never leak SMTP password over the API.
        if (ret.smtp) delete ret.smtp.pass;
        return ret;
      },
    },
  },
);

const CompanyProfile = model<ICompanyProfile>(
  "CompanyProfile",
  companyProfileSchema,
);
export default CompanyProfile;
