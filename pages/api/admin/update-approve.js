// pages/api/admin/approve-clinic.ts
import dbConnect from "../../../lib/database";
import Clinic from "../../../models/Clinic";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { clinicId } = req.body;

  try {
    const clinic = await Clinic.findByIdAndUpdate(clinicId, {
      isApproved: true,
      declined: false,
    });

    res.status(200).json({ success: true, message: "Clinic approved", clinic });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}
