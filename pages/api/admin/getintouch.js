// pages/api/admin/getintouch.js
import dbConnect from "../../../lib/database";
import GetInTouch from "../../../models/GetInTouch";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Only GET requests allowed" });
  }

  try {
    await dbConnect();

    const leads = await GetInTouch.find().sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      count: leads.length,
      data: leads,
    });
  } catch (error) {
    console.error("❌ Error fetching leads:", error);
    return res.status(500).json({
      message: "Failed to fetch leads",
      details: error.message,
    });
  }
}
