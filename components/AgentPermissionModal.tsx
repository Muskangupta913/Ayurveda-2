'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

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
  { key: 'all', label: 'All', activeBg: 'bg-purple-500', inactiveBg: 'bg-gray-300', activeText: 'text-white', inactiveText: 'text-gray-600' },
  { key: 'create', label: 'Create', activeBg: 'bg-green-500', inactiveBg: 'bg-gray-300', activeText: 'text-white', inactiveText: 'text-gray-600' },
  { key: 'read', label: 'Read', activeBg: 'bg-blue-500', inactiveBg: 'bg-gray-300', activeText: 'text-white', inactiveText: 'text-gray-600' },
  { key: 'update', label: 'Update', activeBg: 'bg-yellow-500', inactiveBg: 'bg-gray-300', activeText: 'text-white', inactiveText: 'text-gray-600' },
  { key: 'delete', label: 'Delete', activeBg: 'bg-red-500', inactiveBg: 'bg-gray-300', activeText: 'text-white', inactiveText: 'text-gray-600' },
  { key: 'print', label: 'Print', activeBg: 'bg-purple-500', inactiveBg: 'bg-gray-300', activeText: 'text-white', inactiveText: 'text-gray-600' },
  { key: 'export', label: 'Export', activeBg: 'bg-gray-700', inactiveBg: 'bg-gray-300', activeText: 'text-white', inactiveText: 'text-gray-600' },
  { key: 'approve', label: 'Approve', activeBg: 'bg-indigo-500', inactiveBg: 'bg-gray-300', activeText: 'text-white', inactiveText: 'text-gray-600' }
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
    const newPermissions = permissions.map(p => {
      if (p.module !== moduleKey) return p;
      
      // Create a new module permission object
      const updatedActions = { ...p.actions };
      
      if (action === 'all') {
        const allActions = Object.keys(updatedActions).filter(key => key !== 'all');
        allActions.forEach(actionKey => {
          (updatedActions as any)[actionKey] = value;
        });
        updatedActions.all = value;
        
        // Update submodules
        const navItem = navigationItems.find(item => item.moduleKey === moduleKey);
        let updatedSubModules = [...(p.subModules || [])];
        
        if (navItem && navItem.subModules && navItem.subModules.length > 0) {
          // Ensure all submodules exist
          navItem.subModules.forEach(navSubModule => {
            let subModule = updatedSubModules.find(sm => sm.name === navSubModule.name);
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
              updatedSubModules.push(subModule);
            }
          });
          
          // Update all submodule actions
          updatedSubModules = updatedSubModules.map(subModule => {
            const updatedSubActions = { ...subModule.actions };
            const subModuleActions = Object.keys(updatedSubActions).filter(key => key !== 'all');
            subModuleActions.forEach(actionKey => {
              (updatedSubActions as any)[actionKey] = value;
            });
            updatedSubActions.all = value;
            return { ...subModule, actions: updatedSubActions };
          });
        }
        
        return {
          ...p,
          actions: updatedActions,
          subModules: updatedSubModules
        };
      } else {
        (updatedActions as any)[action] = value;
        const allActions = Object.keys(updatedActions).filter(key => key !== 'all');
        const allEnabled = allActions.every(actionKey => (updatedActions as any)[actionKey]);
        updatedActions.all = allEnabled;
        
        return {
          ...p,
          actions: updatedActions
        };
      }
    });
    
    // If module doesn't exist, add it
    if (!newPermissions.find(p => p.module === moduleKey)) {
      const newModulePermission: ModulePermission = {
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
      (newModulePermission.actions as any)[action] = value;
      if (action !== 'all') {
        const allActions = Object.keys(newModulePermission.actions).filter(key => key !== 'all');
        const allEnabled = allActions.every(actionKey => (newModulePermission.actions as any)[actionKey]);
        newModulePermission.actions.all = allEnabled;
      } else {
        const allActions = Object.keys(newModulePermission.actions).filter(key => key !== 'all');
        allActions.forEach(actionKey => {
          (newModulePermission.actions as any)[actionKey] = value;
        });
        newModulePermission.actions.all = value;
      }
      newPermissions.push(newModulePermission);
    }

    setPermissions(newPermissions);
  };

  const handleSubModuleActionChange = (moduleKey: string, subModuleName: string, action: string, value: boolean) => {
    const newPermissions = permissions.map(p => {
      if (p.module !== moduleKey) return p;
      
      let updatedSubModules = [...(p.subModules || [])];
      let subModule = updatedSubModules.find(sm => sm.name === subModuleName);
      
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
        updatedSubModules.push(subModule);
      }
      
      // Update the specific submodule
      updatedSubModules = updatedSubModules.map(sm => {
        if (sm.name !== subModuleName) return sm;
        
        const updatedSubActions = { ...sm.actions };
        
        if (action === 'all') {
          const allActions = Object.keys(updatedSubActions).filter(key => key !== 'all');
          allActions.forEach(actionKey => {
            (updatedSubActions as any)[actionKey] = value;
          });
          updatedSubActions.all = value;
        } else {
          (updatedSubActions as any)[action] = value;
          const allActions = Object.keys(updatedSubActions).filter(key => key !== 'all');
          const allEnabled = allActions.every(actionKey => (updatedSubActions as any)[actionKey]);
          updatedSubActions.all = allEnabled;
        }
        
        return { ...sm, actions: updatedSubActions };
      });
      
      return {
        ...p,
        subModules: updatedSubModules
      };
    });
    
    // If module doesn't exist, create it with the submodule
    if (!newPermissions.find(p => p.module === moduleKey)) {
      const navItem = navigationItems.find(item => item.moduleKey === moduleKey);
      const navSubModule = navItem?.subModules?.find(sm => sm.name === subModuleName);
      const newSubModule: SubModule = {
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
      
      if (action === 'all') {
        const allActions = Object.keys(newSubModule.actions).filter(key => key !== 'all');
        allActions.forEach(actionKey => {
          (newSubModule.actions as any)[actionKey] = value;
        });
        newSubModule.actions.all = value;
      } else {
        (newSubModule.actions as any)[action] = value;
        const allActions = Object.keys(newSubModule.actions).filter(key => key !== 'all');
        const allEnabled = allActions.every(actionKey => (newSubModule.actions as any)[actionKey]);
        newSubModule.actions.all = allEnabled;
      }
      
      const newModulePermission: ModulePermission = {
        module: moduleKey,
        subModules: [newSubModule],
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
      newPermissions.push(newModulePermission);
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
    const loadingToast = toast.loading('Saving permissions...');
    try {
      const { data } = await axios.post(
        '/api/agent/permissions',
        { agentId, permissions },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.dismiss(loadingToast);
        toast.success('Permissions saved successfully!');
        onClose();
      } else {
        toast.dismiss(loadingToast);
        toast.error(data.message || 'Failed to save permissions');
      }
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.message || 'Failed to save permissions. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-3 md:p-4 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="px-3 sm:px-4 md:px-5 py-3 sm:py-3.5 border-b border-gray-200 bg-gray-50 flex items-start sm:items-center justify-between gap-2 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800">Manage Permissions</h3>
            <p className="text-[10px] sm:text-[11px] text-gray-600 mt-0.5 truncate">{agentName}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-md hover:bg-gray-100 active:bg-gray-200 transition-colors text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-5">
          {loading ? (
            <div className="flex justify-center items-center h-48 sm:h-64">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-gray-200 border-t-gray-900"></div>
              <p className="ml-3 text-sm text-gray-700">Loading permissions...</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {navigationItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-600">No navigation items found</p>
                </div>
              ) : (
                navigationItems.map((item) => {
                  const modulePermission = getModulePermission(item.moduleKey);
                  const isExpanded = expandedModules.has(item.moduleKey);
                  const hasSubModules = item.subModules && item.subModules.length > 0;

                  return (
                    <div key={item._id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Module Header */}
                      <div
                        className={`flex items-center justify-between p-3 sm:p-4 bg-gray-50 ${hasSubModules ? 'cursor-pointer hover:bg-gray-100 active:bg-gray-200' : ''} transition-colors`}
                        onClick={() => hasSubModules && toggleModuleExpansion(item.moduleKey)}
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                          <span className="text-xl sm:text-2xl flex-shrink-0">{item.icon}</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs sm:text-sm font-semibold text-gray-800 truncate">{item.label}</h4>
                            {item.description && (
                              <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 line-clamp-1">{item.description}</p>
                            )}
                          </div>
                        </div>
                        {hasSubModules && (
                          <svg
                            className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path fillRule="evenodd" d="M6 6L14 10L6 14V6Z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>

                      {/* Module Actions */}
                      <div className="p-3 sm:p-4 border-t border-gray-200">
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                          {ACTIONS.map((action) => {
                            const isChecked = modulePermission.actions[action.key as keyof typeof modulePermission.actions] || false;
                            return (
                              <button
                                key={action.key}
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleModuleActionChange(item.moduleKey, action.key, !isChecked);
                                }}
                                className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ${
                                  isChecked ? action.activeBg + ' ' + action.activeText : action.inactiveBg + ' ' + action.inactiveText
                                }`}
                              >
                                <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap pointer-events-none">{action.label}</span>
                                <div
                                  className={`relative inline-flex h-4 w-7 sm:h-5 sm:w-9 items-center rounded-full transition-all duration-200 pointer-events-none ${
                                    isChecked ? 'bg-white/30' : 'bg-black/10'
                                  }`}
                                >
                                  <span
                                    className={`h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-white shadow-md transition-all duration-200 ${
                                      isChecked ? 'translate-x-3 sm:translate-x-4' : 'translate-x-0.5'
                                    }`}
                                  />
                                </div>
                              </button>
                            );
                          })}
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
                              <div key={subIdx} className="p-3 sm:p-4 border-b border-gray-200 last:border-b-0">
                                <div className="flex items-center space-x-2 mb-2 sm:mb-3">
                                  <span className="text-base sm:text-lg flex-shrink-0">{subModule.icon}</span>
                                  <h5 className="text-[11px] sm:text-xs font-medium text-gray-800 truncate">{subModule.name}</h5>
                                </div>
                                <div className="flex flex-wrap gap-2 sm:gap-3">
                                  {ACTIONS.map((action) => {
                                    const isChecked = subModulePermission.actions[action.key as keyof typeof subModulePermission.actions] || false;
                                    return (
                                      <button
                                        key={action.key}
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleSubModuleActionChange(item.moduleKey, subModule.name, action.key, !isChecked);
                                        }}
                                        className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ${
                                          isChecked ? action.activeBg + ' ' + action.activeText : action.inactiveBg + ' ' + action.inactiveText
                                        }`}
                                      >
                                        <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap pointer-events-none">{action.label}</span>
                                        <div
                                          className={`relative inline-flex h-4 w-7 sm:h-5 sm:w-9 items-center rounded-full transition-all duration-200 pointer-events-none ${
                                            isChecked ? 'bg-white/30' : 'bg-black/10'
                                          }`}
                                        >
                                          <span
                                            className={`h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-white shadow-md transition-all duration-200 ${
                                              isChecked ? 'translate-x-3 sm:translate-x-4' : 'translate-x-0.5'
                                            }`}
                                          />
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 sm:px-4 md:px-5 py-3 sm:py-3.5 border-t border-gray-200 bg-gray-50 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 sm:px-3.5 py-2.5 sm:py-2 rounded-md border border-gray-300 text-sm sm:text-[11px] font-medium text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="w-full sm:w-auto px-4 sm:px-3.5 py-2.5 sm:py-2 bg-gray-900 hover:bg-gray-800 active:bg-gray-950 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm sm:text-[11px] font-medium rounded-md transition-colors shadow-sm"
          >
            {saving ? 'Saving...' : 'Save Permissions'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentPermissionModal;

