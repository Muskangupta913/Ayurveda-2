import dbConnect from "../../../lib/database";
import jwt from "jsonwebtoken";
import PatientRegistration from "../../../models/PatientRegistration";
import User from "../../../models/Users";

// ---------------- Helper: verify JWT and get user ----------------
async function getUserFromToken(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.split(" ")[1];
  if (!token) throw { status: 401, message: "No token provided" };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) throw { status: 401, message: "User not found" };
    return user;
  } catch (err) {
    throw { status: 401, message: "Invalid or expired token" };
  }
}

// ---------------- Check user role ----------------
function requireRole(user, roles = []) {
  return roles.includes(user.role);
}

// ---------------- API Handler ----------------
export default async function handler(req, res) {
  await dbConnect();

  let user;
  try {
    user = await getUserFromToken(req);
  } catch (err) {
    return res.status(err.status || 401).json({ success: false, message: err.message });
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

      // Derive invoicedBy if not provided (model requires it)
      const computedInvoicedBy =
        invoicedBy ||
        user.name ||
        user.fullName ||
        user.email ||
        user.username ||
        user.mobileNumber ||
        String(user._id);

      // ✅ Validation
      if (!invoiceNumber || !firstName || !gender || !mobileNumber || !doctor || !service || !amount || !paid || !paymentMethod) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
      }

      // ---------------- Check if patient already exists ----------------
      const existingPatient = await PatientRegistration.findOne({ invoiceNumber });

      if (existingPatient) {
        // Append new payment to paymentHistory
        const newPending = Math.max(0, amount - (paid + advance));
        existingPatient.paymentHistory.push({
          amount,
          paid,
          advance,
          pending: newPending,
          paymentMethod,
          updatedAt: new Date(),
        });

        // Update totals
        existingPatient.amount += amount;
        existingPatient.paid += paid;
        existingPatient.advance += advance;
        existingPatient.pending = Math.max(0, existingPatient.amount - (existingPatient.paid + existingPatient.advance));

        await existingPatient.save();
        return res.status(200).json({ success: true, message: "Payment added to existing patient", data: existingPatient });
      }

      // ---------------- Create new patient ----------------
      const patient = await PatientRegistration.create({
        invoiceNumber,
        invoicedBy: computedInvoicedBy,
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
        paymentHistory: [
          {
            amount,
            paid,
            advance,
            pending: Math.max(0, amount - (paid + advance)),
            paymentMethod,
            updatedAt: new Date(),
          },
        ],
      });

      return res.status(201).json({ success: true, message: "Patient registered successfully", data: patient });
    } catch (err) {
      console.error("POST error:", err);
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  }

  // ---------------- GET: list/filter patients ----------------
  if (req.method === "GET") {
    if (!requireRole(user, ["clinic", "staff", "admin"])) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    try {
      const { emrNumber, invoiceNumber, name, phone, claimStatus, applicationStatus } = req.query;

      const query = { userId: user._id };

      if (emrNumber) query.emrNumber = { $regex: emrNumber, $options: "i" };
      if (invoiceNumber) query.invoiceNumber = { $regex: invoiceNumber, $options: "i" };
      if (phone) query.mobileNumber = { $regex: phone, $options: "i" };
      if (claimStatus) query.advanceClaimStatus = claimStatus;
      if (applicationStatus) query.status = applicationStatus;

      if (name) {
        query.$or = [
          { firstName: { $regex: name, $options: "i" } },
          { lastName: { $regex: name, $options: "i" } },
        ];
      }

      const patients = await PatientRegistration.find(query).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, count: patients.length, data: patients });
    } catch (err) {
      console.error("GET error:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch patients" });
    }
  }

  // ---------------- PUT: update patient status ----------------
  if (req.method === "PUT") {
    if (!requireRole(user, ["staff", "admin"])) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    try {
      const { id, status } = req.body;
      if (!id || !status) {
        return res.status(400).json({ success: false, message: "id and status required" });
      }

      const patient = await PatientRegistration.findOne({ _id: id, userId: user._id });
      if (!patient) return res.status(404).json({ success: false, message: "Patient not found or unauthorized" });

      patient.status = status;
      await patient.save();

      return res.status(200).json({ success: true, message: `Patient status updated to ${status}`, data: patient });
    } catch (err) {
      console.error("PUT error:", err);
      return res.status(500).json({ success: false, message: "Failed to update patient status" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "PUT"]);
  return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
}
