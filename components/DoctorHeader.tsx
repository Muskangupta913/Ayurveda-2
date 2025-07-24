'use client';

import React, { useState, useEffect } from 'react';

interface DoctorHeaderProps {
  handleToggleDesktop: () => void;
  handleToggleMobile: () => void;
  isDesktopHidden: boolean;
  isMobileOpen: boolean;
}

const DoctorHeader: React.FC<DoctorHeaderProps> = ({
  handleToggleDesktop,
  handleToggleMobile,
  isDesktopHidden,
  isMobileOpen
}) => {
  const [screenWidth, setScreenWidth] = useState<number | null>(null);
  const [doctorUser, setDoctorUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userData =
        localStorage.getItem('doctorUser') || sessionStorage.getItem('doctorUser');

      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          if (parsed.name && parsed.email) {
            setDoctorUser(parsed);
          }
        } catch {
          // console.error('Invalid doctorUser data:', err);
        }
      }

      setScreenWidth(window.innerWidth);
      const handleResize = () => setScreenWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('doctorToken');
    localStorage.removeItem('doctorUser');
    sessionStorage.removeItem('doctorToken');
    sessionStorage.removeItem('doctorEmailForReset');
    window.location.href = '/doctor/login';
  };

  const handleResponsiveToggle = () => {
    if (screenWidth && screenWidth < 1024) {
      handleToggleMobile();
    } else {
      handleToggleDesktop();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  return (
    <header className="w-full bg-gradient-to-r from-blue-900 via-teal-800 to-cyan-700 text-white shadow-2xl relative overflow-hidden">
      {/* Background blur effects */}
      <div className="absolute inset-0 opacity-10 hidden md:block">
        <div className="absolute top-0 left-1/4 w-48 h-24 md:w-64 md:h-32 bg-cyan-300 rounded-full blur-3xl transform -translate-y-12"></div>
        <div className="absolute top-0 right-1/3 w-36 h-20 md:w-48 md:h-24 bg-white rounded-full blur-2xl transform -translate-y-8"></div>
      </div>

      <div className="relative z-10 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-center md:justify-between">
          {/* Left Section */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleResponsiveToggle}
              className="p-3 rounded-xl"
              aria-label="Toggle sidebar"
            >
              <svg
                className={`w-6 h-6 transition-transform duration-300 ${
                  screenWidth && screenWidth < 1024 && (isDesktopHidden || isMobileOpen)
                    ? 'rotate-90'
                    : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    screenWidth && screenWidth < 1024 && (isDesktopHidden || isMobileOpen)
                      ? 'M6 18L18 6M6 6l12 12' // X icon
                      : 'M4 6h16M4 12h16M4 18h16' // Hamburger
                  }
                />
              </svg>
            </button>

            <h1 className="ml-4 text-xl sm:text-2xl md:text-3xl font-bold tracking-wide">
              Welcome to {' '}
              <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent font-black">
                { 'AyurVeda'}
                   {/* {doctorUser?.name || 'AyurVeda'} */}
              </span>
              <span className="text-cyan-200 text-base sm:text-lg ml-1 md:ml-2">Portal</span>
            </h1>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 border border-white/20">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xs sm:text-sm">
                  {doctorUser ? getInitials(doctorUser.name) : 'D'}
                </span>
              </div>
              <div className="hidden md:block">
                <div className="text-cyan-200 text-[10px] sm:text-xs opacity-90">
                  {doctorUser?.email || 'Loading...'}
                </div>
                <div className="text-white text-[10px] sm:text-xs font-medium">
                  {doctorUser?.name || 'Doctor'}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-white font-semibold text-[10px] sm:text-xs shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-400"
                aria-label="Logout"
              >
                <div className="flex items-center gap-1 sm:gap-2 hover:cursor-pointer">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Logout</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DoctorHeader;
