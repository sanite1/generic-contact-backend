import ApiError from "../errors/apiError";
import {
  CreateUserRequest,
  IPasswordReset,
  IUser,
  IUserLogin,
  IUserRefresh,
  IUserReset,
  IUserVerify,
} from "../interfaces/user.interface";
import User from "../models/User";
import * as bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import {
  sendVerificationMail,
  sendforgotPasswordMail,
} from "./nodemailer/mail.service";
import jwt from "jsonwebtoken";
import ApiResponse from "../errors/apiResponse";
import { IdParam } from "../interfaces/helper.interface";
import { IUserDecoded } from "../middlewares/authenticatedMiddleWare";

const saltRounds = 13;

export const createUserService = async (data: CreateUserRequest) => {
  const hashedPassword = await bcrypt.hash(data.password, saltRounds);
  data.password = hashedPassword;

  const verificationToken = randomBytes(32).toString("hex");
  const userInfo = { ...data, verificationToken };
  const newUser = await User.create(userInfo);
  await sendVerificationMail(newUser);

  return new ApiResponse(200, "User Created Successfully", newUser.toJSON());
};

export const loginService = async (data: IUserLogin) => {
  const user = await User.findOne({ email: data.email });

  if (!user) {
    throw new ApiError(400, `Invalid Email/Password`);
  }

  const isValidPassword = await bcrypt.compare(data.password, user.password);
  if (!isValidPassword || !user) {
    throw new ApiError(400, `Invalid Email/Password`);
  }

  if (!user.verified) {
    throw new ApiError(400, `Please verify your email`);
  }
  const payload = {
    id: user._id,
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    profilePicture: user.profilePicture,
    role: user.role,
  };
  const JWT_SECRET = process.env.JWT_SECRET;
  if (JWT_SECRET) {
    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: "5h",
    });
    const refreshToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: "6d",
    });
    return new ApiResponse(200, "Login Successfull", {
      accessToken,
      refreshToken,
    });
  }
};
export const refreshService = async (data: IUserRefresh) => {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new ApiError(500, "JWT secret is not configured");
  }
  const decoded = jwt.verify(data.token, JWT_SECRET) as IUserDecoded;

  if (!decoded) {
    throw new ApiError(400, `Invalid Token`);
  }
  if (decoded.exp && decoded.exp * 1000 < Date.now()) {
    throw new ApiError(401, "Refresh Token has expired");
  }
  const user = await User.findById(decoded.id);

  if (!user) {
    throw new ApiError(401, `User not found`);
  }

  const payload = {
    id: user._id,
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    profilePicture: user.profilePicture,
    role: user.role,
  };
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: "5h",
  });

  return new ApiResponse(200, "Refresh successfull", {
    accessToken,
  });
};
export const forgotPasswordService = async (
  data: Pick<IUserLogin, "email">,
) => {
  const user = await User.findOne({ email: data.email });

  if (!user) {
    throw new ApiError(400, `User with ${data.email} does not exist`);
  }
  if (!user.verified) {
    throw new ApiError(400, `Please verify your email`);
  }

  const token = randomBytes(32).toString("hex");
  user.resetToken = token;
  const date = new Date();
  date.setHours(date.getHours() + 1);

  user.resetTokenExpires = date;

  await user.save();

  await sendforgotPasswordMail(user);

  return new ApiResponse(200, "Reset Email Sent Successfully");
};

export const verifyMailService = async (data: IUserVerify) => {
  const user = await User.findOne({
    _id: data.id,
    verificationToken: data.token,
  });
  if (!user) {
    throw new ApiError(400, `User not found`);
  }
  user.verified = true;
  user.verificationToken = undefined;
  await user.save();

  return new ApiResponse(200, "Email Verified Successfully");
};

export const reesetPasswordService = async (
  params: IUserVerify,
  data: IUserReset,
) => {
  const user = await User.findOne({
    _id: params.id,
    resetToken: params.token,
  });
  if (!user) {
    throw new ApiError(400, `User not found`);
  }

  if (
    !user.resetToken ||
    new Date(user.resetToken).getMilliseconds() < new Date().getMilliseconds()
  ) {
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    throw new ApiError(400, `Token has expired`);
  }

  const hashedPassword = await bcrypt.hash(data.password, saltRounds);
  user.resetToken = undefined;
  user.resetTokenExpires = undefined;
  user.password = hashedPassword;

  await user.save();

  return new ApiResponse(200, "Password Reset Successfull");
};

export const updatePasswordService = async (
  params: IdParam,
  data: IPasswordReset,
) => {
  const user = await User.findById(params.id);
  if (!user) {
    throw new ApiError(400, `User not found`);
  }

  const isValidPassword = await bcrypt.compare(data.oldPassword, user.password);
  if (!isValidPassword) {
    throw new ApiError(400, `Old Password Is Invalid`);
  }
  const hashedPassword = await bcrypt.hash(data.newPassword, saltRounds);

  user.password = hashedPassword;

  await user.save();

  return new ApiResponse(200, "Password Reset Successfull");
};
export const updateUserService = async (
  params: IdParam,
  data: Partial<Omit<CreateUserRequest, "password" | "email">>,
) => {
  const user = await User.findByIdAndUpdate(params.id, data, { new: true });
  if (!user) {
    throw new ApiError(400, "Error updating user");
  }
  const payload = {
    id: user._id,
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    profilePicture: user.profilePicture,
  };
  const JWT_SECRET = process.env.JWT_SECRET;
  if (JWT_SECRET) {
    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: "5h",
    });
    const refreshToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: "6d",
    });
    return new ApiResponse(200, "User Updated Successfully", {
      accessToken,
      refreshToken,
    });
  }
};

export const getUserByIdService = async (params: IdParam) => {
  const user = await User.findById(params.id);
  if (!user) {
    throw new ApiError(400, `User not found`);
  }
  return new ApiResponse(200, "User Found", user);
};
