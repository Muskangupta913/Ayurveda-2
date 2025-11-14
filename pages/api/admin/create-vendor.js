import dbConnect from "../../../lib/database";
import Vendor from "../../../models/VendorProfile";
import jwt from "jsonwebtoken";
import { checkAgentPermission } from "../../../lib/checkAgentPermission";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "POST") {
    try {
      let createdBy = req.body.createdBy;
      let userRole = null;
      let userId = null;

      // Extract user info from JWT if provided
      if (req.headers.authorization) {
        try {
          const token = req.headers.authorization.split(" ")[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          createdBy = decoded?.name || decoded?.email || "Unknown User";
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
          'create', 
          'Add Vendor'
        ) || await checkAgentPermission(userId, 'staff_management', 'all');
        
        if (!hasPermission) {
          return res.status(403).json({ 
            success: false, 
            message: "You don't have permission to create vendors" 
          });
        }
      }

      // ✅ Option 2: fallback if still empty
      if (!createdBy) createdBy = "System";

      // commissionPercentage removed — rest stays same
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
