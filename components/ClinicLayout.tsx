import React, { useState } from 'react';
import ClinicSidebar from './ClinicSidebar';
import ClinicHeader from './ClinicHeader';

const ClinicLayout = ({ children }: { children: React.ReactNode }) => {
  const [isDesktopHidden, setIsDesktopHidden] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleToggleDesktop = () => {
    setIsDesktopHidden(prev => !prev);
  };

  const handleToggleMobile = () => {
    setIsMobileOpen(prev => !prev);
  };

  return (
    <div className="flex min-h-screen bg-gray-100" role="application">
      {/* Sidebar */}
      <div className="h-screen sticky top-0 z-30">
        <ClinicSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-h-screen max-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-20">
          <ClinicHeader
            handleToggleDesktop={handleToggleDesktop}
            handleToggleMobile={handleToggleMobile}
            isDesktopHidden={isDesktopHidden}
            isMobileOpen={isMobileOpen}
          />
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8" role="main">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ClinicLayout;
