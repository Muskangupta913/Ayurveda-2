// pages/api/admin/decline-clinic.ts
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
      declined: true,
      isApproved: false,
    });

    res.status(200).json({ success: true, message: "Clinic declined", clinic });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}
