import { Schema, model } from "mongoose";
import { IContactMessage } from "../interfaces/contact.interface";

const contactMessageSchema = new Schema<IContactMessage>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "CompanyProfile",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: { type: String, default: "" },
    subject: { type: String, default: "" },
    message: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ["new", "read", "resolved"],
      default: "new",
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

contactMessageSchema.index({ companyId: 1, status: 1 });
contactMessageSchema.index({ createdAt: -1 });

const ContactMessage = model<IContactMessage>(
  "ContactMessage",
  contactMessageSchema,
);
export default ContactMessage;
