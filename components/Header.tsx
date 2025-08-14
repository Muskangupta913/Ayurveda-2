import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import { useRouter } from 'next/router';


// Define a type for navigation items
interface NavItem {
  name: string;
  href: string;
  icon: string;
  action?: () => void;
}

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isRegisterDropdownOpen, setIsRegisterDropdownOpen] = useState(false);
  const [isDashboardDropdownOpen, setIsDashboardDropdownOpen] = useState(false);

  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  // Refs for dropdown elements
  const dashboardDropdownRef = useRef<HTMLDivElement>(null);
  const registerDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close dashboard dropdown if click is outside
      if (dashboardDropdownRef.current && !dashboardDropdownRef.current.contains(event.target as Node)) {
        setIsDashboardDropdownOpen(false);
      }

      // Close register dropdown if click is outside
      if (registerDropdownRef.current && !registerDropdownRef.current.contains(event.target as Node)) {
        setIsRegisterDropdownOpen(false);
      }
    };

    // Add event listener when any dropdown is open
    if (isDashboardDropdownOpen || isRegisterDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDashboardDropdownOpen, isRegisterDropdownOpen]);

  // Function to handle dashboard dropdown toggle
  const handleDashboardDropdownToggle = () => {
    if (isRegisterDropdownOpen) {
      setIsRegisterDropdownOpen(false);
    }
    setIsDashboardDropdownOpen(prev => !prev);
  };

  // Function to handle register dropdown toggle
  const handleRegisterDropdownToggle = () => {
    if (isDashboardDropdownOpen) {
      setIsDashboardDropdownOpen(false);
    }
    setIsRegisterDropdownOpen(prev => !prev);
  };

  // Navigation items - dynamically change based on auth status
  const getNavItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      { name: 'Home', href: '/', icon: '🏠' },
      { name: 'Career', href: '/job-listings', icon: '🏠' },
      { name: 'Blog', href: '/blogs/viewBlogs', icon: '🏠' },
      // Add other links here if needed
    ];

    if (isAuthenticated) {
      return [
        ...baseItems,
      ];
    } else {
      return [
        ...baseItems,
        { name: 'User Login', href: '#', icon: '🔑', action: () => openAuthModal('login') },
      ];
    }
  };

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
    setIsMenuOpen(false);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navItems = getNavItems();

  return (
    <>
      <header className="bg-white/95 backdrop-blur-md shadow-lg border-b border-opacity-20 relative z-30" style={{ borderColor: '#2D9AA5' }}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Left:ZEVA name & subtitle only */}
            <div className="flex items-center space-x-3 group">
              <div>
                <h1 className="text-2xl font-bold text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, #2D9AA5, #1f7a82)` }}>
                  ZEVA
                </h1>
                {/* <p className="text-xs font-medium -mt-1" style={{ color: '#2D9AA5' }}>NEAR ME</p> */}
              </div>
            </div>
         

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) =>
                item.action ? (
                  <button
                    key={item.name}
                    onClick={item.action}
                    className="group relative px-4 py-2 rounded-full text-gray-700 font-medium transition-all duration-300"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#2D9AA5';
                      e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#374151';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span className="flex items-center space-x-2">
                      <span className="text-sm group-hover:scale-110 transition-transform duration-300">
                        {item.icon}
                      </span>
                      <span>{item.name}</span>
                    </span>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 group-hover:w-full transition-all duration-300" style={{ backgroundColor: '#2D9AA5' }}></div>
                  </button>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="group relative px-4 py-2 rounded-full text-gray-700 font-medium transition-all duration-300"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#2D9AA5';
                      e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#374151';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span className="flex items-center space-x-2">
                      <span className="text-sm group-hover:scale-110 transition-transform duration-300">
                        {item.icon}
                      </span>
                      <span>{item.name}</span>
                    </span>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 group-hover:w-full transition-all duration-300" style={{ backgroundColor: '#2D9AA5' }}></div>
                  </Link>
                )
              )}

              {/* User Menu for Authenticated Users */}
              {isAuthenticated && (
                <div className="relative group">
                  <button
                    className="flex items-center space-x-2 px-4 py-2 rounded-full text-gray-700 font-medium transition-all duration-300"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#2D9AA5';
                      e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#374151';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span className="text-sm">👤</span>
                    <span>{user?.name}</span>
                    <span className="text-xs">▼</span>
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-40">
                    <div className="py-2">
                      <Link
                        href="/user/profile"
                        className="flex items-center space-x-3 px-4 py-3 text-gray-700 transition-colors hover:bg-opacity-10"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#2D9AA5';
                          e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#374151';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <span>👤</span>
                        <span>My Profile</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                      >
                        <span>🚪</span>
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Dashboard Login & Register Dropdowns (desktop) */}
            <div className="flex items-center space-x-4">
              {/* Dashboard Login Dropdown */}
              <div className="relative" ref={dashboardDropdownRef}>
                <button
                  onClick={handleDashboardDropdownToggle}
                  className="hidden sm:flex items-center space-x-2 text-white px-4 py-2.5 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  style={{
                    backgroundImage: `linear-gradient(to right, #2D9AA5, #1f7a82)`,
                  }}
                  aria-haspopup="true"
                  aria-expanded={isDashboardDropdownOpen}
                >
                  <span>Dashboard Login</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 ${isDashboardDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                {isDashboardDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-40">
                    {/* <Link
                      href="#"
                      onClick={() => {
                        setIsDashboardDropdownOpen(false);
                        openAuthModal('login');
                      }}
                      className="block px-4 py-3 text-gray-700 transition-colors hover:bg-opacity-10"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#2D9AA5';
                        e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#374151';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      User
                    </Link> */}
                    <Link
                      href="/clinic/login-clinic"
                      onClick={() => setIsDashboardDropdownOpen(false)}
                      className="block px-4 py-3 text-gray-700 transition-colors hover:bg-opacity-10"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#2D9AA5';
                        e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#374151';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      Health Center
                    </Link>
                    <Link
                      href="/doctor/login"
                      onClick={() => setIsDashboardDropdownOpen(false)}
                      className="block px-4 py-3 text-gray-700 transition-colors hover:bg-opacity-10"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#2D9AA5';
                        e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#374151';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      Doctor
                    </Link>
                    <div className="px-4 py-3 text-gray-500 hover:bg-gray-50 transition-colors cursor-not-allowed relative">
                      Wellness Center
                      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        Coming Soon
                      </span>
                    </div>
                    <div className="px-4 py-3 text-gray-500 hover:bg-gray-50 transition-colors cursor-not-allowed relative">
                      Spa
                      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        Coming Soon
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Register Dropdown */}
              <div className="relative" ref={registerDropdownRef}>
                <button
                  onClick={handleRegisterDropdownToggle}
                  className="hidden sm:flex items-center space-x-2 text-white px-4 py-2.5 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  style={{
                    backgroundImage: `linear-gradient(to right, #2D9AA5, #237a84)`,
                  }}
                  aria-haspopup="true"
                  aria-expanded={isRegisterDropdownOpen}
                >
                  <span>Register</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 ${isRegisterDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                {isRegisterDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-40">
                    <Link
                      href="/clinic/register-clinic"
                      onClick={() => setIsRegisterDropdownOpen(false)}
                      className="block px-4 py-3 text-gray-700 transition-colors hover:bg-opacity-10"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#2D9AA5';
                        e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#374151';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      Register your Health Center
                    </Link>
                    <Link
                      href="/doctor/doctor-register"
                      onClick={() => setIsRegisterDropdownOpen(false)}
                      className="block px-4 py-3 text-gray-700 transition-colors hover:bg-opacity-10"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#2D9AA5';
                        e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#374151';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      Register as Doctor
                    </Link>
                    <div className="px-4 py-3 text-gray-500 hover:bg-gray-50 transition-colors cursor-not-allowed relative">
                      Register as Wellness Center
                      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        Coming Soon
                      </span>
                    </div>
                    <div className="px-4 py-3 text-gray-500 hover:bg-gray-50 transition-colors cursor-not-allowed relative">
                      Register as Spa
                      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        Coming Soon
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden relative w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 hover:bg-opacity-20"
                style={{
                  backgroundColor: 'rgba(45, 154, 165, 0.1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.1)';
                }}
                aria-label="Toggle menu"
                aria-expanded={isMenuOpen}
              >
                <div className="w-6 h-5 relative flex flex-col justify-between">
                  <span className={`block h-0.5 w-full transform transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`} style={{ backgroundColor: '#2D9AA5' }}></span>
                  <span className={`block h-0.5 w-full transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`} style={{ backgroundColor: '#2D9AA5' }}></span>
                  <span className={`block h-0.5 w-full transform transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} style={{ backgroundColor: '#2D9AA5' }}></span>
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <div className={`lg:hidden transition-all duration-300 overflow-hidden ${isMenuOpen ? 'max-h-screen pb-6' : 'max-h-0'}`}>
            <div className="pt-4 space-y-2">
              {navItems.map((item) =>
                item.action ? (
                  <button
                    key={item.name}
                    onClick={() => {
                      item.action && item.action();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-700 font-medium transition-all duration-300 group text-left"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#2D9AA5';
                      e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#374151';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform duration-300">
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </button>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-700 font-medium transition-all duration-300 group"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#2D9AA5';
                      e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#374151';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform duration-300">
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </Link>
                )
              )}

              {/* Mobile Dashboard Login Dropdown */}
              <details className="px-4 py-2 rounded-xl border border-opacity-30" style={{ backgroundColor: 'rgba(45, 154, 165, 0.1)', borderColor: '#2D9AA5' }}>
                <summary className="cursor-pointer font-semibold mb-2 list-none" style={{ color: '#2D9AA5' }}>
                  Dashboard Login
                </summary>
                <div className="mt-2 space-y-2">
                  {/* <button
                    onClick={() => {
                      openAuthModal('login');
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-gray-700 rounded transition-colors hover:bg-opacity-10"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    User
                  </button> */}
                  <Link
                    href="/clinic/login-clinic"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-2 text-gray-700 rounded transition-colors hover:bg-opacity-10"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    Health Center
                  </Link>
                  <Link
                    href="/doctor/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-2 text-gray-700 rounded transition-colors hover:bg-opacity-10"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    Doctor
                  </Link>
                  <div className="px-4 py-2 text-gray-500 cursor-not-allowed flex justify-between items-center">
                    Wellness Center
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Coming Soon</span>
                  </div>
                  <div className="px-4 py-2 text-gray-500 cursor-not-allowed flex justify-between items-center">
                    Spa
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Coming Soon</span>
                  </div>
                </div>
              </details>

              {/* Mobile Register Dropdown */}
              <details className="px-4 py-2 rounded-xl border border-opacity-30" style={{ backgroundColor: 'rgba(45, 154, 165, 0.05)', borderColor: '#2D9AA5' }}>
                <summary className="cursor-pointer font-semibold mb-2 list-none" style={{ color: '#2D9AA5' }}>
                  Register
                </summary>
                <div className="mt-2 space-y-2">
                  <Link
                    href="/clinic/register-clinic"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-2 text-gray-700 rounded transition-colors hover:bg-opacity-10"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    Register your Health Center
                  </Link>
                  <Link
                    href="/doctor/doctor-register"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-2 text-gray-700 rounded transition-colors hover:bg-opacity-10"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    Register as Doctor
                  </Link>
                  <div className="px-4 py-2 text-gray-500 cursor-not-allowed flex justify-between items-center">
                    Register as Wellness Center
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Coming Soon</span>
                  </div>
                  <div className="px-4 py-2 text-gray-500 cursor-not-allowed flex justify-between items-center">
                    Register as Spa
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Coming Soon</span>
                  </div>
                </div>
              </details>

              {/* Mobile User Menu */}
              {isAuthenticated && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="px-4 py-2">
                    <p className="text-sm text-gray-600">Signed in as:</p>
                    <p className="font-medium text-gray-800">{user?.name}</p>
                  </div>
                  <Link
                    href="/user/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-700 font-medium transition-all duration-300"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#2D9AA5';
                      e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#374151';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span className="text-lg">👤</span>
                    <span>My Profile</span>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-700 hover:text-red-700 hover:bg-red-50 font-medium transition-all duration-300 text-left"
                  >
                    <span className="text-lg">🚪</span>
                    <span>Logout</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Top Bar */}
        <div className="hidden md:block text-white text-sm" style={{ backgroundImage: `linear-gradient(to right, #2D9AA5, #1f7a82)` }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-6">
                <span className="flex items-center space-x-2">
                  <span>✉️</span>
                  <span>info@zeva.com</span>
                </span>
              </div>
              {isAuthenticated && (
                <div className="flex items-center space-x-2">
                  <span>Welcome, {user?.name}!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        initialMode={authMode}
      />
    </>
  );
};

export default Header;