import { Document, Types } from "mongoose";

export type ContactStatus = "new" | "read" | "resolved";

export interface IContactMessage extends Document {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  metadata: Record<string, any>; // arbitrary extra form fields
  status: ContactStatus;
  createdAt: Date;
  updatedAt: Date;
}

/** Public submission body. `metadata` carries any extra company-specific fields. */
export interface ISubmitContactRequest {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface IContactMessagesQuery {
  page?: number;
  pageSize?: number;
  status?: ContactStatus;
  sort?: string;
}

export interface IUpdateMessageStatusRequest {
  status: ContactStatus;
}
