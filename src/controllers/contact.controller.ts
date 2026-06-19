import { sendResponse } from "../helpers/sendResponse";
import { ExpresFunction } from "../interfaces/helper.interface";
import {
  ISubmitContactRequest,
  IUpdateMessageStatusRequest,
} from "../interfaces/contact.interface";
import {
  getMessageService,
  listMessagesService,
  submitContactService,
  updateMessageStatusService,
} from "../services/contact.service";

export const submitContact: ExpresFunction<ISubmitContactRequest> = async (
  req,
  res,
  next,
) => {
  try {
    const { companyId } = req.params as { companyId: string };
    const result = await submitContactService(companyId, req.body);
    sendResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const listMessages: ExpresFunction = async (req, res, next) => {
  try {
    const { companyId } = req.params as { companyId: string };
    const result = await listMessagesService(companyId, req.query as any);
    sendResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const getMessage: ExpresFunction = async (req, res, next) => {
  try {
    const result = await getMessageService((req.params as { id: string }).id);
    sendResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const updateMessageStatus: ExpresFunction<
  IUpdateMessageStatusRequest
> = async (req, res, next) => {
  try {
    const result = await updateMessageStatusService(
      (req.params as { id: string }).id,
      req.body.status,
    );
    sendResponse(res, result);
  } catch (error) {
    next(error);
  }
};
