import { Joi, validate } from "express-validation";
import { Types } from "mongoose";

const createUserSchema = {
  body: Joi.object({
    firstname: Joi.string().min(2).required(),
    lastname: Joi.string().required(),
    email: Joi.string().email().required(),
    phoneNumber: Joi.string().required(),
    password: Joi.string().min(6).required(), // Minimum length for security
    role: Joi.string()
      .valid("admin", "instructor", "student")
      .default("student"),
    profilePicture: Joi.string().uri().optional(), // Must be a valid URL
    isVerified: Joi.boolean().default(false),
    isActive: Joi.boolean().default(true),
  }),
};

const updateUserSchema = {
  body: Joi.object({
    firstname: Joi.string().min(2),
    lastname: Joi.string(),
    phoneNumber: Joi.string(),
    role: Joi.string().valid("admin", "instructor", "student"),
    profilePicture: Joi.string().uri(),
    isVerified: Joi.boolean(),
    isActive: Joi.boolean(),
  }),
  params: Joi.object({
    id: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),
  }),
};
const getUserByIdSchema = {
  params: Joi.object({
    id: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),
  }),
};
const loginUserSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};
const verifyUserSchema = {
  params: Joi.object({
    id: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),
    token: Joi.string().required(),
  }),
};
const resetPasswordSchema = {
  params: Joi.object({
    id: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),
    token: Joi.string().required(),
  }),
  body: Joi.object({
    password: Joi.string().required(),
  }),
};
const updatePasswordSchema = {
  params: Joi.object({
    id: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),
  }),
  body: Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().required(),
    confirmNewPassword: Joi.string().required(),
  }),
};

const forgotPasswodSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
  }),
};
const refreshTokenSchema = {
  body: Joi.object({
    token: Joi.string().required(),
  }),
};
const sendEmailSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
    user: Joi.string().email().required(),
  }),
};
export const createUserValidation = () => {
  return validate(createUserSchema, { context: true }, { abortEarly: false });
};
export const sendEmailValidation = () => {
  return validate(sendEmailSchema, { context: true }, { abortEarly: false });
};
export const updateUserValidation = () => {
  return validate(updateUserSchema, { context: true }, { abortEarly: false });
};
export const getUserByIdValidation = () => {
  return validate(getUserByIdSchema, { context: true }, { abortEarly: false });
};
export const loginUserValidation = () => {
  return validate(loginUserSchema, { context: true }, { abortEarly: false });
};

export const refreshTokenValidation = () => {
  return validate(refreshTokenSchema, { context: true }, { abortEarly: false });
};
export const forgotPasswordValidation = () => {
  return validate(
    forgotPasswodSchema,
    { context: true },
    { abortEarly: false },
  );
};

export const verifyUserValidation = () => {
  return validate(verifyUserSchema, { context: true }, { abortEarly: false });
};

export const resetPassswordValidation = () => {
  return validate(
    resetPasswordSchema,
    { context: true },
    { abortEarly: false },
  );
};

export const updatePassswordValidation = () => {
  return validate(
    updatePasswordSchema,
    { context: true },
    { abortEarly: false },
  );
};
