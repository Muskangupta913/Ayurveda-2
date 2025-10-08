// Fixed Responsive AdminSidebar.tsx with Proper Desktop Toggle
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FC, useState, useEffect } from 'react';
import clsx from 'clsx';

interface NavItem {
  label: string;
  path?: string; // ✅ Made optional
  icon: string;
  description?: string; // ✅ Made optional
  badge?: number;
  children?: NavItem[]; // ✅ Allow nested nav items
}

const navItems: NavItem[] = [
  { 
    label: 'Dashboard', 
    path: '/admin/dashboard-admin', 
    icon: '🏠',
    description: 'Overview & analytics'
  },
  { 
    label: 'Approval Clinic', 
    path: '/admin/AdminClinicApproval ', 
    icon: '✅',
    description: 'Manage Clinics'
    // badge: 8
  },
  { 
    label: 'Approval Doctors', 
    path: '/admin/approve-doctors', 
    icon: '🏥',
    description: 'Manage Doctors'
  },
  { 
    label: 'Add Treatment', 
    path: '/admin/add-treatment', 
    icon: '📝',
    description: 'Add new Treatment'
  },

    {
    label: "Staff Managemant",
    icon: "💼",
    description: "Manage Staff",
    children: [
      {
        label: "Create Staff",
        path: "/admin/create-staff",
        icon: "📢",
      },
      {
        label: "Create Services",
        path: "/admin/admin-add-service",
        icon: "💼",
      },
     
    ],
  },

  { 
    label: 'All Blogs', 
    path: '/admin/all-blogs', 
    icon: '👥',
    description: 'Manage users & roles'
  },
  { 
    label: 'User Analytics', 
    path: '/admin/analytics', 
    icon: '📊',
    description: 'View detailed reports'
  },

  {
  label: 'Request Call Back',
  path: '/admin/get-in-touch',
  icon: '📞',
  description: 'View and export user call back requests'
},
  { 
    label: 'Manage Job', 
    path: '/admin/job-manage', 
    icon: '⚙️',
    description: 'Approve or decline job'
  },
  { 
    label: 'Create-Staff', 
    path: '/admin/create-staff', 
    icon: '⚙️',
    description: 'create-staff'
  },
  { 
    label: 'View EOD Report', 
    path: '/admin/getAllEodNotes', 
    icon: '⚙️',
    description: 'staff-report'
  },
  { 
    label: 'Patient Report', 
    path: '/admin/patient-report', 
    icon: '⚙️',
    description: 'patient-report'
  },
];

interface AdminSidebarProps {
  className?: string;
}

