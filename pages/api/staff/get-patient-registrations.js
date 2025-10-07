// pages/api/staff/get-patient-registrations.js
import dbConnect from "../../../lib/database";
import PatientRegistration from "../../../models/PatientRegistration";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  try {
    const {
      emrNumber,
      invoiceNumber,
      name,
      phone,
      claimStatus, // advanceClaimStatus
      applicationStatus, // status
    } = req.query;

    // 🔹 Build Dynamic Query
    const query = {};

    if (emrNumber) query.emrNumber = { $regex: emrNumber, $options: "i" };
    if (invoiceNumber) query.invoiceNumber = { $regex: invoiceNumber, $options: "i" };
    if (phone) query.mobileNumber = { $regex: phone, $options: "i" };
    if (claimStatus) query.advanceClaimStatus = claimStatus;
    if (applicationStatus) query.status = applicationStatus;

    // For name search (first or last name)
    if (name) {
      query.$or = [
        { firstName: { $regex: name, $options: "i" } },
        { lastName: { $regex: name, $options: "i" } },
      ];
    }

    // 🔹 Fetch from MongoDB
    const patients = await PatientRegistration.find(query)
      .sort({ createdAt: -1 }) // latest first
      .limit(50); // limit results for performance

    return res.status(200).json({
      success: true,
      count: patients.length,
      data: patients,
    });
  } catch (error) {
    console.error("❌ Error fetching patients:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
}
