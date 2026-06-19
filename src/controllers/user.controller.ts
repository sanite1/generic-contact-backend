import ApiError from "../errors/apiError";
import ApiResponse from "../errors/apiResponse";
import { ExpresFunction, IdParam } from "../interfaces/helper.interface";
import {
  CreateUserRequest,
  IPasswordReset,
  ISendEmail,
  IUserLogin,
  IUserRefresh,
  IUserReset,
  IUserVerify,
} from "../interfaces/user.interface";
import User from "../models/User";
import cloudinary, {
  cloudinaryImageUpload,
} from "../services/cloudinary.service";
import { sendInvoiceMail } from "../services/nodemailer/mail.service";
import {
  createUserService,
  forgotPasswordService,
  getUserByIdService,
  loginService,
  reesetPasswordService,
  refreshService,
  updatePasswordService,
  updateUserService,
  verifyMailService,
} from "../services/user.service";

export const createUser: ExpresFunction<CreateUserRequest> = async (
  req,
  res,
  next,
) => {
  try {
    // Check if user exists
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      throw new ApiError(400, `User with ${user.email} already exists`);
    }

    // Ensure req.files is correctly typed and profilePicture exists
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    if (files && files.profilePicture) {
      const profilePicture = files.profilePicture[0]; // Get the first uploaded file

      if (profilePicture) {
        const profilePictureResult = await cloudinaryImageUpload(
          profilePicture.buffer,
          "Amber_Users",
        );
        req.body.profilePicture = profilePictureResult.secure_url;
      }
    }

    // Create user
    const data = await createUserService(req.body);
    return res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};
export const sendEmailToClient: ExpresFunction<ISendEmail> = async (
  req,
  res,
  next,
) => {
  try {
    if (req.file) {
      const imageResult = await cloudinaryImageUpload(
        req.file.buffer,
        "InvoiceApp_Products",
        "raw",
      );
      await sendInvoiceMail(
        {
          path: imageResult.secure_url,
          filename: "invoice",
        },
        req.body.email,
        req.body.user,
      );

      return res
        .status(201)
        .json(new ApiResponse(200, "Email sent successfully"));
    } else {
      throw new ApiError(400, "No file provided");
    }
  } catch (error) {
    next(error);
  }
};
export const updateUser: ExpresFunction<
  Partial<Omit<CreateUserRequest, "password" | "email">>
> = async (req, res, next) => {
  try {
    // Ensure req.files is correctly typed and profilePicture exists
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    if (files && files.profilePicture) {
      const profilePicture = files.profilePicture[0]; // Get the first uploaded file

      if (profilePicture) {
        const profilePictureResult = await cloudinaryImageUpload(
          profilePicture.buffer,
          "Amber_Users",
        );
        req.body.profilePicture = profilePictureResult.secure_url;
      }
    }
    const data = await updateUserService(req.params as IdParam, req.body);
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const getUserById: ExpresFunction = async (req, res, next) => {
  try {
    const data = await getUserByIdService(req.params as IdParam);
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const login: ExpresFunction<IUserLogin> = async (req, res, next) => {
  try {
    const data = await loginService(req.body);
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
export const refresh: ExpresFunction<IUserRefresh> = async (req, res, next) => {
  try {
    const data = await refreshService(req.body);
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const forgotPassword: ExpresFunction<Pick<IUserLogin, "email">> = async (
  req,
  res,
  next,
) => {
  try {
    const data = await forgotPasswordService(req.body);
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const verifyUser: ExpresFunction = async (req, res, next) => {
  try {
    const data = await verifyMailService(req.params as IUserVerify);
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const resetPassword: ExpresFunction<IUserReset> = async (
  req,
  res,
  next,
) => {
  try {
    const data = await reesetPasswordService(
      req.params as IUserVerify,
      req.body,
    );
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const updatePassword: ExpresFunction<IPasswordReset> = async (
  req,
  res,
  next,
) => {
  try {
    const data = await updatePasswordService(req.params as IdParam, req.body);
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
