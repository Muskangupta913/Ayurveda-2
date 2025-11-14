// pages/api/agent/check-permission.js
// Check if agent has permission for a specific module and action
import dbConnect from "../../../lib/database";
import AgentPermission from "../../../models/AgentPermission";
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

    const { moduleKey, action, subModuleName } = req.query;

    if (!moduleKey || !action) {
      return res.status(400).json({ success: false, message: 'moduleKey and action are required' });
    }

    // Get agent permissions
    const agentPermission = await AgentPermission.findOne({ agentId: me._id });
    
    if (!agentPermission || !agentPermission.permissions || agentPermission.permissions.length === 0) {
      return res.status(200).json({ 
        success: true, 
        hasPermission: false,
        message: 'No permissions found'
      });
    }

    // Find the module permission
    const modulePerm = agentPermission.permissions.find(p => {
      const permModuleKey = p.module;
      const moduleKeyWithoutPrefix = moduleKey.replace(/^(admin|clinic|doctor|agent)_/, '');
      const permModuleKeyWithoutPrefix = permModuleKey.replace(/^(admin|clinic|doctor|agent)_/, '');
      
      return permModuleKey === moduleKey || 
             permModuleKeyWithoutPrefix === moduleKeyWithoutPrefix ||
             permModuleKey === moduleKeyWithoutPrefix ||
             permModuleKeyWithoutPrefix === moduleKey;
    });

    if (!modulePerm) {
      return res.status(200).json({ 
        success: true, 
        hasPermission: false,
        message: 'Module permission not found'
      });
    }

    // If checking submodule permission
    if (subModuleName) {
      const subModulePerm = modulePerm.subModules?.find(sm => sm.name === subModuleName);
      if (!subModulePerm) {
        return res.status(200).json({ 
          success: true, 
          hasPermission: false,
          message: 'Submodule permission not found'
        });
      }

      // Check if submodule has the action permission
      const hasPermission = subModulePerm.actions?.[action] === true || 
                           subModulePerm.actions?.all === true;

      return res.status(200).json({ 
        success: true, 
        hasPermission,
        message: hasPermission ? 'Permission granted' : 'Permission denied'
      });
    }

    // Check module-level permission
    const hasPermission = modulePerm.actions?.[action] === true || 
                         modulePerm.actions?.all === true;

    return res.status(200).json({ 
      success: true, 
      hasPermission,
      message: hasPermission ? 'Permission granted' : 'Permission denied'
    });

  } catch (error) {
    console.error('Error checking agent permission:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
}

