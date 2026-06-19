import ApiError from "../errors/apiError";
import ApiResponse from "../errors/apiResponse";
import PaginatedResponse from "../errors/paginatedResponse";
import {
  ICreateCompanyRequest,
  IUpdateCompanyRequest,
} from "../interfaces/company.interface";
import CompanyProfile from "../models/CompanyProfile";

export const createCompanyService = async (data: ICreateCompanyRequest) => {
  const existing = await CompanyProfile.findOne({ slug: data.slug });
  if (existing) {
    throw new ApiError(
      409,
      `A company with slug "${data.slug}" already exists`,
    );
  }
  const company = await CompanyProfile.create(data);
  return new ApiResponse(201, "Company profile created", company.toJSON());
};

export const listCompaniesService = async (query: {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
  search?: string;
}) => {
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 20;

  const filter: Record<string, any> = {};
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { slug: { $regex: query.search, $options: "i" } },
      { contactEmail: { $regex: query.search, $options: "i" } },
    ];
  }

  const [items, totalItems] = await Promise.all([
    CompanyProfile.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    CompanyProfile.countDocuments(filter),
  ]);

  return PaginatedResponse.build(
    items.map((c) => c.toJSON()),
    totalItems,
    page,
    pageSize,
    "Companies retrieved successfully",
  );
};

export const getCompanyService = async (id: string) => {
  const company = await CompanyProfile.findById(id);
  if (!company) throw new ApiError(404, "Company profile not found");
  return new ApiResponse(200, "Company profile found", company.toJSON());
};

export const updateCompanyService = async (
  id: string,
  data: IUpdateCompanyRequest,
) => {
  if (data.slug) {
    const clash = await CompanyProfile.findOne({
      slug: data.slug,
      _id: { $ne: id },
    });
    if (clash)
      throw new ApiError(
        409,
        `A company with slug "${data.slug}" already exists`,
      );
  }
  const company = await CompanyProfile.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!company) throw new ApiError(404, "Company profile not found");
  return new ApiResponse(200, "Company profile updated", company.toJSON());
};

export const deleteCompanyService = async (id: string) => {
  const company = await CompanyProfile.findByIdAndDelete(id);
  if (!company) throw new ApiError(404, "Company profile not found");
  return new ApiResponse(200, "Company profile deleted");
};
