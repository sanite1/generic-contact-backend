import jwt, { JwtPayload } from "jsonwebtoken";
import ApiError from "../errors/apiError";
import { ExpresFunction } from "../interfaces/helper.interface";
import { Request } from "express";
import { Types } from "mongoose";

export type UserRole = "admin" | "instructor" | "student";

export interface IUserDecoded extends JwtPayload {
  id: Types.ObjectId;
  firstname: string;
  lastname: string;
  email: string;
  profilePicture: string;
  role: UserRole;
}
export const isAuthenticated: ExpresFunction = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Unauthorized");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new ApiError(401, "Unauthorized");
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      throw new ApiError(500, "JWT secret is not configured");
    }

    const decoded = jwt.verify(token, JWT_SECRET) as IUserDecoded;

    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      throw new ApiError(401, "Token has expired");
    }

    (req as Request & { user?: IUserDecoded }).user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};
