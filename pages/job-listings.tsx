import React, { useEffect, useState, ChangeEvent } from "react";
import axios from "axios";
import Link from "next/link";
import { Search, Filter, MapPin, DollarSign, Clock, Building, Users, X, ChevronLeft, ChevronRight } from "lucide-react";

interface Job {
  _id: string;
  companyName: string;
  location: string;
  salary: string;
  role: string;
  createdAt: string;
}

interface Filters {
  location: string;
  jobType: string;
  department: string;
  skills: string;
  salary: string;
  time: string;
  minSalary: string;
  maxSalary: string;
  experience: string;
  remote: string;
  companySize: string;
}

const AllJobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [filters, setFilters] = useState<Filters>({
    location: "",
    jobType: "",
    department: "",
    skills: "",
    salary: "",
    time: "",
    minSalary: "",
    maxSalary: "",
    experience: "",
    remote: "",
    companySize: ""
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const jobsPerPage = 20;

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.append(k, v);
      });
      if (searchTerm) params.append('search', searchTerm);

      const res = await axios.get<{ jobs: Job[] }>(
        `/api/job-postings/all?${params.toString()}`
      );
      setAllJobs(res.data.jobs);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [filters, searchTerm]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * jobsPerPage;
    const endIndex = startIndex + jobsPerPage;
    setJobs(allJobs.slice(startIndex, endIndex));
  }, [allJobs, currentPage]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearFilters = () => {
    setFilters({
      location: "",
      jobType: "",
      department: "",
      skills: "",
      salary: "",
      time: "",
      minSalary: "",
      maxSalary: "",
      experience: "",
      remote: "",
      companySize: ""
    });
    setSearchTerm("");
  };

  const totalPages = Math.ceil(allJobs.length / jobsPerPage);

  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const formatSalary = (salary: string) => {
    if (!salary) return "Not specified";
    return salary.includes("$") ? salary : `$${salary}`;
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Discover Your Dream Job with Zeva</h1>
              <p className="text-gray-600 mt-1">Discover opportunities that match your skills and aspirations</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="bg-[#2D9AA5] text-white px-3 py-1 rounded-full">
                {allJobs.length} jobs found
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-6">
              {/* Search Bar */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Jobs
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Job title, company, or keywords"
                    className="text-black w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Basic Filters */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline w-4 h-4 mr-1" />
                    Location
                  </label>
                  <input
                    name="location"
                    value={filters.location}
                    onChange={handleChange}
                    placeholder="City, state, or remote"
                    className="text-black w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline w-4 h-4 mr-1" />
                    Job Type
                  </label>
                  <select
                    name="jobType"
                    value={filters.jobType}
                    onChange={handleChange}
                    className="text-black w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    <option value="Full Time">Full Time</option>
                    <option value="Part Time">Part Time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building className="inline w-4 h-4 mr-1" />
                    Department
                  </label>
                  <select
                    name="department"
                    value={filters.department}
                    onChange={handleChange}
                    className="text-black w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-transparent"
                  >
                    <option value="">All Departments</option>
                    <option value="Dental">Dental</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Radiology">Radiology</option>
                    <option value="Software">Software</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="HR">Human Resources</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Posted
                  </label>
                  <select
                    name="time"
                    value={filters.time}
                    onChange={handleChange}
                    className="text-black w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-transparent"
                  >
                    <option value="">Anytime</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="3months">Last 3 Months</option>
                  </select>
                </div>
              </div>

              {/* Advanced Filters Toggle */}
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2 text-[#2D9AA5] hover:text-[#247a83] font-medium mb-4 w-full"
              >
                <Filter className="w-4 h-4" />
                More Filters
                <span className="ml-auto">
                  {showAdvancedFilters ? "−" : "+"}
                </span>
              </button>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="space-y-4 border-t pt-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Min Salary
                      </label>
                      <input
                        name="minSalary"
                        value={filters.minSalary}
                        onChange={handleChange}
                        placeholder="$0"
                        className="text-black w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#2D9AA5] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Max Salary
                      </label>
                      <input
                        name="maxSalary"
                        value={filters.maxSalary}
                        onChange={handleChange}
                        placeholder="$200k+"
                        className="text-black w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#2D9AA5] focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Experience Level
                    </label>
                    <select
                      name="experience"
                      value={filters.experience}
                      onChange={handleChange}
                      className="text-black w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-transparent"
                    >
                      <option value="">Any Level</option>
                      <option value="Entry Level">Entry Level</option>
                      <option value="Mid Level">Mid Level</option>
                      <option value="Senior Level">Senior Level</option>
                      <option value="Executive">Executive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Skills & Keywords
                    </label>
                    <input
                      name="skills"
                      value={filters.skills}
                      onChange={handleChange}
                      placeholder="React, Python, Marketing..."
                      className="text-black w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Clear Filters */}
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm mt-4 w-full justify-center py-2 border border-red-200 rounded-lg hover:bg-red-50"
              >
                <X className="w-4 h-4" />
                Clear All Filters
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D9AA5]"></div>
              </div>
            )}

            {/* Jobs List */}
            {!loading && (
              <>
                {jobs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                    <p className="text-gray-500 mb-4">Try adjusting your search criteria or filters</p>
                    <button
                      onClick={clearFilters}
                      className="text-[#2D9AA5] hover:text-[#247a83] font-medium"
                    >
                      Clear all filters
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {jobs.map((job) => (
                      <Link key={job._id} href={`/job-details/${job._id}`} className="block group">
                        <div className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 p-6 hover:border-[#2D9AA5]">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-start gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-[#2D9AA5] to-[#247a83] rounded-lg flex items-center justify-center text-white font-semibold text-lg">
                                  {job.companyName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-[#2D9AA5] transition-colors mb-1">
                                    {job.role}
                                  </h3>
                                  <p className="text-[#2D9AA5] font-medium mb-2">{job.companyName}</p>
                                  
                                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-4 h-4" />
                                      {job.location}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <DollarSign className="w-4 h-4" />
                                      {formatSalary(job.salary)}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      {getTimeAgo(job.createdAt)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col sm:items-end gap-2">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <span>View Details</span>
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((pageNumber, index) => (
                        <button
                          key={index}
                          onClick={() => typeof pageNumber === 'number' && setCurrentPage(pageNumber)}
                          disabled={pageNumber === "..."}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            pageNumber === currentPage
                              ? 'bg-[#2D9AA5] text-white'
                              : pageNumber === "..."
                              ? 'text-gray-400 cursor-default'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Results Info */}
                {allJobs.length > 0 && (
                  <div className="text-center text-sm text-gray-500 mt-4">
                    Showing {((currentPage - 1) * jobsPerPage) + 1} to {Math.min(currentPage * jobsPerPage, allJobs.length)} of {allJobs.length} jobs
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllJobs;