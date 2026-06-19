import { Router } from "express";
import { isAuthenticated } from "../middlewares/authenticatedMiddleWare";
import { authorizeRoles } from "../middlewares/authorizeRoles";
import {
  companyIdValidation,
  createCompanyValidation,
  listCompaniesValidation,
  updateCompanyValidation,
} from "../validations/company.validation";
import {
  createCompany,
  deleteCompany,
  getCompany,
  listCompanies,
  updateCompany,
} from "../controllers/company.controller";

const router = Router();

// All company-profile management requires an authenticated admin.
router.use(isAuthenticated, authorizeRoles("admin"));

router
  .route("/")
  .post(createCompanyValidation(), createCompany)
  .get(listCompaniesValidation(), listCompanies);

router
  .route("/:id")
  .get(companyIdValidation(), getCompany)
  .patch(updateCompanyValidation(), updateCompany)
  .delete(companyIdValidation(), deleteCompany);

export default router;
