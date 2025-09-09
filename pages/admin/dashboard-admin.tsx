import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout';
import withAdminAuth from '../../components/withAdminAuth'; 
import type { NextPageWithLayout } from '../_app';
import Adminstats from '../../components/Adminstats';


interface AnalyticsData {
  pendingClinicCount: number;
  pendingDoctorCount: number;
  approvedClinicCount: number;
  approvedDoctorCount: number;
}

interface ChartData {
  name: string;
  value: number;
  color: string;
}

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    pendingClinicCount: 0,
    pendingDoctorCount: 0,
    approvedClinicCount: 0,
    approvedDoctorCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Update date and time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch user count from API
  const fetchUserCount = useCallback(async () => {
    try {
      const res = await axios.get('/api/admin/user-count');
      setUserCount(res.data.userCount);
    } catch (error) {
      console.error('Error fetching user count:', error);
      setUserCount(0);
    }
  }, []);

  // Fetch analytics data from API
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        setError('No admin token found');
        return;
      }

      // Fetch pending counts
      const pendingRes = await axios.get('/api/admin/pending-counts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // You may need to add these API endpoints if they don't exist
      // Fetch reviews and enquiries count
     
      
     

      setAnalytics({
        pendingClinicCount: pendingRes.data.pendingClinicCount || 0,
        pendingDoctorCount: pendingRes.data.pendingDoctorCount || 0,
        approvedClinicCount: pendingRes.data.approvedClinicCount || 0,
        approvedDoctorCount: pendingRes.data.approvedDoctorCount || 0,
      });

    } catch {
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    fetchUserCount();
    fetchAnalyticsData();
  }, [fetchUserCount, fetchAnalyticsData]);

  // Memoized calculated values
  const totalClinics = useMemo(() => 
    analytics.pendingClinicCount + analytics.approvedClinicCount, 
    [analytics.pendingClinicCount, analytics.approvedClinicCount]
  );

  const totalDoctors = useMemo(() => 
    analytics.pendingDoctorCount + analytics.approvedDoctorCount, 
    [analytics.pendingDoctorCount, analytics.approvedDoctorCount]
  );

  // Enhanced chart data with real API data (removed Total Reviews and Pending Requests)
  const chartData = useMemo((): ChartData[] => [
    {
      name: 'Total Users',
      value: userCount || 0,
      color: '#6366F1'
    },
    {
      name: 'Approved Clinics',
      value: analytics.approvedClinicCount,
      color: '#10B981'
    },
    {
      name: 'Approved Doctors',
      value: analytics.approvedDoctorCount,
      color: '#F59E0B'
    }
  ], [userCount, analytics]);

  // Format date and time
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getGreeting = () => {
    const hour = currentDateTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Enhanced Bar Chart Component (removed Total Records section)
  const EnhancedBarChart = ({ data }: { data: ChartData[] }) => {
    const maxValue = Math.max(...data.map(d => d.value));
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Platform Overview</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span>Live Data</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="space-y-4">
            {data.map((item, index) => (
              <div key={index} className="group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{item.name}</span>
                  <span className="text-sm font-bold text-gray-900">
                    {item.value.toLocaleString()}
                  </span>
                </div>
                <div className="relative bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                    style={{
                      width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                      backgroundColor: item.color
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pie Chart Visualization */}
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {data.map((item, index) => {
                  const total = data.reduce((sum, d) => sum + d.value, 0);
                  const percentage = total > 0 ? (item.value / total) * 100 : 0;
                  const strokeDasharray = `${percentage} ${100 - percentage}`;
                  const strokeDashoffset = data.slice(0, index).reduce((sum, d) => 
                    sum - (total > 0 ? (d.value / total) * 100 : 0), 0
                  );
                  
                  return (
                    <circle
                      key={index}
                      cx="50"
                      cy="50"
                      r="15.915"
                      fill="transparent"
                      stroke={item.color}
                      strokeWidth="4"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-1000 ease-out"
                    />
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 justify-center pt-4 border-t border-gray-200">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-sm text-gray-600">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Loading Component
  const LoadingSkeleton = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="h-1 bg-gray-300 animate-pulse"></div>
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="bg-white rounded-2xl p-4 sm:p-8 shadow-lg border border-gray-200 mb-8">
            <div className="h-8 bg-gray-300 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-96 mb-8"></div>
            <div className="flex space-x-4">
              <div className="h-24 bg-gray-300 rounded-xl w-40"></div>
              <div className="h-24 bg-gray-300 rounded-xl w-40"></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 sm:p-8 shadow-lg border border-gray-200 mb-8">
            <div className="h-6 bg-gray-300 rounded w-48 mb-6"></div>
            <div className="space-y-4">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="h-8 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Error Component
  const ErrorComponent = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center border border-gray-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Dashboard</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              fetchAnalyticsData();
            }} 
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorComponent />;
  }

 return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Progress Bar */}
      <div className="h-1 bg-gradient-to-r from-[#2D9AA5] via-[#2D9AA5] to-[#2D9AA5]"></div>
      
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header Section with Waveform Design - Removed Pending Requests */}
        <div className="bg-white rounded-2xl p-4 sm:p-8 shadow-lg border border-gray-200 relative overflow-hidden mb-8">
          {/* Wave Background Effect */}
          <div className="absolute inset-0 pointer-events-none">
            <svg className="absolute bottom-0 left-0 w-full h-full opacity-15" viewBox="0 0 1000 200" preserveAspectRatio="none">
              <path d="M0,100 C150,200 350,0 500,100 C650,200 850,0 1000,100 L1000,200 L0,200 Z" fill="url(#wave-gradient)" />
              <defs>
                <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2D9AA5" />
                  <stop offset="50%" stopColor="#2D9AA5" />
                  <stop offset="100%" stopColor="#2D9AA5" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Floating Circle Decorations */}
          <div className="absolute top-4 right-4 w-20 h-20 bg-[#2D9AA5]/10 rounded-full blur-sm"></div>
          <div className="absolute top-12 right-12 w-32 h-32 bg-[#2D9AA5]/8 rounded-full blur-md"></div>
          <div className="absolute bottom-8 left-8 w-24 h-24 bg-[#2D9AA5]/10 rounded-full blur-sm"></div>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center relative z-10">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900 bg-gradient-to-r from-[#2D9AA5] via-[#2D9AA5] to-[#2D9AA5] bg-clip-text text-transparent">
                {getGreeting()}, Admin!
              </h1>
              <p className="text-gray-600 text-base sm:text-lg mb-3">
                Welcome back to your professional dashboard
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-full">
                  <svg className="w-4 h-4 text-[#2D9AA5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium text-xs sm:text-sm">{formatDate(currentDateTime)}</span>
                </div>
                <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-full">
                  <svg className="w-4 h-4 text-[#2D9AA5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium text-xs sm:text-sm">{formatTime(currentDateTime)}</span>
                </div>
              </div>
            </div>

            {/* Only Total Users Card */}
            <div className="w-full lg:w-auto">
              <div className="relative group">
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 120" preserveAspectRatio="none">
                  <path
                    d="M10,20 Q50,5 90,20 Q130,35 170,20 Q180,25 190,30 L190,100 Q180,105 170,100 Q130,85 90,100 Q50,115 10,100 Q5,95 10,90 Z"
                    fill="none"
                    stroke="url(#users-gradient)"
                    strokeWidth="2"
                    className="opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                  />
                </svg>

                <div className="bg-gradient-to-br from-[#2D9AA5]/10 via-[#2D9AA5]/5 to-[#2D9AA5]/10 rounded-xl p-4 sm:p-6 min-w-[160px] border-2 border-transparent bg-clip-padding relative z-10 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-3">
                      <div className="p-2 bg-gradient-to-br from-[#2D9AA5] to-[#2D9AA5] rounded-full shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold mb-1 bg-gradient-to-r from-[#2D9AA5] to-[#2D9AA5] bg-clip-text text-transparent">
                      {userCount?.toLocaleString() || '0'}
                    </div>
                    <div className="text-[#2D9AA5] text-sm font-semibold">Total Users</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Analytics Chart */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-8 mb-8 relative overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='0.1'%3E%3Cpath d='M0 0h40v40H0z'/%3E%3Cpath d='M20 20c0-11.046-8.954-20-20-20v20h20z'/%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>
          
          <div className="relative z-10">
            <EnhancedBarChart data={chartData} />
          </div>
        </div>

        {/* Quick Stats Grid - Made into Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {[
            { title: "Total Clinics", value: totalClinics, icon: "🏥", color: "emerald", href: "/admin/AdminClinicApproval" },
            { title: "Total Doctors", value: totalDoctors, icon: "👩‍⚕️", color: "blue", href: "/admin/approve-doctors" },
            { title: "Pending Clinics", value: analytics.pendingClinicCount, icon: "🏥", color: "amber", href: "/admin/AdminClinicApproval" },
            { title: "Pending Doctors", value: analytics.pendingDoctorCount, icon: "👨‍⚕️", color: "red", href: "/admin/approve-doctors" }
          ].map((stat, index) => (
            <Link key={index} href={stat.href} className="block">
              <div className="w-full bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 transform hover:scale-105 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                  </div>
                  <div className="text-2xl sm:text-3xl opacity-80">{stat.icon}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

          <div className='mb-8'>
          <Adminstats />
          </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2 text-[#2D9AA5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "Manage Clinics", icon: "🏥", color: "emerald", description: "View & approve clinics", href: "/admin/AdminClinicApproval" },
              { name: "Manage Doctors", icon: "👨‍⚕️", color: "blue", description: "Doctor verification", href: "/admin/approve-doctors" },
              { name: "Add Treatment", icon: "➕ ", color: "amber", description: "Add Treatment", href: "/admin/add-treatment" },
              { name: "User Analytics", icon: "📊", color: "indigo", description: "Analytics", href: "/admin/analytics" },
              { name: "All Blogs", icon: "📝", color: "orange", description: "See all blogs", href: "/admin/all-blogs" },
             { name: "Request Call Back", icon: "📞", color: "teal", description: "See Call Back Request", href: "/admin/get-in-touch" },
              { name: "Manage Jobs", icon: "💼", color: "blue", description: "Manage all Jobs", href: "/admin/job-manage" },

            ].map((action, index) => (
              <Link key={index} href={action.href} className="block">
                <div className="group cursor-pointer w-full">
                  <div className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 sm:p-6 transition-all duration-200 border border-gray-200 hover:border-gray-300 hover:shadow-md">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform duration-200">
                        {action.icon}
                      </div>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-left">{action.name}</h3>
                    <p className="text-sm text-gray-600 text-left">{action.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

AdminDashboard.getLayout = function PageLayout(page: React.ReactNode) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedDashboard: NextPageWithLayout = withAdminAuth(AdminDashboard);
ProtectedDashboard.getLayout = AdminDashboard.getLayout;

export default ProtectedDashboard;