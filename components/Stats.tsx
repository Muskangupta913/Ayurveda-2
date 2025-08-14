// components/common/JobStats.tsx
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';

// Type definitions (matching your existing Job interface)
interface Job {
  _id: string;
  jobTitle: string;
  companyName?: string;
  clinicName?: string;
  hospitalName?: string;
  department?: string;
  jobType?: string;
  location?: string;
  salary?: string;
  isActive: boolean;
  role?: string;
  qualification?: string;
  workingDays?: string;
  jobTiming?: string;
  skills?: string[];
  perks?: string[];
  languagesPreferred?: string[];
  description?: string;
  noOfOpenings?: number;
  establishment?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface StatsConfig {
  tokenKey: string;
  primaryColor: string;
  title?: string;
}

interface JobStatsProps {
  role?: 'clinic' | 'doctor';
  config?: StatsConfig;
}

interface JobTypeStats {
  [key: string]: number;
}

interface StatsData {
  totalJobs: number;
  activeJobs: number;
  inactiveJobs: number;
  jobTypeStats: JobTypeStats;
  totalOpenings: number;
}

const JobStats: React.FC<JobStatsProps> = ({ 
  role = 'clinic',
  config = {
    tokenKey: 'clinicToken',
    primaryColor: '#2D9AA5',
    title: 'Job Statistics'
  }
}) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const fetchJobs = async (): Promise<void> => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem(config.tokenKey);
      
      if (!token) {
        setError('Authentication token not found');
        return;
      }

      const res = await axios.get<{ jobs: Job[] }>('/api/job-postings/my-jobs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobs(res.data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('Failed to fetch job statistics');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [config.tokenKey]);

  // Calculate statistics
  const stats: StatsData = useMemo(() => {
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(job => job.isActive).length;
    const inactiveJobs = jobs.filter(job => !job.isActive).length;
    
    // Calculate total openings
    const totalOpenings = jobs.reduce((sum, job) => {
      return sum + (job.noOfOpenings || 1);
    }, 0);

    // Calculate job type statistics
    const jobTypeStats: JobTypeStats = {};
    jobs.forEach(job => {
      const jobType = job.jobType || 'Not Specified';
      jobTypeStats[jobType] = (jobTypeStats[jobType] || 0) + 1;
    });

    return {
      totalJobs,
      activeJobs,
      inactiveJobs,
      jobTypeStats,
      totalOpenings
    };
  }, [jobs]);

  // Get job type entries sorted by count
  const sortedJobTypes = useMemo(() => {
    return Object.entries(stats.jobTypeStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6); // Show top 6 job types
  }, [stats.jobTypeStats]);

  if (loading) {
    return (
      <div className="w-full">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-300 rounded w-1/3 mb-1"></div>
                <div className="h-3 bg-gray-300 rounded w-3/4"></div>
              </div>
            ))}
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-300 rounded w-12"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-medium text-red-900">Unable to load statistics</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
          <button 
            onClick={fetchJobs}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Jobs */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Jobs</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalJobs}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalOpenings} total openings
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8zM16 10h.01M12 14h.01M8 14h.01M8 10h.01" />
              </svg>
            </div>
          </div>
        </div>

        {/* Active Jobs */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Jobs</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.activeJobs}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalJobs > 0 ? Math.round((stats.activeJobs / stats.totalJobs) * 100) : 0}% of total
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Inactive Jobs */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive Jobs</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{stats.inactiveJobs}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalJobs > 0 ? Math.round((stats.inactiveJobs / stats.totalJobs) * 100) : 0}% of total
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
            </div>
          </div>
        </div>

        {/* Job Types Count */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Job Types</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{Object.keys(stats.jobTypeStats).length}</p>
              <p className="text-xs text-gray-500 mt-1">Different categories</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Job Types Breakdown */}
      {sortedJobTypes.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Job Types Breakdown</h3>
            <span className="text-sm text-gray-500">{stats.totalJobs} total jobs</span>
          </div>
          
          <div className="space-y-4">
            {sortedJobTypes.map(([jobType, count], index) => {
              const percentage = stats.totalJobs > 0 ? (count / stats.totalJobs) * 100 : 0;
              const colors = [
                'bg-blue-500',
                'bg-green-500', 
                'bg-purple-500',
                'bg-orange-500',
                'bg-pink-500',
                'bg-indigo-500'
              ];
              
              return (
                <div key={jobType} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                    <span className="font-medium text-gray-700 flex-1">{jobType}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${colors[index % colors.length]}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-right min-w-[60px]">
                      <span className="font-bold text-gray-900">{count}</span>
                      <span className="text-sm text-gray-500 ml-1">({Math.round(percentage)}%)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {Object.keys(stats.jobTypeStats).length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-gray-500">No job types data available</p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {stats.totalJobs === 0 && (
        <div className="bg-white p-8 rounded-xl border border-gray-200 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8zM16 10h.01M12 14h.01M8 14h.01M8 10h.01" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Job Posts Yet</h3>
          <p className="text-gray-500 mb-4">Create your first job posting to see statistics here.</p>
        </div>
      )}
    </div>
  );
};

export default JobStats;