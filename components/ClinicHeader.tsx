import React, { useEffect, useMemo, useState } from 'react';

interface ClinicHeaderProps {
  handleToggleDesktop: () => void;
  handleToggleMobile: () => void;
  isDesktopHidden: boolean;
  isMobileOpen: boolean;
}

const ClinicHeader: React.FC<ClinicHeaderProps> = ({
  handleToggleDesktop,
  handleToggleMobile,
  isDesktopHidden,
  isMobileOpen
}) => {
  // Header no longer controls sidebar toggles

  const handleLogout = () => {
    localStorage.removeItem('clinicToken');
    sessionStorage.removeItem('clinicEmail');
    sessionStorage.removeItem('clinicName');
    sessionStorage.removeItem('clinicUser');
    sessionStorage.removeItem('resetEmail');
     sessionStorage.removeItem('clinicEmailForReset');
    window.location.href = '/clinic/login-clinic';
  };
  const clinicUserRaw = localStorage.getItem('clinicUser');
  const clinicUser = clinicUserRaw ? JSON.parse(clinicUserRaw) : null;
  const clinicName: string = useMemo(() => {
    try {
      const token = localStorage.getItem('clinicToken') || '';
      if (!token) return clinicUser?.name || '';
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) return clinicUser?.name || '';
      const payload = JSON.parse(atob(payloadBase64));
      return payload?.clinicName || payload?.name || clinicUser?.name || '';
    } catch {
      return clinicUser?.name || '';
    }
  }, [clinicUser]);
  // console.log('clinicUserssss', clinicUserRaw);
  // console.log('clinicTokensss', localStorage.getItem('clinicToken'));


  const [now, setNow] = useState<string>('');
  useEffect(() => {
    const fmt = () => new Date().toLocaleString();
    setNow(fmt());
    const id = setInterval(() => setNow(fmt()), 1000);
    return () => clearInterval(id);
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  return (
  <header className="w-full bg-white border-b border-gray-200 shadow-sm">
    <div className="px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4">
           
          </div>
        </div>

        {/* Right: Search, Date/Time, Clinic, Support, Profile */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="hidden md:flex items-center">
            <input
              type="text"
              placeholder="Search..."
              className="w-56 lg:w-72 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>

          {/* Date & Time */}
          <div className="hidden sm:flex text-xs text-gray-600 px-2 py-1 rounded-lg bg-gray-50 border border-gray-200">
            {now}
          </div>

          {/* Clinic name */}
          {clinicName && (
            <div className="hidden sm:flex items-center text-sm font-medium text-gray-800 px-2 py-1 rounded-lg bg-gray-50 border border-gray-200">
              {clinicName}
            </div>
          )}

          {/* Support */}
          <a
            href="#"
            className="hidden sm:inline-flex items-center text-sm text-gray-700 hover:text-gray-900 px-2 py-1 rounded-lg hover:bg-gray-100"
          >
            Support
          </a>
          
          {/* Profile dropdown */}
          <div className="relative">
            <details className="group">
              <summary className="list-none flex items-center gap-2 cursor-pointer select-none">
                <div className="w-9 h-9 bg-[#2D9AA5] rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {clinicUser ? getInitials(clinicUser.name) : 'A'}
                  </span>
                </div>
                <svg className="w-4 h-4 text-gray-600 group-open:rotate-180 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                </svg>
              </summary>
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50">
                <div className="flex items-center gap-3 p-2 border-b border-gray-100">
                  <div className="w-9 h-9 bg-[#2D9AA5] rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {clinicUser ? getInitials(clinicUser.name) : 'A'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{clinicUser?.name || 'User'}</div>
                    <div className="text-xs text-gray-500 truncate">{clinicUser?.email || ''}</div>
                  </div>
                </div>
                <div className="py-2 text-sm">
                 
                  <a href="/clinic/myallClinic" className="block px-3 py-2 hover:bg-gray-50 rounded">Profile</a>
  
                </div>
                <div className="border-t border-gray-100 pt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  </header>
);
};

export default ClinicHeader;