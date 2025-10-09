import PatientRegistration from "../../../models/PatientRegistration";
import dbConnect from "../../../lib/database"; // your DB connection
import { requireRole } from "../lead-ms/auth"
export default async function handler(req, res) {
  await dbConnect();
  const user = req.user;

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

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
    if (!invoiceNumber || !firstName || !gender || !mobileNumber || !doctor || !service || !amount || !paid || !paymentMethod) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Check if patient already exists
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

    // Create new patient with initial payment
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
