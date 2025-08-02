import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PosterDashboard = () => {
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    const fetchApplications = async () => {
      const token = localStorage.getItem("clinicToken");

      try {
        const res = await axios.get("/api/job-postings/job-applications", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setApplications(res.data.applications);
      } catch (error) {
        console.error("Failed to load applications", error);
      }
    };

    fetchApplications();
  }, []);

  const updateStatus = async (applicationId: string, status: string) => {
    const token = localStorage.getItem("clinicToken");

    try {
      await axios.put("/api/job-postings/application-status", {
        applicationId,
        status
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setApplications((prev) =>
        prev.map((app: any) =>
          app._id === applicationId ? { ...app, status } : app
        )
      );
    } catch (error) {
      console.error("Status update failed", error);
    }
  };

  const deleteApplication = async (applicationId: string) => {
    const token = localStorage.getItem("clinicToken");

    try {
      await axios.delete(`/api/job-postings/delete-application/${applicationId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setApplications(prev => prev.filter(app => app._id !== applicationId));
    } catch (error) {
      console.error("Failed to delete application", error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Job Applications</h2>

      {applications.length === 0 ? (
        <p>No applications yet.</p>
      ) : (
        <div className="grid gap-4">
          {applications.map((app: any) => (
            <div key={app._id} className="border p-4 rounded shadow">
              <h3 className="font-semibold text-lg">{app.jobId?.jobTitle}</h3>
              <p><strong>Location:</strong> {app.jobId?.location}</p>
              <p><strong>Job Type:</strong> {app.jobId?.jobType}</p>
              <hr className="my-2" />
              <p><strong>Applicant:</strong> {app.applicantId?.name}</p>
              <p><strong>Email:</strong> {app.applicantId?.email}</p>
              <p><strong>Phone:</strong> {app.applicantId?.phone}</p>
              <p><strong>Role:</strong> {app.applicantId?.role}</p>
              <p><strong>Status:</strong> {app.status || "Pending"}</p>

              <div className="flex gap-2 mt-3">
                <button
                  className="bg-green-600 text-white px-4 py-1 rounded"
                  onClick={() => updateStatus(app._id, "contacted")}
                >
                  Mark as Contacted
                </button>
                <button
                  className="bg-red-600 text-white px-4 py-1 rounded"
                  onClick={() => updateStatus(app._id, "rejected")}
                >
                  Mark as Rejected
                </button>
                <button
                  className="bg-gray-600 text-white px-4 py-1 rounded"
                  onClick={() => deleteApplication(app._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PosterDashboard;
