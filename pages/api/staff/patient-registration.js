import dbConnect from "../../../lib/database";
import User from "../../../models/Users";
import PatientRegistration from "../../../models/PatientRegistration";
import { getUserFromReq, requireRole } from "../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  // Allow only POST and GET requests
  if (!["POST", "GET"].includes(req.method)) {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  // ✅ Authenticate user
  const me = await getUserFromReq(req);
  if (!me || !requireRole(me, ["clinic", "staff", "admin"])) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  // ===========================
  // POST → Create a new patient
  // ===========================
  if (req.method === "POST") {
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

      // 🔹 Validation
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
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      // 🔹 Check for duplicate invoice number
      const existing = await PatientRegistration.findOne({ invoiceNumber });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Invoice number already exists",
        });
      }

      // 🔹 Create new patient registration
      const patient = await PatientRegistration.create({
        invoiceNumber,
        invoicedBy,
        userId: me._id, // logged-in user
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

      return res.status(201).json({
        success: true,
        message: "Patient registered successfully",
        data: patient,
      });
    } catch (err) {
      console.error("❌ Error creating patient registration:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }

  // ===========================
  // GET → List all patient records created by this user
  // ===========================
  if (req.method === "GET") {
    try {
      const patients = await PatientRegistration.find({ userId: me._id })
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json({
        success: true,
        count: patients.length,
        data: patients,
      });
    } catch (err) {
      console.error("❌ Error fetching patients:", err);
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch patients" });
    }
  }
}
