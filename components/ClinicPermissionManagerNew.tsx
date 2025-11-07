import React, { useState, useEffect, useCallback } from 'react';

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

interface ClinicNavigationItem {
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

interface ClinicPermissionManagerProps {
  permissions: ModulePermission[];
  onPermissionsChange: (permissions: ModulePermission[]) => void;
  disabled?: boolean;
  title?: string;
}

const ACTIONS = [
  { key: 'all', label: 'All', color: 'bg-purple-600' },
  { key: 'create', label: 'Create', color: 'bg-green-500' },
  { key: 'read', label: 'Read', color: 'bg-yellow-500' },
  { key: 'update', label: 'Update', color: 'bg-blue-500' },
  { key: 'delete', label: 'Delete', color: 'bg-red-500' },
  { key: 'print', label: 'Print', color: 'bg-purple-600' },
  { key: 'export', label: 'Export', color: 'bg-gray-800' },
  { key: 'approve', label: 'Approve', color: 'bg-gray-800' }
];

const ClinicPermissionManagerNew: React.FC<ClinicPermissionManagerProps> = ({
  permissions,
  onPermissionsChange,
  disabled = false,
  title = "Manage Clinic Permissions"
}) => {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [localPermissions, setLocalPermissions] = useState<ModulePermission[]>(permissions);
  const [navigationItems, setNavigationItems] = useState<ClinicNavigationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClinicNavigationItems();
  }, []);

  useEffect(() => {
    setLocalPermissions(permissions);
  }, [permissions]);

  // Sync permissions with navigation items when both are available
  useEffect(() => {
    if (navigationItems.length > 0) {
      // Always ensure we have permissions for all navigation items
      const currentModules = localPermissions.map(p => p.module);
      const missingModules = navigationItems.filter(navItem => !currentModules.includes(navItem.moduleKey));

      if (missingModules.length > 0) {
        console.log('Adding missing modules to permissions:', missingModules.map(m => m.moduleKey));

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

        const updatedPermissions = [...localPermissions, ...newPermissions];
        setLocalPermissions(updatedPermissions);
        onPermissionsChange(updatedPermissions);
      }
    }
  }, [navigationItems, localPermissions, onPermissionsChange]);

  const fetchClinicNavigationItems = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/navigation/clinic-items', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setNavigationItems(data.data);
        // Auto-expand modules with sub-modules
        const modulesWithSubModules = data.data.filter(item => item.subModules && item.subModules.length > 0);
        setExpandedModules(new Set(modulesWithSubModules.map(item => item.moduleKey)));
      }
    } catch (error) {
      console.error('Error fetching clinic navigation items:', error);
    } finally {
      setLoading(false);
    }
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

  const handleModuleActionChange = (moduleIndex: number, action: string, value: boolean) => {
    console.log('handleModuleActionChange called:', { moduleIndex, action, value });

    const newPermissions = [...localPermissions];

    // Check if moduleIndex is valid
    if (moduleIndex < 0 || moduleIndex >= newPermissions.length) {
      console.error('Invalid module index:', moduleIndex);
      return;
    }

    const module = newPermissions[moduleIndex];

    // Ensure module exists and has actions
    if (!module) {
      console.error('Module not found at index:', moduleIndex);
      return;
    }

    if (!module.actions) {
      console.error('Module actions not found for module:', module);
      return;
    }

    console.log('Current module actions:', module.actions);

    if (action === 'all') {
      const allActions = Object.keys(module.actions).filter(key => key !== 'all');
      const newValue = value;
      allActions.forEach(actionKey => {
        (module.actions as any)[actionKey] = newValue;
      });
    } else {
      (module.actions as any)[action] = value;

      const allActions = Object.keys(module.actions).filter(key => key !== 'all');
      const allEnabled = allActions.every(actionKey =>
        (module.actions as any)[actionKey]
      );
      module.actions.all = allEnabled;
    }

    console.log('Updated module actions:', module.actions);

    setLocalPermissions(newPermissions);
    onPermissionsChange(newPermissions);
  };

  const handleSubModuleActionChange = (moduleIndex: number, subModuleIndex: number, action: string, value: boolean) => {
    const newPermissions = [...localPermissions];

    // Check if moduleIndex is valid
    if (moduleIndex < 0 || moduleIndex >= newPermissions.length) {
      console.error('Invalid module index:', moduleIndex);
      return;
    }

    const module = newPermissions[moduleIndex];

    // Ensure module exists
    if (!module) {
      console.error('Module not found at index:', moduleIndex);
      return;
    }

    // Ensure sub-modules array exists
    if (!module.subModules) {
      module.subModules = [];
    }

    // Ensure the sub-module exists at the given index
    if (!module.subModules[subModuleIndex]) {
      module.subModules[subModuleIndex] = {
        name: '',
        path: '',
        icon: '📄',
        order: 0,
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
    }

    const subModule = module.subModules[subModuleIndex];

    if (action === 'all') {
      const allActions = Object.keys(subModule.actions).filter(key => key !== 'all');
      const newValue = value;
      allActions.forEach(actionKey => {
        (subModule.actions as any)[actionKey] = newValue;
      });
    } else {
      (subModule.actions as any)[action] = value;

      const allActions = Object.keys(subModule.actions).filter(key => key !== 'all');
      const allEnabled = allActions.every(actionKey =>
        (subModule.actions as any)[actionKey]
      );
      subModule.actions.all = allEnabled;
    }

    setLocalPermissions(newPermissions);
    onPermissionsChange(newPermissions);
  };

  const getModulePermission = (moduleKey: string) => {
    return localPermissions.find(p => p.module === moduleKey) || {
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

  const getSubModulePermission = (moduleKey: string, subModuleName: string) => {
    const modulePermission = getModulePermission(moduleKey);
    const subModule = modulePermission.subModules.find(sm => sm.name === subModuleName);

    if (subModule) {
      return subModule;
    }

    // Return default sub-module permission if not found
    return {
      name: subModuleName,
      path: '',
      icon: '📄',
      order: 0,
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

  if (loading) {
    return React.createElement("div", { className: "bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto" },
      React.createElement("div", { className: "flex justify-center items-center h-64" },
        React.createElement("div", { className: "animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500" })
      )
    );
  }

  return React.createElement("div", { className: "bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto" },
    React.createElement("h2", { className: "text-2xl font-bold text-gray-800 mb-6" }, title),

    React.createElement("div", { className: "space-y-4" },
      navigationItems.map((item) => {
        const modulePermission = getModulePermission(item.moduleKey);
        const isExpanded = expandedModules.has(item.moduleKey);
        const hasSubModules = item.subModules && item.subModules.length > 0;

        return React.createElement("div", { key: item._id, className: "border border-gray-200 rounded-lg" },
          // Module Header
          React.createElement("div", {
            className: "flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100",
            onClick: () => toggleModuleExpansion(item.moduleKey)
          },
            React.createElement("div", { className: "flex items-center space-x-3" },
              React.createElement("span", { className: "text-2xl" }, item.icon),
              React.createElement("div", null,
                React.createElement("span", { className: "font-medium text-gray-800" }, item.label),
                item.description && (
                  React.createElement("p", { className: "text-sm text-gray-600" }, item.description)
                )
              )
            ),
            React.createElement("div", { className: "flex items-center space-x-2" },
              hasSubModules && (
                React.createElement("span", { className: "text-sm text-gray-500" },
                  item.subModules?.length, " sub-modules"
                )
              ),
              React.createElement("svg", {
                className: `w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`,
                fill: "none",
                stroke: "currentColor",
                viewBox: "0 0 24 24"
              },
                React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" })
              )
            )
          ),

          // Module Content
          isExpanded && (
            React.createElement("div", { className: "p-4 border-t border-gray-200" },
              // Module-level Actions
              React.createElement("div", { className: "mb-4" },
                React.createElement("h4", { className: "text-sm font-medium text-gray-700 mb-3" }, "Module Actions"),
                React.createElement("div", { className: "flex flex-wrap gap-2" },
                  ACTIONS.map((action) => (
                    React.createElement("label", { key: action.key, className: "flex items-center space-x-2 cursor-pointer" },
                      React.createElement("input", {
                        type: "checkbox",
                        checked: modulePermission.actions[action.key as keyof typeof modulePermission.actions],
                        onChange: (e) => {
                          const moduleIndex = localPermissions.findIndex(p => p.module === item.moduleKey);
                          console.log('Module action change:', { moduleKey: item.moduleKey, moduleIndex, action: action.key, checked: e.target.checked });

                          if (moduleIndex >= 0) {
                            handleModuleActionChange(
                              moduleIndex,
                              action.key,
                              e.target.checked
                            );
                          } else {
                            console.error('Module not found in permissions:', item.moduleKey);
                            // Create the module if it doesn't exist
                            const newPermission = {
                              module: item.moduleKey,
                              subModules: item.subModules?.map(subModule => ({
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
                            };

                            // Set the action value
                            if (action.key === 'all') {
                              const allActions = Object.keys(newPermission.actions).filter(key => key !== 'all');
                              allActions.forEach(actionKey => {
                                (newPermission.actions as any)[actionKey] = e.target.checked;
                              });
                            } else {
                              (newPermission.actions as any)[action.key] = e.target.checked;
                            }

                            const updatedPermissions = [...localPermissions, newPermission];
                            setLocalPermissions(updatedPermissions);
                            onPermissionsChange(updatedPermissions);
                          }
                        },
                        disabled: disabled,
                        className: "sr-only"
                      }),
                      React.createElement("div", {
                        className: `
                        px-3 py-1 rounded-full text-xs font-medium transition-colors
                        ${modulePermission.actions[action.key as keyof typeof modulePermission.actions]
                            ? `${action.color} text-white`
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }
                      ` },
                        action.label
                      )
                    )
                  ))
                )
              ),

              // Sub-modules
              hasSubModules && (
                React.createElement("div", null,
                  React.createElement("h4", { className: "text-sm font-medium text-gray-700 mb-3" }, "Sub-modules"),
                  React.createElement("div", { className: "space-y-3" },
                    item.subModules?.map((subModule, subIndex) => {
                      const subModulePermission = getSubModulePermission(item.moduleKey, subModule.name);
                      return (
                        React.createElement("div", { key: subIndex, className: "bg-gray-50 p-3 rounded-lg" },
                          React.createElement("div", { className: "flex items-center justify-between mb-2" },
                            React.createElement("div", { className: "flex items-center space-x-2" },
                              React.createElement("span", { className: "text-lg" }, subModule.icon),
                              React.createElement("span", { className: "font-medium text-gray-800" }, subModule.name)
                            )
                          ),
                          React.createElement("div", { className: "flex flex-wrap gap-2" },
                            ACTIONS.map((action) => (
                              React.createElement("label", { key: action.key, className: "flex items-center space-x-2 cursor-pointer" },
                                React.createElement("input", {
                                  type: "checkbox",
                                  checked: subModulePermission.actions[action.key as keyof typeof subModulePermission.actions],
                                  onChange: (e) => {
                                    const moduleIndex = localPermissions.findIndex(p => p.module === item.moduleKey);
                                    console.log('Sub-module action change:', { moduleKey: item.moduleKey, moduleIndex, subModuleName: subModule.name, action: action.key, checked: e.target.checked });

                                    if (moduleIndex >= 0) {
                                      handleSubModuleActionChange(
                                        moduleIndex,
                                        subIndex,
                                        action.key,
                                        e.target.checked
                                      );
                                    } else {
                                      console.error('Module not found for sub-module action:', item.moduleKey);
                                      // Create the module if it doesn't exist
                                      const newPermission = {
                                        module: item.moduleKey,
                                        subModules: item.subModules?.map((sub, idx) => ({
                                          name: sub.name,
                                          path: sub.path || '',
                                          icon: sub.icon,
                                          order: sub.order,
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
                                      };

                                      // Set the sub-module action value
                                      if (newPermission.subModules[subIndex]) {
                                        if (action.key === 'all') {
                                          const allActions = Object.keys(newPermission.subModules[subIndex].actions).filter(key => key !== 'all');
                                          allActions.forEach(actionKey => {
                                            const actions = newPermission.subModules[subIndex].actions;
                                            (actions as any)[actionKey] = e.target.checked;
                                          });
                                        } else {
                                          const actions = newPermission.subModules[subIndex].actions;
                                          (actions as any)[action.key] = e.target.checked;
                                        }
                                      }

                                      const updatedPermissions = [...localPermissions, newPermission];
                                      setLocalPermissions(updatedPermissions);
                                      onPermissionsChange(updatedPermissions);
                                    }
                                  },
                                  disabled: disabled,
                                  className: "sr-only"
                                }),
                                React.createElement("div", {
                                  className: `
                                  px-3 py-1 rounded-full text-xs font-medium transition-colors
                                  ${subModulePermission.actions[action.key as keyof typeof subModulePermission.actions]
                                      ? `${action.color} text-white`
                                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                    }
                                ` },
                                  action.label
                                )
                              )
                            ))
                          )
                        )
                      );
                    })
                  )
                )
              )
            )
          )
        );
      })
    )
  );
};

export default ClinicPermissionManagerNew;
