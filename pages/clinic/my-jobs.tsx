import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ClinicLayout from "../../components/ClinicLayout";
import withClinicAuth from "../../components/withClinicAuth";
import type { NextPageWithLayout } from "../_app";

// Define interfaces for type safety
interface Job {
  _id: string;
  jobTitle: string;
  companyName: string;
  department?: string;
  jobType?: string;
  location?: string;
  qualification?: string;
  salary?: string;
  noOfOpenings?: number;
  workingDays?: string;
  jobTiming?: string;
  establishment?: string;
  skills?: string[];
  perks?: string[];
  languagesPreferred?: string[];
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ConfirmAction {
  type: 'toggle' | 'delete';
  jobId: string;
  currentStatus?: boolean;
  jobTitle: string;
  action: 'activate' | 'deactivate' | 'delete';
}

type StatusFilter = 'all' | 'active' | 'inactive';

function MyJobs(){
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const jobsPerPage = 10;
  
  // Filter and Search state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchJobs = async (): Promise<void> => {
    try {
      setLoading(true);
      const token = localStorage.getItem('clinicToken');
      const res = await axios.get<{ jobs: Job[] }>('/api/job-postings/my-jobs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Jobs data:', res.data.jobs);
      setJobs(res.data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search logic
  useEffect(() => {
    let filtered = jobs;

    // Apply status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(job => job.isActive);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(job => !job.isActive);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(job => 
        job.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredJobs(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [jobs, statusFilter, searchQuery]);

  useEffect(() => {
    fetchJobs();
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const endIndex = startIndex + jobsPerPage;
  const currentJobs = filteredJobs.slice(startIndex, endIndex);

  const goToPage = (page: number): void => {
    setCurrentPage(page);
    window.scrollTo(0, 0); // Scroll to top when changing page
  };

  const handleToggleJob = (jobId: string, currentStatus: boolean, jobTitle: string): void => {
    setConfirmAction({
      type: 'toggle',
      jobId,
      currentStatus,
      jobTitle,
      action: currentStatus ? 'deactivate' : 'activate'
    });
    setShowConfirmModal(true);
  };

  const handleDeleteJob = (jobId: string, jobTitle: string): void => {
    setConfirmAction({
      type: 'delete',
      jobId,
      jobTitle,
      action: 'delete'
    });
    setShowConfirmModal(true);
  };

  const executeAction = async (): Promise<void> => {
    if (!confirmAction) return;
    
    const token = localStorage.getItem('clinicToken');
    
    try {
      if (confirmAction.type === 'toggle') {
        await axios.patch('/api/job-postings/toggle', {
          jobId: confirmAction.jobId,
          isActive: !confirmAction.currentStatus,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else if (confirmAction.type === 'delete') {
        await axios.delete(`/api/job-postings/delete?jobId=${confirmAction.jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      
      fetchJobs();
      setShowConfirmModal(false);
      setConfirmAction(null);
    } catch (error) {
      console.error('Error executing action:', error);
    }
  };

  const cancelAction = (): void => {
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const clearFilters = (): void => {
    setStatusFilter('all');
    setSearchQuery('');
  };

  // Pagination component
  const Pagination: React.FC = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = (): (number | string)[] => {
      const pages: (number | string)[] = [];
      const maxVisiblePages = 5;
      
      if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push('...');
          for (let i = totalPages - 3; i <= totalPages; i++) {
            pages.push(i);
          }
        } else {
          pages.push(1);
          pages.push('...');
          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        }
      }
      
      return pages;
    };

    return (
      <div className="flex items-center justify-between bg-white px-4 py-3 border-t border-gray-200 sm:px-6 rounded-xl">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => goToPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">{Math.min(endIndex, filteredJobs.length)}</span> of{' '}
              <span className="font-medium">{filteredJobs.length}</span> results
            </p>
          </div>
          
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => goToPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                </svg>
              </button>

              {getPageNumbers().map((page, index) => (
                page === '...' ? (
                  <span key={index} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                    ...
                  </span>
                ) : (
                  <button
                    key={index}
                    onClick={() => goToPage(page as number)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                      currentPage === page
                        ? 'z-10 bg-[#2D9AA5] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D9AA5]'
                        : 'text-gray-900'
                    }`}
                  >
                    {page}
                  </button>
                )
              ))}

              <button
                onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  // Confirmation Modal
  const ConfirmationModal: React.FC = () => (
    <>
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={cancelAction}
      />
      
      <div className="fixed inset-x-4 top-1/2 transform -translate-y-1/2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[400px] z-50">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          
          <div className={`px-6 py-4 ${
            confirmAction?.action === 'delete' 
              ? 'bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200' 
              : confirmAction?.action === 'activate'
              ? 'bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200'
              : 'bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                confirmAction?.action === 'delete' 
                  ? 'bg-red-500' 
                  : confirmAction?.action === 'activate'
                  ? 'bg-green-500'
                  : 'bg-orange-500'
              }`}>
                {confirmAction?.action === 'delete' ? (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                ) : confirmAction?.action === 'activate' ? (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {confirmAction?.action === 'delete' 
                    ? 'Delete Job Posting' 
                    : confirmAction?.action === 'activate'
                    ? 'Activate Job Posting'
                    : 'Deactivate Job Posting'}
                </h3>
                <p className={`text-sm ${
                  confirmAction?.action === 'delete' 
                    ? 'text-red-700' 
                    : confirmAction?.action === 'activate'
                    ? 'text-green-700'
                    : 'text-orange-700'
                }`}>
                  {confirmAction?.action === 'delete' 
                    ? 'This action cannot be undone' 
                    : confirmAction?.action === 'activate'
                    ? 'Job will be visible to candidates'
                    : 'Job will be hidden from candidates'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <p className="text-gray-700 mb-4">
              Are you sure you want to <strong>{confirmAction?.action}</strong> the job posting:
            </p>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="font-semibold text-gray-900">{confirmAction?.jobTitle}</p>
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={cancelAction}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 ${
                  confirmAction?.action === 'delete'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : confirmAction?.action === 'activate'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                }`}
              >
                {confirmAction?.action === 'delete' 
                  ? 'Delete Job' 
                  : confirmAction?.action === 'activate'
                  ? 'Activate Job'
                  : 'Deactivate Job'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#2D9AA5] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your job posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-[#2D9AA5] rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0V6a2 2 0 00-2 2v6.001" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Job Posts</h1>
              <p className="text-gray-600 mt-1">Manage your job postings and track applications</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Jobs</p>
                  <p className="text-xl font-bold text-gray-900">{jobs.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Jobs</p>
                  <p className="text-xl font-bold text-gray-900">{jobs.filter(job => job.isActive).length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Inactive Jobs</p>
                  <p className="text-xl font-bold text-gray-900">{jobs.filter(job => !job.isActive).length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* Search Bar */}
              <div className="flex-1 w-full sm:w-auto">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by job title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-black block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-[#2D9AA5] focus:border-[#2D9AA5] text-sm"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="text-black border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-[#2D9AA5] focus:border-[#2D9AA5]"
                >
                  <option value="all">All Jobs</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>

              {/* Clear Filters */}
              {(statusFilter !== 'all' || searchQuery.trim()) && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Results Info */}
            {(statusFilter !== 'all' || searchQuery.trim()) && (
              <div className="mt-3 text-sm text-gray-600">
                Showing {filteredJobs.length} of {jobs.length} jobs
                {searchQuery.trim() && ` matching "${searchQuery}"`}
                {statusFilter !== 'all' && ` (${statusFilter} only)`}
              </div>
            )}
          </div>
        </div>

        {/* Jobs List */}
        <div className="space-y-4 mb-6">
          {currentJobs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0V6a2 2 0 00-2 2v6.001" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {jobs.length === 0 ? 'No Job Posts Yet' : 'No jobs match your criteria'}
              </h3>
              <p className="text-gray-600 mb-6">
                {jobs.length === 0 
                  ? 'Start by creating your first job posting to attract candidates.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              {jobs.length === 0 && (
                <button className="bg-[#2D9AA5] text-white px-6 py-3 rounded-xl hover:bg-[#247a83] transition-colors font-medium">
                  Create Your First Job
                </button>
              )}
            </div>
          ) : (
            currentJobs.map(job => (
              <div key={job._id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="p-4">
                  
                  {/* Job Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${
                        job.isActive ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <svg className={`w-5 h-5 ${job.isActive ? 'text-green-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0V6a2 2 0 00-2 2v6.001" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 truncate">{job.jobTitle}</h3>
                        <p className="text-[#2D9AA5] font-medium text-sm">{job.companyName}</p>
                      </div>
                    </div>

                    {/* Status Badge and Actions */}
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        job.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {job.isActive ? '● Active' : '● Inactive'}
                      </div>
                      
                      <button
                        onClick={() => handleToggleJob(job._id, job.isActive, job.jobTitle)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                          job.isActive 
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {job.isActive ? 'Deactivate' : 'Activate'}
                      </button>

                      <button
                        onClick={() => handleDeleteJob(job._id, job.jobTitle)}
                        className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-xs font-medium transition-all duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Job Details - Clean grid layout showing ALL data */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {job.department && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Department</span>
                        <p className="text-sm font-medium text-gray-800">{job.department}</p>
                      </div>
                    )}
                    {job.jobType && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Type</span>
                        <p className="text-sm font-medium text-gray-800">{job.jobType}</p>
                      </div>
                    )}
                    {job.location && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Location</span>
                        <p className="text-sm font-medium text-gray-800">{job.location}</p>
                      </div>
                    )}
                    {job.qualification && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Qualification</span>
                        <p className="text-sm font-medium text-gray-800">{job.qualification}</p>
                      </div>
                    )}
                    {job.salary && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Salary</span>
                        <p className="text-sm font-medium text-gray-800">{job.salary}</p>
                      </div>
                    )}
                    {job.noOfOpenings && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Openings</span>
                        <p className="text-sm font-medium text-gray-800">{job.noOfOpenings}</p>
                      </div>
                    )}
                    {job.workingDays && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Working Days</span>
                        <p className="text-sm font-medium text-gray-800">{job.workingDays}</p>
                      </div>
                    )}
                    {job.jobTiming && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Timing</span>
                        <p className="text-sm font-medium text-gray-800">{job.jobTiming}</p>
                      </div>
                    )}
                    {job.establishment && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Establishment</span>
                        <p className="text-sm font-medium text-gray-800">{job.establishment}</p>
                      </div>
                    )}
                  </div>

                  {/* Skills, Perks, Languages */}
                  {job.skills && job.skills.length > 0 && (
                    <div className="mb-3">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Skills</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {job.skills.map((skill, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {job.perks && job.perks.length > 0 && (
                    <div className="mb-3">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Perks</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {job.perks.map((perk, index) => (
                          <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                            {perk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {job.languagesPreferred && job.languagesPreferred.length > 0 && (
                    <div className="mb-3">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Languages</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {job.languagesPreferred.map((language, index) => (
                          <span key={index} className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                            {language}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {job.description && (
                    <div className="mb-4">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Description</span>
                      <div className="mt-1 bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-gray-800 text-sm">{job.description}</p>
                      </div>
                    </div>
                  )}

                  {/* Footer with dates */}
                  <div className="border-t border-gray-100 pt-3 mt-3">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Created: {formatDate(job.createdAt)}</span>
                      <span>Updated: {formatDate(job.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <Pagination />
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && <ConfirmationModal />}
    </div>
  );
};

MyJobs.getLayout = function PageLayout(page: React.ReactNode) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

const ProtectedDashboard: NextPageWithLayout = withClinicAuth(MyJobs);
ProtectedDashboard.getLayout = MyJobs.getLayout;

export default ProtectedDashboard;