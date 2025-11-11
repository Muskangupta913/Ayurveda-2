// pages/api/navigation/seed-by-role.js
import dbConnect from "../../../lib/database";
import ClinicNavigationItem from "../../../models/ClinicNavigationItem";
import { getUserFromReq, requireRole } from "../lead-ms/auth";
import { clinicNavigationItems } from "../../../data/clinicNavigationItems";

// Admin sidebar items (from AdminSidebar.tsx)
const adminNavigationItems = [
  {
    label: 'Dashboard',
    path: '/admin/dashboard-admin',
    icon: '🏠',
    description: 'Overview & analytics',
    moduleKey: 'dashboard',
    order: 1,
  },
  {
    label: 'Approval Clinic',
    path: '/admin/AdminClinicApproval ',
    icon: '✅',
    description: 'Manage Clinics',
    moduleKey: 'approval_clinic',
    order: 2,
  },
  {
    label: 'Approval Doctors',
    path: '/admin/approve-doctors',
    icon: '🏥',
    description: 'Manage Doctors',
    moduleKey: 'approval_doctors',
    order: 3,
  },
  {
    label: 'Add Treatment',
    path: '/admin/add-treatment',
    icon: '📝',
    description: 'Add new Treatment',
    moduleKey: 'add_treatment',
    order: 4,
  },
  {
    label: 'All Blogs',
    path: '/admin/all-blogs',
    icon: '👥',
    description: 'Manage users & roles',
    moduleKey: 'all_blogs',
    order: 5,
  },
  {
    label: 'User Analytics',
    path: '/admin/analytics',
    icon: '📊',
    description: 'View detailed reports',
    moduleKey: 'user_analytics',
    order: 6,
  },
  {
    label: 'Request Call Back',
    path: '/admin/get-in-touch',
    icon: '📞',
    description: 'View and export user call back requests',
    moduleKey: 'request_callback',
    order: 7,
  },
  {
    label: 'Manage Job',
    path: '/admin/job-manage',
    icon: '⚙️',
    description: 'Approve or decline job',
    moduleKey: 'manage_job',
    order: 8,
  },
  {
    label: "Staff Management",
    icon: "👥",
    description: "Manage Staff",
    moduleKey: "staff_management",
    order: 9,
    children: [
      {
        label: "Create Staff",
        path: "/admin/create-staff",
        icon: "🧑‍💼",
        order: 1,
      },
      {
        label: "Create Services",
        path: "/admin/admin-add-service",
        icon: "🛠️",
        order: 2,
      },
      {
        label: "Create Vendor",
        path: "/admin/admin-create-vendor",
        icon: "🏢",
        order: 3,
      },
      {
        label: 'View EOD Report',
        path: '/admin/getAllEodNotes',
        icon: '📄',
        order: 4,
      },
      {
        label: 'Patient Report',
        path: '/admin/patient-report',
        icon: '📋',
        order: 5,
      },
      {
        label: 'Track Expenses',
        path: '/admin/track-expenses',
        icon: '💰',
        order: 6,
      },
      {
        label: 'Contracts',
        path: '/admin/contracters',
        icon: '⚙️',
        order: 7,
      },
    ],
  },
  {
    label: "Create Agent",
    path: "/admin/create-agent",
    icon: "👤",
    description: "Create agent account",
    moduleKey: "create_agent",
    order: 10,
  },
];

