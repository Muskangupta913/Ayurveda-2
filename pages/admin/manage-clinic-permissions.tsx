// pages/admin/manage-clinic-permissions.tsx
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { NextPageWithLayout } from '../_app';
import AdminLayout from '../../components/AdminLayout';
import ClinicPermissionManagerNew from '../../components/ClinicPermissionManagerNew';
import withAdminAuth from '../../components/withAdminAuth';

interface Clinic {
  _id: string;
  name: string;
  address: string;
  isApproved: boolean;
}

interface Doctor {
  _id: string;
  name: string;
  email?: string;
  userId?: string;
}

interface DoctorProfileApi {
  _id: string;
  user?: {
    _id?: string;
    name?: string;
    email?: string;
  };
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
  };
}

interface ClinicPermission {
  _id: string;
  clinicId:
    | {
        _id: string;
        name?: string;
      }
    | string
    | null;
  permissions: ModulePermission[];
  isActive: boolean;
  role: 'admin' | 'clinic' | 'doctor';
}

interface EntityOption {
  id: string;
  label: string;
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
  role: 'admin' | 'clinic' | 'doctor';
  subModules: Array<{
    name: string;
    path?: string;
    icon: string;
    order: number;
  }>;
}

const ACTION_KEYS: Array<keyof ModulePermission['actions']> = ['all', 'create', 'read', 'update', 'delete'];

