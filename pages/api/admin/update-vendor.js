import dbConnect from "../../../lib/database";
import Vendor from "../../../models/VendorProfile";
import jwt from "jsonwebtoken";
import { checkAgentPermission } from "../../../lib/checkAgentPermission";

export default async function handler(req, res) {
  await dbConnect();

  const { id } = req.query;

  if (req.method !== "PUT") {
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
      }
    }

    // Check agent permissions if user is an agent
    if (userRole === 'agent' || userRole === 'doctorStaff') {
      const hasPermission = await checkAgentPermission(
        userId, 
        'staff_management', 
        'update', 
        'Add Vendor'
      ) || await checkAgentPermission(userId, 'staff_management', 'all');
      
      if (!hasPermission) {
        return res.status(403).json({ 
          success: false, 
          message: "You don't have permission to update vendors" 
        });
      }
    }

    const updated = await Vendor.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}
