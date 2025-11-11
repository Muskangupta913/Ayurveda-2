// pages/api/admin/navigation/clinic-seed.js
import dbConnect from "../../../../lib/database";
import ClinicNavigationItem from "../../../../models/ClinicNavigationItem";
import jwt from "jsonwebtoken";
import { clinicNavigationItems } from "../../../../data/clinicNavigationItems";

export default async function handler(req, res) {
  await dbConnect();

  // Verify admin token
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  if (req.method === 'POST') {
    try {
      // Navigation items from shared clinic navigation data
      const navigationItems = clinicNavigationItems.map((item, index) => {
        const moduleKey =
          item.moduleKey ||
          item.label
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");

        return {
          label: item.label,
          path: item.path || "",
          icon: item.icon,
          description: item.description || "",
          badge: typeof item.badge === "number" ? item.badge : null,
          order: typeof item.order === "number" ? item.order : index + 1,
          moduleKey,
          subModules: Array.isArray(item.children)
            ? item.children.map((child, childIdx) => ({
                name: child.label,
                path: child.path || "",
                icon: child.icon,
                order:
                  typeof child.order === "number" ? child.order : childIdx + 1,
              }))
            : [],
        };
      });

      // Clear existing clinic navigation items
      await ClinicNavigationItem.deleteMany({});

      // Insert new clinic navigation items
      const createdItems = await ClinicNavigationItem.insertMany(navigationItems);

      return res.status(200).json({ 
        success: true, 
        message: 'Clinic navigation items seeded successfully',
        data: createdItems
      });
    } catch (error) {
      console.error('Error seeding clinic navigation items:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}
