import { Router } from "express";
import { strictRateLimiter } from "../middlewares/rateLimiter";
import { isAuthenticated } from "../middlewares/authenticatedMiddleWare";
import { authorizeRoles } from "../middlewares/authorizeRoles";
import {
  listMessagesValidation,
  messageIdValidation,
  submitContactValidation,
  updateMessageStatusValidation,
} from "../validations/contact.validation";
import {
  getMessage,
  listMessages,
  submitContact,
  updateMessageStatus,
} from "../controllers/contact.controller";

const router = Router();

// ── Admin: read/manage individual messages (declared before param routes) ──
router.get(
  "/messages/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  messageIdValidation(),
  getMessage,
);
router.patch(
  "/messages/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  updateMessageStatusValidation(),
  updateMessageStatus,
);

// ── Admin: list a company's messages ──
router.get(
  "/:companyId/messages",
  isAuthenticated,
  authorizeRoles("admin"),
  listMessagesValidation(),
  listMessages,
);

// ── Public: submit a contact message (strictly rate limited per IP) ──
router.post(
  "/:companyId",
  strictRateLimiter({
    prefix: "contact",
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
    keyStrategy: "ip",
    message: "Too many messages — please wait a while before sending another.",
  }),
  submitContactValidation(),
  submitContact,
);

export default router;
