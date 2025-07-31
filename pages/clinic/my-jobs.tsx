import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MyJobs = () => {
  const [jobs, setJobs] = useState([]);

  const fetchJobs = async () => {
    const token = localStorage.getItem('clinicToken');
    const res = await axios.get('/api/job-postings/my-jobs', {
      headers: { Authorization: `Bearer ${token}` },
    });
    setJobs(res.data.jobs);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const toggleJob = async (jobId, currentStatus) => {
    const token = localStorage.getItem('clinicToken');
    await axios.patch('/api/job-postings/toggle', {
      jobId,
      isActive: !currentStatus,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchJobs();
  };
  const deleteJob = async (jobId) => {
  const token = localStorage.getItem('clinicToken');
  if (!window.confirm("Are you sure you want to delete this job permanently?")) return;

  await axios.delete(`/api/job-postings/delete?jobId=${jobId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  fetchJobs(); // Refresh list
};


  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">My Job Posts</h2>
      {jobs.map(job => (
        <div key={job._id} className="border p-4 rounded mb-3 shadow">
          <h3 className="text-lg font-semibold">{job.jobTitle} ({job.companyName})</h3>
          <p className="text-sm text-gray-600">Status: {job.isActive ? 'Active' : 'Inactive'}</p>
          <button
            onClick={() => toggleJob(job._id, job.isActive)}
            className={`mt-2 px-4 py-1 rounded ${
              job.isActive ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
            }`}
          >
            {job.isActive ? 'Turn Off' : 'Turn On'}
          </button>
          <button
      onClick={() => deleteJob(job._id)}
      className="px-4 py-1 rounded bg-gray-700 text-white"
    >
      Delete
    </button>
        </div>
      ))}
    </div>
  );
};

export default MyJobs;
