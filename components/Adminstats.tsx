'use client';
import React, { useEffect, useState, ReactNode } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  AreaChart,
  Area,
  ComposedChart,
  Line,
} from "recharts";

import type { TooltipProps, NameType, ValueType } from "recharts/types";

import { TrendingUp, FileText, Briefcase, Activity, ChevronUp, ChevronDown } from 'lucide-react';

// ---------------- Types ----------------
type SubTreatment = {
  name: string;
  slug: string;
};

type Treatment = {
  _id: string;
  name: string;
  slug: string;
  subcategories: SubTreatment[];
};

interface Blog {
  _id: string;
  title: string;
  postedBy?: { name?: string };
}

interface Job {
  _id: string;
  jobTitle: string;
  companyName: string;
  jobType?: string;
  location?: string;
  department?: string;
  salary?: string;
}

interface JobsData {
  pending: Job[];
  approved: Job[];
  declined: Job[];
}

interface AdminStatsProps {
  theme?: 'light' | 'dark';
}

// ---------------- Custom Components ----------------
type TrendDir = 'up' | 'down';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
  trend?: TrendDir;
  trendValue?: number | string;
  subtitle?: string;
  prefix?: string;
  suffix?: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color = 'bg-[#2D9AA5]',
  trend,
  trendValue,
  subtitle,
  prefix = '',
  suffix = '',
  loading = false,
}) => {
  const getTrendColor = (t?: TrendDir): string => {
    if (t === 'up') return 'text-emerald-500';
    if (t === 'down') return 'text-red-500';
    return 'text-gray-500';
  };

  const formatValue = (val: number | string): string => {
    if (loading) return '---';
    if (typeof val === 'number') {
      if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
      if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
      return val.toLocaleString();
    }
    return String(val);
  };

  return (
    <div className="group bg-white border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-[#2D9AA5]/30 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#2D9AA5] via-transparent to-[#2D9AA5] transform rotate-12 scale-150" />
      </div>

      <div className="relative z-10">
        {/* Header with icon and trend */}
        <div className="flex items-center justify-between mb-6">
          <div
            className={`p-4 rounded-xl ${color} shadow-lg shadow-[#2D9AA5]/20 group-hover:shadow-[#2D9AA5]/30 transition-all duration-300 group-hover:scale-110`}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
          {trend && trendValue !== undefined && trendValue !== null && (
            <div
              className={`flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full bg-gray-50 ${getTrendColor(
                trend,
              )}`}
            >
              {trend === 'up' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span>{trendValue}%</span>
            </div>
          )}
        </div>

        {/* Main value */}
        <div className="mb-3">
          <div className="flex items-baseline gap-1">
            {prefix && <span className="text-lg font-medium text-gray-600">{prefix}</span>}
            <div
              className={`text-3xl font-bold text-gray-900 transition-all duration-300 ${
                loading ? 'animate-pulse' : 'group-hover:text-[#2D9AA5]'
              }`}
            >
              {formatValue(value)}
            </div>
            {suffix && <span className="text-lg font-medium text-gray-600 ml-1">{suffix}</span>}
          </div>
        </div>

        {/* Title and subtitle */}
        <div>
          <div className="text-gray-700 text-sm font-semibold uppercase tracking-wide mb-1">{title}</div>
          {subtitle && <div className="text-gray-500 text-xs">{subtitle}</div>}
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-100 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#2D9AA5] to-cyan-400 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
};

interface ChartContainerProps {
  title: string;
  children: ReactNode;
  fullWidth?: boolean;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ title, children, fullWidth = false }) => (
  <div
    className={`bg-white border border-gray-200 rounded-xl p-6 hover:border-[#2D9AA5]/30 transition-all duration-300 hover:shadow-lg ${
      fullWidth ? 'col-span-full' : ''
    }`}
  >
    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
      <div className="w-1 h-6 bg-[#2D9AA5] rounded-full" />
      {title}
    </h3>
    <div className="relative">{children}</div>
  </div>
);

// ---------------- Main Component ----------------
const AdminStats: React.FC<AdminStatsProps> = ({ theme = 'dark' }) => {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [jobs, setJobs] = useState<JobsData>({
    pending: [],
    approved: [],
    declined: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Fetch all data function
  const fetchData = async (): Promise<void> => {
    try {
      const isRefresh = !loading;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const headers: HeadersInit = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
      };

      // Fetch Treatments
      const treatmentsResponse = await fetch('/api/doctor/getTreatment', { headers });
      if (!treatmentsResponse.ok) throw new Error('Failed to fetch treatments');
      const treatmentsData: { treatments?: Treatment[] } = await treatmentsResponse.json();
      setTreatments(treatmentsData.treatments ?? []);

      // Fetch Blogs
      const blogsResponse = await fetch('/api/admin/get-blogs', { headers });
      if (!blogsResponse.ok) throw new Error('Failed to fetch blogs');
      const blogsData: { blogs?: Blog[] } = await blogsResponse.json();
      setBlogs(blogsData.blogs ?? []);

      // Fetch Jobs
      const jobsResponse = await fetch('/api/admin/job-manage', { headers });
      if (!jobsResponse.ok) throw new Error('Failed to fetch jobs');
      const jobsData: Partial<JobsData> = await jobsResponse.json();
      setJobs({
        pending: jobsData.pending ?? [],
        approved: jobsData.approved ?? [],
        declined: jobsData.declined ?? [],
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching data:', error);
      // Optionally trigger a toast UI here
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------- Theme Styles ----------------
  const isLight = theme === 'light';
  const themeStyles = {
    rootBg: isLight ? 'bg-gray-50 text-gray-900' : 'bg-gray-900 text-white',
    headerBg: isLight
      ? 'bg-white border-b border-gray-200'
      : 'bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border-b border-gray-700',
    container: isLight ? 'bg-white border border-gray-200' : 'bg-gray-800 border border-gray-700',
    primaryText: isLight ? 'text-gray-900' : 'text-white',
    secondaryText: isLight ? 'text-gray-600' : 'text-gray-400',
    mutedText: isLight ? 'text-gray-500' : 'text-gray-500',
    accent: 'bg-teal-500',
    axisColor: isLight ? '#6B7280' : '#9CA3AF',
    gridColor: isLight ? '#E5E7EB' : '#374151',
    tooltipBg: isLight ? 'bg-white border border-gray-200' : 'bg-gray-800 border border-gray-600',
    tooltipText: isLight ? 'text-gray-900' : 'text-white',
  } as const;

  // ---------------- Calculated Statistics ----------------
  const mainTreatmentCount = treatments.length;
  const subTreatmentCount = treatments.reduce(
    (acc, treatment) => acc + (treatment.subcategories?.length || 0),
    0,
  );
  const blogCount = blogs.length;
  const pendingJobCount = jobs.pending.length;
  const approvedJobCount = jobs.approved.length;
  const declinedJobCount = jobs.declined.length;
  const totalJobCount = pendingJobCount + approvedJobCount + declinedJobCount;

  // ---------------- Chart Data Preparation ----------------
  const overviewBarData = [
    { name: 'Main Treatments', value: mainTreatmentCount, fill: '#2D9AA5' },
    { name: 'Sub Treatments', value: subTreatmentCount, fill: '#18232b' },
    { name: 'Published Blogs', value: blogCount, fill: '#4ECDC4' },
    { name: 'Total Jobs', value: totalJobCount, fill: '#45B7D1' },
  ];

  const jobStatusPieData = [
    { name: 'Approved', value: approvedJobCount, fill: '#10B981' },
    { name: 'Pending', value: pendingJobCount, fill: '#F59E0B' },
    { name: 'Declined', value: declinedJobCount, fill: '#EF4444' },
  ].filter((item) => item.value > 0);

  const treatmentAreaData = [
    { name: 'Main Treatments', value: mainTreatmentCount },
    { name: 'Sub Treatments', value: subTreatmentCount },
  ];

  const contentComparisonData = [
    {
      category: 'Treatments',
      main: mainTreatmentCount,
      secondary: subTreatmentCount,
      total: mainTreatmentCount + subTreatmentCount,
    },
    {
      category: 'Content',
      main: blogCount,
      secondary: 0,
      total: blogCount,
    },
    {
      category: 'Jobs',
      main: approvedJobCount,
      secondary: pendingJobCount,
      total: totalJobCount,
    },
  ];

  // Custom tooltip component
  const CustomTooltip: React.FC<TooltipProps<ValueType, NameType>> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`${themeStyles.tooltipBg} rounded-lg p-3 shadow-xl`}>
          <p className={`${themeStyles.tooltipText} font-medium`}>{label as ReactNode}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: (entry?.color as string) || undefined }}>
              {String(entry?.name)}: {String(entry?.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Main Treatments"
            value={mainTreatmentCount}
            icon={Activity}
            color="bg-gradient-to-r from-teal-600 to-teal-700"
            trend="up"
            trendValue={12}
          />
          <StatCard
            title="Sub Treatments"
            value={subTreatmentCount}
            icon={TrendingUp}
            color="bg-gradient-to-r from-blue-600 to-blue-700"
            trend="up"
            trendValue={8}
          />
          <StatCard
            title="Published Blogs"
            value={blogCount}
            icon={FileText}
            color="bg-gradient-to-r from-purple-600 to-purple-700"
            trend="up"
            trendValue={15}
          />
          <StatCard
            title="Total Jobs"
            value={totalJobCount}
            icon={Briefcase}
            color="bg-gradient-to-r from-green-600 to-green-700"
            trend="up"
            trendValue={5}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {/* Quick Bar Chart */}
          <ChartContainer title="Quick Overview">
  <ResponsiveContainer width="100%" height={350}>
    <AreaChart
      data={overviewBarData}
      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
    >
      <CartesianGrid strokeDasharray="3 3" stroke={themeStyles.gridColor} />
      <XAxis
        dataKey="name"
        tick={{ fill: themeStyles.axisColor, fontSize: 12 }}
        angle={-45}
        textAnchor="end"
        height={80}
        interval={0}
        axisLine={{ stroke: themeStyles.axisColor }}
        tickLine={{ stroke: themeStyles.axisColor }}
      />
      <YAxis
        tick={{ fill: themeStyles.axisColor, fontSize: 12 }}
        axisLine={{ stroke: themeStyles.axisColor }}
        tickLine={{ stroke: themeStyles.axisColor }}
      />
      <Tooltip content={<CustomTooltip />} />
      <Area
        type="monotone"
        dataKey="value"
        stroke="#2D9AA5"
        fill="#2D9AA5"
        fillOpacity={0.3}
      />
    </AreaChart>
  </ResponsiveContainer>
</ChartContainer>

          {/* Job Status Distribution Pie Chart */}
          <ChartContainer title="Job Status Distribution">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={jobStatusPieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={40}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Treatment Breakdown Area Chart */}
          <ChartContainer title="Treatment Analysis">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={treatmentAreaData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="treatmentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2D9AA5" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#2D9AA5" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={themeStyles.gridColor} />
                <XAxis dataKey="name" tick={{ fill: themeStyles.axisColor, fontSize: 12 }} />
                <YAxis tick={{ fill: themeStyles.axisColor, fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#2D9AA5" strokeWidth={3} fill="url(#treatmentGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Content Comparison Chart */}
          <div className="xl:col-span-3">
            <ChartContainer title="Content Category Comparison">
              <ResponsiveContainer width="100%" height={380}>
                <ComposedChart data={contentComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="secondaryGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.7} />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="5 5" stroke={themeStyles.gridColor} />
                  <XAxis
                    dataKey="category"
                    tick={{ fill: themeStyles.axisColor, fontSize: 12, fontWeight: 500 as unknown as number }}
                    axisLine={{ stroke: themeStyles.axisColor, strokeWidth: 2 }}
                    tickLine={{ stroke: themeStyles.axisColor, strokeWidth: 1 }}
                  />
                  <YAxis
                    tick={{ fill: themeStyles.axisColor, fontSize: 12, fontWeight: 500 as unknown as number }}
                    axisLine={{ stroke: themeStyles.axisColor, strokeWidth: 2 }}
                    tickLine={{ stroke: themeStyles.axisColor, strokeWidth: 1 }}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{
                      fill: 'rgba(79, 70, 229, 0.1)',
                      stroke: '#4F46E5',
                      strokeWidth: 2,
                      strokeDasharray: '5 5',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="main"
                    stroke="#4F46E5"
                    fill="url(#primaryGradient)"
                    strokeWidth={3}
                    dot={{ r: 6, fill: '#4F46E5', stroke: '#fff', strokeWidth: 2, filter: 'url(#glow)' }}
                    activeDot={{ r: 8, fill: '#4F46E5', stroke: '#fff', strokeWidth: 3 }}
                    name="Main"
                  />
                  <Bar dataKey="secondary" fill="url(#secondaryGradient)" name="Secondary" radius={[8, 8, 0, 0]} />
                  <Line
                    type="monotone"
                    dataKey="main"
                    stroke="#4F46E5"
                    strokeWidth={4}
                    dot={{ r: 0 }}
                    activeDot={{ r: 8, fill: '#4F46E5', stroke: '#fff', strokeWidth: 3, filter: 'url(#glow)' }}
                    name="Main (Line)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;
