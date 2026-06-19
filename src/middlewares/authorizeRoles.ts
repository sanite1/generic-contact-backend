import { Request, Response, NextFunction } from "express";
import ApiError from "../errors/apiError";
import { IUserDecoded, UserRole } from "./authenticatedMiddleWare";

/**
 * Role gate. Must run AFTER `isAuthenticated` (which attaches `req.user`).
 * Throws 401 if there is no authenticated user, 403 if their role is not allowed.
 */
export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as Request & { user?: IUserDecoded }).user;
    if (!user) {
      return next(new ApiError(401, "Unauthorized"));
    }
    if (!roles.includes(user.role)) {
      return next(new ApiError(403, "Forbidden — insufficient permissions"));
    }
    next();
  };
};
