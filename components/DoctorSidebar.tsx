import Link from 'next/link';
import { useRouter } from 'next/router';
import { FC, useState, useEffect } from 'react';
import clsx from 'clsx';

interface NavItem {
  key: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  description: string;
  badge?: string | number;
}

const navigationItems: NavItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/doctor/doctor-dashboard',
    description: 'Overview & metrics',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a3 3 0 106 0c0 1.61-.95 3-2 3h-2c-1.05 0-2-1.39-2-3z" />
      </svg>
    )
  },
  {
    key: 'Manage',
    label: 'Manage Profile',
    path: '/doctor/manageDoctor',
    description: 'Manage Profile',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
      </svg>
    ),
  },
  {
    key: 'See Review',
    label: 'All users Review',
    path: '/doctor/getReview',
    description: 'See All Users Reviews',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
];

interface DoctorSidebarProps {
  className?: string;
  isDesktopHidden: boolean;
  isMobileOpen: boolean;
  handleToggleDesktop: () => void;
  handleToggleMobile: () => void;
  handleCloseMobile: () => void;
  handleItemClick: () => void;
}

const DoctorSidebar: FC<DoctorSidebarProps> = ({
  className,
  isDesktopHidden,
  isMobileOpen,
  handleToggleDesktop,
  handleToggleMobile,
  handleCloseMobile,
  handleItemClick
}) => {
  const router = useRouter();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        handleCloseMobile();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileOpen, handleCloseMobile]);

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

  // Don't render until mounted to avoid hydration issues
  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* Desktop Toggle Button - Fixed Position */}
      <button
        onClick={handleToggleDesktop}
        className={clsx(
          "fixed top-4 left-4 z-[60] bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/20 backdrop-blur-sm hidden lg:block",
          {
            'lg:block': isDesktopHidden,
            'lg:hidden': !isDesktopHidden
          }
        )}
        aria-label="Toggle desktop sidebar"
      >
        <svg 
          className={clsx('w-6 h-6 transition-transform duration-300', {
            'rotate-90': isDesktopHidden
          })} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          {isDesktopHidden ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          )}
        </svg>
      </button>

      {/* Mobile Toggle Button - Fixed Position */}
      <button
        onClick={handleToggleMobile}
        className={clsx(
          "fixed top-4 left-4 z-[60] bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/20 backdrop-blur-sm lg:hidden",
          {
            'hidden': isMobileOpen
          }
        )}
        aria-label="Toggle mobile menu"
      >
        <svg 
          className="w-6 h-6"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={handleCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Desktop Sidebar */}
      <aside className={clsx(
        'hidden lg:flex transition-all duration-300 ease-in-out bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-700 text-white shadow-2xl relative overflow-hidden flex-col min-h-screen w-72',
        {
          'lg:flex': !isDesktopHidden,
          'lg:hidden': isDesktopHidden
        },
        className
      )} style={{ height: '100vh' }}>
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-4 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-4 w-24 h-24 bg-cyan-300 rounded-full blur-2xl animate-pulse delay-1000"></div>
        </div>
        <div className="relative z-10 flex flex-col h-full">
          {/* Desktop Header Section */}
          <div className="p-6 border-b border-white/10 flex-shrink-0">
            <Link href="">
              <div className="group cursor-pointer">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 group-hover:bg-white/20 transition-all duration-300 border border-white/20">
                  <span className="font-black bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent drop-shadow-lg block text-center text-2xl sm:text-3xl md:text-4xl">
                    AyurVeda
                  </span>
                </div>
              </div>
            </Link>
            {/* Desktop Close Button */}
            <button
              onClick={handleToggleDesktop}
              className="absolute right-6 top-6 bg-white text-blue-600 p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border-2 border-blue-200 w-7 h-7 flex items-center justify-center"
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Desktop Navigation */}
          <nav className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6 min-h-0">
            <div className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-4 px-2">
              Doctor Management
            </div>
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const isActive = router.pathname === item.path;
                const isHovered = hoveredItem === item.path;
                return (
                  <Link key={item.path} href={item.path}>
                    <div
                      className={clsx(
                        'group relative block rounded-xl transition-all duration-300 cursor-pointer border p-4',
                        {
                          'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg border-blue-400 transform scale-105': isActive,
                          'hover:bg-white/10 border-transparent hover:border-white/20 hover:transform hover:scale-102': !isActive,
                        }
                      )}
                      onMouseEnter={() => setHoveredItem(item.path)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-cyan-300 rounded-r-full shadow-lg"></div>
                      )}
                      <div className="flex items-center space-x-4">
                        <div className={clsx(
                          'text-2xl p-2 rounded-lg transition-all duration-300 relative flex-shrink-0',
                          {
                            'bg-white/20 shadow-inner': isActive,
                            'group-hover:bg-white/10 group-hover:scale-110': !isActive
                          }
                        )}>
                          {item.icon}
                          {/* Badge */}
                          {item.badge && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={clsx(
                            'font-semibold text-base transition-colors duration-300 truncate',
                            {
                              'text-white': isActive,
                              'text-blue-100 group-hover:text-white': !isActive
                            }
                          )}>
                            {item.label}
                          </div>
                          <div className={clsx(
                            'text-xs mt-1 transition-all duration-300 truncate',
                            {
                              'text-blue-100 opacity-100': isActive,
                              'text-blue-300 opacity-70 group-hover:opacity-100': !isActive
                            }
                          )}>
                            {item.description}
                          </div>
                        </div>
                        {/* Arrow indicator */}
                        <div className={clsx(
                          'transition-all duration-300 flex-shrink-0',
                          {
                            'opacity-100 transform translate-x-0': isActive || isHovered,
                            'opacity-0 transform -translate-x-2': !isActive && !isHovered
                          }
                        )}>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      {/* Hover glow effect */}
                      {!isActive && (
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/0 to-indigo-400/0 group-hover:from-blue-400/10 group-hover:to-indigo-400/10 transition-all duration-300"></div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>

        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 2px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }
          .custom-scrollbar {
            -webkit-overflow-scrolling: touch;
          }
        `}</style>
      </aside>

      {/* Mobile Sidebar */}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-50 w-80 sm:w-96 lg:hidden transition-transform duration-300 ease-in-out bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-700 text-white shadow-2xl overflow-hidden flex flex-col',
        {
          'translate-x-0': isMobileOpen,
          '-translate-x-full': !isMobileOpen,
        }
      )}>
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-4 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-4 w-24 h-24 bg-cyan-300 rounded-full blur-2xl animate-pulse delay-1000"></div>
        </div>
        <div className="relative z-10 flex flex-col h-full">
          {/* Mobile Header Section */}
          <div className="p-4 sm:p-6 border-b border-white/10 relative min-h-[56px]">
            {/* Mobile Close Button - match ClinicSidebar */}
            <button
              onClick={handleCloseMobile}
              className="absolute left-6 top-6 z-20 bg-white text-blue-600 p-2 rounded-full border-2 border-blue-200 w-10 h-10 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* Logo and title */}
            <div>
              <Link href="" onClick={handleItemClick}>
                <div className="group cursor-pointer">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 sm:p-4 group-hover:bg-white/20 transition-all duration-300 border border-white/20">
                    <span className="font-black bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent drop-shadow-lg block text-center text-2xl sm:text-3xl">
                      AyurVeda
                    </span>
                  </div>
                  <p className="text-blue-200 text-sm font-medium opacity-80 group-hover:opacity-100 transition-opacity text-center mt-2">
                    Doctor Portal
                  </p>
                </div>
              </Link>
            </div>
          </div>
          {/* Mobile Navigation */}
          <nav className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6">
            <div className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-4 px-2">
              Doctor Management
            </div>
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const isActive = router.pathname === item.path;
                const isHovered = hoveredItem === item.path;
                return (
                  <Link key={item.path} href={item.path}>
                    <div
                      className={clsx(
                        'group relative block rounded-xl transition-all duration-300 cursor-pointer border p-4 touch-manipulation active:scale-95',
                        {
                          'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg border-blue-400': isActive,
                          'hover:bg-white/10 border-transparent hover:border-white/20 active:bg-white/20': !isActive,
                        }
                      )}
                      onMouseEnter={() => setHoveredItem(item.path)}
                      onMouseLeave={() => setHoveredItem(null)}
                      onClick={handleItemClick}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-cyan-300 rounded-r-full shadow-lg"></div>
                      )}
                      <div className="flex items-center space-x-4">
                        <div className={clsx(
                          'text-2xl p-2 rounded-lg transition-all duration-300 relative flex-shrink-0',
                          {
                            'bg-white/20 shadow-inner': isActive,
                            'group-hover:bg-white/10': !isActive
                          }
                        )}>
                          {item.icon}
                          {/* Badge */}
                          {item.badge && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={clsx(
                            'font-semibold text-base transition-colors duration-300 truncate',
                            {
                              'text-white': isActive,
                              'text-blue-100 group-hover:text-white': !isActive
                            }
                          )}>
                            {item.label}
                          </div>
                          <div className={clsx(
                            'text-xs mt-1 transition-all duration-300 truncate',
                            {
                              'text-blue-100 opacity-100': isActive,
                              'text-blue-300 opacity-70 group-hover:opacity-100': !isActive
                            }
                          )}>
                            {item.description}
                          </div>
                        </div>
                        {/* Arrow indicator */}
                        <div className={clsx(
                          'transition-all duration-300 flex-shrink-0',
                          {
                            'opacity-100 transform translate-x-0': isActive || isHovered,
                            'opacity-0 transform -translate-x-2': !isActive && !isHovered
                          }
                        )}>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      {/* Hover glow effect */}
                      {!isActive && (
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/0 to-indigo-400/0 group-hover:from-blue-400/10 group-hover:to-indigo-400/10 transition-all duration-300"></div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>

        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 2px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }
          .custom-scrollbar {
            -webkit-overflow-scrolling: touch;
          }
        `}</style>
      </aside>
    </>
  );
};

export default DoctorSidebar;