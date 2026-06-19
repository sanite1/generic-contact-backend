import { Joi, validate } from "express-validation";
import { Types } from "mongoose";

const objectId = Joi.string().custom((value, helpers) => {
  if (!Types.ObjectId.isValid(value)) return helpers.error("any.invalid");
  return value;
}, "ObjectId validation");

const submitContactSchema = {
  params: Joi.object({ companyId: objectId.required() }),
  body: Joi.object({
    name: Joi.string().min(2).max(200).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().max(50),
    subject: Joi.string().max(300),
    message: Joi.string().min(1).max(5000).required(),
    metadata: Joi.object().unknown(true),
  }),
};

const listMessagesSchema = {
  params: Joi.object({ companyId: objectId.required() }),
  query: Joi.object({
    page: Joi.number().min(1),
    pageSize: Joi.number().min(1).max(100),
    status: Joi.string().valid("new", "read", "resolved"),
    sort: Joi.string(),
  }),
};

const messageIdSchema = {
  params: Joi.object({ id: objectId.required() }),
};

const updateStatusSchema = {
  params: Joi.object({ id: objectId.required() }),
  body: Joi.object({
    status: Joi.string().valid("new", "read", "resolved").required(),
  }),
};

export const submitContactValidation = () =>
  validate(submitContactSchema, { context: true }, { abortEarly: false });
export const listMessagesValidation = () =>
  validate(listMessagesSchema, { context: true }, { abortEarly: false });
export const messageIdValidation = () =>
  validate(messageIdSchema, { context: true }, { abortEarly: false });
export const updateMessageStatusValidation = () =>
  validate(updateStatusSchema, { context: true }, { abortEarly: false });
