// pages/api/staff/patient-registration.js
import dbConnect from "../../../lib/database";
import jwt from "jsonwebtoken";
import PatientRegistration from "../../../models/PatientRegistration";
import User from "../../../models/Users";

// Helper: verify JWT and get user
async function getUserFromToken(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.split(" ")[1];
  if (!token) throw { status: 401, message: "No token provided" };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId || decoded.id).select("-password");
    if (!user) throw { status: 401, message: "User not found" };
    return user;
  } catch (err) {
    throw { status: 401, message: "Invalid or expired token" };
  }
}

// Check if user has required role
function requireRole(user, roles = []) {
  return roles.includes(user.role);
}

export default async function handler(req, res) {
  await dbConnect();

  let user;
  try {
    user = await getUserFromToken(req);
  } catch (err) {
    return res.status(err.status || 401).json({ success: false, message: err.message });
  }

  // ---------------- GET: return current user's name and role ----------------
  if (req.method === "GET") {
    return res.status(200).json({
      success: true,
      data: {
        name: user.name,
        role: user.role,
        _id: user._id,
      },
    });
  }

  // ---------------- POST: create a new patient ----------------
  if (req.method === "POST") {
    if (!requireRole(user, ["clinic", "staff", "admin"])) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    try {
      const {
        invoiceNumber,
        invoicedBy,
        emrNumber,
        firstName,
        lastName,
        gender,
        email,
        mobileNumber,
        referredBy,
        patientType,
        doctor,
        service,
        treatment,
        package: packageName,
        amount,
        paid,
        advance,
        paymentMethod,
        insurance,
        advanceGivenAmount,
        coPayPercent,
        advanceClaimStatus,
        advanceClaimReleasedBy,
        notes,
      } = req.body;

      // Validation
      if (
        !invoiceNumber ||
        !firstName ||
        !gender ||
        !mobileNumber ||
        !doctor ||
        !service ||
        !amount ||
        !paid ||
        !paymentMethod
      ) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
      }

      // Check duplicate invoice
      const existing = await PatientRegistration.findOne({ invoiceNumber });
      if (existing) {
        return res.status(400).json({ success: false, message: "Invoice number already exists" });
      }

      // Create patient
      const patient = await PatientRegistration.create({
        invoiceNumber,
        invoicedBy,
        userId: user._id,
        emrNumber,
        firstName,
        lastName,
        gender,
        email,
        mobileNumber,
        referredBy,
        patientType,
        doctor,
        service,
        treatment,
        package: packageName,
        amount,
        paid,
        advance,
        paymentMethod,
        insurance,
        advanceGivenAmount,
        coPayPercent,
        advanceClaimStatus,
        advanceClaimReleasedBy,
        notes,
      });

      return res.status(201).json({ success: true, message: "Patient registered successfully", data: patient });
    } catch (err) {
      console.error("POST error:", err);
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  }

  // ---------------- Other methods ----------------
  return res.status(405).json({ success: false, message: "Method not allowed" });
}
