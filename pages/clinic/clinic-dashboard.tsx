import React, { useState, useEffect } from 'react';
import { Star, Mail, Settings, Calendar, Clock ,MessageCircle} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Stats from '../../components/Stats';
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
    { title: 'Manage Health Center', icon: Settings, color: 'from-blue-500 to-indigo-500', href: '/clinic/myallClinic' },
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
    <div className="min-h-screen bg-gray-100">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-[#2D9AA5] to-[#1F7A7A] rounded-xl p-8 shadow-lg border border-gray-200 mx-4 mt-4 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-32 h-32 bg-white rounded-full"></div>
          <div className="absolute top-12 right-12 w-20 h-20 bg-white rounded-full"></div>
          <div className="absolute bottom-8 left-8 w-24 h-24 bg-white rounded-full"></div>
          <div className="absolute bottom-4 left-16 w-16 h-16 bg-white rounded-full"></div>
        </div>
        
        <div className="flex flex-col items-start space-y-6 relative z-10">
          <div className="w-full">
            <h1 className="text-4xl font-bold mb-3 text-white drop-shadow-sm">
              {getGreeting()}, {clinicUser?.name || 'Clinic'}!
            </h1>
            <p className="text-white/90 text-xl mb-4 font-medium">
              Welcome back to your professional dashboard
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
              <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30">
                <Calendar className="w-5 h-5 text-white" />
                <span className="font-semibold text-white text-sm">{formatDate(currentTime)}</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30">
                <Clock className="w-5 h-5 text-white" />
                <span className="font-semibold text-white text-sm">{formatTime(currentTime)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-6">
        {/* Quick Actions Section */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="group bg-white hover:bg-gray-50 rounded-lg p-6 border border-gray-200 hover:border-[#2D9AA5] transition-all duration-200 hover:shadow-md"
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className="p-3 bg-[#2D9AA5] rounded-lg shadow-sm group-hover:shadow-md transition-shadow duration-200">
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-gray-800 font-medium text-lg text-center">
                    {action.title}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.totalClinics !== undefined && (
            <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-[#2D9AA5] rounded-lg shadow-sm flex-shrink-0">
                  <Settings className="text-white w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-medium text-gray-800">Total Health Centers</h3>
                  <p className="text-3xl font-semibold text-gray-900">{stats.totalClinics}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dashboard Graph */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900">Analytics Overview</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 20,
                  left: 20,
                  bottom: 60
                }}
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#374151', fontSize: 12 }}
                  axisLine={{ stroke: '#d1d5db' }}
                  tickLine={{ stroke: '#d1d5db' }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  tick={{ fill: '#374151', fontSize: 12 }}
                  axisLine={{ stroke: '#d1d5db' }}
                  tickLine={{ stroke: '#d1d5db' }}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '14px'
                  }}
                  cursor={{ fill: 'rgba(45, 154, 165, 0.1)' }}
                />
                <Bar
                  dataKey="value"
                  radius={[4, 4, 0, 0]}
                  fill="#2D9AA5"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Summary */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-[#2D9AA5]">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Enquiries</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalEnquiries}</p>
                </div>
                <div className="p-2 bg-white rounded-lg flex-shrink-0 ml-2 shadow-sm">
                  <Mail className="w-5 h-5 text-[#2D9AA5]" />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-[#2D9AA5]">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalReviews}</p>
                </div>
                <div className="p-2 bg-white rounded-lg flex-shrink-0 ml-2 shadow-sm">
                  <Star className="w-5 h-5 text-[#2D9AA5]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
       {/* // For clinic Dashboard */}
      <Stats
        role="clinic"
        config={{
          tokenKey: 'clinicToken',
          primaryColor: '#2D9AA5'
        }}
      />
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