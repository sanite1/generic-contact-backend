import { NextFunction, Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";
import { IUserDecoded } from "../middlewares/authenticatedMiddleWare";

export type ExpresFunction<B = {}, Q = {}> = (
  req: Request<{}, {}, B, Q> & { user?: IUserDecoded },
  res: Response,
  next: NextFunction,
) => void;

export interface IdParam {
  id: Types.ObjectId;
}
export interface IParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  search?: string;
}
