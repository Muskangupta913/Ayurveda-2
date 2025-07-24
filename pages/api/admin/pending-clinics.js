// pages/api/admin/pending-clinics.ts
import dbConnect from "../../../lib/database";
import Clinic from "../../../models/Clinic";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const pending = await Clinic.find({ isApproved: false, declined: false }).populate("owner", "email name phone");
    res.status(200).json({ clinics: pending });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}
