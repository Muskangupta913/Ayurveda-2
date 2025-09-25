import React, { useEffect, useState, ReactElement, CSSProperties } from 'react';
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
    totalEnquiries: 0,
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
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
      bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50',
      iconColor: 'text-blue-600',
      hoverColor: 'hover:from-blue-100 hover:to-indigo-100',
      borderColor: 'border-blue-200',
    },
    {
      key: 'view-reviews',
      label: 'Patient Reviews',
      path: '/doctor/getReview',
      description: 'View and manage patient feedback and reviews',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      ),
      bgColor: 'bg-gradient-to-br from-emerald-50 to-teal-50',
      iconColor: 'text-emerald-600',
      hoverColor: 'hover:from-emerald-100 hover:to-teal-100',
      borderColor: 'border-emerald-200',
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);

  const formatTime = (date: Date) =>
    new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);

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
        const res = await fetch('/api/doctor/dashbaordStats', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          throw new Error(errorData?.message || `Request failed with status ${res.status}`);
        }

        const data: ApiResponse = await res.json();
        setAnalytics({
          totalReviews: data.totalReviews,
          totalEnquiries: data.totalEnquiries || 0,
        });
        setError(null);
      } catch (err: unknown) {
        let errorMessage = 'Failed to load dashboard data';
        if (err instanceof Error) {
          errorMessage = err.message;
        }
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
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Unable to Load Dashboard
                </h3>
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

  // Define custom CSS properties for Tailwind compatibility
  const quickActionButtonStyle: CSSProperties = {
    borderColor: '#2D9AA5',
    '--tw-border-opacity': 1,
  } as CSSProperties & { '--tw-border-opacity': number };

  const arrowIconStyle: CSSProperties = {
    '--group-hover-color': '#2D9AA5',
  } as CSSProperties & { '--group-hover-color': string };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ... Rest of your JSX unchanged ... */}
      <Stats
        role="doctor"
        config={{
          tokenKey: 'doctorToken',
          primaryColor: '#2D9AA5',
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
