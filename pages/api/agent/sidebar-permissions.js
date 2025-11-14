// pages/api/agent/sidebar-permissions.js
// Returns navigation items for agent sidebar based on permissions granted by admin/clinic/doctor
import dbConnect from "../../../lib/database";
import AgentPermission from "../../../models/AgentPermission";
import User from "../../../models/Users";
import ClinicNavigationItem from "../../../models/ClinicNavigationItem";
import { getUserFromReq } from "../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Get the logged-in agent
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
    }

    // Verify user is an agent
    if (!['agent', 'doctorStaff'].includes(me.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Agent role required' });
    }

    // Get agent permissions
    const agentPermission = await AgentPermission.findOne({ agentId: me._id });
    
    // Determine which role's navigation items to show based on who created the agent
    // Priority: 1. Check who created the agent, 2. Default to 'clinic'
    let navigationRole = 'clinic'; // default
    
    if (me.createdBy) {
      const creator = await User.findById(me.createdBy).select('role');
      if (creator) {
        if (creator.role === 'admin') {
          navigationRole = 'admin';
        } else if (creator.role === 'clinic') {
          navigationRole = 'clinic';
        } else if (creator.role === 'doctor') {
          navigationRole = 'doctor';
        }
      }
    }

    // Get navigation items for the determined role (these are the modules from creator's dashboard)
    const navigationItems = await ClinicNavigationItem.find({ 
      role: navigationRole, 
      isActive: true 
    }).sort({ order: 1 });

    // If no permissions exist, return empty array (agent sees nothing until permissions are granted)
    if (!agentPermission || !agentPermission.permissions || agentPermission.permissions.length === 0) {
      return res.status(200).json({
        success: true,
        permissions: null,
        navigationItems: [], // No permissions = no sidebar items
        navigationRole
      });
    }

    // Build permission map for quick lookup
    // Handle both with and without role prefix in moduleKey
    const permissionMap = {};
    agentPermission.permissions.forEach(perm => {
      const moduleKey = perm.module;
      // Remove role prefix if present (e.g., "admin_dashboard" -> "dashboard")
      const moduleKeyWithoutPrefix = moduleKey.replace(/^(admin|clinic|doctor)_/, '');
      const moduleKeyWithPrefix = `${navigationRole}_${moduleKeyWithoutPrefix}`;
      
      const permissionData = {
        moduleActions: perm.actions,
        subModules: {}
      };
      
      // Store with both keys for flexible lookup
      permissionMap[moduleKey] = permissionData;
      permissionMap[moduleKeyWithoutPrefix] = permissionData;
      permissionMap[moduleKeyWithPrefix] = permissionData;
      
      if (perm.subModules && perm.subModules.length > 0) {
        perm.subModules.forEach(subModule => {
          permissionData.subModules[subModule.name] = subModule.actions;
        });
      }
    });

    // Filter navigation items based on permissions
    // Show module only if agent has "read" or "all" permission at module level
    // Show submodule only if agent has "read" or "all" permission at submodule level
    const filteredNavigationItems = navigationItems
      .map(item => {
        // Try multiple lookup strategies for moduleKey matching
        // item.moduleKey from DB is like "clinic_marketing", permission might be stored as "marketing" or "clinic_marketing"
        const moduleKeyWithoutRole = item.moduleKey.replace(/^(admin|clinic|doctor)_/, '');
        const moduleKeyWithRole = `${navigationRole}_${moduleKeyWithoutRole}`;
        
        const modulePerm = permissionMap[item.moduleKey] || 
                          permissionMap[moduleKeyWithoutRole] ||
                          permissionMap[moduleKeyWithRole] ||
                          permissionMap[item.moduleKey.replace(`${navigationRole}_`, '')];
        
        // Check if module has read permission
        const hasModuleRead = modulePerm && (
          modulePerm.moduleActions.read === true || 
          modulePerm.moduleActions.all === true
        );

        if (!hasModuleRead) {
          return null; // Don't show this module at all
        }

        // Filter submodules based on permissions
        // Only show submodules that the agent has explicit permission for
        let filteredSubModules = [];
        if (item.subModules && item.subModules.length > 0) {
          filteredSubModules = item.subModules.filter(subModule => {
            // Check if this specific submodule has permission
            const subModulePerm = modulePerm?.subModules[subModule.name];
            return subModulePerm && (
              subModulePerm.read === true || 
              subModulePerm.all === true
            );
          });
        }

        // Convert path from admin/clinic/doctor/staff routes to agent routes
        let agentPath = item.path;
        if (agentPath) {
          // Convert /staff/* to /agent/*
          if (agentPath.startsWith('/staff/')) {
            agentPath = agentPath.replace('/staff/', '/agent/');
          }
          // Convert /admin/* to /agent/*
          else if (agentPath.startsWith('/admin/')) {
            agentPath = agentPath.replace('/admin/', '/agent/');
          }
          // Convert /clinic/* to /agent/*
          else if (agentPath.startsWith('/clinic/')) {
            agentPath = agentPath.replace('/clinic/', '/agent/');
          }
          // Convert /doctor/* to /agent/*
          else if (agentPath.startsWith('/doctor/')) {
            agentPath = agentPath.replace('/doctor/', '/agent/');
          }
          // Convert /lead/* to /agent/lead/*
          else if (agentPath.startsWith('/lead/')) {
            agentPath = agentPath.replace('/lead/', '/agent/lead/');
          }
          // Convert /lead to /agent/lead
          else if (agentPath === '/lead') {
            agentPath = '/agent/lead';
          }
          // Convert /marketingalltype/* to /agent/marketing/*
          else if (agentPath.startsWith('/marketingalltype/')) {
            agentPath = agentPath.replace('/marketingalltype/', '/agent/marketing/');
          }
          // Convert /marketingalltype to /agent/marketing
          else if (agentPath === '/marketingalltype') {
            agentPath = '/agent/marketing';
          }
          // Convert /staff to /agent
          else if (agentPath === '/staff') {
            agentPath = '/agent';
          }
        }

        // Convert submodule paths as well
        const convertedSubModules = filteredSubModules.map(subModule => ({
          name: subModule.name,
          path: subModule.path ? (
            subModule.path.startsWith('/staff/') ? subModule.path.replace('/staff/', '/agent/') :
            subModule.path === '/staff' ? '/agent' :
            subModule.path.startsWith('/admin/') ? subModule.path.replace('/admin/', '/agent/') :
            subModule.path.startsWith('/clinic/') ? subModule.path.replace('/clinic/', '/agent/') :
            subModule.path.startsWith('/doctor/') ? subModule.path.replace('/doctor/', '/agent/') :
            subModule.path.startsWith('/lead/') ? subModule.path.replace('/lead/', '/agent/lead/') :
            subModule.path === '/lead' ? '/agent/lead' :
            subModule.path.startsWith('/marketingalltype/') ? subModule.path.replace('/marketingalltype/', '/agent/marketing/') :
            subModule.path === '/marketingalltype' ? '/agent/marketing' :
            subModule.path
          ) : '',
          icon: subModule.icon || '',
          order: subModule.order || 0
        }));

        return {
          _id: item._id,
          label: item.label,
          path: agentPath, // Converted to agent route
          icon: item.icon,
          description: item.description,
          order: item.order,
          moduleKey: item.moduleKey,
          subModules: convertedSubModules
        };
      })
      .filter(item => item !== null); // Remove null items

    return res.status(200).json({
      success: true,
      permissions: agentPermission.permissions,
      navigationItems: filteredNavigationItems,
      navigationRole,
      agentId: me._id.toString()
    });

  } catch (error) {
    console.error('Error fetching agent sidebar permissions:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
}

