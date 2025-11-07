// pages/api/admin/navigation/clinic-seed.js
import dbConnect from "../../../../lib/database";
import ClinicNavigationItem from "../../../../models/ClinicNavigationItem";
import jwt from "jsonwebtoken";

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
      // Navigation items from ClinicSidebar
      const navigationItems = [
        {
          label: "Dashboard",
          path: "/clinic/clinic-dashboard",
          icon: "🏠",
          description: "Overview & metrics",
          order: 1,
          moduleKey: "dashboard"
        },
        {
          label: "Manage Health Center",
          path: "/clinic/myallClinic",
          icon: "📅",
          description: "Manage Clinic",
          order: 2,
          moduleKey: "health_center"
        },
        {
          label: "Review",
          path: "/clinic/getAllReview",
          icon: "👤",
          description: "Check all review",
          order: 3,
          moduleKey: "review"
        },
        {
          label: "Enquiry",
          path: "/clinic/get-Enquiry",
          icon: "👨‍⚕️",
          description: "All Patient Enquiries",
          order: 4,
          moduleKey: "enquiry"
        },
        {
          label: "Jobs",
          icon: "💼",
          description: "Manage job postings",
          order: 5,
          moduleKey: "jobs",
          subModules: [
            {
              name: "Job Posting",
              path: "/clinic/job-posting",
              icon: "📢",
              order: 1
            },
            {
              name: "See All Jobs",
              path: "/clinic/my-jobs",
              icon: "💼",
              order: 2
            },
            {
              name: "See Job Applicants",
              path: "/clinic/job-applicants",
              icon: "👥",
              order: 3
            }
          ]
        },
        {
          label: "Blogs",
          icon: "📄",
          description: "Manage Blogs",
          order: 6,
          moduleKey: "blogs",
          subModules: [
            {
              name: "Write Blog",
              path: "/clinic/BlogForm",
              icon: "📝",
              order: 1
            },
            {
              name: "Published and Drafts Blogs",
              path: "/clinic/published-blogs",
              icon: "📄",
              order: 2
            },
            {
              name: "Analytics of blog",
              path: "/clinic/getAuthorCommentsAndLikes",
              icon: "📊",
              order: 3
            }
          ]
        }
      ];

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
