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
} from '@heroicons/react/24/outline';
import type { NextPageWithLayout } from '../_app';

type User = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
};

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
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [loading, setLoading] = useState(true);

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

  // Sort users
  const sortUsers = (field: keyof User) => {
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

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers: User[] = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Download CSV
  const downloadCSV = () => {
    const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
    const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
    const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
    
    if ((isAgentRoute || isAgent) && agentTokenExists && !adminTokenExists && agentPermissions && agentPermissions.canExport !== true && agentPermissions.canAll !== true) {
      showToast("You do not have permission to export user data", 'error');
      return;
    }

    if (filteredUsers.length === 0) {
      showToast('No data to export', 'warning');
      return;
    }

    try {
      const headers = ['Name', 'Email', 'Phone', 'Role'];
      const csvContent = [
        headers.join(','),
        ...filteredUsers.map(user => [
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

return (
 <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
   <ToastContainer toasts={toasts} removeToast={removeToast} />
   
   <div className="max-w-7xl mx-auto space-y-4">
     {/* Header */}
     <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
         <div className="flex items-center gap-3">
           <div className="bg-gray-800 p-2 rounded-lg">
             <UserGroupIcon className="h-5 w-5 text-white" />
           </div>
           <div>
             <h1 className="text-lg font-semibold text-gray-900">User Analytics</h1>
             <p className="text-xs text-gray-700">Manage and analyze user registrations</p>
           </div>
         </div>
         <div className="bg-gray-100 px-3 py-1.5 rounded-lg">
           <span className="text-xs font-medium text-gray-700">Total: {users.length}</span>
         </div>
       </div>
     </div>

     {/* Stats Cards */}
     <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
       <div className="bg-white rounded-lg border border-gray-200 p-3">
         <p className="text-xs text-gray-700 mb-1">Total Users</p>
         <p className="text-xl font-bold text-gray-900">{users.length}</p>
       </div>
       {Object.entries(roleCounts).slice(0, 3).map(([role, count]) => (
         <div key={role} className="bg-white rounded-lg border border-gray-200 p-3">
           <p className="text-xs text-gray-700 mb-1">{role}</p>
           <p className="text-xl font-bold text-gray-900">{count}</p>
         </div>
       ))}
     </div>

     {/* Controls */}
     <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
       <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
         {/* Search */}
         <div className="relative flex-1 max-w-full lg:max-w-md">
           <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-700" />
           <input
             type="text"
             placeholder="Search by name, email, or phone..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-800"
           />
         </div>

         {/* Actions */}
         <div className="flex gap-2">
           {(() => {
             const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
             const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
             const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
             
             const canExport = isAdmin || (isAgent && !permissionsLoading && agentPermissions && (agentPermissions.canExport || agentPermissions.canAll));
             
             if (canExport) {
               return (
                 <button
                   onClick={downloadCSV}
                   className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-medium rounded-lg transition-colors"
                 >
                   <ArrowDownTrayIcon className="w-4 h-4" />
                   <span className="hidden sm:inline">Export CSV</span>
                 </button>
               );
             }
             return null;
           })()}
           <div className="flex items-center gap-2">
             <FunnelIcon className="w-4 h-4 text-gray-700" />
             <select
               value={sortField}
               onChange={(e) => sortUsers(e.target.value as keyof User)}
               className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-800"
             >
               <option value="name">Sort by Name</option>
               <option value="email">Sort by Email</option>
               <option value="phone">Sort by Phone</option>
             </select>
           </div>
         </div>
       </div>
     </div>

     {/* User List */}
     <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
       <div className="space-y-1 p-2">
         {currentUsers.map((user) => (
           <div key={user._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-2">
             <div className="flex items-center gap-3 flex-1 min-w-0">
               <div className="bg-gray-800 p-1.5 rounded-lg flex-shrink-0">
                 <UserIcon className="h-4 w-4 text-white" />
               </div>
               <div className="flex-1 min-w-0">
                 <h3 className="text-sm font-semibold text-gray-900 truncate">{user.name}</h3>
                 <span className="inline-block px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded mt-1">
                   {user.role}
                 </span>
               </div>
             </div>

             <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pl-9 sm:pl-0">
               <div className="flex items-center text-xs text-gray-700">
                 <EnvelopeIcon className="w-3 h-3 mr-1.5 text-gray-600 flex-shrink-0" />
                 <span className="truncate">{user.email}</span>
               </div>
               <div className="flex items-center text-xs text-gray-700">
                 <PhoneIcon className="w-3 h-3 mr-1.5 text-gray-600 flex-shrink-0" />
                 <span>{user.phone}</span>
               </div>
             </div>
           </div>
         ))}
       </div>
     </div>

     {/* Pagination */}
     {totalPages > 1 && (
       <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
           <div className="text-xs text-gray-700 text-center sm:text-left">
             Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} results
           </div>
           
           <div className="flex items-center justify-center gap-2">
             <button
               onClick={() => {
                 setCurrentPage(prev => Math.max(prev - 1, 1));
                 showToast('Previous page', 'info');
               }}
               disabled={currentPage === 1}
               className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <ChevronLeftIcon className="w-4 h-4" />
               <span className="hidden sm:inline ml-1">Previous</span>
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
                     className={`px-2 py-1.5 text-xs font-medium rounded-lg ${
                       currentPage === pageNum
                         ? 'bg-gray-800 text-white'
                         : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                     }`}
                   >
                     {pageNum}
                   </button>
                 );
               })}
             </div>
             
             <button
               onClick={() => {
                 setCurrentPage(prev => Math.min(prev + 1, totalPages));
                 showToast('Next page', 'info');
               }}
               disabled={currentPage === totalPages}
               className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <span className="hidden sm:inline mr-1">Next</span>
               <ChevronRightIcon className="w-4 h-4" />
             </button>
           </div>
         </div>
       </div>
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

