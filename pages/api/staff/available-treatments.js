import dbConnect from "../../../lib/database";
import Treatment from "../../../models/Treatment";
import User from "../../../models/Users";
import jwt from "jsonwebtoken";

async function getStaffUser(req) {
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

    // Allow doctor, doctorStaff, clinic, and admin roles
    if (!["doctor", "doctorStaff", "clinic", "admin"].includes(user.role)) {
      throw { status: 403, message: "Access denied" };
    }

    // For doctor/doctorStaff, check approval status
    if (["doctor", "doctorStaff"].includes(user.role)) {
      if (!user.isApproved || user.declined) {
        throw { status: 403, message: "Account not active" };
      }
    }

    return user;
  } catch (error) {
    if (error.status) throw error;
    throw { status: 401, message: "Invalid or expired token" };
  }
}

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await getStaffUser(req);
    const treatments = await Treatment.find({})
      .select("name subcategories")
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({ success: true, treatments });
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || "Failed to load treatments";
    return res.status(status).json({ success: false, message });
  }
}


