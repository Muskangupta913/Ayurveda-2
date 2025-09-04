import { useEffect, useState } from 'react';
import { Search, Download, Users, Filter, ChevronLeft, ChevronRight, Mail, Phone, User } from 'lucide-react';

import AdminLayout from '../../components/AdminLayout';
import withAdminAuth from '../../components/withAdminAuth'; 

type NextPageWithLayout = React.FC & {
  getLayout?: (page: React.ReactNode) => React.ReactNode;
};

type User = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
};

function UserProfile() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(20); //pagination number 
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/analytics');
        const data = await res.json();
        setUsers(data.users);
        setFilteredUsers(data.users);
      } catch (error: unknown) {
        let message = 'Failed to fetch users';
        if (typeof error === 'object' && error !== null && 'message' in error) {
          message = (error as { message?: string }).message || message;
        }
        console.error('Failed to fetch users:', message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

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
    }
    setCurrentPage(1);
  }, [searchTerm, users]);

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
  };

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers: User[] = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Download CSV
  const downloadCSV = () => {
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
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-4 text-lg text-gray-600">Loading user analytics...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Users Found</h3>
              <p className="text-gray-600">No user data available at the moment.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

return (
 <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
   <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
     {/* Header */}
     <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
         <div className="flex items-center">
           <div className="bg-[#2D9AA5] p-2 sm:p-3 rounded-lg mr-3 sm:mr-4">
             <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
           </div>
           <div>
             <h1 className="text-xl sm:text-2xl font-bold text-gray-900">User Analytics Dashboard</h1>
             <p className="text-sm sm:text-base text-gray-600">Manage and analyze user registrations</p>
           </div>
         </div>
         <div className="bg-[#2D9AA5]/10 px-3 sm:px-4 py-2 rounded-lg self-start sm:self-auto">
           <span className="text-sm font-medium text-[#2D9AA5]">Total Users: {users.length}</span>
         </div>
       </div>
     </div>

     {/* Controls */}
     <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
       <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
         {/* Search */}
         <div className="relative flex-1 max-w-full lg:max-w-md">
           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
           <input
             type="text"
             placeholder="Search by name, email, or phone..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="text-gray-700 w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-transparent text-sm sm:text-base"
           />
         </div>

         {/* Actions */}
         <div className="flex flex-col xs:flex-row gap-3">
           <button
             onClick={downloadCSV}
             className="flex items-center justify-center px-3 sm:px-4 py-2 bg-[#2D9AA5] text-white rounded-lg hover:bg-[#267982] transition-colors text-sm sm:text-base"
           >
             <Download className="h-4 w-4 mr-2" />
             Download CSV
           </button>
           <div className="flex items-center gap-2">
             <Filter className="h-4 w-4 text-gray-500 flex-shrink-0" />
             <select
               value={sortField}
               onChange={(e) => sortUsers(e.target.value as keyof User)}
               className="text-gray-700 px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-transparent text-sm sm:text-base flex-1 xs:flex-none"
             >
               <option value="name">Sort by Name</option>
               <option value="email">Sort by Email</option>
               <option value="phone">Sort by Phone</option>
             </select>
           </div>
         </div>
       </div>
     </div>

     {/* User Cards - Inline Layout */}
     <div className="bg-white rounded-lg shadow-sm overflow-hidden">
       <div className="space-y-2 p-2 sm:p-4">
         {currentUsers.map((user) => (
           <div key={user._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-3 sm:gap-0">
             <div className="flex flex-col sm:flex-row sm:items-center flex-1 min-w-0 gap-3 sm:gap-0">
               {/* User Avatar & Name */}
               <div className="flex items-center min-w-0">
                 <div className="bg-gradient-to-r from-[#2D9AA5] to-[#359BA8] p-2 rounded-full flex-shrink-0">
                   <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                 </div>
                 <div className="ml-3 min-w-0 flex-1">
                   <h3 className="text-sm font-semibold text-gray-900 truncate">{user.name}</h3>
                   <span className="inline-block px-2 py-1 text-xs font-medium bg-[#2D9AA5]/10 text-[#2D9AA5] rounded-full mt-1">
                     {user.role}
                   </span>
                 </div>
               </div>

               {/* User Details - Responsive Layout */}
               <div className="flex flex-col xs:flex-row xs:items-center xs:space-x-4 sm:space-x-6 sm:ml-4 flex-1 min-w-0 gap-2 xs:gap-0 pl-9 sm:pl-0">
                 <div className="flex items-center text-gray-600">
                   <Mail className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                   <span className="text-sm truncate">{user.email}</span>
                 </div>
                 <div className="flex items-center text-gray-600">
                   <Phone className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                   <span className="text-sm whitespace-nowrap">{user.phone}</span>
                 </div>
               </div>
             </div>
           </div>
         ))}
       </div>
     </div>

     {/* Pagination */}
     {totalPages > 1 && (
       <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
           <div className="text-sm text-gray-700 text-center sm:text-left">
             Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} results
           </div>
           
           <div className="flex items-center justify-center sm:justify-end space-x-1 sm:space-x-2">
             <button
               onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
               disabled={currentPage === 1}
               className="flex items-center px-2 sm:px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <ChevronLeft className="h-4 w-4 mr-1" />
               <span className="hidden xs:inline">Previous</span>
             </button>
             
             <div className="flex space-x-1 max-w-xs overflow-x-auto">
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
                     onClick={() => setCurrentPage(pageNum)}
                     className={`px-2 sm:px-3 py-2 text-sm font-medium rounded-lg flex-shrink-0 ${
                       currentPage === pageNum
                         ? 'bg-[#2D9AA5] text-white'
                         : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                     }`}
                   >
                     {pageNum}
                   </button>
                 );
               })}
             </div>
             
             <button
               onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
               disabled={currentPage === totalPages}
               className="flex items-center px-2 sm:px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <span className="hidden xs:inline">Next</span>
               <ChevronRight className="h-4 w-4 ml-1" />
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