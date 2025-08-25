import axios from "axios";
import { useEffect, useState } from "react";

export default function AdminJobs() {
  const [jobs, setJobs] = useState({ pending: [], approved: [], declined: [] });

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    axios
      .get("/api/admin/job-manage", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setJobs(res.data))
      .catch((err) => console.error(err));
  }, []);

  const deleteJob = (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;
    const token = localStorage.getItem("adminToken");

    axios
      .delete(`/api/admin/job-updateStatus?jobId=${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => window.location.reload())
      .catch((err) => console.error(err));
  };

  const updateStatus = (jobId: string, status: "approved" | "declined") => {
    const token = localStorage.getItem("adminToken");
    axios
      .patch(
        "/api/admin/job-updateStatus",
        { jobId, status },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => window.location.reload())
      .catch((err) => console.error(err));
  };

  const JobCard = ({ job, status }: { job: any; status: string }) => (
    <div className="border p-4 rounded-lg shadow-sm mb-3">
      <h3 className="font-semibold">{job.jobTitle}</h3>
      <p className="text-sm text-gray-600">
        {job.companyName} • {job.location}
      </p>
      <p className="text-sm">Department: {job.department}</p>
      <p className="text-sm">Qualification: {job.qualification}</p>
      <p className="text-sm">Type: {job.jobType}</p>
      <p className="text-sm">Salary: {job.salary}</p>

      {/* Action Buttons */}
      <div className="mt-2 space-x-2">
        {status === "pending" && (
          <>
            <button
              onClick={() => updateStatus(job._id, "approved")}
              className="px-3 py-1 bg-green-600 text-white rounded"
            >
              Approve
            </button>
            <button
              onClick={() => updateStatus(job._id, "declined")}
              className="px-3 py-1 bg-yellow-600 text-white rounded"
            >
              Decline
            </button>
            <button
              onClick={() => deleteJob(job._id)}
              className="px-3 py-1 bg-red-600 text-white rounded"
            >
              Delete
            </button>
          </>
        )}

        {status === "approved" && (
          <>
            <button
              onClick={() => updateStatus(job._id, "declined")}
              className="px-3 py-1 bg-yellow-600 text-white rounded"
            >
              Decline
            </button>
            <button
              onClick={() => deleteJob(job._id)}
              className="px-3 py-1 bg-red-600 text-white rounded"
            >
              Delete
            </button>
          </>
        )}

        {status === "declined" && (
          <>
            <button
              onClick={() => updateStatus(job._id, "approved")}
              className="px-3 py-1 bg-green-600 text-white rounded"
            >
              Approve
            </button>
            <button
              onClick={() => deleteJob(job._id)}
              className="px-3 py-1 bg-red-600 text-white rounded"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Pending Section */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">🕒 Pending Jobs</h2>
        {jobs.pending.length > 0 ? (
          jobs.pending.map((job) => (
            <JobCard key={job._id} job={job} status="pending" />
          ))
        ) : (
          <p className="text-gray-500">No pending jobs.</p>
        )}
      </section>

      {/* Approved Section */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">✅ Approved Jobs</h2>
        {jobs.approved.length > 0 ? (
          jobs.approved.map((job) => (
            <JobCard key={job._id} job={job} status="approved" />
          ))
        ) : (
          <p className="text-gray-500">No approved jobs.</p>
        )}
      </section>

      {/* Declined Section */}
      <section>
        <h2 className="text-xl font-bold mb-4">❌ Declined Jobs</h2>
        {jobs.declined.length > 0 ? (
          jobs.declined.map((job) => (
            <JobCard key={job._id} job={job} status="declined" />
          ))
        ) : (
          <p className="text-gray-500">No declined jobs.</p>
        )}
      </section>
    </div>
  );
}
