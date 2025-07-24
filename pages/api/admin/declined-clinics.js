// pages/api/admin/declined-clinics.ts
import dbConnect from "../../../lib/database";
import Clinic from "../../../models/Clinic";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const declined = await Clinic.find({ isApproved: false, declined: true }).populate("owner", "email name phone");
    res.status(200).json({ clinics: declined });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}
