import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import { useRouter } from 'next/router';
import { 
  HomeIcon, 
  BriefcaseIcon, 
  PencilSquareIcon, 
  KeyIcon 
} from "@heroicons/react/24/solid";

// Define a type for navigation items - updated to accept both string and JSX element
interface NavItem {
  name: string;
  href: string;
  icon: string | React.ComponentType<{ className?: string }>; // Updated to accept both emoji string and React component
  action?: () => void;
}

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isRegisterDropdownOpen, setIsRegisterDropdownOpen] = useState(false);
  const [isDashboardDropdownOpen, setIsDashboardDropdownOpen] = useState(false);
  const [isMobileDashboardDropdownOpen, setIsMobileDashboardDropdownOpen] = useState(false);
  const [isMobileRegisterDropdownOpen, setIsMobileRegisterDropdownOpen] = useState(false);

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

  // Function to handle mobile dashboard dropdown toggle
  const handleMobileDashboardDropdownToggle = () => {
    if (isMobileRegisterDropdownOpen) {
      setIsMobileRegisterDropdownOpen(false);
    }
    setIsMobileDashboardDropdownOpen(prev => !prev);
  };

  // Function to handle mobile register dropdown toggle
  const handleMobileRegisterDropdownToggle = () => {
    if (isMobileDashboardDropdownOpen) {
      setIsMobileDashboardDropdownOpen(false);
    }
    setIsMobileRegisterDropdownOpen(prev => !prev);
  };

  // Helper function to render icons
  const renderIcon = (icon: string | React.ComponentType<{ className?: string }>, className: string = "w-4 h-4") => {
    if (typeof icon === 'string') {
      return <span className="text-sm">{icon}</span>;
    } else {
      const IconComponent = icon;
      return <IconComponent className={className} />;
    }
  };

  // Navigation items - dynamically change based on auth status - Updated with Heroicons
  const getNavItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      { name: 'Home', href: '/', icon: HomeIcon }, // Using HomeIcon here
      { name: 'Career', href: '/job-listings', icon: BriefcaseIcon }, // Using BriefcaseIcon
      { name: 'Blogs', href: '/blogs/viewBlogs', icon: PencilSquareIcon }, // Using PencilSquareIcon
      // Add other links here if needed
    ];

    if (isAuthenticated) {
      return [
        ...baseItems,
      ];
    } else {
      return [
        ...baseItems,
        { name: 'User Login', href: '#', icon: KeyIcon, action: () => openAuthModal('login') }, // Using KeyIcon
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
      <header className="bg-white/95 backdrop-blur-md shadow-xl border-b border-opacity-20 relative z-30" style={{ borderColor: '#2D9AA5' }}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Left: ZEVA name & subtitle with enhanced styling */}
            <div className="flex items-center space-x-3 group">
              <div className="relative">
                {/* Subtle background accent */}
                <div className="absolute inset-0 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform scale-110"></div>
                <div className="relative px-3 py-2">
                  <div className="flex items-center gap-3">
                    {/* <span className="text-6xl text-cyan-400 drop-shadow-[0_0_20px_rgba(0,255,255,0.7)] animate-bounce">
                      ⚕
                    </span> */}
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-400 to-cyan-300 drop-shadow-lg">
                      ZEVA
                    </h1>
                  </div>

                  <div className="h-0.5 w-0 bg-gradient-to-r from-transparent via-teal-400 to-transparent group-hover:w-full transition-all duration-500"></div>
                </div>
              </div>
            </div>

            {/* Desktop Navigation with enhanced hover effects - Updated icon rendering */}
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) =>
                item.action ? (
                  <button
                    key={item.name}
                    onClick={item.action}
                    className="group relative px-5 py-3 rounded-full text-gray-700 font-medium transition-all duration-300 hover:shadow-lg"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#2D9AA5';
                      e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.12)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#374151';
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateY(0px)';
                    }}
                  >
                    <span className="flex items-center space-x-2">
                      <span className="group-hover:scale-125 transition-transform duration-300">
                        {renderIcon(item.icon)}
                      </span>
                      <span className="relative">
                        {item.name}
                        <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-teal-400 to-cyan-500 group-hover:w-full transition-all duration-300"></div>
                      </span>
                    </span>
                  </button>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="group relative px-5 py-3 rounded-full text-gray-700 font-medium transition-all duration-300 hover:shadow-lg"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#2D9AA5';
                      e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.12)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#374151';
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateY(0px)';
                    }}
                  >
                    <span className="flex items-center space-x-2">
                      <span className="group-hover:scale-125 transition-transform duration-300">
                        {renderIcon(item.icon)}
                      </span>
                      <span className="relative">
                        {item.name}
                        <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-teal-400 to-cyan-500 group-hover:w-full transition-all duration-300"></div>
                      </span>
                    </span>
                  </Link>
                )
              )}

              {/* Enhanced User Menu for Authenticated Users */}
              {isAuthenticated && (
                <div className="relative group">
                  <button
                    className="flex items-center space-x-3 px-5 py-3 rounded-full text-gray-700 font-medium transition-all duration-300 hover:shadow-lg"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#2D9AA5';
                      e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.12)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#374151';
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateY(0px)';
                    }}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-white font-semibold text-sm">
                      {user?.name?.charAt(0)?.toUpperCase() || '👤'}
                    </div>
                    <span className="max-w-24 truncate">{user?.name}</span>
                    <span className="text-xs transition-transform duration-300 group-hover:rotate-180">▼</span>
                  </button>
                  <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-40 overflow-hidden">
                    {/* Gradient header */}
                    <div className="px-4 py-3 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                      <p className="text-xs text-gray-500">Authenticated User</p>
                    </div>
                    <div className="py-2">
                      <Link
                        href="/user/profile"
                        className="flex items-center space-x-3 px-4 py-3 text-gray-700 transition-all duration-300 hover:shadow-sm"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#2D9AA5';
                          e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.08)';
                          e.currentTarget.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#374151';
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.transform = 'translateX(0px)';
                        }}
                      >
                        <span className="text-lg">👤</span>
                        <span className="font-medium">My Profile</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all duration-300"
                      >
                        <span className="text-lg">🚪</span>
                        <span className="font-medium">Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Dashboard Login & Register Dropdowns */}
            <div className="flex items-center space-x-3">
              {/* Enhanced Dashboard Login Dropdown */}
              <div className="relative" ref={dashboardDropdownRef}>
                <button
                  onClick={handleDashboardDropdownToggle}
                  className="hidden sm:flex items-center space-x-2 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 relative overflow-hidden"
                  style={{
                    backgroundImage: `linear-gradient(135deg, #2D9AA5, #1f7a82, #2D9AA5)`,
                  }}
                  aria-haspopup="true"
                  aria-expanded={isDashboardDropdownOpen}
                >
                  <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity duration-300"></div>
                  <span className="relative z-10">Dashboard Login</span>
                  <svg
                    className={`w-4 h-4 transition-all duration-300 relative z-10 ${isDashboardDropdownOpen ? 'rotate-180 scale-110' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                {isDashboardDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-40 overflow-hidden animate-fadeIn">
                    {/* Gradient header */}
                    <div className="px-4 py-3 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-800">Choose Dashboard</h3>
                      <p className="text-xs text-gray-500">Select your login type</p>
                    </div>
                    <div className="py-2">
                      <Link
                        href="/clinic/login-clinic"
                        onClick={() => setIsDashboardDropdownOpen(false)}
                        className="flex items-center space-x-3 px-4 py-4 text-gray-700 transition-all duration-300 group hover:shadow-sm"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#2D9AA5';
                          e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.08)';
                          e.currentTarget.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#374151';
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.transform = 'translateX(0px)';
                        }}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <span className="text-lg">🏥</span>
                        </div>
                        <div>
                          <div className="font-medium">Health Center</div>
                          <div className="text-xs text-gray-500">Medical facilities & clinics</div>
                        </div>
                      </Link>
                      <Link
                        href="/doctor/login"
                        onClick={() => setIsDashboardDropdownOpen(false)}
                        className="flex items-center space-x-3 px-4 py-4 text-gray-700 transition-all duration-300 group hover:shadow-sm"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#2D9AA5';
                          e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.08)';
                          e.currentTarget.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#374151';
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.transform = 'translateX(0px)';
                        }}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <span className="text-lg">👨‍⚕️</span>
                        </div>
                        <div>
                          <div className="font-medium">Doctor</div>
                          <div className="text-xs text-gray-500">Healthcare professionals</div>
                        </div>
                      </Link>
                      <div className="px-4 py-4 text-gray-400 cursor-not-allowed relative group">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-lg opacity-50">🧘</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">Wellness Center</div>
                            <div className="text-xs text-gray-400">Holistic health services</div>
                          </div>
                          <span className="text-xs bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 px-3 py-1 rounded-full font-medium">
                            Coming Soon
                          </span>
                        </div>
                      </div>
                      <div className="px-4 py-4 text-gray-400 cursor-not-allowed relative group">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-lg opacity-50">💆</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">Spa</div>
                            <div className="text-xs text-gray-400">Relaxation & beauty services</div>
                          </div>
                          <span className="text-xs bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 px-3 py-1 rounded-full font-medium">
                            Coming Soon
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced Register Dropdown */}
              <div className="relative" ref={registerDropdownRef}>
                <button
                  onClick={handleRegisterDropdownToggle}
                  className="hidden sm:flex items-center space-x-2 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 relative overflow-hidden"
                  style={{
                    backgroundImage: `linear-gradient(135deg, #237a84, #2D9AA5, #1f7a82)`,
                  }}
                  aria-haspopup="true"
                  aria-expanded={isRegisterDropdownOpen}
                >
                  <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity duration-300"></div>
                  <span className="relative z-10">Register</span>
                  <svg
                    className={`w-4 h-4 transition-all duration-300 relative z-10 ${isRegisterDropdownOpen ? 'rotate-180 scale-110' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                {isRegisterDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-40 overflow-hidden animate-fadeIn">
                    {/* Gradient header */}
                    <div className="px-4 py-3 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-800">Join Our Platform</h3>
                      <p className="text-xs text-gray-500">Start your healthcare journey</p>
                    </div>
                    <div className="py-2">
                      <Link
                        href="/clinic/register-clinic"
                        onClick={() => setIsRegisterDropdownOpen(false)}
                        className="flex items-center space-x-3 px-4 py-4 text-gray-700 transition-all duration-300 group hover:shadow-sm"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#2D9AA5';
                          e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.08)';
                          e.currentTarget.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#374151';
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.transform = 'translateX(0px)';
                        }}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <span className="text-lg">🏥</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">Register Health Center</div>
                          <div className="text-xs text-gray-500">Add your medical facility</div>
                        </div>
                      </Link>
                      <Link
                        href="/doctor/doctor-register"
                        onClick={() => setIsRegisterDropdownOpen(false)}
                        className="flex items-center space-x-3 px-4 py-4 text-gray-700 transition-all duration-300 group hover:shadow-sm"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#2D9AA5';
                          e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.08)';
                          e.currentTarget.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#374151';
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.transform = 'translateX(0px)';
                        }}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <span className="text-lg">👨‍⚕️</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">Register as Doctor</div>
                          <div className="text-xs text-gray-500">Join as healthcare provider</div>
                        </div>
                      </Link>
                      <div className="px-4 py-4 text-gray-400 cursor-not-allowed relative group">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-lg opacity-50">🧘</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">Register Wellness Center</div>
                            <div className="text-xs text-gray-400">Holistic health services</div>
                          </div>
                          <span className="text-xs bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 px-3 py-1 rounded-full font-medium">
                            Coming Soon
                          </span>
                        </div>
                      </div>
                      <div className="px-4 py-4 text-gray-400 cursor-not-allowed relative group">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-lg opacity-50">💆</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">Register as Spa</div>
                            <div className="text-xs text-gray-400">Beauty & relaxation services</div>
                          </div>
                          <span className="text-xs bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 px-3 py-1 rounded-full font-medium">
                            Coming Soon
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:shadow-lg"
                style={{
                  backgroundColor: 'rgba(45, 154, 165, 0.1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.2)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.1)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                aria-label="Toggle menu"
                aria-expanded={isMenuOpen}
              >
                <div className="w-6 h-5 relative flex flex-col justify-between">
                  <span className={`block h-0.5 w-full transform transition-all duration-300 rounded-full ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`} style={{ backgroundColor: '#2D9AA5' }}></span>
                  <span className={`block h-0.5 w-full transition-all duration-300 rounded-full ${isMenuOpen ? 'opacity-0 scale-0' : ''}`} style={{ backgroundColor: '#2D9AA5' }}></span>
                  <span className={`block h-0.5 w-full transform transition-all duration-300 rounded-full ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} style={{ backgroundColor: '#2D9AA5' }}></span>
                </div>
              </button>
            </div>
          </div>

          {/* Enhanced Mobile Menu - Updated icon rendering */}
          <div className={`lg:hidden transition-all duration-500 overflow-hidden ${isMenuOpen ? 'max-h-screen pb-6' : 'max-h-0'}`}>
            <div className="pt-4 space-y-2">
              {navItems.map((item) =>
                item.action ? (
                  <button
                    key={item.name}
                    onClick={() => {
                      if (item.action) {
                        item.action();
                      }
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-4 px-4 py-4 rounded-xl text-gray-700 font-medium transition-all duration-300 group text-left hover:shadow-md"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#2D9AA5';
                      e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.1)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#374151';
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateX(0px)';
                    }}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      {renderIcon(item.icon, "w-5 h-5")}
                    </div>
                    <span>{item.name}</span>
                  </button>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-4 px-4 py-4 rounded-xl text-gray-700 font-medium transition-all duration-300 group hover:shadow-md"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#2D9AA5';
                      e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.1)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#374151';
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateX(0px)';
                    }}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      {renderIcon(item.icon, "w-5 h-5")}
                    </div>
                    <span>{item.name}</span>
                  </Link>
                )
              )}

              {/* Enhanced Mobile Dashboard Login Dropdown */}
              <details 
                className="px-4 py-3 rounded-xl border border-opacity-30 shadow-sm" 
                style={{ backgroundColor: 'rgba(45, 154, 165, 0.08)', borderColor: '#2D9AA5' }}
                open={isMobileDashboardDropdownOpen}
                onToggle={(e) => {
                  const isOpen = (e.target as HTMLDetailsElement).open;
                  if (isOpen) {
                    handleMobileDashboardDropdownToggle();
                  } else {
                    setIsMobileDashboardDropdownOpen(false);
                  }
                }}
              >
                <summary className="cursor-pointer font-semibold mb-3 list-none flex items-center justify-between" style={{ color: '#2D9AA5' }}>
                  <span className="flex items-center space-x-2">
                    <span>🏥</span>
                    <span>Dashboard Login</span>
                  </span>
                  <span className={`text-sm transition-transform duration-300 ${isMobileDashboardDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                </summary>
                <div className="mt-2 space-y-2 pl-4">
                  <Link
                    href="/clinic/login-clinic"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-3 text-gray-700 rounded-lg transition-all duration-300 hover:shadow-sm"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.1)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateX(0px)';
                    }}
                  >
                    <span>🏥</span>
                    <span className="font-medium">Health Center</span>
                  </Link>
                  <Link
                    href="/doctor/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-3 text-gray-700 rounded-lg transition-all duration-300 hover:shadow-sm"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.1)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateX(0px)';
                    }}
                  >
                    <span>👨‍⚕️</span>
                    <span className="font-medium">Doctor</span>
                  </Link>
                  <div className="flex items-center justify-between px-3 py-3 text-gray-400 rounded-lg">
                    <span className="flex items-center space-x-3">
                      <span>🧘</span>
                      <span className="font-medium">Wellness Center</span>
                    </span>
                    <span className="text-xs bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 px-2 py-1 rounded-full">Coming Soon</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-3 text-gray-400 rounded-lg">
                    <span className="flex items-center space-x-3">
                      <span>💆</span>
                      <span className="font-medium">Spa</span>
                    </span>
                    <span className="text-xs bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 px-2 py-1 rounded-full">Coming Soon</span>
                  </div>
                </div>
              </details>

              {/* Enhanced Mobile Register Dropdown */}
              <details 
                className="px-4 py-3 rounded-xl border border-opacity-30 shadow-sm" 
                style={{ backgroundColor: 'rgba(45, 154, 165, 0.05)', borderColor: '#2D9AA5' }}
                open={isMobileRegisterDropdownOpen}
                onToggle={(e) => {
                  const isOpen = (e.target as HTMLDetailsElement).open;
                  if (isOpen) {
                    handleMobileRegisterDropdownToggle();
                  } else {
                    setIsMobileRegisterDropdownOpen(false);
                  }
                }}
              >
                <summary className="cursor-pointer font-semibold mb-3 list-none flex items-center justify-between" style={{ color: '#2D9AA5' }}>
                  <span className="flex items-center space-x-2">
                    <span>📝</span>
                    <span>Register</span>
                  </span>
                  <span className={`text-sm transition-transform duration-300 ${isMobileRegisterDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                </summary>
                <div className="mt-2 space-y-2 pl-4">
                  <Link
                    href="/clinic/register-clinic"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-3 text-gray-700 rounded-lg transition-all duration-300 hover:shadow-sm"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.1)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateX(0px)';
                    }}
                  >
                    <span>🏥</span>
                    <span className="font-medium">Register Health Center</span>
                  </Link>
                  <Link
                    href="/doctor/doctor-register"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-3 text-gray-700 rounded-lg transition-all duration-300 hover:shadow-sm"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.1)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateX(0px)';
                    }}
                  >
                    <span>👨‍⚕️</span>
                    <span className="font-medium">Register as Doctor</span>
                  </Link>
                  <div className="flex items-center justify-between px-3 py-3 text-gray-400 rounded-lg">
                    <span className="flex items-center space-x-3">
                      <span>🧘</span>
                      <span className="font-medium">Register Wellness Center</span>
                    </span>
                    <span className="text-xs bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 px-2 py-1 rounded-full">Coming Soon</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-3 text-gray-400 rounded-lg">
                    <span className="flex items-center space-x-3">
                      <span>💆</span>
                      <span className="font-medium">Register as Spa</span>
                    </span>
                    <span className="text-xs bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 px-2 py-1 rounded-full">Coming Soon</span>
                  </div>
                </div>
              </details>

              {/* Enhanced Mobile User Menu */}
              {isAuthenticated && (
                <>
                  <div className="border-t border-gray-200 my-4 mx-4"></div>
                  <div className="mx-4 px-4 py-3 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100">
                    <p className="text-sm text-gray-600 font-medium">Signed in as:</p>
                    <div className="flex items-center space-x-3 mt-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-white font-semibold text-sm">
                        {user?.name?.charAt(0)?.toUpperCase() || '👤'}
                      </div>
                      <p className="font-semibold text-gray-800">{user?.name}</p>
                    </div>
                  </div>
                  <Link
                    href="/user/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-4 px-4 py-4 mx-2 rounded-xl text-gray-700 font-medium transition-all duration-300 hover:shadow-md"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#2D9AA5';
                      e.currentTarget.style.backgroundColor = 'rgba(45, 154, 165, 0.1)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#374151';
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateX(0px)';
                    }}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center">
                      <span className="text-lg">👤</span>
                    </div>
                    <span>My Profile</span>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-4 px-4 py-4 mx-2 rounded-xl text-gray-700 hover:text-red-700 hover:bg-red-50 font-medium transition-all duration-300 text-left hover:shadow-md"
                  >
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                      <span className="text-lg">🚪</span>
                    </div>
                    <span>Logout</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Enhanced Top Bar */}
        <div className="hidden md:block text-white text-sm relative overflow-hidden" style={{ backgroundImage: `linear-gradient(135deg, #2D9AA5, #1f7a82, #2D9AA5)` }}>
          <div className="absolute inset-0 bg-white opacity-5"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 relative z-10">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-8">
                <span className="flex items-center space-x-2 hover:scale-105 transition-transform duration-300">
                  <span className="text-base">✉️</span>
                  <span className="font-medium">info@zeva.com</span>
                </span>
                <span className="flex items-center space-x-2 hover:scale-105 transition-transform duration-300">
                  <span className="text-base">🕌</span>
                  <span className="font-medium">Healthcare Near You</span>
                </span>
              </div>
              {isAuthenticated && (
                <div className="flex items-center space-x-3 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                  <span className="text-base">👋</span>
                  <span className="font-medium">Welcome, {user?.name}!</span>
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

      {/* Add custom CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default Header;