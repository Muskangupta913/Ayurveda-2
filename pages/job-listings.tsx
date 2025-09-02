import React, { useEffect, useState, ChangeEvent } from "react";
import axios from "axios";
import Link from "next/link";;

type Job = {
  _id: string;
  companyName: string;
  location: string;
  salary?: string;
  salaryType?: string;
  role: string;
  createdAt: string;
  jobType?: string;
  department?: string;
  experience?: string;
  jobTitle?: string;
};

type Filters = {
  location: string;
  jobType: string;
  department: string;
  skills: string;
  salary: string;
  time: string;
  experience?: string;
};

const AllJobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filters, setFilters] = useState<Filters>({
    location: "",
    jobType: "",
    department: "",
    skills: "",
    salary: "",
    time: "",
    experience: "",
  });

  const fetchJobs = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.append(k, v);
      });

      const res = await axios.get<{ jobs: Job[] }>(
        `/api/job-postings/all?${params.toString()}`
      );
      setJobs(res.data.jobs);
    } catch (err) {
      console.error("Error fetching jobs:", err);
    }
  };

  const formatPostedDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatSalary = (job: Job) => {
    if (job.salary) return `${job.salary} ${job.salaryType ? `/ ${job.salaryType}` : ""}`;
    if (job.salaryType) return `Not specified / ${job.salaryType}`;
    return "Not specified";
  };

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-800 mb-2">
            Find Your Dream Job With <span style={{ color: "#2D9AA5" }}>ZEVA</span>
          </h2>
          <p className="text-gray-600 text-lg">
            Discover opportunities that match your skills and aspirations
          </p>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🔍 Filter Jobs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <input
                name="location"
                onChange={handleChange}
                placeholder="📍 Location (e.g. Noida Sec 2)"
                className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] transition-all duration-200"
              />
            </div>

            {/* Job Type */}
            <div className="relative">
              <select
                name="jobType"
                onChange={handleChange}
                className="text-black w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] transition-all duration-200 appearance-none bg-white"
              >
                <option value="">💼 Job Type</option>
                <option>Full Time</option>
                <option>Part Time</option>
                <option>Internship</option>
              </select>
              <svg
                className="w-5 h-5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Department */}
            <div className="relative">
              <select
                name="department"
                onChange={handleChange}
                className="text-black w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] transition-all duration-200 appearance-none bg-white"
              >
                <option value="">🏢 Select Department</option>
                <option>Software Development</option>
                <option>Frontend</option>
                <option>Backend</option>
                <option>Full Stack</option>
                <option>DevOps</option>
                <option>QA & Testing</option>
                <option>Automation Testing</option>
                <option>Manual Testing</option>
                <option>UI/UX</option>
                <option>Data Science</option>
                <option>AI/ML</option>
                <option>Cloud Computing</option>
                <option>Cybersecurity</option>
                <option>Database Administration</option>
                <option>Product Management</option>
                <option>Business Analysis</option>
                <option>General Medicine</option>
                <option>Cardiology</option>
                <option>Radiology</option>
                <option>Dental</option>
                <option>Pathology</option>
                <option>Pediatrics</option>
                <option>Orthopedics</option>
                <option>Gynecology</option>
                <option>Dermatology</option>
                <option>Anesthesiology</option>
                <option>Surgery</option>
                <option>ENT</option>
                <option>Psychiatry</option>
                <option>Physiotherapy</option>
                <option>Administration</option>
                <option>Pharmacy</option>
                <option>Research</option>
                <option>Other</option>
              </select>
              <svg
                className="w-5 h-5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Experience */}
            <div className="relative">
              <select
                name="experience"
                onChange={handleChange}
                className="text-black w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] transition-all duration-200 appearance-none bg-white"
              >
                <option value="">👨‍💼 Select Experience</option>
                <option value="fresher">Fresher</option>
                <option value="1-2">1-2 years</option>
                <option value="2-4">2-4 years</option>
                <option value="4-6">4-6 years</option>
                <option value="7+">7+ years</option>
              </select>
              <svg
                className="w-5 h-5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            <div>
              <input
                name="skills"
                onChange={handleChange}
                placeholder="🔧 Skills (comma separated)"
                className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] transition-all duration-200"
              />
            </div>

            <div>
              <input
                name="salary"
                onChange={handleChange}
                placeholder="Min salary AED (e.g. 20000)"
                className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] transition-all duration-200"
              />
            </div>

            {/* Posted Time */}
            <div className="relative">
              <select
                name="time"
                onChange={handleChange}
                className="text-black w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] transition-all duration-200 appearance-none bg-white"
              >
                <option value="">📅 Posted Anytime</option>
                <option value="week">Last 7 Days</option>
              </select>
              <svg
                className="w-5 h-5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            <button className="col-span-1 bg-[#2D9AA5] hover:bg-[#238892] text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
              Search Jobs
            </button>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">
              {jobs.length > 0 ? `${jobs.length} Jobs Found` : "No Jobs Found"}
            </h3>
            <p className="text-gray-500">
              Find the perfect opportunity for your career
            </p>
          </div>
        </div>

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No jobs found
            </h3>
            <p className="text-gray-500">
              Try adjusting your filters or search criteria
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Link key={job._id} href={`/job-details/${job._id}`} className="block group">
                <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-xl hover:border-[#2D9AA5] transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 group-hover:text-[#2D9AA5] transition-colors duration-200">
                            {job.jobTitle}
                          </h3>
                          <p className="text-lg font-medium text-[#2D9AA5] mt-1">
                            {job.companyName}
                          </p>
                        </div>
                        <span className="text-white inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#2D9AA5] bg-opacity-10 text-[#2D9AA5] border border-[#2D9AA5] border-opacity-20">
                          {job.jobType || ""}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <span className="mr-1">📍</span>
                          {job.location}
                        </div>
                        <div className="flex items-center">
                          <span className="mr-1">💰</span>
                          {formatSalary(job)}
                        </div>
                        <div className="flex items-center">
                          <span className="mr-1">🕒</span>
                          Posted {formatPostedDate(job.createdAt)}
                        </div>
                      </div>

                      {job.department && (
                        <div className="flex items-center mb-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 mr-2">
                            <span className="mr-1">🏢</span>
                            {job.department}
                          </span>
                          {job.experience && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                              <span className="mr-1">👨‍💼</span>
                              {job.experience}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllJobs;
