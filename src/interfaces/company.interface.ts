import { Document, Types } from "mongoose";

/** Per-company SMTP credentials. When absent, the default shared transport is used. */
export interface ICompanySmtp {
  host: string;
  port: number;
  secure?: boolean;
  user: string;
  pass: string;
}

/** Branding applied to the auto-reply email so it looks like it came from the company. */
export interface ICompanyBranding {
  logoUrl?: string;
  primaryColor?: string;
  websiteUrl?: string;
}

export interface ICompanyProfile extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string; // url-safe identifier, unique
  contactEmail: string; // where contact submissions are delivered
  fromName?: string; // display name for the "From" header
  replyToEmail?: string; // optional override for Reply-To on the company notification
  supportEmail?: string; // shown to senders in the auto-reply footer
  autoReplyMessage?: string; // custom body for the auto-reply email
  branding: ICompanyBranding;
  smtp?: ICompanySmtp;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateCompanyRequest {
  name: string;
  slug: string;
  contactEmail: string;
  fromName?: string;
  replyToEmail?: string;
  supportEmail?: string;
  autoReplyMessage?: string;
  branding?: ICompanyBranding;
  smtp?: ICompanySmtp;
  isActive?: boolean;
}

export type IUpdateCompanyRequest = Partial<ICreateCompanyRequest>;
