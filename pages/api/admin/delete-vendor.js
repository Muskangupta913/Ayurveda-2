import dbConnect from "../../../lib/database";
import Vendor from "../../../models/VendorProfile";

export default async function handler(req, res) {
  await dbConnect();

  const { id } = req.query;

  if (req.method !== "DELETE") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  try {
    const deleted = await Vendor.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }
    res.status(200).json({ success: true, message: "Vendor deleted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}
