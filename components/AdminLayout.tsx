import React from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

interface AdminLayoutProps {
  children: React.ReactNode;
  hideSidebar?: boolean;
  hideHeader?: boolean;
}

const AdminLayout = ({
  children,
  hideSidebar = false,
  hideHeader = false,
}: AdminLayoutProps) => {
  if (hideSidebar && hideHeader) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100" role="application">
      {/* Sidebar */}
      {!hideSidebar && (
        <div className="sticky top-0 z-30 h-screen">
          <AdminSidebar />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-h-screen max-h-screen flex-1 flex-col">
        {/* Header */}
        {!hideHeader && (
          <div className="sticky top-0 z-20">
            <AdminHeader />
          </div>
        )}

        {/* Page Content */}
        <main
          className={`flex-1 overflow-y-auto ${
            hideSidebar && hideHeader ? '' : 'p-4 sm:p-6 md:p-8'
          }`}
          role="main"
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
