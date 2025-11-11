// pages/api/admin/navigation/seed.js
import dbConnect from "../../../../lib/database";
import NavigationItem from "../../../../models/NavigationItem";
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
      // Navigation items from AdminSidebar
      const navigationItems = [
        {
          label: "Dashboard",
          path: "/admin/dashboard-admin",
          icon: "🏠",
          description: "Admin dashboard overview",
          order: 1,
          moduleKey: "dashboard"
        },
        {
          label: "Analytics",
          path: "/admin/analytics",
          icon: "📊",
          description: "System analytics and reports",
          order: 2,
          moduleKey: "analytics"
        },
        {
          label: "Clinic Management",
          path: "/admin/all-clinic",
          icon: "🏥",
          description: "Manage all clinics",
          order: 3,
          moduleKey: "clinic_management"
        },
        {
          label: "Doctor Management",
          path: "/admin/approve-doctors",
          icon: "👨‍⚕️",
          description: "Approve and manage doctors",
          order: 4,
          moduleKey: "doctor_management"
        },
        {
          label: "Blog Management",
          path: "/admin/all-blogs",
          icon: "📝",
          description: "Manage all blogs",
          order: 5,
          moduleKey: "blog_management"
        },
        {
          label: "Job Management",
          path: "/admin/job-manage",
          icon: "💼",
          description: "Manage job postings",
          order: 6,
          moduleKey: "job_management"
        },
        {
          label: "Get in Touch",
          path: "/admin/get-in-touch",
          icon: "📞",
          description: "Contact inquiries",
          order: 7,
          moduleKey: "get_in_touch"
        },
        {
          label: "Contractor",
          path: "/admin/Contractor",
          icon: "🤝",
          description: "Contractor management",
          order: 8,
          moduleKey: "contractor"
        },
        {
          label: "Staff Management",
          path: "/admin/create-staff",
          icon: "👥",
          description: "Create and manage staff",
          order: 9,
          moduleKey: "staff_management"
        },
        {
          label: "Patient Reports",
          path: "/admin/patient-report",
          icon: "📋",
          description: "Patient reports and analytics",
          order: 10,
          moduleKey: "patient_reports"
        },
        {
          label: "Track Expenses",
          path: "/admin/track-expenses",
          icon: "💰",
          description: "Track and manage expenses",
          order: 11,
          moduleKey: "track_expenses"
        },
        {
          label: "EOD Notes",
          path: "/admin/getAllEodNotes",
          icon: "📝",
          description: "End of day notes",
          order: 12,
          moduleKey: "eod_notes"
        },
        {
          label: "Add Treatment",
          path: "/admin/add-treatment",
          icon: "💊",
          description: "Add new treatments",
          order: 13,
          moduleKey: "add_treatment"
        },
        {
          label: "Admin Add Service",
          path: "/admin/admin-add-service",
          icon: "⚙️",
          description: "Add new services",
          order: 14,
          moduleKey: "admin_add_service"
        },
        {
          label: "Create Vendor",
          path: "/admin/admin-create-vendor",
          icon: "🏪",
          description: "Create new vendors",
          order: 15,
          moduleKey: "create_vendor"
        },
        {
          label: "Register Clinic",
          path: "/admin/register-clinic",
          icon: "🏥",
          description: "Register new clinics",
          order: 16,
          moduleKey: "register_clinic"
        },
        {
          label: "Admin Clinic Approval",
          path: "/admin/AdminClinicApproval",
          icon: "✅",
          description: "Approve clinic registrations",
          order: 17,
          moduleKey: "clinic_approval"
        },
        {
          label: "Reset Password",
          path: "/admin/reset-password",
          icon: "🔑",
          description: "Reset user passwords",
          order: 18,
          moduleKey: "reset_password"
        },
        {
          label: "Admin Forgot Password",
          path: "/admin/AdminForgotPassword",
          icon: "🔐",
          description: "Admin password recovery",
          order: 19,
          moduleKey: "admin_forgot_password"
        }
      ];

      // Clear existing navigation items
      await NavigationItem.deleteMany({});

      // Insert new navigation items
      const createdItems = await NavigationItem.insertMany(navigationItems);

      return res.status(200).json({ 
        success: true, 
        message: 'Navigation items seeded successfully',
        data: createdItems
      });
    } catch (error) {
      console.error('Error seeding navigation items:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}