const AdminSidebar: FC<AdminSidebarProps> = ({ className }) => {
  const router = useRouter();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isDesktopHidden, setIsDesktopHidden] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileOpen]);

  const handleRegularItemClick = () => {
    setIsMobileOpen(false);
    setOpenDropdown(null); // Close dropdown when regular items are clicked
  };

  const handleToggleDesktop = () => {
    setIsDesktopHidden(!isDesktopHidden);
  };

  const handleToggleMobile = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const handleCloseMobile = () => {
    setIsMobileOpen(false);
  };

  const handleItemClick = () => {
    setIsMobileOpen(false);
  };

 return (
  <>
    {/* Mobile Toggle Button - Only shows when sidebar is closed */}
    <button
      onClick={handleToggleMobile}
      className={clsx(
        "fixed top-4 left-4 z-[60] bg-white text-[#2D9AA5] p-3 rounded-lg shadow-lg transition-all duration-300 border border-gray-200 lg:hidden",
        {
          'block': !isMobileOpen,
          'hidden': isMobileOpen
        }
      )}
      aria-label="Open mobile menu"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>

    {/* Desktop Toggle Button */}
    <button
      onClick={handleToggleDesktop}
      className={clsx(
        "fixed top-4 left-4 z-[60] bg-white text-[#2D9AA5] p-3 rounded-lg shadow-lg transition-all duration-300 border border-gray-200 hidden lg:block",
        {
          'lg:block': isDesktopHidden,
          'lg:hidden': !isDesktopHidden
        }
      )}
      aria-label="Toggle desktop sidebar"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>

    {/* Mobile Overlay - Covers entire screen when sidebar is open */}
    {isMobileOpen && (
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
        onClick={handleCloseMobile}
        aria-hidden="true"
      />
    )}

    {/* Desktop Sidebar */}
    <aside className={clsx(
      'transition-all duration-300 ease-in-out bg-white border-r border-gray-200 shadow-sm flex-col min-h-screen w-72 hidden lg:flex',
      {
        'lg:flex': !isDesktopHidden,
        'lg:hidden': isDesktopHidden
      },
      className
    )} style={{ height: '100vh' }}>

      <div className="flex flex-col h-full">
        {/* Desktop Header Section */}
        <div className="p-6 border-b border-gray-100 flex-shrink-0 relative">
          <Link href="/admin/dashboard-admin">
            <div className="group cursor-pointer">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 group-hover:bg-[#2D9AA5]/5 transition-all duration-300 border border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-br from-[#2D9AA5] to-[#1e7d87] rounded-xl flex items-center justify-center shadow-sm">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
                <div>
                  <span className="font-bold text-xl text-gray-900 block">
                    ZEVA
                  </span>
                  <span className="text-sm text-[#2D9AA5] font-medium">Admin Dashboard</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Desktop Close Button */}
          <button
            onClick={handleToggleDesktop}
            className="absolute right-6 top-6 bg-gray-100 text-gray-600 p-2 rounded-lg hover:bg-gray-200 transition-all duration-300"
            aria-label="Close sidebar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Desktop Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6 min-h-0">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-4 px-2">
            Admin Management
          </div>
          <div className="space-y-1">
             {navItems.map((item) => {
                             const isActive = router.pathname === item.path;
                             const isDropdownOpen = openDropdown === item.label;
                             const hasChildren = item.children && item.children.length > 0;
           
                             // If item has children => Dropdown
                             if (item.children) {
                               return (
                                 <div key={item.label}>
                                   <div
                                     className={clsx(
                                       "group relative block rounded-lg transition-all duration-200 cursor-pointer p-3 touch-manipulation active:scale-98",
                                       {
                                         "bg-[#2D9AA5] text-white shadow-sm":
                                           isDropdownOpen,
                                         "hover:bg-gray-50 text-gray-700 active:bg-gray-100":
                                           !isDropdownOpen,
                                       }
                                     )}
                                     onClick={() => {
                                       setOpenDropdown(isDropdownOpen ? null : item.label);
                                     }}
                                   >
                                     <div className="flex items-center space-x-3">
                                       <div
                                         className={clsx(
                                           "text-lg p-2 rounded-lg transition-all duration-200 relative flex-shrink-0",
                                           {
                                             "bg-white/20 text-white": isDropdownOpen,
                                             "text-gray-500 group-hover:text-[#2D9AA5] group-hover:bg-[#2D9AA5]/10":
                                               !isDropdownOpen,
                                           }
                                         )}
                                       >
                                         {item.icon}
                                       </div>
                                       <div className="flex-1 min-w-0">
                                         <div
                                           className={clsx(
                                             "font-medium text-sm transition-colors duration-200 truncate",
                                             {
                                               "text-white": isDropdownOpen,
                                               "text-gray-900": !isDropdownOpen,
                                             }
                                           )}
                                         >
                                           {item.label}
                                         </div>
                                         <div
                                           className={clsx(
                                             "text-xs mt-0.5 transition-all duration-200 truncate",
                                             {
                                               "text-white/80": isDropdownOpen,
                                               "text-gray-500": !isDropdownOpen,
                                             }
                                           )}
                                         >
                                           {item.description}
                                         </div>
                                       </div>
                                       <svg
                                         className={clsx(
                                           "w-4 h-4 transition-transform duration-200 flex-shrink-0",
                                           isDropdownOpen && "rotate-90"
                                         )}
                                         fill="currentColor"
                                         viewBox="0 0 20 20"
                                       >
                                         <path
                                           fillRule="evenodd"
                                           d="M6 6L14 10L6 14V6Z"
                                           clipRule="evenodd"
                                         />
                                       </svg>
                                     </div>
                                   </div>
           
                                   {/* Dropdown children */}
                                   {isDropdownOpen && (
                                     <div className="pl-6 mt-1 space-y-1">
                                       {item.children.map((child) => {
                                         const childActive =
                                           router.pathname === child.path;
           
                                         return (
                                           <Link key={child.path} href={child.path!}>
                                             <div
                                               className={clsx(
                                                 "group relative block rounded-lg transition-all duration-200 cursor-pointer touch-manipulation active:scale-98",
                                                 child.description ? "p-3" : "p-1.5",
                                                 {
                                                   "bg-[#2D9AA5] text-white shadow-sm":
                                                     childActive,
                                                   "hover:bg-gray-50 text-gray-700 active:bg-gray-100":
                                                     !childActive,
                                                 }
                                               )}
                                               onClick={handleItemClick}
                                             >
                                               <div className="flex items-center space-x-2">
                                                 <div
                                                   className={clsx(
                                                     "text-base p-1.5 rounded-lg transition-all duration-200 relative flex-shrink-0",
                                                     {
                                                       "bg-white/20 text-white":
                                                         childActive,
                                                       "text-gray-500 group-hover:text-[#2D9AA5] group-hover:bg-[#2D9AA5]/10":
                                                         !childActive,
                                                     }
                                                   )}
                                                 >
                                                   {child.icon}
                                                 </div>
                                                 <div className="flex-1 min-w-0">
                                                   <div
                                                     className={clsx(
                                                       "font-medium text-sm transition-colors duration-200 truncate",
                                                       {
                                                         "text-white": childActive,
                                                         "text-gray-900": !childActive,
                                                       }
                                                     )}
                                                   >
                                                     {child.label}
                                                   </div>
                                                   {child.description && (
                                                     <div
                                                       className={clsx(
                                                         "text-xs mt-0.5 transition-all duration-200 truncate",
                                                         {
                                                           "text-white/80": childActive,
                                                           "text-gray-500": !childActive,
                                                         }
                                                       )}
                                                     >
                                                       {child.description}
                                                     </div>
                                                   )}
                                                 </div>
                                               </div>
                                             </div>
                                           </Link>
                                         );
                                       })}
                                     </div>
                                   )}
                                 </div>
                               );
                             }
           
                             // Regular (non-dropdown) item
                             const MenuItemContent = (
                               <div
                                 className={clsx(
                                   "group relative block rounded-lg transition-all duration-200 cursor-pointer p-3 touch-manipulation active:scale-98",
                                   {
                                     "bg-[#2D9AA5] text-white shadow-sm": isActive,
                                     "hover:bg-gray-50 text-gray-700 active:bg-gray-100":
                                       !isActive,
                                   }
                                 )}
                                 onClick={handleRegularItemClick}
                               >
                                 {isActive && (
                                   <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
                                 )}
           
                                 <div className="flex items-center space-x-3">
                                   <div
                                     className={clsx(
                                       "text-lg p-2 rounded-lg transition-all duration-200 relative flex-shrink-0",
                                       {
                                         "bg-white/20 text-white": isActive,
                                         "text-gray-500 group-hover:text-[#2D9AA5] group-hover:bg-[#2D9AA5]/10":
                                           !isActive,
                                       }
                                     )}
                                   >
                                     {item.icon}
                                     {item.badge && (
                                       <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold text-[10px]">
                                         {item.badge}
                                       </span>
                                     )}
                                   </div>
           
                                   <div className="flex-1 min-w-0">
                                     <div
                                       className={clsx(
                                         "font-medium text-sm transition-colors duration-200 truncate",
                                         {
                                           "text-white": isActive,
                                           "text-gray-900": !isActive,
                                         }
                                       )}
                                     >
                                       {item.label}
                                     </div>
           
                                     {item.description && (
                                       <div
                                         className={clsx(
                                           "text-xs mt-0.5 transition-all duration-200 truncate",
                                           {
                                             "text-white/80": isActive,
                                             "text-gray-500": !isActive,
                                           }
                                         )}
                                       >
                                         {item.description}
                                       </div>
                                     )}
                                   </div>
           
                                   <div className="flex-shrink-0 opacity-60">
                                     <svg
                                       className="w-4 h-4"
                                       fill="currentColor"
                                       viewBox="0 0 20 20"
                                     >
                                       <path
                                         fillRule="evenodd"
                                         d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                         clipRule="evenodd"
                                       />
                                     </svg>
                                   </div>
                                 </div>
                               </div>
                             );
           
                             // ✅ Only wrap in <Link> if item.path exists
                             return item.path ? (
                               <Link key={item.label} href={item.path}>
                                 {MenuItemContent}
                               </Link>
                             ) : (
                               <div key={item.label}>{MenuItemContent}</div>
                             );
                           })}
          </div>
        </nav>
      </div>
    </aside>

    {/* Mobile Sidebar - Full height overlay */}
    <div className={clsx(
      'fixed inset-0 z-50 lg:hidden transition-transform duration-300 ease-in-out',
      {
        'translate-x-0': isMobileOpen,
        '-translate-x-full': !isMobileOpen,
      }
    )}>
      <aside className="w-full max-w-xs h-full bg-white shadow-xl border-r border-gray-200 flex flex-col">
        <div className="flex flex-col h-full">
          {/* Mobile Header Section */}
          <div className="p-4 border-b border-gray-100 relative flex-shrink-0">
            {/* Mobile Close Button */}
            <button
              onClick={handleCloseMobile}
              className="absolute right-4 top-4 bg-gray-100 text-gray-600 p-2.5 rounded-lg hover:bg-gray-200 transition-all duration-200 z-10 touch-manipulation"
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="pr-16">
              <Link href="/admin/dashboard-admin" onClick={handleItemClick}>
                <div className="group cursor-pointer">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 group-hover:bg-[#2D9AA5]/5 transition-all duration-300 border border-gray-100">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#2D9AA5] to-[#1e7d87] rounded-xl flex items-center justify-center shadow-sm">
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div>
                      <span className="font-bold text-lg text-gray-900 block">
                        ZEVA
                      </span>
                      <span className="text-xs text-[#2D9AA5] font-medium">Admin Dashboard</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
            <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-4 px-2">
              Admin Management
            </div>

            <div className="space-y-1">
  {navItems.map((item) => {
    const isActive = router.pathname === item.path;

    const MenuItemContent = (
      <div
        className={clsx(
          'group relative block rounded-lg transition-all duration-200 cursor-pointer p-3 touch-manipulation active:scale-98',
          {
            'bg-[#2D9AA5] text-white shadow-sm': isActive,
            'hover:bg-gray-50 text-gray-700 active:bg-gray-100': !isActive,
          }
        )}
        onClick={handleItemClick}
      >
        {/* Active indicator */}
        {isActive && (
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
        )}

        <div className="flex items-center space-x-3">
          <div
            className={clsx(
              'text-lg p-2 rounded-lg transition-all duration-200 relative flex-shrink-0',
              {
                'bg-white/20 text-white': isActive,
                'text-gray-500 group-hover:text-[#2D9AA5] group-hover:bg-[#2D9AA5]/10':
                  !isActive,
              }
            )}
          >
            {item.icon}
            {/* Badge */}
            {item.badge && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold text-[10px]">
                {item.badge}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div
              className={clsx(
                'font-medium text-sm transition-colors duration-200 truncate',
                {
                  'text-white': isActive,
                  'text-gray-900': !isActive,
                }
              )}
            >
              {item.label}
            </div>
            {item.description && (
              <div
                className={clsx(
                  'text-xs mt-0.5 transition-all duration-200 truncate',
                  {
                    'text-white/80': isActive,
                    'text-gray-500': !isActive,
                  }
                )}
              >
                {item.description}
              </div>
            )}
          </div>

          {/* Arrow indicator */}
          <div className="flex-shrink-0 opacity-60">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>
    );

    // ✅ Wrap in <Link> only if path exists
    return item.path ? (
      <Link key={item.label} href={item.path}>
        {MenuItemContent}
      </Link>
    ) : (
      <div key={item.label}>{MenuItemContent}</div>
    );
  })}
</div>

          </nav>
        </div>
      </aside>
    </div>
{/* 
    <style jsx>{`
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.05);
      border-radius: 2px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(45, 154, 165, 0.3);
      border-radius: 2px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(45, 154, 165, 0.5);
    }

    .custom-scrollbar {
      -webkit-overflow-scrolling: touch;
    }
  `}</style> */}
  </>
);
};

export default AdminSidebar;