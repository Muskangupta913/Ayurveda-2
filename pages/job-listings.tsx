import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

const AllJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({
    location: "",
    jobType: "",
    department: "",
    skills: "",
    salary: "",
    time: ""
  });


   const fetchJobs = async () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
    const res = await axios.get(`/api/job-postings/all?${params.toString()}`);
    setJobs(res.data.jobs);
  };

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Job Listings</h2>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <input name="location" onChange={handleChange} placeholder="Location" className="border p-2 rounded" />
        <select name="jobType" onChange={handleChange} className="border p-2 rounded">
          <option value="">Job Type</option>
          <option>Full Time</option>
          <option>Part Time</option>
          <option>Internship</option>
        </select>
        <select name="department" onChange={handleChange} className="border p-2 rounded">
          <option value="">Department</option>
          <option>Dental</option>
          <option>Cardiology</option>
          <option>Radiology</option>
          <option>Software</option>
        </select>
        <input name="skills" onChange={handleChange} placeholder="Skills (comma separated)" className="border p-2 rounded" />
        <input name="salary" onChange={handleChange} placeholder="Salary" className="border p-2 rounded" />
        <select name="time" onChange={handleChange} className="border p-2 rounded">
          <option value="">Posted Anytime</option>
          <option value="week">Last 7 Days</option>
        </select>
      </div>

      {/* Jobs List */}
       {jobs.length === 0 && <p>No jobs found</p>}
      {jobs.map(job => (
         <Link key={job._id} href={`/job-details/${job._id}`} className="block">
            <div className="border p-4 rounded shadow mb-4 hover:bg-gray-50">
              <h3 className="text-xl font-semibold">{job.companyName}</h3>
              <p className="text-gray-700">{job.location} • {job.salary} • {job.role}</p>
              <p className="text-gray-500 text-sm">Posted {new Date(job.createdAt).toLocaleDateString()}</p>
            </div>
        </Link>
      ))}
    </div>
  );
};

export default AllJobs;