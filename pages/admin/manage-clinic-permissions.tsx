// pages/admin/manage-clinic-permissions.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';
import ClinicPermissionManagerNew from '../../components/ClinicPermissionManagerNew';

interface Clinic {
  _id: string;
  name: string;
  address: string;
  isApproved: boolean;
}

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

interface ClinicPermission {
  _id: string;
  clinicId: {
    _id: string;
    name: string;
  };
  permissions: ModulePermission[];
  isActive: boolean;
}

interface NavigationItem {
  _id: string;
  label: string;
  path?: string;
  icon: string;
  description?: string;
  badge?: number;
  parentId?: string;
  order: number;
  isActive: boolean;
  moduleKey: string;
  subModules: Array<{
    name: string;
    path?: string;
    icon: string;
    order: number;
  }>;
}

export default function ManageClinicPermissions() {
  const router = useRouter();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [clinicPermissions, setClinicPermissions] = useState<ClinicPermission[]>([]);
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<string>('');
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);

  useEffect(() => {
    fetchClinics();
    fetchClinicPermissions();
    fetchNavigationItems();
  }, []);

  const fetchClinics = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      console.log('Admin token:', token ? 'Present' : 'Missing');
      
      const response = await fetch('/api/admin/approved-clinics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('API Response:', data);
      
      if (data.clinics) {
        console.log('Found clinics:', data.clinics.length);
        setClinics(data.clinics);
      } else {
        console.log('No clinics found in response');
      }
    } catch (error) {
      console.error('Error fetching clinics:', error);
    }
  };

  const fetchClinicPermissions = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      console.log('Fetching clinic permissions...');
      
      const response = await fetch('/api/admin/permissions/clinic', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Permissions response status:', response.status);
      const data = await response.json();
      console.log('Permissions API Response:', data);
      
      if (data.success) {
        console.log('Found permissions:', data.data.length);
        setClinicPermissions(data.data);
      } else {
        console.log('No permissions found or error:', data.message);
      }
    } catch (error) {
      console.error('Error fetching clinic permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNavigationItems = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      console.log('Fetching clinic navigation items...');
      
      const response = await fetch('/api/admin/navigation/clinic-items', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Navigation response status:', response.status);
      const data = await response.json();
      console.log('Navigation API Response:', data);
      
      if (data.success) {
        console.log('Found navigation items:', data.data.length);
        setNavigationItems(data.data);
      } else {
        console.log('No navigation items found or error:', data.message);
      }
    } catch (error) {
      console.error('Error fetching navigation items:', error);
    }
  };

  const handleClinicSelect = (clinicId: string) => {
    setSelectedClinic(clinicId);
    const existingPermissions = clinicPermissions.find(cp => cp.clinicId._id === clinicId);
    
    if (existingPermissions) {
      setPermissions(existingPermissions.permissions);
    } else {
      // Initialize with default permissions (all false) - dynamically generated from navigation items
      const defaultPermissions = navigationItems.map(navItem => ({
        module: navItem.moduleKey,
        subModules: navItem.subModules.map(subModule => ({
          name: subModule.name,
          path: subModule.path,
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
        })),
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
      setPermissions(defaultPermissions);
    }
  };

  const handlePermissionsChange = (newPermissions: ModulePermission[]) => {
    console.log('Permissions changed:', newPermissions);
    setPermissions(newPermissions);
  };

  const handleSave = async () => {
    if (!selectedClinic) return;

    console.log('Saving permissions for clinic:', selectedClinic);
    console.log('Permissions to save:', permissions);

    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/permissions/clinic', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clinicId: selectedClinic,
          permissions: permissions
        })
      });

      console.log('Save response status:', response.status);
      const data = await response.json();
      console.log('Save response data:', data);
      
      if (data.success) {
        alert('Permissions saved successfully!');
        fetchClinicPermissions();
      } else {
        alert('Error saving permissions: ' + data.message);
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
      alert('Error saving permissions');
    } finally {
      setSaving(false);
    }
  };

  const getClinicName = (clinicId: string) => {
    const clinic = clinics.find(c => c._id === clinicId);
    return clinic ? clinic.name : 'Unknown Clinic';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Manage Clinic Permissions</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Clinic
            </label>
            <select
              value={selectedClinic}
              onChange={(e) => handleClinicSelect(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose a clinic...</option>
              {clinics.map((clinic) => (
                <option key={clinic._id} value={clinic._id}>
                  {clinic.name}
                </option>
              ))}
            </select>
          </div>

          {selectedClinic && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Permissions for {getClinicName(selectedClinic)}
              </h2>
              
              <ClinicPermissionManagerNew
                permissions={permissions}
                onPermissionsChange={handlePermissionsChange}
                title="Clinic Permissions"
              />

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2 px-4 rounded"
                >
                  {saving ? 'Saving...' : 'Save Permissions'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Existing Permissions Overview */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Clinic Permissions</h2>
          <div className="space-y-4">
            {clinicPermissions.map((cp) => (
              <div key={cp._id} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900">{cp.clinicId.name}</h3>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                  {cp.permissions.map((perm) => (
                    <div key={perm.module} className="text-sm">
                      <span className="font-medium">{perm.module.charAt(0).toUpperCase() + perm.module.slice(1)}:</span>
                      <div className="flex space-x-1 mt-1">
                        {Object.entries(perm.actions).map(([action, enabled]) => (
                          <span
                            key={action}
                            className={`px-2 py-1 text-xs rounded ${
                              enabled 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {action}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