const ManageClinicPermissionsPage: NextPageWithLayout = () => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [clinicPermissions, setClinicPermissions] = useState<ClinicPermission[]>([]);
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveStatusTimeout = useRef<NodeJS.Timeout | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);

  const createBlankActions = () => ({
    all: false,
    create: false,
    read: false,
    update: false,
    delete: false,
  });

  const sanitizeModulePermissions = useCallback(
    (items: ModulePermission[]): ModulePermission[] =>
      items.map((module) => ({
        module: module.module,
        actions: ACTION_KEYS.reduce((acc, key) => {
          acc[key] = Boolean(module.actions?.[key]);
          return acc;
        }, {} as ModulePermission['actions']),
        subModules: module.subModules?.map((subModule) => ({
          ...subModule,
          actions: ACTION_KEYS.reduce((acc, key) => {
            acc[key] = Boolean(subModule.actions?.[key]);
            return acc;
          }, {} as SubModule['actions']),
        })) || [],
      })),
    [],
  );

  const arePermissionsEqual = (left: ModulePermission[], right: ModulePermission[]) =>
    JSON.stringify(left) === JSON.stringify(right);

  const roleOptions = [
    { label: 'Clinic', value: 'clinic' },
    { label: 'Doctor', value: 'doctor' },
  ] as const;

  const [selectedRole, setSelectedRole] = useState<'clinic' | 'doctor'>(roleOptions[0].value);
  const [roleLoading, setRoleLoading] = useState(false);
  const entityOptions = useMemo<EntityOption[]>(() => {
    if (selectedRole === 'clinic') {
      return clinics.map(({ _id, name }) => ({
        id: _id,
        label: name,
      }));
    }

    return doctors.map(({ _id, name, email }) => ({
      id: _id,
      label: name || email || 'Unnamed doctor',
    }));
  }, [selectedRole, clinics, doctors]);
  const entityCardLabel = selectedRole === 'clinic' ? 'Clinics' : 'Doctors';
  const entitySelectLabel = selectedRole === 'clinic' ? 'Select clinic' : 'Select doctor';
  const entityPlaceholder = selectedRole === 'clinic' ? 'Choose a clinic...' : 'Choose a doctor...';
  const entityCount = entityOptions.length;

  const fetchClinics = useCallback(async (): Promise<Clinic[]> => {
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
      
      const clinicsData: Clinic[] = data?.clinics || [];
      console.log('Found clinics:', clinicsData.length);
      setClinics(clinicsData);
      return clinicsData;
    } catch (error) {
      console.error('Error fetching clinics:', error);
      return [];
    }
  }, []);

  const fetchDoctors = useCallback(async (): Promise<Doctor[]> => {
    try {
      const token = localStorage.getItem('adminToken');
      console.log('Fetching doctors list...');

      const response = await fetch('/api/admin/getAllDoctors', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Doctors response status:', response.status);
      const data = await response.json();
      console.log('Doctors API response:', data);

      if (!data?.success) {
        console.log('No doctors found or API reported failure.');
        setDoctors([]);
        return [];
      }

      const doctorProfiles: DoctorProfileApi[] = Array.isArray(data.doctorProfiles)
        ? data.doctorProfiles
        : [];
      const normalizedDoctors: Doctor[] = doctorProfiles.map((profile) => ({
        _id: profile._id,
        name: profile?.user?.name || profile?.user?.email || 'Unnamed doctor',
        email: profile?.user?.email,
        userId: profile?.user?._id,
      }));

      console.log('Found doctors:', normalizedDoctors.length);
      setDoctors(normalizedDoctors);
      return normalizedDoctors;
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setDoctors([]);
      return [];
    }
  }, []);

  const getPermissionEntityId = (permission: ClinicPermission): string => {
    if (!permission?.clinicId) {
      return '';
    }
    return typeof permission.clinicId === 'string'
      ? permission.clinicId
      : permission.clinicId._id;
  };

  const buildPermissionsForEntity = useCallback(
    (
      entityId: string,
      availablePermissions: ClinicPermission[],
      navItems: NavigationItem[],
    ): ModulePermission[] => {
      if (!entityId) {
        return [];
      }

      const existing = availablePermissions.find(
        (cp) => getPermissionEntityId(cp) === entityId
      );
      if (existing) {
        return sanitizeModulePermissions(existing.permissions);
      }

      return navItems.map((navItem) => ({
        module: navItem.moduleKey,
        subModules: navItem.subModules.map((subModule) => ({
          name: subModule.name,
          path: subModule.path,
          icon: subModule.icon,
          order: subModule.order,
          actions: createBlankActions(),
        })),
        actions: createBlankActions(),
      }));
    },
    [sanitizeModulePermissions],
  );

  const fetchClinicPermissions = useCallback(async (
    role: 'clinic' | 'doctor',
    entityOptionsOverride?: EntityOption[],
  ) => {
    try {
      const token = localStorage.getItem('adminToken');
      console.log('Fetching clinic permissions for role:', role);
      
      const response = await fetch(`/api/admin/permissions/clinic?role=${role}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Permissions response status:', response.status);
      const data = await response.json();
      console.log('Permissions API Response:', data);
      
      if (data.success) {
        const permissionsArray = Array.isArray(data.data) ? data.data : data.data ? [data.data] : [];
        const normalizedPermissions = permissionsArray.map((permission: ClinicPermission) => ({
          ...permission,
          role: permission.role || 'clinic',
        }));
        console.log('Found permissions:', normalizedPermissions.length);
        const entityOptionsForRole = entityOptionsOverride || [];

        const enrichedPermissions = normalizedPermissions.map((permission: ClinicPermission) => {
          const rawId =
            typeof permission.clinicId === 'object' && permission.clinicId !== null
              ? permission.clinicId._id
              : permission.clinicId;
          const stringId = rawId?.toString?.() || '';
          const entityMatch = entityOptionsForRole.find((option) => option.id === stringId);
          return {
            ...permission,
            clinicId: {
              _id: stringId,
              name:
                entityMatch?.label ||
                (typeof permission.clinicId === 'object' ? permission.clinicId?.name : undefined) ||
                'Unknown',
            },
          };
        });

        setClinicPermissions(enrichedPermissions as ClinicPermission[]);
      } else {
        console.log('No permissions found or error:', data.message);
        setClinicPermissions([]);
      }
    } catch (error) {
      console.error('Error fetching clinic permissions:', error);
    }
  }, []);

  const fetchNavigationItems = useCallback(async (role: 'clinic' | 'doctor') => {
    try {
      const token = localStorage.getItem('adminToken');
      console.log('Fetching clinic navigation items for role:', role);
      
      const response = await fetch(`/api/navigation/get-by-role?role=${role}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Navigation response status:', response.status);

      if (!response.ok) {
        console.warn('Navigation request failed, skipping parsing', { status: response.status, statusText: response.statusText });
        setNavigationItems([]);
        return;
      }

      const data = await response.json();
      console.log('Navigation API Response:', data);
      
      if (data.success) {
        const items = Array.isArray(data.data) ? data.data : [];
        console.log('Found navigation items:', items.length);
        setNavigationItems(items as NavigationItem[]);
      } else {
        console.log('No navigation items found or error:', data.message);
        setNavigationItems([]);
      }
    } catch (error) {
      console.error('Error fetching navigation items:', error);
    }
  }, []);

  const fetchEntitiesForRole = useCallback(
    (role: 'clinic' | 'doctor') => (role === 'clinic' ? fetchClinics() : fetchDoctors()),
    [fetchClinics, fetchDoctors]
  );

  useEffect(() => {
    let cancelled = false;

    const loadRoleData = async () => {
      setRoleLoading(true);
      setSelectedEntity('');
      setPermissions([]);

      try {
        const entityList = await fetchEntitiesForRole(selectedRole);
        const entityOptionsOverride: EntityOption[] = entityList.map((entity) => ({
          id: entity._id,
          label: entity.name || (selectedRole === 'clinic' ? 'Unnamed clinic' : 'Unnamed doctor'),
        }));

        await Promise.all([
          fetchClinicPermissions(selectedRole, entityOptionsOverride),
          fetchNavigationItems(selectedRole),
        ]);
      } finally {
        if (!cancelled) {
          setRoleLoading(false);
          setLoading(false);
        }
      }
    };

    loadRoleData();

    return () => {
      cancelled = true;
    };
  }, [selectedRole, fetchEntitiesForRole, fetchClinicPermissions, fetchNavigationItems]);

  const handleEntitySelect = (entityId: string) => {
    setSelectedEntity(entityId);
    if (!entityId) {
      setPermissions([]);
    }
  };

  useEffect(() => {
    if (!selectedEntity) {
      setPermissions([]);
      return;
    }

    const next = buildPermissionsForEntity(
      selectedEntity,
      clinicPermissions,
      navigationItems,
    );

    setPermissions((prev) => (arePermissionsEqual(prev, next) ? prev : next));
  }, [selectedEntity, clinicPermissions, navigationItems, buildPermissionsForEntity]);

  const autoSavePermissions = useCallback(async (permissionsPayload: ModulePermission[]) => {
    if (!selectedEntity || !selectedRole) return;
    console.log('Auto-saving permissions for entity:', selectedEntity, 'role:', selectedRole);
    console.log('Payload:', permissionsPayload);
    if (saveStatusTimeout.current) {
      clearTimeout(saveStatusTimeout.current);
      saveStatusTimeout.current = null;
    }
    setSaving(true);
    setSaveStatus('saving');
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/permissions/clinic', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clinicId: selectedEntity,
          role: selectedRole,
          permissions: permissionsPayload
        })
      });

      console.log('Save response status:', response.status);
      const data = await response.json();
      console.log('Save response data:', data);
      
      if (data.success) {
        setSaveStatus('saved');
        saveStatusTimeout.current = setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
        await fetchClinicPermissions(selectedRole, entityOptions);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  }, [selectedEntity, selectedRole, fetchClinicPermissions, entityOptions]);

  useEffect(() => {
    return () => {
      if (saveStatusTimeout.current) {
        clearTimeout(saveStatusTimeout.current);
      }
    };
  }, []);

  const handlePermissionsChange = useCallback((
    newPermissions: ModulePermission[],
    meta?: { trigger?: 'user' | 'sync' }
  ) => {
    console.log('Permissions changed:', newPermissions);
    setPermissions(newPermissions);
    if (meta?.trigger === 'user') {
      autoSavePermissions(newPermissions);
    }
  }, [autoSavePermissions]);

  const getEntityLabel = (entityId: string) => {
    if (!entityId) {
      return selectedRole === 'clinic' ? 'Unknown Clinic' : 'Unknown Doctor';
    }

    const option = entityOptions.find((entity) => entity.id === entityId);
    if (option) {
      return option.label;
    }

    const permissionMatch = clinicPermissions.find(
      (permission) => getPermissionEntityId(permission) === entityId
    );

    if (
      permissionMatch &&
      typeof permissionMatch.clinicId === 'object' &&
      permissionMatch.clinicId?.name
    ) {
      return permissionMatch.clinicId.name;
    }

    return selectedRole === 'clinic' ? 'Unknown Clinic' : 'Unknown Doctor';
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
      <div className="min-h-screen bg-[#f5f7fb] py-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 lg:px-8">
          <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-sky-500 to-indigo-500 text-sm font-semibold text-white shadow-sm">
                  CP
                </span>
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    permission matrix
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                      Clinic Access Control
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                      Quickly review clinics, adjust permissions, and keep every workspace aligned.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { label: 'Role-driven', icon: '🛡️' },
                  { label: 'Module aware', icon: '🧭' },
                  { label: 'Audit ready', icon: '📊' },
                ].map((item) => (
                  <span
                    key={item.label}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600"
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">{entityCardLabel}</p>
                  <p className="text-lg font-semibold text-slate-900">{roleLoading ? '…' : entityCount}</p>
                </div>
                <span className="h-9 w-9 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-sm font-semibold">
                  ✓
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Permission sets</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {roleLoading ? '…' : navigationItems.length}
                  </p>
                </div>
                <span className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-semibold">
                  ∑
                </span>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:flex sm:flex-col sm:justify-between">
                <label className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
                  Role filter
                </label>
                <div className="relative mt-2">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as typeof roleOptions[number]['value'])}
                    disabled={roleLoading}
                    className="w-full appearance-none rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {roleOptions.map((roleOption) => (
                      <option key={roleOption.value} value={roleOption.value}>
                        {roleOption.label}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:col-span-1 sm:flex sm:flex-col sm:justify-between">
                <label className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
                  {entitySelectLabel}
                </label>
                <div className="relative mt-2">
                  <select
                    value={selectedEntity}
                    onChange={(e) => handleEntitySelect(e.target.value)}
                    disabled={roleLoading || entityOptions.length === 0}
                    className="w-full appearance-none rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">{entityPlaceholder}</option>
                    {entityOptions.map((entity) => (
                      <option key={entity.id} value={entity.id}>
                        {entity.label}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </header>

          {selectedEntity && (
            <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.08)] backdrop-blur">
              <header className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Active matrix</p>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {getEntityLabel(selectedEntity)}
                  </h2>
                  <p className="text-sm text-slate-500">
                    Toggle module and sub-module permissions to tailor the clinic experience.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium">
                  {roleLoading && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                      <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
                      </svg>
                      Refreshing modules…
                    </span>
                  )}
                  {saveStatus === 'saving' && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-sky-700">
                      <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
                      </svg>
                      Saving…
                    </span>
                  )}
                  {saveStatus === 'saved' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3.25-3.25a1 1 0 111.414-1.414L8.5 11.586l6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Saved
                    </span>
                  )}
                  {saveStatus === 'error' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-rose-600">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-11.75a.75.75 0 011.5 0v4.5a.75.75 0 01-1.5 0v-4.5zM10 13.5a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                      </svg>
                      Save failed
                    </span>
                  )}
                </div>
              </header>

              <ClinicPermissionManagerNew
                permissions={permissions}
                navigationItems={navigationItems}
                onPermissionsChange={handlePermissionsChange}
                isLoading={roleLoading}
                disabled={roleLoading || saving}
                title="Permission Matrix"
              />
            </section>
          )}
        </div>
      </div>
  );
};

ManageClinicPermissionsPage.getLayout = function PageLayout(page: ReactNode) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedManageClinicPermissions: NextPageWithLayout =
  withAdminAuth(ManageClinicPermissionsPage);
ProtectedManageClinicPermissions.getLayout = ManageClinicPermissionsPage.getLayout;

export default ProtectedManageClinicPermissions;

