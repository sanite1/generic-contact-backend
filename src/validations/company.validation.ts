import { Joi, validate } from "express-validation";
import { Types } from "mongoose";

const objectId = Joi.string().custom((value, helpers) => {
  if (!Types.ObjectId.isValid(value)) return helpers.error("any.invalid");
  return value;
}, "ObjectId validation");

const smtpSchema = Joi.object({
  host: Joi.string().required(),
  port: Joi.number().required(),
  secure: Joi.boolean(),
  user: Joi.string().required(),
  pass: Joi.string().required(),
});

const brandingSchema = Joi.object({
  logoUrl: Joi.string().uri().allow(""),
  primaryColor: Joi.string().allow(""),
  websiteUrl: Joi.string().uri().allow(""),
});

const createCompanySchema = {
  body: Joi.object({
    name: Joi.string().min(2).required(),
    slug: Joi.string()
      .pattern(/^[a-z0-9-]+$/)
      .message("slug may only contain lowercase letters, numbers and hyphens")
      .required(),
    contactEmail: Joi.string().email().required(),
    fromName: Joi.string(),
    replyToEmail: Joi.string().email(),
    supportEmail: Joi.string().email(),
    autoReplyMessage: Joi.string().allow(""),
    branding: brandingSchema,
    smtp: smtpSchema,
    isActive: Joi.boolean(),
  }),
};

const updateCompanySchema = {
  params: Joi.object({ id: objectId.required() }),
  body: Joi.object({
    name: Joi.string().min(2),
    slug: Joi.string()
      .pattern(/^[a-z0-9-]+$/)
      .message("slug may only contain lowercase letters, numbers and hyphens"),
    contactEmail: Joi.string().email(),
    fromName: Joi.string(),
    replyToEmail: Joi.string().email(),
    supportEmail: Joi.string().email(),
    autoReplyMessage: Joi.string().allow(""),
    branding: brandingSchema,
    smtp: smtpSchema,
    isActive: Joi.boolean(),
  }).min(1),
};

const companyIdSchema = {
  params: Joi.object({ id: objectId.required() }),
};

const listCompaniesSchema = {
  query: Joi.object({
    page: Joi.number().min(1),
    pageSize: Joi.number().min(1).max(100),
    isActive: Joi.boolean(),
    search: Joi.string(),
  }),
};

export const createCompanyValidation = () =>
  validate(createCompanySchema, { context: true }, { abortEarly: false });
export const updateCompanyValidation = () =>
  validate(updateCompanySchema, { context: true }, { abortEarly: false });
export const companyIdValidation = () =>
  validate(companyIdSchema, { context: true }, { abortEarly: false });
export const listCompaniesValidation = () =>
  validate(listCompaniesSchema, { context: true }, { abortEarly: false });
