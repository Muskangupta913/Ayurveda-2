// /pages/api/admin/getPatientClaims.js
import jwt from "jsonwebtoken";
import dbConnect from "../../../lib/database";
import User from "../../../models/Users";
import PatientRegistration from "../../../models/PatientRegistration";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await User.findById(decoded.id);

    if (!admin) return res.status(404).json({ message: "Admin not found" });
    if (admin.role !== "admin")
      return res.status(403).json({ message: "Access denied: Admins only" });

    const { statusFilter } = req.query; // optional: Pending, Released, Cancelled, Co-pay, Advance

    // 🔹 Build query
    const query = {};
    if (statusFilter) {
      if (statusFilter.toLowerCase() === "co-pay") {
        query.coPayPercent = { $gt: 0 }; // co-pay patients
      } else if (statusFilter.toLowerCase() === "advance") {
        query.advanceGivenAmount = { $gt: 0 }; // advance patients
      } else {
        query.advanceClaimStatus = new RegExp(`^${statusFilter}$`, "i");
      }
    }

    // 🔹 Fetch patients with staff name
    const patients = await PatientRegistration.find(query)
      .populate("userId", "name") // fetch staff/allocated by
      .sort({ createdAt: -1 });

    // 🔹 Count summary
    const allPatients = await PatientRegistration.find({});
    const summary = {
      pending: allPatients.filter((p) => p.advanceClaimStatus === "Pending")
        .length,
      released: allPatients.filter((p) => p.advanceClaimStatus === "Released")
        .length,
      cancelled: allPatients.filter((p) => p.advanceClaimStatus === "Cancelled")
        .length,
      copay: allPatients.filter((p) => p.coPayPercent > 0).length,
      advance: allPatients.filter((p) => p.advanceGivenAmount > 0).length,
      total: allPatients.length,
    };

    // 🔹 Prepare response with staff name
    const patientDetails = patients.map((p) => ({
      patientName: `${p.firstName} ${p.lastName || ""}`,
      email: p.email,
      mobileNumber: p.mobileNumber,
      invoiceNumber: p.invoiceNumber,
      invoicedDate: p.invoicedDate,
      allocatedBy: p.userId?.name || "-",
      amount: p.amount,
      paid: p.paid,
      advance: p.advance,
      pending: p.pending,
      coPayPercent: p.coPayPercent,
      advanceGivenAmount: p.advanceGivenAmount,
      advanceClaimStatus: p.advanceClaimStatus,
      needToPay: p.needToPay,
      insurance: p.insurance,
      paymentMethod: p.paymentMethod,
      service: p.service,
      package: p.package,
      treatment: p.treatment,
      status: p.status,
    }));

    return res.status(200).json({
      message: "Patient claims fetched successfully",
      summary,
      patients: patientDetails,
    });
  } catch (error) {
    console.error("Admin Patient Claim Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
