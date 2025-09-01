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
        <input
  name="location"
  onChange={handleChange}
  placeholder="Search by Location (e.g. Noida Sec 2)"
  className="border p-2 rounded"
/>
        <select name="jobType" onChange={handleChange} className="border p-2 rounded">
          <option value="">Job Type</option>
          <option>Full Time</option>
          <option>Part Time</option>
          <option>Internship</option>
        </select>
        <select name="department" onChange={handleChange} className="border p-2 rounded">
          <option value="">Select Department</option>
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
        <select name="experience" onChange={handleChange} className="border p-2 rounded">
  <option value="">Select Experience</option>
  <option value="fresher">Fresher</option>
  <option value="1-2">1-2 years</option>
  <option value="2-4">2-4 years</option>
  <option value="4-6">4-6 years</option>
  <option value="7+">7+ years</option>
</select>


        <input name="skills" onChange={handleChange} placeholder="Skills (comma separated)" className="border p-2 rounded" />
      <input
  name="salary"
  onChange={handleChange}
  placeholder="Enter salary (e.g. 20000)"
  className="border p-2 rounded"
/>
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