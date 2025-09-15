import React, { useEffect, useState, ReactElement } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import DoctorLayout from '../../components/DoctorLayout';
import withDoctorAuth from '../../components/withDoctorAuth';
import type { NextPageWithLayout } from '../_app';
import Stats from '../../components/Stats';

interface DoctorAnalytics {
  totalReviews: number;
  totalEnquiries: number;
}

interface ApiResponse {
  totalReviews: number;
  totalEnquiries: number;
}

interface DoctorUser {
  name: string;
  email: string;
}

const DoctorDashboard: NextPageWithLayout = () => {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<DoctorAnalytics>({
    totalReviews: 0,
    totalEnquiries: 0
  });
  const [doctorUser, setDoctorUser] = useState<DoctorUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Quick actions data
  const quickActions = [
    {
      key: 'manage-profile',
      label: 'Manage Profile',
      path: '/doctor/manageDoctor',
      description: 'Update your professional information and settings',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50',
      iconColor: 'text-blue-600',
      hoverColor: 'hover:from-blue-100 hover:to-indigo-100',
      borderColor: 'border-blue-200'
    },
    {
      key: 'view-reviews',
      label: 'Patient Reviews',
      path: '/doctor/getReview',
      description: 'View and manage patient feedback and reviews',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      bgColor: 'bg-gradient-to-br from-emerald-50 to-teal-50',
      iconColor: 'text-emerald-600',
      hoverColor: 'hover:from-emerald-100 hover:to-teal-100',
      borderColor: 'border-emerald-200'
    }
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  useEffect(() => {
    // Get doctor user data from storage
    const userData = localStorage.getItem('doctorUser') || sessionStorage.getItem('doctorUser');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        if (parsed.name && parsed.email) {
          setDoctorUser(parsed);
        }
      } catch (err) {
        console.error('Invalid doctorUser data:', err);
      }
    }

    const fetchDoctorStats = async (): Promise<void> => {
      const token = localStorage.getItem('doctorToken');

      if (!token) {
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get<ApiResponse>('/api/doctor/dashbaordStats', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setAnalytics({
          totalReviews: res.data.totalReviews,
          totalEnquiries: res.data.totalEnquiries || 0
        });
        setError(null);
      } catch (err) {
        const errorMessage = axios.isAxiosError(err)
          ? err.response?.data?.message || err.message
          : 'Failed to load dashboard data';
        console.error('Error fetching doctor analytics:', errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorStats();
  }, []);

  const handleQuickAction = (path: string) => {
    router.push(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            {/* Header skeleton */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
                <div className="space-y-3">
                  <div className="h-8 bg-gray-200 rounded w-64"></div>
                  <div className="h-4 bg-gray-200 rounded w-48"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="flex space-x-4">
                  <div className="bg-gray-200 rounded-xl p-6 w-32 h-20"></div>
                  <div className="bg-gray-200 rounded-xl p-6 w-32 h-20"></div>
                </div>
              </div>
            </div>

            {/* Quick actions skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 h-32 border border-gray-200"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Dashboard</h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 md:space-y-8">
        {/* Enhanced Welcome Header */}
        <div className="rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg relative overflow-hidden" style={{background: 'linear-gradient(135deg, #2D9AA5 0%, #3BAEB8 50%, #2D9AA5 100%)'}}>
          {/* Floating Circle Decorations - Hidden on small screens */}
          <div className="hidden md:block absolute top-8 right-8 w-32 h-32 bg-white/10 rounded-full blur-sm"></div>
          <div className="hidden lg:block absolute top-16 right-16 w-48 h-48 bg-white/5 rounded-full blur-md"></div>
          <div className="hidden md:block absolute bottom-8 left-8 w-24 h-24 bg-white/8 rounded-full blur-sm"></div>

          <div className="flex flex-col space-y-4 sm:space-y-6 lg:flex-row lg:justify-between lg:items-center lg:space-y-0 relative z-10">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 text-white leading-tight">
                {getGreeting()}, {doctorUser?.name || 'Doctor'}!
              </h1>
              <p className="text-white/90 text-sm sm:text-base md:text-lg mb-3 sm:mb-4">
                Welcome back to your professional dashboard
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm">
                <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full border border-white/30">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium text-white whitespace-nowrap">{formatDate(currentTime)}</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full border border-white/30">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium text-white whitespace-nowrap">{formatTime(currentTime)}</span>
                </div>
              </div>
            </div>

            {/* Enhanced Analytics Cards with Wave Borders */}
            <div className="flex justify-center lg:justify-end w-full lg:w-auto">
              {/* Total Reviews Card with Wave Border */}
              <div className="relative group w-full max-w-[200px] sm:max-w-none sm:w-auto">
                {/* Wave Border SVG - Hidden on small screens */}
                <svg className="hidden sm:block absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 120" preserveAspectRatio="none">
                  <path
                    d="M10,20 Q50,5 90,20 Q130,35 170,20 Q180,25 190,30 L190,100 Q180,105 170,100 Q130,85 90,100 Q50,115 10,100 Q5,95 10,90 Z"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    className="opacity-40 group-hover:opacity-60 transition-opacity duration-300"
                  />
                </svg>

                <div className="bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-6 min-w-[140px] sm:min-w-[160px] border border-white/30 relative z-10 hover:shadow-lg hover:bg-white/25 transition-all duration-300 transform hover:scale-105">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2 sm:mb-3">
                      <div className="p-1.5 sm:p-2 rounded-full shadow-lg bg-white/20 backdrop-blur-sm border border-white/30">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold mb-1 text-white">
                      {analytics.totalReviews}
                    </div>
                    <div className="text-white/90 text-xs sm:text-sm font-semibold">Total Reviews</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8">
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Quick Actions</h2>
            <p className="text-sm sm:text-base text-gray-600">Access your most important tools and features</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {quickActions.map((action) => (
              <button
                key={action.key}
                onClick={() => handleQuickAction(action.path)}
                className={`bg-gradient-to-br from-teal-50 to-cyan-50 hover:from-teal-100 hover:to-cyan-100 border-2 border-teal-200 rounded-lg sm:rounded-xl p-4 sm:p-6 text-left transition-all duration-300 hover:shadow-lg hover:scale-105 group w-full`}
                style={{'--tw-border-opacity': 1, borderColor: '#2D9AA5'}}
              >
                <div className="flex items-start space-x-3 sm:space-x-5">
                  <div className="p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-white shadow-sm group-hover:scale-110 transition-transform duration-300 flex-shrink-0" style={{color: '#2D9AA5'}}>
                    <div className="w-5 h-5 sm:w-6 sm:h-6">
                      {action.icon}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2 leading-tight">{action.label}</h3>
                    <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{action.description}</p>
                  </div>
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" style={{'--group-hover-color': '#2D9AA5'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Professional Tips - Only show if there are reviews or enquiries */}
        {(analytics.totalReviews > 0 || analytics.totalEnquiries > 0) && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8">
            <div className="mb-4 sm:mb-6 md:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Professional Insights</h2>
              <p className="text-sm sm:text-base text-gray-600">Tips to enhance your professional presence and patient engagement</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border-2 rounded-lg sm:rounded-xl p-4 sm:p-6" style={{borderColor: '#2D9AA5'}}>
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#E6F7F8'}}>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" style={{color: '#2D9AA5'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold ml-3" style={{color: '#1F7A84'}}>Profile Optimization</h3>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed" style={{color: '#1F7A84'}}>
                  Keep your profile information current and comprehensive to attract more patients and build trust.
                </p>
              </div>

              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border-2 rounded-lg sm:rounded-xl p-4 sm:p-6" style={{borderColor: '#2D9AA5'}}>
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#E6F7F8'}}>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" style={{color: '#2D9AA5'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.4 9.4 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold ml-3" style={{color: '#1F7A84'}}>Patient Communication</h3>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed" style={{color: '#1F7A84'}}>
                  Respond to patient reviews and inquiries promptly to maintain excellent patient relationships.
                </p>
              </div>

              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border-2 rounded-lg sm:rounded-xl p-4 sm:p-6 md:col-span-2 xl:col-span-1" style={{borderColor: '#2D9AA5'}}>
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#E6F7F8'}}>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" style={{color: '#2D9AA5'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold ml-3" style={{color: '#1F7A84'}}>Professional Growth</h3>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed" style={{color: '#1F7A84'}}>
                  Regular updates and active engagement help improve your visibility and professional reputation.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Stats Component */}
      <Stats
        role="doctor"
        config={{
          tokenKey: 'doctorToken',
          primaryColor: '#2D9AA5'
        }}
      />
    </div>
  );
};

DoctorDashboard.getLayout = function PageLayout(page: ReactElement) {
  return <DoctorLayout>{page}</DoctorLayout>;
};


const ProtectedDashboard: NextPageWithLayout = withDoctorAuth(DoctorDashboard);

// Reassign layout (TS-safe now)
ProtectedDashboard.getLayout = DoctorDashboard.getLayout;

export default ProtectedDashboard;