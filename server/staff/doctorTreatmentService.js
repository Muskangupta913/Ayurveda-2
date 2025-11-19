import jwt from "jsonwebtoken";
import DoctorTreatment from "../../models/DoctorTreatment";
import Treatment from "../../models/Treatment";
import User from "../../models/Users";

export async function getStaffUser(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.split(" ")[1];

  if (!token) {
    throw { status: 401, message: "No token provided" };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded?.userId || decoded?.id;

    if (!userId) {
      throw { status: 401, message: "Invalid token payload" };
    }

    const user = await User.findById(userId);
    if (!user) {
      throw { status: 401, message: "User not found" };
    }

    if (!["doctor","clinic","doctorStaff"].includes(user.role)) {
      throw { status: 403, message: "Access denied" };
    }

    if (!user.isApproved || user.declined) {
      throw { status: 403, message: "Account not active" };
    }

    return user;
  } catch (error) {
    if (error.status) throw error;
    throw { status: 401, message: "Invalid or expired token" };
  }
}

export async function formatDoctorTreatments(doctorId) {
  const docs = await DoctorTreatment.find({ doctorId })
    .populate("treatmentId", "name subcategories")
    .sort({ createdAt: -1 })
    .lean();

  return docs.map((doc) => {
    const allSubcategories = doc.treatmentId?.subcategories || [];
    const selectedSubcategoryIds = doc.subcategoryIds || [];
    
    // Filter subcategories based on selected subcategoryIds and include prices
    const filteredSubcategories = allSubcategories.filter((sub) =>
      selectedSubcategoryIds.includes(sub.slug || sub.name)
    );

    return {
      _id: doc._id.toString(),
      treatmentId: doc.treatmentId?._id || doc.treatmentId,
      treatmentName: doc.treatmentId?.name || "Unknown treatment",
      subcategoryIds: selectedSubcategoryIds,
      subcategories: filteredSubcategories.map((sub) => ({
        name: sub.name,
        slug: sub.slug || sub.name,
        price: sub.price || null,
      })),
      price: doc.price ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  });
}

export function slugifyValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-") || `treatment-${Date.now()}`;
}

export async function ensureUniqueTreatmentSlug(name) {
  const baseSlug = slugifyValue(name);
  let slug = baseSlug;
  let counter = 1;
  while (await Treatment.exists({ slug })) {
    slug = `${baseSlug}-${counter++}`;
  }
  return slug;
}


