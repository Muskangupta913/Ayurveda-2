import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';
import withAdminAuth from '../../components/withAdminAuth';
import { useAgentPermissions } from '../../hooks/useAgentPermissions';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EnvelopeIcon,
  PhoneIcon,
  UserIcon,
  XCircleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ChartBarSquareIcon,
  ChartPieIcon,
} from '@heroicons/react/24/outline';
import type { NextPageWithLayout } from '../_app';

type User = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  gender?: string;
};

type SortableField = 'name' | 'email' | 'phone';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

// Toast Component
const Toast = ({ toast, onClose }: { toast: Toast; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircleIcon className="w-4 h-4" />,
    error: <XCircleIcon className="w-4 h-4" />,
    info: <InformationCircleIcon className="w-4 h-4" />,
    warning: <ExclamationTriangleIcon className="w-4 h-4" />,
  };

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
  };

  return (
    <div
      className={`${colors[toast.type]} text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-xs animate-slide-in`}
    >
      {icons[toast.type]}
      <span className="flex-1 font-medium">{toast.message}</span>
      <button
        onClick={onClose}
        className="hover:bg-white/20 rounded p-0.5 transition-colors"
      >
        <XMarkIcon className="w-3 h-3" />
      </button>
    </div>
  );
};

// Toast Container
const ToastContainer = ({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) => (
  <div className="fixed top-4 right-4 z-50 space-y-2">
    {toasts.map((toast) => (
      <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
    ))}
  </div>
);

function UserProfile() {
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(20);
  const [sortField, setSortField] = useState<SortableField>('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // Toast helper functions
  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Check if user is an admin or agent
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAgent, setIsAgent] = useState<boolean>(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const adminToken = !!localStorage.getItem('adminToken');
      const agentToken = !!localStorage.getItem('agentToken');
      const isAgentRoute = router.pathname?.startsWith('/agent/') || window.location.pathname?.startsWith('/agent/');
      
      if (isAgentRoute && agentToken) {
        setIsAdmin(false);
        setIsAgent(true);
      } else if (adminToken) {
        setIsAdmin(true);
        setIsAgent(false);
      } else if (agentToken) {
        setIsAdmin(false);
        setIsAgent(true);
      } else {
        setIsAdmin(false);
        setIsAgent(false);
      }
    }
  }, [router.pathname]);
  
  const agentPermissionsData: any = useAgentPermissions(isAgent ? "admin_user_analytics" : (null as any));
  const agentPermissions = isAgent ? agentPermissionsData?.permissions : null;
  const permissionsLoading = isAgent ? agentPermissionsData?.loading : false;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
        const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
        const token = adminToken || agentToken;

        const res = await fetch('/api/admin/analytics', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
          if (res.status === 403) {
            setUsers([]);
            setFilteredUsers([]);
            showToast('You do not have permission to view analytics', 'error');
            setLoading(false);
            return;
          }
          throw new Error('Failed to fetch users');
        }

        const data = await res.json();
        const usersData = data.users || [];
        setUsers(usersData);
        setFilteredUsers(usersData);
        if (usersData.length > 0) {
          showToast(`Loaded ${usersData.length} user(s)`, 'success');
        }
      } catch (error: any) {
        console.error('Failed to fetch users:', error);
        showToast('Failed to load user analytics', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchUsers();
    } else if (isAgent) {
      if (!permissionsLoading) {
        if (agentPermissions && (agentPermissions.canRead === true || agentPermissions.canAll === true)) {
          fetchUsers();
        } else {
          setLoading(false);
        }
      }
    } else {
      setLoading(false);
    }
  }, [isAdmin, isAgent, permissionsLoading, agentPermissions, showToast]);

  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
      if (filtered.length === 0) {
        showToast('No users found matching your search', 'info');
      }
    }
    setCurrentPage(1);
  }, [searchTerm, users, showToast]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRole]);

  // Sort users
  const sortUsers = (field: SortableField) => {
    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(direction);
    
    const sorted = [...filteredUsers].sort((a, b) => {
      if (direction === 'asc') {
        return a[field].localeCompare(b[field]);
      } else {
        return b[field].localeCompare(a[field]);
      }
    });
    setFilteredUsers(sorted);
    showToast(`Sorted by ${field} (${direction})`, 'info');
  };

  const roleFilteredUsers =
    selectedRole === 'all'
      ? filteredUsers
      : filteredUsers.filter((user) => user.role === selectedRole);

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers: User[] = roleFilteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(roleFilteredUsers.length / usersPerPage);

  // Download CSV
  const downloadCSV = () => {
    const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
    const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
    const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
    
    if ((isAgentRoute || isAgent) && agentTokenExists && !adminTokenExists && agentPermissions && agentPermissions.canExport !== true && agentPermissions.canAll !== true) {
      showToast("You do not have permission to export user data", 'error');
      return;
    }

    const exportData =
      selectedRole === 'all'
        ? filteredUsers
        : filteredUsers.filter((user) => user.role === selectedRole);

    if (exportData.length === 0) {
      showToast('No data to export', 'warning');
      return;
    }

    try {
      const headers = ['Name', 'Email', 'Phone', 'Role'];
      const csvContent = [
        headers.join(','),
        ...exportData.map(user => [
          `"${user.name}"`,
          `"${user.email}"`,
          `"${user.phone}"`,
          `"${user.role}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `users_analytics_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('CSV file downloaded successfully', 'success');
    } catch (error) {
      showToast('Failed to download CSV file', 'error');
    }
  };

  // Check if agent has read permission
  const hasReadPermission = isAdmin || (isAgent && agentPermissions && (agentPermissions.canRead === true || agentPermissions.canAll === true));
  const canExport =
    isAdmin ||
    (isAgent && !permissionsLoading && agentPermissions && (agentPermissions.canExport || agentPermissions.canAll));

  if (loading || (isAgent && permissionsLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mx-auto"></div>
          <p className="mt-3 text-sm text-gray-700">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (isAgent && !hasReadPermission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm p-6 max-w-sm w-full text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <XCircleIcon className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-sm text-gray-700">
            You do not have permission to view user analytics.
          </p>
        </div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Users Found</h3>
            <p className="text-sm text-gray-700">No user data available at the moment.</p>
          </div>
        </div>
      </div>
    );
  }

  // Get role counts for stats
  const roleCounts = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const uniqueRoles = Object.keys(roleCounts);
  const topRoleEntry = uniqueRoles
    .map((role) => ({ role, count: roleCounts[role] }))
    .sort((a, b) => b.count - a.count)[0];
  const averagePerRole =
    uniqueRoles.length > 0 ? Math.round(users.length / uniqueRoles.length) : 0;
  const summaryStats = [
    {
      label: 'Total Users',
      value: users.length,
      meta: `${roleFilteredUsers.length} in view`,
    },
    {
      label: 'Top Role',
      value: topRoleEntry ? topRoleEntry.role : '—',
      meta: topRoleEntry ? `${topRoleEntry.count} members` : 'No data',
    },
    {
      label: 'Unique Roles',
      value: uniqueRoles.length,
      meta: 'Segments tracked',
    },
    {
      label: 'Avg / Role',
      value: averagePerRole,
      meta: 'Members per category',
    },
  ];
  const roleDistribution = uniqueRoles
    .map((role) => ({
      role,
      count: roleCounts[role],
      percentage: Math.round((roleCounts[role] / users.length) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  const allowedGenders = ['male', 'female', 'other'];
  const genderCounts = users.reduce((acc, user) => {
    const normalized = user.gender
      ? user.gender.toLowerCase().trim()
      : 'unspecified';
    const bucket = allowedGenders.includes(normalized)
      ? normalized
      : 'unspecified';
    acc[bucket] = (acc[bucket] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const genderDistribution = Object.entries(genderCounts).map(
    ([gender, count]) => ({
      gender,
      count,
      percentage: users.length
        ? Math.round((count / users.length) * 100)
        : 0,
    })
  );

return (
  <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
    <ToastContainer toasts={toasts} removeToast={removeToast} />

    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest text-slate-300">
              Admin · User analytics
            </p>
            <h1 className="text-3xl font-semibold leading-tight">
              Intelligence dashboard for every user touchpoint
            </h1>
            <p className="max-w-2xl text-sm text-slate-200">
              Track growth across roles, surface who recently joined, and export the exact slice you need.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-2xl border border-white/30 bg-white/10 px-6 py-4 text-center">
              <p className="text-xs uppercase tracking-widest text-slate-200">
                Active profiles
              </p>
              <p className="text-3xl font-semibold">{roleFilteredUsers.length}</p>
            </div>
            {canExport && (
              <button
                onClick={downloadCSV}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Export view
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
              {stat.label}
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {stat.value}
            </p>
            <p className="text-xs text-slate-500">{stat.meta}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Filter roles
              </span>
              {['all', ...uniqueRoles].map((role) => {
                const chipCount = role === 'all'
                  ? filteredUsers.length
                  : roleCounts[role] || 0;
                return (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      selectedRole === role
                        ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {role === 'all' ? 'All roles' : role}{' '}
                    <span className="text-[10px] opacity-80">({chipCount})</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <FunnelIcon className="h-4 w-4 text-slate-400" />
                Sorting
              </div>
              <select
              value={sortField}
              onChange={(e) => sortUsers(e.target.value as SortableField)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 lg:w-48"
              >
                <option value="name">Name (A-Z)</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
              </select>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-slate-700">
              <ChartBarSquareIcon className="h-5 w-5" />
              <p className="text-sm font-semibold">Role distribution</p>
            </div>
            <div className="mt-4 space-y-3">
              {roleDistribution.length === 0 ? (
                <p className="text-sm text-slate-500">No roles available.</p>
              ) : (
                roleDistribution.map((role) => (
                  <div key={role.role}>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-medium text-slate-700">{role.role}</span>
                      <span>{role.count} · {role.percentage || 0}%</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-slate-900"
                        style={{ width: `${role.percentage || 0}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          {/* <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-slate-700">
              <ChartPieIcon className="h-5 w-5" />
              <p className="text-sm font-semibold">Gender breakdown</p>
            </div>
            <div className="mt-4 space-y-3">
              {genderDistribution.length === 0 ? (
                <p className="text-sm text-slate-500">No gender data available.</p>
              ) : (
                genderDistribution.map((item) => (
                  <div key={item.gender}>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-medium text-slate-700 capitalize">
                        {item.gender}
                      </span>
                      <span>{item.count} · {item.percentage || 0}%</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-slate-800"
                        style={{ width: `${item.percentage || 0}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
              <p className="text-[11px] text-slate-400">
                Invalid or missing values are grouped as “unspecified”.
              </p>
            </div>
          </div> */}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        {roleFilteredUsers.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">
            No users match the current filters.
          </div>
        ) : (
          <div className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-3">
            {currentUsers.map((user) => (
              <div
                key={user._id}
                className="rounded-2xl border border-slate-100 bg-slate-50/40 p-5 shadow-sm transition hover:border-slate-200 hover:bg-white"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-slate-900/90 p-2 text-white">
                      <UserIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">ID: {user._id.slice(-6)}</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                    {user.role}
                  </span>
                </div>
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <div className="flex items-center">
                    <EnvelopeIcon className="mr-2 h-4 w-4 text-slate-400" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center">
                    <PhoneIcon className="mr-2 h-4 w-4 text-slate-400" />
                    <span>{user.phone}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {totalPages > 1 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Showing {roleFilteredUsers.length === 0 ? 0 : indexOfFirstUser + 1} –
              {Math.min(indexOfLastUser, roleFilteredUsers.length)} of {roleFilteredUsers.length} users
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCurrentPage((prev) => Math.max(prev - 1, 1));
                  showToast('Previous page', 'info');
                }}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Prev
              </button>
              <div className="flex gap-1">
                {[...Array(Math.min(totalPages, 7))].map((_, index) => {
                  let pageNum;
                  if (totalPages <= 7) {
                    pageNum = index + 1;
                  } else if (currentPage <= 4) {
                    pageNum = index + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + index;
                  } else {
                    pageNum = currentPage - 3 + index;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => {
                        setCurrentPage(pageNum);
                        showToast(`Page ${pageNum}`, 'info');
                      }}
                      className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
                        currentPage === pageNum
                          ? 'bg-slate-900 text-white'
                          : 'border border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => {
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                  showToast('Next page', 'info');
                }}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  </div>
);
}

UserProfile.getLayout = function PageLayout(page: React.ReactNode) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedDashboard: NextPageWithLayout = withAdminAuth(UserProfile);
ProtectedDashboard.getLayout = UserProfile.getLayout;

export default ProtectedDashboard;

