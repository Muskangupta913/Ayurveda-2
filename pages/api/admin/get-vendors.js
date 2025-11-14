import dbConnect from "../../../lib/database";
import Vendor from "../../../models/VendorProfile";
import jwt from "jsonwebtoken";
import { checkAgentPermission } from "../../../lib/checkAgentPermission";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  try {
    let userRole = null;
    let userId = null;

    // Extract user info from JWT if provided
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userRole = decoded?.role;
        userId = decoded?.userId || decoded?.id;
      } catch (err) {
        console.warn("JWT decode failed:", err.message);
        // If token is invalid, we'll check permissions anyway
      }
    }

    // Check agent permissions if user is an agent
    if (userRole === 'agent' || userRole === 'doctorStaff') {
      const hasPermission = await checkAgentPermission(
        userId, 
        'staff_management', 
        'read', 
        'Add Vendor'
      ) || await checkAgentPermission(userId, 'staff_management', 'all');
      
      if (!hasPermission) {
        return res.status(403).json({ 
          success: false, 
          message: "You don't have permission to view vendors" 
        });
      }
    }

    // Fetch vendors
    const vendors = await Vendor.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: vendors });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(400).json({ success: false, message: error.message });
  }
}
