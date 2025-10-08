import dbConnect from "../../../lib/database";
import Vendor from "../../../models/VendorProfile";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  try {
    const vendors = await Vendor.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: vendors });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}
