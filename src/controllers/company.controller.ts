import { sendResponse } from "../helpers/sendResponse";
import { ExpresFunction } from "../interfaces/helper.interface";
import {
  ICreateCompanyRequest,
  IUpdateCompanyRequest,
} from "../interfaces/company.interface";
import {
  createCompanyService,
  deleteCompanyService,
  getCompanyService,
  listCompaniesService,
  updateCompanyService,
} from "../services/company.service";

export const createCompany: ExpresFunction<ICreateCompanyRequest> = async (
  req,
  res,
  next,
) => {
  try {
    const result = await createCompanyService(req.body);
    sendResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const listCompanies: ExpresFunction = async (req, res, next) => {
  try {
    const result = await listCompaniesService(req.query as any);
    sendResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const getCompany: ExpresFunction = async (req, res, next) => {
  try {
    const result = await getCompanyService((req.params as { id: string }).id);
    sendResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const updateCompany: ExpresFunction<IUpdateCompanyRequest> = async (
  req,
  res,
  next,
) => {
  try {
    const result = await updateCompanyService(
      (req.params as { id: string }).id,
      req.body,
    );
    sendResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const deleteCompany: ExpresFunction = async (req, res, next) => {
  try {
    const result = await deleteCompanyService(
      (req.params as { id: string }).id,
    );
    sendResponse(res, result);
  } catch (error) {
    next(error);
  }
};
