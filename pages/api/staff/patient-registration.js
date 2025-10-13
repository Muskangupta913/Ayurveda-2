import dbConnect from "../../../lib/database";
import jwt from "jsonwebtoken";
import PatientRegistration from "../../../models/PatientRegistration";
import User from "../../../models/Users";
import PettyCash from "../../../models/PettyCash";

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

// ---------------- Add to PettyCash if payment method is Cash ----------------
async function addToPettyCashIfCash(user, patient, paidAmount) {
  if (patient.paymentMethod === "Cash" && paidAmount > 0) {
    try {
      // Create a separate PettyCash record for each patient
      const pettyCashRecord = await PettyCash.create({
        staffId: user._id,
        patientName: `${patient.firstName || ''} ${patient.lastName || ''}`.trim(),
        patientEmail: patient.email || '',
        patientPhone: patient.mobileNumber || '',
        note: `Auto-added from patient registration - Invoice: ${patient.invoiceNumber}`,
        allocatedAmounts: [{
          amount: paidAmount,
          receipts: [],
          date: new Date()
        }],
        expenses: []
      });

      // Update global total amount
      await PettyCash.updateGlobalTotalAmount(paidAmount, 'add');
      
      console.log(`Added ₹${paidAmount} to PettyCash for staff ${user.name} and updated global total - Patient: ${patient.firstName} ${patient.lastName}`);
    } catch (error) {
      console.error("Error adding to PettyCash:", error);
      // Don't throw error to avoid breaking patient registration
    }
  }
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
        insuranceType,
        advanceGivenAmount,
        coPayPercent,
        advanceClaimStatus,
        advanceClaimReleasedBy,
        notes,
      } = req.body;

      const computedInvoicedBy =
        invoicedBy ||
        user.name ||
        user.fullName ||
        user.email ||
        user.username ||
        user.mobileNumber ||
        String(user._id);

      if (
        !invoiceNumber ||
        !firstName ||
        !gender ||
        !mobileNumber ||
        !doctor ||
        !service ||
        amount === undefined ||
        paid === undefined ||
        !paymentMethod
      ) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
      }

      const existingPatient = await PatientRegistration.findOne({ invoiceNumber });

      if (existingPatient) {
        const normalizedAmount = Number(amount) || 0;
        const normalizedPaid = Number(paid) || 0;
        const normalizedAdvance = Number(advance) || 0;
        const newPending = Math.max(0, normalizedAmount - (normalizedPaid + normalizedAdvance));

        existingPatient.paymentHistory.push({
          amount: normalizedAmount,
          paid: normalizedPaid,
          advance: normalizedAdvance,
          pending: newPending,
          paymentMethod,
          updatedAt: new Date(),
        });

        existingPatient.amount += normalizedAmount;
        existingPatient.paid += normalizedPaid;
        existingPatient.advance += normalizedAdvance;

        await existingPatient.save();

        // Add to PettyCash if payment method is Cash
        await addToPettyCashIfCash(user, existingPatient, normalizedPaid);

        return res.status(200).json({
          success: true,
          message: "Payment added to existing patient",
          data: existingPatient,
        });
      }

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
        amount: Number(amount) || 0,
        paid: Number(paid) || 0,
        advance: Number(advance) || 0,
        paymentMethod,
        insurance,
        insuranceType,
        advanceGivenAmount: Number(advanceGivenAmount) || 0,
        coPayPercent: Number(coPayPercent) || 0,
        advanceClaimStatus,
        advanceClaimReleasedBy,
        notes,
        paymentHistory: [
          {
            amount: Number(amount) || 0,
            paid: Number(paid) || 0,
            advance: Number(advance) || 0,
            pending: Math.max(
              0,
              (Number(amount) || 0) - ((Number(paid) || 0) + (Number(advance) || 0))
            ),
            paymentMethod,
            updatedAt: new Date(),
          },
        ],
      });

      // Add to PettyCash if payment method is Cash
      await addToPettyCashIfCash(user, patient, Number(paid) || 0);

      return res.status(201).json({
        success: true,
        message: "Patient registered successfully",
        data: patient,
      });
    } catch (err) {
      console.error("POST error:", err);
      
      // Handle validation errors
      if (err.name === 'ValidationError') {
        const validationErrors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ 
          success: false, 
          message: "Validation Error", 
          errors: validationErrors 
        });
      }
      
      // Handle duplicate key errors
      if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({ 
          success: false, 
          message: `${field} already exists` 
        });
      }
      
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
      return res
        .status(200)
        .json({ success: true, count: patients.length, data: patients });
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
      if (!patient)
        return res.status(404).json({ success: false, message: "Patient not found or unauthorized" });

      patient.status = status;
      await patient.save();

      return res.status(200).json({
        success: true,
        message: `Patient status updated to ${status}`,
        data: patient,
      });
    } catch (err) {
      console.error("PUT error:", err);
      return res.status(500).json({ success: false, message: "Failed to update patient status" });
    }
  }

  // ---------------- Default response for unsupported methods ----------------
  res.setHeader("Allow", ["GET", "POST", "PUT"]);
  return res
    .status(405)
    .json({ success: false, message: `Method ${req.method} Not Allowed` });
}