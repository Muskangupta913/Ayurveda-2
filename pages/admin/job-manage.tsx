import axios from "axios";
import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";

import AdminLayout from "../../components/AdminLayout";
import withAdminAuth from "../../components/withAdminAuth";
import type { NextPageWithLayout } from "../_app";
import { Building2, MapPin, DollarSign, Clock, Users, Calendar, CheckCircle, XCircle, Trash2, X } from "lucide-react";
import { useAgentPermissions } from "../../hooks/useAgentPermissions";


// Define a Job interface
interface Job {
  _id: string;
  jobTitle: string;
  companyName: string;
  location: string;
  department: string;
  qualification: string;
  jobType: string;
  salary?: string;
  salaryType?: string;
  postedBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  workingDays?: string;
  jobTiming?: string;
  skills?: string[];
  perks?: string[];
  languagesPreferred?: string[];
  description?: string;
  noOfOpenings?: number;
  establishment?: string;
  experience?: string;
  status?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface JobsData {
  pending: Job[];
  approved: Job[];
  declined: Job[];
}

interface Filters {
  search: string;
  jobType: string;
  location: string;
  salaryMin: string;
  salaryMax: string;
  department: string;
}

interface ConfirmationModal {
  isOpen: boolean;
  type: 'approve' | 'decline' | 'delete' | null;
  jobId: string;
  jobTitle: string;
}

const JOBS_PER_PAGE = 15;

function AdminJobs() {
  const router = useRouter();
  
  const [jobs, setJobs] = useState<JobsData>({
    pending: [],
    approved: [],
    declined: [],
  });

  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "declined">("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    jobType: "",
    location: "",
    salaryMin: "",
    salaryMax: "",
    department: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModal>({
    isOpen: false,
    type: null,
    jobId: '',
    jobTitle: '',
  });
  
  // Check if user is an admin or agent - use state to ensure reactivity
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAgent, setIsAgent] = useState<boolean>(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const adminToken = !!localStorage.getItem('adminToken');
      const agentToken = !!localStorage.getItem('agentToken');
      const isAgentRoute = router.pathname?.startsWith('/agent/') || window.location.pathname?.startsWith('/agent/');
      
      console.log('Job Manage - Initial Token Check:', { 
        adminToken, 
        agentToken, 
        isAgentRoute,
        pathname: router.pathname,
        locationPath: window.location.pathname
      });
      
      // CRITICAL: If on agent route, prioritize agentToken over adminToken
      if (isAgentRoute && agentToken) {
        setIsAdmin(false);
        setIsAgent(true);
      } else if (adminToken) {
        setIsAdmin(true);
        setIsAgent(false);
      } else if (agentToken) {
        setIsAdmin(false);
        setIsAgent(true);
      } else {
        setIsAdmin(false);
        setIsAgent(false);
      }
    }
  }, [router.pathname]);
  
  // Always call the hook (React rules), but only use it if isAgent is true
  const agentPermissionsData: any = useAgentPermissions(isAgent ? "admin_manage_job" : (null as any));
  const agentPermissions = isAgent ? agentPermissionsData?.permissions : null;
  const permissionsLoading = isAgent ? agentPermissionsData?.loading : false;

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
        const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
        const token = adminToken || agentToken;
        
        if (!token) {
          setIsLoading(false);
          return;
        }
        
        setIsLoading(true);
        const res = await axios.get<JobsData>("/api/admin/job-manage", {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(err => {
          // If 403 (permission denied), return empty data
          if (err.response?.status === 403) {
            return { data: { pending: [], approved: [], declined: [] } };
          }
          throw err;
        });
        
        setJobs(res.data || { pending: [], approved: [], declined: [] });
      } catch (error: any) {
        console.error('Failed to fetch jobs:', error);
        // If permission denied, set empty arrays
        if (error.response?.status === 403) {
          setJobs({ pending: [], approved: [], declined: [] });
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch jobs immediately for admins
    // For agents: only fetch if read permission is granted
    if (isAdmin) {
      fetchJobs();
    } else if (isAgent) {
      if (!permissionsLoading) {
        // Check if agent has read permission
        if (agentPermissions && (agentPermissions.canRead === true || agentPermissions.canAll === true)) {
          fetchJobs();
        } else {
          // Agent doesn't have read permission - stop loading
          setIsLoading(false);
        }
      }
      // If permissions are still loading, keep loading state true
    } else {
      // Neither admin nor agent - stop loading
      setIsLoading(false);
    }
  }, [isAdmin, isAgent, permissionsLoading, agentPermissions]);

  const deleteJob = (jobId: string) => {
    // CRITICAL: Check route and tokens to determine if user is admin or agent
    const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
    const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
    const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
    
    // Check permissions only for agents - admins bypass all checks
    if ((isAgentRoute || isAgent) && agentTokenExists && !adminTokenExists && agentPermissions && agentPermissions.canDelete !== true && agentPermissions.canAll !== true) {
      alert("You do not have permission to delete jobs");
      return;
    }
    
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
    const token = adminToken || agentToken;

    if (!token) {
      alert("No token found. Please login again.");
      return;
    }

    axios
      .delete(`/api/admin/job-updateStatus?jobId=${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => window.location.reload())
      .catch((err) => console.error(err));
  };

  const updateStatus = (jobId: string, status: "approved" | "declined") => {
    // CRITICAL: Check route and tokens to determine if user is admin or agent
    const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
    const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
    const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
    
    // Check permissions only for agents - admins bypass all checks
    if ((isAgentRoute || isAgent) && agentTokenExists && !adminTokenExists && agentPermissions && agentPermissions.canApprove !== true && agentPermissions.canAll !== true) {
      alert("You do not have permission to approve/decline jobs");
      return;
    }
    
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
    const token = adminToken || agentToken;

    if (!token) {
      alert("No token found. Please login again.");
      return;
    }
    
    axios
      .patch(
        "/api/admin/job-updateStatus",
        { jobId, status },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => window.location.reload())
      .catch((err) => console.error(err));
  };

  const openConfirmationModal = (type: 'approve' | 'decline' | 'delete', jobId: string, jobTitle: string) => {
    setConfirmationModal({
      isOpen: true,
      type,
      jobId,
      jobTitle,
    });
  };

  const closeConfirmationModal = () => {
    setConfirmationModal({
      isOpen: false,
      type: null,
      jobId: '',
      jobTitle: '',
    });
  };

  const handleConfirmAction = () => {
    const { type, jobId } = confirmationModal;

    if (type === 'delete') {
      deleteJob(jobId);
    } else if (type === 'approve') {
      updateStatus(jobId, 'approved');
    } else if (type === 'decline') {
      updateStatus(jobId, 'declined');
    }

    closeConfirmationModal();
  };

  // Extract unique values for filter options
  const filterOptions = useMemo(() => {
    const allJobs = [...jobs.pending, ...jobs.approved, ...jobs.declined];

    return {
      jobTypes: [...new Set(allJobs.map(job => job.jobType))].filter(Boolean),
      locations: [...new Set(allJobs.map(job => job.location))].filter(Boolean),
      departments: [...new Set(allJobs.map(job => job.department))].filter(Boolean),
    };
  }, [jobs]);

  // Filter and search logic
  const filteredJobs = useMemo(() => {
    const currentJobs = jobs[activeTab];

    return currentJobs.filter(job => {
      const matchesSearch = !filters.search ||
        job.jobTitle.toLowerCase().includes(filters.search.toLowerCase()) ||
        job.companyName.toLowerCase().includes(filters.search.toLowerCase()) ||
        job.department.toLowerCase().includes(filters.search.toLowerCase());

      const matchesJobType = !filters.jobType || job.jobType === filters.jobType;
      const matchesLocation = !filters.location || job.location === filters.location;
      const matchesDepartment = !filters.department || job.department === filters.department;

      // Basic salary filtering (assuming salary is a string like "50000" or "50k-80k")
      const matchesSalary = () => {
        if (!filters.salaryMin && !filters.salaryMax) return true;

        const salaryStr = job.salary?.toLowerCase().replace(/[^0-9.-]/g, '') ?? '';
        const salaryNum = parseInt(salaryStr) || 0;


        const minSalary = filters.salaryMin ? parseInt(filters.salaryMin) : 0;
        const maxSalary = filters.salaryMax ? parseInt(filters.salaryMax) : Infinity;

        return salaryNum >= minSalary && salaryNum <= maxSalary;
      };

      return matchesSearch && matchesJobType && matchesLocation && matchesDepartment && matchesSalary();
    });
  }, [jobs, activeTab, filters]);

  // Pagination logic
  const totalPages = Math.ceil(filteredJobs.length / JOBS_PER_PAGE);
  const startIndex = (currentPage - 1) * JOBS_PER_PAGE;
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + JOBS_PER_PAGE);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, activeTab]);

  const handleFilterChange = (key: keyof Filters, value: string | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value || "" }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      jobType: "",
      location: "",
      salaryMin: "",
      salaryMax: "",
      department: "",
    });
  };

  const getTabCount = (status: keyof JobsData) => {
    if (status === activeTab) {
      return filteredJobs.length;
    }
    return jobs[status].length;
  };

  // Check if agent has read permission
  const hasReadPermission = isAdmin || (isAgent && agentPermissions && (agentPermissions.canRead === true || agentPermissions.canAll === true));

  if (isLoading || (isAgent && permissionsLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-[#2D9AA5] rounded-full animate-pulse"></div>
          <div className="w-6 h-6 bg-[#2D9AA5] rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-6 h-6 bg-[#2D9AA5] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    );
  }

  // Show permission denied message if agent doesn't have read permission
  if (isAgent && !hasReadPermission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You do not have permission to view job management. Please contact your administrator to request access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Management</h1>
          <p className="text-gray-600">Manage and review job listings across different statuses</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8 border-b border-gray-200">
            {(['pending', 'approved', 'declined'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors duration-200 ${activeTab === tab
                  ? 'border-[#2D9AA5] text-[#2D9AA5]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab} ({getTabCount(tab)})
              </button>
            ))}
          </nav>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 lg:mb-0">Filters & Search</h3>
            <button
              onClick={clearFilters}
              className="text-[#2D9AA5] hover:text-[#2D9AA5]/80 text-sm font-medium transition-colors duration-200"
            >
              Clear all filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Job title, company, department..."
                className="text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D9AA5] focus:border-transparent"
              />
            </div>

            {/* Job Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
              <select
                value={filters.jobType}
                onChange={(e) => handleFilterChange('jobType', e.target.value)}
                className="text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D9AA5] focus:border-transparent"
              >
                <option value="">All Types</option>
                {filterOptions.jobTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <select
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D9AA5] focus:border-transparent"
              >
                <option value="">All Locations</option>
                {filterOptions.locations.map((location) => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                className="text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D9AA5] focus:border-transparent"
              >
                <option value="">All Departments</option>
                {filterOptions.departments.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
            </div>

            {/* Salary Range */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Salary Range</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={filters.salaryMin}
                  onChange={(e) => handleFilterChange('salaryMin', e.target.value)}
                  placeholder="Min salary"
                  className="text-gray-900 flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D9AA5] focus:border-transparent"
                />
                <span className="flex items-center text-gray-500">to</span>
                <input
                  type="number"
                  value={filters.salaryMax}
                  onChange={(e) => handleFilterChange('salaryMax', e.target.value)}
                  placeholder="Max salary"
                  className="text-gray-900 flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D9AA5] focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-4">
          <p className="text-gray-600">
            Showing {filteredJobs.length} {activeTab} job{filteredJobs.length !== 1 ? 's' : ''}
            {Object.values(filters).some(filter => filter) && ' (filtered)'}
          </p>
        </div>

        {/* Job Cards */}
        <div className="space-y-8 mb-8">
          {paginatedJobs.length > 0 ? (
            paginatedJobs.map((job) => (
              <div key={job._id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{job.jobTitle}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          <span className="font-medium">{job.companyName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{job.location}</span>
                        </div>
                      </div>
                    </div>
                    {job.postedBy && (
                      <div className="text-right text-xs text-gray-500">
                        <div className="font-medium">Posted by</div>
                        <div className="text-gray-700">{job.postedBy.name}</div>
                        <div className="text-gray-500">{job.postedBy.role}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Main Content */}
                <div className="p-6">
                  {/* Key Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-medium">SALARY</div>
                        <div className="font-semibold text-green-600">{job.salary} {job.salaryType && `/ ${job.salaryType}`}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Clock className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-medium">TYPE</div>
                        <div className="font-semibold text-blue-600">{job.jobType}</div>
                      </div>
                    </div>

                    {job.noOfOpenings !== undefined && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 font-medium">OPENINGS</div>
                          <div className="font-semibold text-purple-600">{job.noOfOpenings}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Detailed Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 mb-6">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-500">Department</span>
                      <span className="text-sm text-gray-900">{job.department}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-500">Qualification</span>
                      <span className="text-sm text-gray-900">{job.qualification}</span>
                    </div>
                    {job.workingDays && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-500">Working Days</span>
                        <span className="text-sm text-gray-900">{job.workingDays}</span>
                      </div>
                    )}
                    {job.jobTiming && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-500">Timing</span>
                        <span className="text-sm text-gray-900">{job.jobTiming}</span>
                      </div>
                    )}
                    {job.experience && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-500">Experience</span>
                        <span className="text-sm text-gray-900">{job.experience}</span>
                      </div>
                    )}
                    {job.establishment && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-500">Established</span>
                        <span className="text-sm text-gray-900">{job.establishment}</span>
                      </div>
                    )}
                    {job.status && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-500">Status</span>
                        <span className={`text-sm px-2 py-1 rounded-full text-xs font-medium ${job.status === 'approved' ? 'bg-green-100 text-green-800' :
                            job.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                          }`}>
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </span>
                      </div>
                    )}
                    {job.isActive !== undefined && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-500">Active</span>
                        <span className={`text-sm font-medium ${job.isActive ? 'text-green-600' : 'text-red-600'}`}>{job.isActive ? 'Yes' : 'No'}</span>
                      </div>
                    )}
                  </div>

                  {/* Skills, Perks, Languages */}
                  {(job.skills?.length || 0) > 0 || (job.perks?.length || 0) > 0 || (job.languagesPreferred?.length || 0) > 0 ? (
                    <div className="space-y-4 mb-6">
                      {(job.skills?.length || 0) > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Skills Required</h4>
                          <div className="flex flex-wrap gap-2">
                            {(job.skills || []).map((skill, index) => (
                              <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">{skill}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {(job.perks?.length || 0) > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Perks & Benefits</h4>
                          <div className="flex flex-wrap gap-2">
                            {(job.perks || []).map((perk, index) => (
                              <span key={index} className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">{perk}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {(job.languagesPreferred?.length || 0) > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Languages Preferred</h4>
                          <div className="flex flex-wrap gap-2">
                            {(job.languagesPreferred || []).map((language, index) => (
                              <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">{language}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* Description */}
                  {job.description && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Job Description</h4>
                      <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg leading-relaxed">{job.description}</div>
                    </div>
                  )}
                </div>

                {/* Footer with Actions and Timestamps */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                    {/* Timestamps */}
                    <div className="text-xs text-gray-500 space-y-1">
                      {job.createdAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Created: {new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>
                      )}
                      {job.updatedAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Updated: {new Date(job.updatedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                      {job.postedBy?.email && (
                        <div className="text-gray-500">Contact: {job.postedBy.email}</div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
                        const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
                        const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
                        
                        // Helper function to check if action should be shown
                        const shouldShowAction = (action: 'approve' | 'decline' | 'delete') => {
                          // Admin always sees all actions - but ONLY if NOT on agent route
                          if (!isAgentRoute && adminTokenExists && isAdmin) {
                            return true;
                          }
                          
                          // For agents: Check permissions
                          if ((isAgentRoute || isAgent) && agentTokenExists) {
                            if (permissionsLoading || !agentPermissions) {
                              return false;
                            }
                            
                            if (action === 'approve' || action === 'decline') {
                              return agentPermissions.canApprove === true || agentPermissions.canAll === true;
                            }
                            if (action === 'delete') {
                              return agentPermissions.canDelete === true || agentPermissions.canAll === true;
                            }
                          }
                          
                          return false;
                        };
                        
                        return (
                          <>
                            {activeTab === "pending" && (
                              <>
                                {shouldShowAction('approve') && (
                                  <button
                                    onClick={() => openConfirmationModal('approve', job._id, job.jobTitle)}
                                    className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 gap-2"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Approve
                                  </button>
                                )}
                                {shouldShowAction('decline') && (
                                  <button
                                    onClick={() => openConfirmationModal('decline', job._id, job.jobTitle)}
                                    className="inline-flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 gap-2"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Decline
                                  </button>
                                )}
                                {shouldShowAction('delete') && (
                                  <button
                                    onClick={() => openConfirmationModal('delete', job._id, job.jobTitle)}
                                    className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 gap-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                  </button>
                                )}
                              </>
                            )}
                            {activeTab === "approved" && (
                              <>
                                {shouldShowAction('decline') && (
                                  <button
                                    onClick={() => openConfirmationModal('decline', job._id, job.jobTitle)}
                                    className="inline-flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 gap-2"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Decline
                                  </button>
                                )}
                                {shouldShowAction('delete') && (
                                  <button
                                    onClick={() => openConfirmationModal('delete', job._id, job.jobTitle)}
                                    className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 gap-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                  </button>
                                )}
                              </>
                            )}
                            {activeTab === "declined" && (
                              <>
                                {shouldShowAction('approve') && (
                                  <button
                                    onClick={() => openConfirmationModal('approve', job._id, job.jobTitle)}
                                    className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 gap-2"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Approve
                                  </button>
                                )}
                                {shouldShowAction('delete') && (
                                  <button
                                    onClick={() => openConfirmationModal('delete', job._id, job.jobTitle)}
                                    className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 gap-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                  </button>
                                )}
                              </>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 opacity-20">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-500 mb-4">
                {Object.values(filters).some(filter => filter)
                  ? "Try adjusting your filters or search terms"
                  : `No ${activeTab} jobs available`}
              </p>
              {Object.values(filters).some(filter => filter) && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#2D9AA5] hover:bg-[#2D9AA5]/90 transition-colors duration-200"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(startIndex + JOBS_PER_PAGE, filteredJobs.length)}</span> of{' '}
                  <span className="font-medium">{filteredJobs.length}</span> results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {(() => {
                    const delta = 2;
                    const range = [];
                    const rangeWithDots = [];

                    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
                      range.push(i);
                    }

                    if (currentPage - delta > 2) {
                      rangeWithDots.push(1, '...');
                    } else {
                      rangeWithDots.push(1);
                    }

                    rangeWithDots.push(...range);

                    if (currentPage + delta < totalPages - 1) {
                      rangeWithDots.push('...', totalPages);
                    } else {
                      rangeWithDots.push(totalPages);
                    }

                    return rangeWithDots.map((pageNum, index) => (
                      <React.Fragment key={index}>
                        {pageNum === '...' ? (
                          <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                            ...
                          </span>
                        ) : (
                          <button
                            onClick={() => setCurrentPage(pageNum as number)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage === pageNum
                              ? 'z-10 bg-[#2D9AA5] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D9AA5]'
                              : 'text-gray-900'
                              }`}
                          >
                            {pageNum}
                          </button>
                        )}
                      </React.Fragment>
                    ));
                  })()}

                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmationModal.isOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              {/* Enhanced Background overlay with blur */}
              <div
                className="fixed inset-0 bg-black/40 backdrop-blur-md transition-all duration-300 ease-out"
                aria-hidden="true"
                onClick={closeConfirmationModal}
              ></div>

              {/* Center modal */}
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              {/* Enhanced Modal panel */}
              <div className="relative inline-block align-bottom bg-white/95 backdrop-blur-xl rounded-2xl px-6 pt-6 pb-5 text-left overflow-hidden shadow-2xl transform transition-all duration-300 ease-out sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-8 border border-white/20">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    {/* Enhanced Icon with glow effect */}
                    <div className="mb-6">
                      {confirmationModal.type === 'approve' && (
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-green-200 shadow-lg ring-1 ring-green-200/50">
                          <svg className="h-7 w-7 text-green-600 drop-shadow-sm" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </div>
                      )}
                      {confirmationModal.type === 'decline' && (
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-yellow-200 shadow-lg ring-1 ring-yellow-200/50">
                          <svg className="h-7 w-7 text-amber-600 drop-shadow-sm" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                          </svg>
                        </div>
                      )}
                      {confirmationModal.type === 'delete' && (
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-rose-200 shadow-lg ring-1 ring-red-200/50">
                          <svg className="h-7 w-7 text-red-600 drop-shadow-sm" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Enhanced Title */}
                    <h3 className="text-xl leading-7 font-semibold text-gray-900 mb-3 text-center tracking-tight" id="modal-title">
                      {confirmationModal.type === 'approve' && 'Approve Job Application'}
                      {confirmationModal.type === 'decline' && 'Decline Job Application'}
                      {confirmationModal.type === 'delete' && 'Delete Job Posting'}
                    </h3>

                    {/* Enhanced Message */}
                    <div className="mb-8">
                      <p className="text-base text-gray-600 text-center leading-relaxed">
                        {confirmationModal.type === 'approve' && (
                          <>
                            You&apos;re about to approve <span className="font-medium text-gray-800">&quot;{confirmationModal.jobTitle}&quot;</span>. This will notify the applicant and move the job forward in the process.
                          </>
                        )}
                        {confirmationModal.type === 'decline' && (
                          <>
                            You&apos;re about to decline <span className="font-medium text-gray-800">&quot;{confirmationModal.jobTitle}&quot;</span>. The applicant will be notified of this decision.
                          </>
                        )}
                        {confirmationModal.type === 'delete' && (
                          <>
                            You&apos;re about to permanently delete <span className="font-medium text-gray-800">&quot;{confirmationModal.jobTitle}&quot;</span>.
                            <span className="block mt-2 text-sm text-red-600 font-medium">This action cannot be undone and all associated data will be lost.</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Enhanced Action buttons */}
                <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 sm:justify-center">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center items-center rounded-xl border border-gray-200 shadow-sm px-6 py-3 bg-white/80 backdrop-blur-sm text-base font-medium text-gray-700 hover:bg-gray-50/90 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 sm:w-auto sm:text-sm transition-all duration-200 ease-out transform hover:scale-[1.02] active:scale-[0.98]"
                    onClick={closeConfirmationModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`w-full inline-flex justify-center items-center rounded-xl border border-transparent shadow-lg px-6 py-3 text-base font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto sm:text-sm transition-all duration-200 ease-out transform hover:scale-[1.02] active:scale-[0.98] ${confirmationModal.type === 'approve'
                      ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:ring-green-500 shadow-green-500/25' :
                      confirmationModal.type === 'decline'
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 focus:ring-amber-500 shadow-amber-500/25' :
                        'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 focus:ring-red-500 shadow-red-500/25'
                      }`}
                    onClick={handleConfirmAction}
                  >
                    <span className="drop-shadow-sm">
                      {confirmationModal.type === 'approve' && 'Approve Application'}
                      {confirmationModal.type === 'decline' && 'Decline Application'}
                      {confirmationModal.type === 'delete' && 'Delete Permanently'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

AdminJobs.getLayout = function PageLayout(page: React.ReactNode) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedDashboard: NextPageWithLayout = withAdminAuth(AdminJobs);
ProtectedDashboard.getLayout = AdminJobs.getLayout;

export default ProtectedDashboard;

