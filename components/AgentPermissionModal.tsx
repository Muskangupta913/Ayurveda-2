'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface SubModule {
  name: string;
  path?: string;
  icon: string;
  order: number;
  actions: {
    all: boolean;
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    print: boolean;
    export: boolean;
    approve: boolean;
  };
}

interface ModulePermission {
  module: string;
  subModules: SubModule[];
  actions: {
    all: boolean;
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    print: boolean;
    export: boolean;
    approve: boolean;
  };
}

interface NavigationItem {
  _id: string;
  label: string;
  path?: string;
  icon: string;
  description?: string;
  order: number;
  moduleKey: string;
  subModules?: Array<{
    name: string;
    path?: string;
    icon: string;
    order: number;
  }>;
}

interface AgentPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  agentName: string;
  token: string | null;
  userRole: 'admin' | 'clinic' | 'doctor';
}

const ACTIONS = [
  { key: 'all', label: 'All', color: 'bg-purple-600' },
  { key: 'create', label: 'Create', color: 'bg-green-500' },
  { key: 'read', label: 'Read', color: 'bg-blue-500' },
  { key: 'update', label: 'Update', color: 'bg-yellow-500' },
  { key: 'delete', label: 'Delete', color: 'bg-red-500' },
  { key: 'print', label: 'Print', color: 'bg-purple-600' },
  { key: 'export', label: 'Export', color: 'bg-gray-800' },
  { key: 'approve', label: 'Approve', color: 'bg-indigo-600' }
];

