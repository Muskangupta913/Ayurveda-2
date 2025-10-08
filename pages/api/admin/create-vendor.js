import dbConnect from "../../../lib/database";
import Vendor from "../../../models/VendorProfile";
import jwt from "jsonwebtoken"; // optional, if you use tokens

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "POST") {
    try {
      let createdBy = req.body.createdBy;

      // ✅ Option 1: extract from JWT if you send it
      if (!createdBy && req.headers.authorization) {
        try {
          const token = req.headers.authorization.split(" ")[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          createdBy = decoded?.name || decoded?.email || "Unknown User";
        } catch (err) {
          console.warn("JWT decode failed:", err.message);
        }
      }

      // ✅ Option 2: fallback if still empty
      if (!createdBy) createdBy = "System";

      const vendor = new Vendor({
        ...req.body,
        createdBy,
      });

      await vendor.save();

      res.status(201).json({ success: true, data: vendor });
    } catch (error) {
      console.error("Error creating vendor:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  } else {
    res.status(405).json({ success: false, message: "Method not allowed" });
  }
}