// Doctor sidebar items (from DoctorSidebar.tsx)
const doctorNavigationItems = [
  {
    label: "Dashboard",
    path: "/doctor/doctor-dashboard",
    icon: "🏠",
    description: "Overview & metrics",
    moduleKey: "dashboard",
    order: 1,
  },
  {
    label: "Manage Profile",
    path: "/doctor/manageDoctor",
    icon: "👤",
    description: "Manage Profile",
    moduleKey: "manage_profile",
    order: 2,
  },
  {
    label: "All users Review",
    path: "/doctor/getReview",
    icon: "📅",
    description: "See All Users Reviews",
    moduleKey: "all_users_review",
    order: 3,
  },
  {
    label: "Blogs",
    icon: "📄",
    description: "Blog Management",
    moduleKey: "blogs",
    order: 4,
    children: [
      { label: "Write Article", path: "/doctor/BlogForm", icon: "📝", order: 1 },
      { label: "Published Blogs", path: "/doctor/published-blogs", icon: "📄", order: 2 },
      { label: "Blog Analytics", path: "/doctor/getAuthorCommentsAndLikes", icon: "📊", order: 3 },
    ],
  },
  {
    label: "Jobs",
    icon: "💼",
    description: "Job Management",
    moduleKey: "jobs",
    order: 5,
    children: [
      { label: "Post Job", path: "/doctor/create-job", icon: "📢", order: 1 },
      { label: "See Jobs", path: "/doctor/my-jobs", icon: "💼", order: 2 },
      { label: "Job Applicants", path: "/doctor/job-applicants", icon: "👥", order: 3 },
    ],
  },
  {
    label: "Prescription Requests",
    path: "/doctor/prescription-requests",
    icon: "📋",
    description: "View all prescription requests",
    moduleKey: "prescription_requests",
    order: 6,
  },
  {
    label: "Create Agent",
    path: "/doctor/create-agent",
    icon: "👤",
    description: "Create agent account",
    moduleKey: "create_agent",
    order: 7,
  },
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  await dbConnect();
  const me = await getUserFromReq(req);

  if (!me) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
  }

  // Allow admin, clinic, and doctor roles
  if (!requireRole(me, ['admin', 'clinic', 'doctor'])) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  try {
    const { role } = req.body;

    // Validate role
    if (!role || !['admin', 'clinic', 'doctor'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role. Must be admin, clinic, or doctor' 
      });
    }

    // Verify user has permission to seed for this role
    // Admin can seed any role, clinic can only seed clinic, doctor can only seed doctor
    if (me.role === 'clinic' && role !== 'clinic') {
      return res.status(403).json({ 
        success: false, 
        message: 'Clinic users can only seed clinic navigation items' 
      });
    }
    if (me.role === 'doctor' && role !== 'doctor') {
      return res.status(403).json({ 
        success: false, 
        message: 'Doctor users can only seed doctor navigation items' 
      });
    }

    // Get navigation items based on role
    let navigationItems;
    if (role === 'admin') {
      navigationItems = adminNavigationItems;
    } else if (role === 'clinic') {
      navigationItems = clinicNavigationItems;
    } else if (role === 'doctor') {
      navigationItems = doctorNavigationItems;
    }

    // Transform navigation items to match ClinicNavigationItem schema
    const itemsToInsert = navigationItems.map((item, index) => {
      const moduleKey = item.moduleKey || 
        item.label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

      return {
        label: item.label,
        path: item.path || "",
        icon: item.icon,
        description: item.description || "",
        badge: typeof item.badge === "number" ? item.badge : null,
        order: typeof item.order === "number" ? item.order : index + 1,
        moduleKey: `${role}_${moduleKey}`, // Prefix with role to ensure uniqueness
        role: role,
        subModules: Array.isArray(item.children)
          ? item.children.map((child, childIdx) => ({
              name: child.label,
              path: child.path || "",
              icon: child.icon,
              order: typeof child.order === "number" ? child.order : childIdx + 1,
            }))
          : [],
        isActive: true,
      };
    });

    // Delete existing navigation items for this role
    await ClinicNavigationItem.deleteMany({ role: role });

    // Drop existing unique index on label if it exists (to allow common sidebar items across roles)
    try {
      await ClinicNavigationItem.collection.dropIndex('label_1');
    } catch (err) {
      // Index doesn't exist or already dropped, ignore error
      if (err.code !== 27) { // 27 is MongoDB error code for index not found
        console.warn('Could not drop label_1 index:', err.message);
      }
    }

    // Insert new navigation items
    const createdItems = await ClinicNavigationItem.insertMany(itemsToInsert);

    return res.status(200).json({ 
      success: true, 
      message: `${role} navigation items seeded successfully`,
      data: createdItems,
      count: createdItems.length
    });
  } catch (error) {
    console.error('Error seeding navigation items:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
}

