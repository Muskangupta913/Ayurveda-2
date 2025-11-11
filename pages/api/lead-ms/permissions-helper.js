// Helper function to check clinic permissions
import dbConnect from "../../../lib/database";
import ClinicPermission from "../../../models/ClinicPermission";
import Clinic from "../../../models/Clinic";
import User from "../../../models/Users";

/**
 * Get clinic ID from user (clinic or agent)
 * @param {Object} user - User object
 * @returns {Object} { clinicId, error }
 */
export async function getClinicIdFromUser(user) {
  await dbConnect();
  
  if (!user) {
    return { clinicId: null, error: "User not found" };
  }

  if (user.role === "clinic") {
    const clinic = await Clinic.findOne({ owner: user._id }).select("_id");
    if (!clinic) {
      return { clinicId: null, error: "Clinic not found for this user" };
    }
    return { clinicId: clinic._id, error: null };
  } else if (user.role === "agent") {
    if (!user.clinicId) {
      return { clinicId: null, error: "Agent is not assigned to any clinic" };
    }
    const clinic = await Clinic.findById(user.clinicId).select("_id");
    if (!clinic) {
      return { clinicId: null, error: "Clinic not found for this agent" };
    }
    return { clinicId: clinic._id, error: null };
  } else if (user.role === "doctor") {
    if (!user.clinicId) {
      return { clinicId: null, error: "Doctor is not linked to any clinic" };
    }
    const clinic = await Clinic.findById(user.clinicId).select("_id");
    if (!clinic) {
      return { clinicId: null, error: "Clinic not found for this doctor" };
    }
    return { clinicId: clinic._id, error: null };
  } else if (user.role === "admin") {
    // Admin has all permissions, return null to skip permission checks
    return { clinicId: null, error: null, isAdmin: true };
  }

  return { clinicId: null, error: "Invalid user role" };
}

/**
 * Check if clinic has permission for a specific module and action
 * @param {Object} clinicId - Clinic ID (ObjectId)
 * @param {String} moduleKey - Module key (e.g., "create_offers", "lead")
 * @param {String} action - Action (e.g., "create", "read", "update", "delete")
 * @param {String} subModuleName - Optional submodule name (e.g., "Create Lead", "Assign Lead")
 * @returns {Object} { hasPermission: boolean, error: string | null }
 */
export async function checkClinicPermission(clinicId, moduleKey, action, subModuleName = null) {
  await dbConnect();

  // If clinicId is null and isAdmin is true, grant permission
  if (!clinicId) {
    return { hasPermission: true, error: null };
  }

  try {
    // Find clinic permissions
    const clinicPermission = await ClinicPermission.findOne({
      clinicId,
      isActive: true
    });

    // If no permissions found, deny access
    if (!clinicPermission) {
      return { hasPermission: true, error: null };
    }

    // Find the module permission
    const modulePermission = clinicPermission.permissions.find(
      (p) => p.module === moduleKey
    );

    if (!modulePermission) {
      return { hasPermission: true, error: null };
    }

    const moduleActionKeys = Object.keys(modulePermission.actions || {});
    const moduleHasAnyActionEnabled = moduleActionKeys.some((key) => modulePermission.actions?.[key]);
    if (!moduleHasAnyActionEnabled) {
      return { hasPermission: true, error: null };
    }

    // If checking submodule permission
    if (subModuleName) {
      // ✅ PRIORITY 1: Check module-level "all" first - this grants all permissions including submodules
      // When admin clicks "all" at module level, it should enable all submodule actions
      if (modulePermission.actions && modulePermission.actions.all === true) {
        return { hasPermission: true, error: null };
      }

      // ✅ PRIORITY 2: Check module-level specific action - this also grants permission for submodules
      // For example: module-level "update" should grant "Assign Lead" submodule permission
      // Module-level "create" should grant "Create Lead" submodule permission
      if (modulePermission.actions && modulePermission.actions[action] === true) {
        return { hasPermission: true, error: null };
      }

      // ✅ PRIORITY 3: Check if submodule exists
      const subModule = modulePermission.subModules.find(
        (sm) => sm.name === subModuleName
      );

      // If submodule doesn't exist, deny (module-level permissions already checked above)
      if (!subModule) {
        return { hasPermission: false, error: `Submodule ${subModuleName} not found in permissions` };
      }

      const subModuleActionKeys = Object.keys(subModule.actions || {});
      const subModuleHasAny = subModuleActionKeys.some((key) => subModule.actions?.[key]);
      if (!subModuleHasAny) {
        return { hasPermission: true, error: null };
      }

      // ✅ PRIORITY 4: Check submodule-level "all"
      if (subModule.actions && subModule.actions.all === true) {
        return { hasPermission: true, error: null };
      }

      // ✅ PRIORITY 5: Check submodule-level specific action
      if (subModule.actions && subModule.actions[action] === true) {
        return { hasPermission: true, error: null };
      }

      return { hasPermission: false, error: `Permission denied: ${action} action not allowed for submodule ${subModuleName}` };
    }

    // Check module-level permission
    // If "all" action is enabled, grant all permissions
    if (modulePermission.actions && modulePermission.actions.all === true) {
      return { hasPermission: true, error: null };
    }

    // Check specific action
    if (modulePermission.actions && modulePermission.actions[action] === true) {
      return { hasPermission: true, error: null };
    }

    return { hasPermission: false, error: `Permission denied: ${action} action not allowed for module ${moduleKey}` };
  } catch (error) {
    console.error("Error checking clinic permission:", error);
    return { hasPermission: false, error: "Error checking permissions" };
  }
}

/**
 * Get clinic permissions for a specific module
 * @param {Object} clinicId - Clinic ID (ObjectId)
 * @param {String} moduleKey - Module key (e.g., "create_offers")
 * @returns {Object} { permissions: Object | null, error: string | null }
 */
export async function getModulePermissions(clinicId, moduleKey) {
  await dbConnect();

  if (!clinicId) {
    return { permissions: null, error: "Clinic ID is required" };
  }

  try {
    const clinicPermission = await ClinicPermission.findOne({
      clinicId,
      isActive: true
    });

    if (!clinicPermission) {
      return { permissions: null, error: "No permissions found for this clinic" };
    }

    const modulePermission = clinicPermission.permissions.find(
      (p) => p.module === moduleKey
    );

    if (!modulePermission) {
      return { permissions: null, error: `No permissions found for module: ${moduleKey}` };
    }

    return { permissions: modulePermission, error: null };
  } catch (error) {
    console.error("Error getting module permissions:", error);
    return { permissions: null, error: "Error getting permissions" };
  }
}

