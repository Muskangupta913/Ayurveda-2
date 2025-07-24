import React, { useState, useEffect } from 'react';
import { Star, Mail, Settings, Calendar, Clock ,MessageCircle} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import ClinicLayout from '../../components/ClinicLayout';
import withClinicAuth from '../../components/withClinicAuth';
import type { NextPageWithLayout } from '../_app';
import Link from 'next/link';

// Type definitions
interface Stats {
  totalReviews: number;
  totalEnquiries: number;
  totalClinics?: number;
}

interface DashboardStatsResponse {
  success: boolean;
  stats: Stats;
  message?: string;
}

interface ClinicUser {
  name?: string;
  [key: string]: unknown;
}

interface ChartData {
  name: string;
  value: number;
}

const ClinicDashboard: NextPageWithLayout = () => {
  const [stats, setStats] = useState<Stats>({ totalReviews: 0, totalEnquiries: 0, totalClinics: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [clinicUser, setClinicUser] = useState<ClinicUser | null>(null);

  // Get clinic user data from localStorage (same as ClinicHeader)
  useEffect(() => {
    const clinicUserRaw = localStorage.getItem('clinicUser');
    if (clinicUserRaw) {
      try {
        const parsedUser = JSON.parse(clinicUserRaw);
        setClinicUser(parsedUser);
      } catch  {
        // console.error('Error parsing clinic user data:', error);
      }
    }
  }, []);

  useEffect(() => {
    const fetchStats = async (): Promise<void> => {
      try {
        const token = localStorage.getItem('clinicToken') || sessionStorage.getItem('clinicToken');
        const res = await fetch('/api/clinics/dashboardStats', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data: DashboardStatsResponse = await res.json();
        if (data.success) {
          setStats(data.stats);
        } else {
          // console.error('Error:', data.message);
        }
      } catch  {
        // const err = error as { message?: string };
        // setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timeInterval);
  }, []);

  const getGreeting = (): string => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const chartData: ChartData[] = [
    { name: 'Total Enquiries', value: stats.totalEnquiries },
    { name: 'Total Reviews', value: stats.totalReviews }
  ];

  const quickActions = [
    { title: 'Manage Clinic', icon: Settings, color: 'from-blue-500 to-indigo-500', href: '/clinic/myallClinic' },
    { title: 'Review', icon: Star, color: 'from-yellow-500 to-orange-500', href: '/clinic/getAllReview' },
    { title: 'Enquiry', icon: MessageCircle, color: 'from-green-500 to-emerald-500', href: '/clinic/get-Enquiry' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Waveform Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-200 relative overflow-hidden mx-2 sm:mx-4 lg:mx-6 mt-4 sm:mt-6">
        {/* Wave Background Effect */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="absolute bottom-0 left-0 w-full h-full opacity-15" viewBox="0 0 1000 200" preserveAspectRatio="none">
            <path d="M0,100 C150,200 350,0 500,100 C650,200 850,0 1000,100 L1000,200 L0,200 Z" fill="url(#wave-gradient)" />
            <defs>
              <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1E40AF" />
                <stop offset="50%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#0891B2" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Floating Circle Decorations */}
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-12 h-12 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-sm"></div>
        <div className="absolute top-6 right-6 sm:top-12 sm:right-12 w-16 h-16 sm:w-32 sm:h-32 bg-gradient-to-br from-indigo-400/8 to-cyan-400/8 rounded-full blur-md"></div>
        <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 w-12 h-12 sm:w-24 sm:h-24 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-full blur-sm"></div>

        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center relative z-10 space-y-6 xl:space-y-0">
          <div className="w-full xl:w-auto">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-gray-900 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
              {getGreeting()}, {clinicUser?.name || 'Clinic'}!
            </h1>
            <p className="text-gray-600 text-base sm:text-lg mb-3">
              Welcome back to your professional dashboard
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-full">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-gray-700 text-xs sm:text-sm">{formatDate(currentTime)}</span>
              </div>
              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-full">
                <Clock className="w-4 h-4 text-purple-500" />
                <span className="font-medium text-gray-700 text-xs sm:text-sm">{formatTime(currentTime)}</span>
              </div>
            </div>
          </div>

          {/* Enhanced Analytics Cards */}
          <div className="w-full xl:w-auto flex justify-center xl:justify-end">
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-2 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Quick Actions Section */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="group bg-gradient-to-br from-gray-50 to-gray-100 hover:from-white hover:to-gray-50 rounded-xl p-4 sm:p-6 border-2 border-gray-200 hover:border-gray-300 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                <div className="flex flex-col items-center space-y-2 sm:space-y-3">
                  <div className={`p-2 sm:p-3 bg-gradient-to-br ${action.color} rounded-full shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                    <action.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <span className="text-gray-800 font-semibold text-sm sm:text-lg text-center">
                    {action.title}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {stats.totalClinics !== undefined && (
            <div className="bg-white shadow-lg rounded-2xl p-4 sm:p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full shadow-lg flex-shrink-0">
                  <Settings className="text-white w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 truncate">Total Clinics</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalClinics}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dashboard Graph */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">Analytics Overview</h2>
          <div className="h-64 sm:h-80 lg:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 10,
                  left: 10,
                  bottom: 20
                }}
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#374151', fontSize: 12, fontWeight: 500 }}
                  axisLine={{ stroke: '#d1d5db', strokeWidth: 2 }}
                  tickLine={{ stroke: '#d1d5db' }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  tick={{ fill: '#374151', fontSize: 12 }}
                  axisLine={{ stroke: '#d1d5db', strokeWidth: 2 }}
                  tickLine={{ stroke: '#d1d5db' }}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#000000'
                  }}
                  labelStyle={{ color: '#000000' }}
                  cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                />
                <Bar
                  dataKey="value"
                  radius={[8, 8, 0, 0]}
                  fill="url(#multiBarGradient)"
                  stroke="#1e40af"
                  strokeWidth={2}
                />
                <defs>
                  <linearGradient id="multiBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="50%" stopColor="#1D4ED8" />
                    <stop offset="100%" stopColor="#1E40AF" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Summary */}
          <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 sm:p-4 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-blue-600 truncate">Total Enquiries</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-900">{stats.totalEnquiries}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-full flex-shrink-0 ml-2">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 sm:p-4 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-yellow-600 truncate">Total Reviews</p>
                  <p className="text-xl sm:text-2xl font-bold text-yellow-900">{stats.totalReviews}</p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-full flex-shrink-0 ml-2">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ClinicDashboard.getLayout = function PageLayout(page: React.ReactNode) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

// Apply HOC and assign correct type
const ProtectedDashboard: NextPageWithLayout = withClinicAuth(ClinicDashboard);

// Reassign layout (TS-safe now)
ProtectedDashboard.getLayout = ClinicDashboard.getLayout;

export default ProtectedDashboard;