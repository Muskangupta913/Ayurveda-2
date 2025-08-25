import dbConnect from "../../../lib/database";
import PrescriptionRequest from "../../../models/PrescriptionRequest";
import { verifyToken } from "../auth/verify";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "DELETE") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { prescriptionId } = req.body;
    const userId = verifyToken(req);

    if (!prescriptionId) {
      return res.status(400).json({ success: false, error: "PrescriptionId required" });
    }

    const prescription = await PrescriptionRequest.findById(prescriptionId);
    if (!prescription) {
      return res.status(404).json({ success: false, error: "Prescription not found" });
    }

    if (prescription.user.toString() !== userId && prescription.doctor.toString() !== userId) {
      return res.status(403).json({ success: false, error: "Not authorized to delete this prescription" });
    }

    await PrescriptionRequest.findByIdAndDelete(prescriptionId);

    return res.status(200).json({ success: true, message: "Prescription deleted successfully" });
  } catch (error) {
    console.error("Delete prescription error:", error);
    return res.status(500).json({ success: false, error: "Server error" });
  }
}