const AgentPermissionModal: React.FC<AgentPermissionModalProps> = ({
  isOpen,
  onClose,
  agentId,
  agentName,
  token,
  userRole
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && token) {
      fetchNavigationItems();
      fetchAgentPermissions();
    }
  }, [isOpen, token, userRole, agentId]);

  const fetchNavigationItems = async () => {
    try {
      const { data } = await axios.get(`/api/navigation/get-by-role?role=${userRole}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setNavigationItems(data.data || []);
        // Auto-expand modules with sub-modules
        const modulesWithSubModules = data.data.filter((item: NavigationItem) => 
          item.subModules && item.subModules.length > 0
        );
        setExpandedModules(new Set(modulesWithSubModules.map((item: NavigationItem) => item.moduleKey)));
      }
    } catch (err) {
      console.error('Error fetching navigation items:', err);
    }
  };

  const fetchAgentPermissions = async () => {
    try {
      const { data } = await axios.get(`/api/agent/permissions?agentId=${agentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success && data.data) {
        setPermissions(data.data.permissions || []);
      } else {
        // Initialize with empty permissions - will be synced with navigation items
        setPermissions([]);
      }
    } catch (err) {
      console.error('Error fetching agent permissions:', err);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  // Sync permissions with navigation items when both are loaded
  useEffect(() => {
    if (navigationItems.length > 0 && !loading && permissions.length === 0) {
      // Only initialize if no permissions exist yet
      const newPermissions = navigationItems.map(navItem => ({
        module: navItem.moduleKey,
        subModules: navItem.subModules?.map(subModule => ({
          name: subModule.name,
          path: subModule.path || '',
          icon: subModule.icon,
          order: subModule.order,
          actions: {
            all: false,
            create: false,
            read: false,
            update: false,
            delete: false,
            print: false,
            export: false,
            approve: false
          }
        })) || [],
        actions: {
          all: false,
          create: false,
          read: false,
          update: false,
          delete: false,
          print: false,
          export: false,
          approve: false
        }
      }));

      setPermissions(newPermissions);
    } else if (navigationItems.length > 0 && !loading && permissions.length > 0) {
      // Sync missing modules from navigation items
      const currentModules = permissions.map(p => p.module);
      const missingModules = navigationItems.filter(navItem => !currentModules.includes(navItem.moduleKey));

      if (missingModules.length > 0) {
        const newPermissions = missingModules.map(navItem => ({
          module: navItem.moduleKey,
          subModules: navItem.subModules?.map(subModule => ({
            name: subModule.name,
            path: subModule.path || '',
            icon: subModule.icon,
            order: subModule.order,
            actions: {
              all: false,
              create: false,
              read: false,
              update: false,
              delete: false,
              print: false,
              export: false,
              approve: false
            }
          })) || [],
          actions: {
            all: false,
            create: false,
            read: false,
            update: false,
            delete: false,
            print: false,
            export: false,
            approve: false
          }
        }));

        setPermissions(prev => [...prev, ...newPermissions]);
      }
    }
  }, [navigationItems, loading]);

  const getModulePermission = (moduleKey: string): ModulePermission => {
    return permissions.find(p => p.module === moduleKey) || {
      module: moduleKey,
      subModules: [],
      actions: {
        all: false,
        create: false,
        read: false,
        update: false,
        delete: false,
        print: false,
        export: false,
        approve: false
      }
    };
  };

  const handleModuleActionChange = (moduleKey: string, action: string, value: boolean) => {
    const newPermissions = [...permissions];
    let modulePermission = newPermissions.find(p => p.module === moduleKey);

    if (!modulePermission) {
      modulePermission = {
        module: moduleKey,
        subModules: [],
        actions: {
          all: false,
          create: false,
          read: false,
          update: false,
          delete: false,
          print: false,
          export: false,
          approve: false
        }
      };
      newPermissions.push(modulePermission);
    }

    if (action === 'all') {
      const allActions = Object.keys(modulePermission.actions).filter(key => key !== 'all');
      allActions.forEach(actionKey => {
        (modulePermission.actions as any)[actionKey] = value;
      });
      
      // ✅ CRITICAL FIX: When module-level "all" is clicked, also set all submodule actions to true
      // First, ensure all submodules from navigationItems are initialized
      const navItem = navigationItems.find(item => item.moduleKey === moduleKey);
      if (navItem && navItem.subModules && navItem.subModules.length > 0) {
        // Initialize submodules if they don't exist
        if (!modulePermission.subModules) {
          modulePermission.subModules = [];
        }
        
        // Add missing submodules from navigationItems
        navItem.subModules.forEach(navSubModule => {
          let subModule = modulePermission.subModules.find(sm => sm.name === navSubModule.name);
          if (!subModule) {
            subModule = {
              name: navSubModule.name,
              path: navSubModule.path || '',
              icon: navSubModule.icon || '📄',
              order: navSubModule.order || 0,
              actions: {
                all: false,
                create: false,
                read: false,
                update: false,
                delete: false,
                print: false,
                export: false,
                approve: false
              }
            };
            modulePermission.subModules.push(subModule);
          }
        });
        
        // Now set all actions for all submodules
        modulePermission.subModules.forEach(subModule => {
          // Set all actions for each submodule
          const subModuleActions = Object.keys(subModule.actions).filter(key => key !== 'all');
          subModuleActions.forEach(actionKey => {
            (subModule.actions as any)[actionKey] = value;
          });
          // Also set the "all" flag for the submodule
          subModule.actions.all = value;
        });
      }
    } else {
      (modulePermission.actions as any)[action] = value;
      const allActions = Object.keys(modulePermission.actions).filter(key => key !== 'all');
      const allEnabled = allActions.every(actionKey => (modulePermission.actions as any)[actionKey]);
      modulePermission.actions.all = allEnabled;
    }

    setPermissions(newPermissions);
  };

  const handleSubModuleActionChange = (moduleKey: string, subModuleName: string, action: string, value: boolean) => {
    const newPermissions = [...permissions];
    let modulePermission = newPermissions.find(p => p.module === moduleKey);

    if (!modulePermission) {
      modulePermission = {
        module: moduleKey,
        subModules: [],
        actions: {
          all: false,
          create: false,
          read: false,
          update: false,
          delete: false,
          print: false,
          export: false,
          approve: false
        }
      };
      newPermissions.push(modulePermission);
    }

    if (!modulePermission.subModules) {
      modulePermission.subModules = [];
    }

    let subModule = modulePermission.subModules.find(sm => sm.name === subModuleName);
    if (!subModule) {
      const navItem = navigationItems.find(item => item.moduleKey === moduleKey);
      const navSubModule = navItem?.subModules?.find(sm => sm.name === subModuleName);
      subModule = {
        name: subModuleName,
        path: navSubModule?.path || '',
        icon: navSubModule?.icon || '📄',
        order: navSubModule?.order || 0,
        actions: {
          all: false,
          create: false,
          read: false,
          update: false,
          delete: false,
          print: false,
          export: false,
          approve: false
        }
      };
      modulePermission.subModules.push(subModule);
    }

    if (action === 'all') {
      const allActions = Object.keys(subModule.actions).filter(key => key !== 'all');
      allActions.forEach(actionKey => {
        (subModule.actions as any)[actionKey] = value;
      });
    } else {
      (subModule.actions as any)[action] = value;
      const allActions = Object.keys(subModule.actions).filter(key => key !== 'all');
      const allEnabled = allActions.every(actionKey => (subModule.actions as any)[actionKey]);
      subModule.actions.all = allEnabled;
    }

    setPermissions(newPermissions);
  };

  const toggleModuleExpansion = (moduleKey: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleKey)) {
      newExpanded.delete(moduleKey);
    } else {
      newExpanded.add(moduleKey);
    }
    setExpandedModules(newExpanded);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await axios.post(
        '/api/agent/permissions',
        { agentId, permissions },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        alert('Permissions saved successfully!');
        onClose();
      } else {
        alert(data.message || 'Failed to save permissions');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Manage Permissions</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">{agentName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {navigationItems.map((item) => {
                const modulePermission = getModulePermission(item.moduleKey);
                const isExpanded = expandedModules.has(item.moduleKey);
                const hasSubModules = item.subModules && item.subModules.length > 0;

                return (
                  <div key={item._id} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Module Header */}
                    <div
                      className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => hasSubModules && toggleModuleExpansion(item.moduleKey)}
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <span className="text-2xl">{item.icon}</span>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900">{item.label}</h4>
                          {item.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                          )}
                        </div>
                      </div>
                      {hasSubModules && (
                        <svg
                          className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M6 6L14 10L6 14V6Z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>

                    {/* Module Actions */}
                    <div className="p-4 border-t border-gray-200">
                      <div className="flex flex-wrap gap-2">
                        {ACTIONS.map((action) => (
                          <label
                            key={action.key}
                            className="flex items-center space-x-1 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={modulePermission.actions[action.key as keyof typeof modulePermission.actions] || false}
                              onChange={(e) => handleModuleActionChange(item.moduleKey, action.key, e.target.checked)}
                              className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                            />
                            <span className="text-xs text-gray-700">{action.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Sub-modules */}
                    {hasSubModules && isExpanded && (
                      <div className="border-t border-gray-200 bg-gray-50">
                        {item.subModules?.map((subModule, subIdx) => {
                          const subModulePermission = modulePermission.subModules.find(
                            sm => sm.name === subModule.name
                          ) || {
                            name: subModule.name,
                            path: subModule.path || '',
                            icon: subModule.icon,
                            order: subModule.order,
                            actions: {
                              all: false,
                              create: false,
                              read: false,
                              update: false,
                              delete: false,
                              print: false,
                              export: false,
                              approve: false
                            }
                          };

                          return (
                            <div key={subIdx} className="p-4 border-b border-gray-200 last:border-b-0">
                              <div className="flex items-center space-x-2 mb-3">
                                <span className="text-lg">{subModule.icon}</span>
                                <h5 className="text-xs font-medium text-gray-900">{subModule.name}</h5>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {ACTIONS.map((action) => (
                                  <label
                                    key={action.key}
                                    className="flex items-center space-x-1 cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={subModulePermission.actions[action.key as keyof typeof subModulePermission.actions] || false}
                                      onChange={(e) => handleSubModuleActionChange(item.moduleKey, subModule.name, action.key, e.target.checked)}
                                      className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                                    />
                                    <span className="text-xs text-gray-700">{action.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-md border border-gray-300 text-[11px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-3.5 py-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white text-[11px] font-medium rounded-md transition-colors shadow-sm"
          >
            {saving ? 'Saving...' : 'Save Permissions'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentPermissionModal;

