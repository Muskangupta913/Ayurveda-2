// components/ApplicationsDashboard.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface JobInfo {
  jobTitle: string;
  location: string;
  jobType: string;
}

interface ApplicantInfo {
  name: string;
  email: string;
  phone: string;
  role: string;
}

interface Application {
  _id: string;
  jobId: JobInfo;
  applicantId: ApplicantInfo;
  status: string;
  resumeUrl?: string;  // ✅ add resumeUrl here
}

type FilterType = 'All' | 'Part Time' | 'Full Time' | 'Internship';

interface ApplicationsDashboardProps {
  tokenKey?: string; // Default: "clinicToken"
  apiEndpoint?: string; // Default: "/api/job-postings/job-applications"
  updateStatusEndpoint?: string; // Default: "/api/job-postings/application-status"
  deleteEndpoint?: string; // Default: "/api/job-postings/delete-application"
}

const ApplicationsDashboard: React.FC<ApplicationsDashboardProps> = ({
  tokenKey = "clinicToken",
  apiEndpoint = "/api/job-postings/job-applications",
  updateStatusEndpoint = "/api/job-postings/application-status",
  deleteEndpoint = "/api/job-postings/delete-application"
}) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filter, setFilter] = useState<FilterType>('All');
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [applicationToDelete, setApplicationToDelete] = useState<Application | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      const token = localStorage.getItem(tokenKey);

      try {
        setLoading(true);
        setError(null);
        
        const res = await axios.get(apiEndpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setApplications(res.data.applications);
      } catch (error) {
        console.error("Failed to load applications", error);
        setError("Failed to load applications. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [tokenKey, apiEndpoint]);

  const updateStatus = async (applicationId: string, status: string): Promise<void> => {
    const token = localStorage.getItem(tokenKey);

    try {
      await axios.put(updateStatusEndpoint, {
        applicationId,
        status
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setApplications((prev) =>
        prev.map((app) =>
          app._id === applicationId ? { ...app, status } : app
        )
      );
    } catch (error) {
      console.error("Status update failed", error);
      setError("Failed to update status. Please try again.");
    }
  };

  const deleteApplication = async (applicationId: string): Promise<void> => {
    const token = localStorage.getItem(tokenKey);

    try {
      await axios.delete(`${deleteEndpoint}/${applicationId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setApplications(prev => prev.filter(app => app._id !== applicationId));
      setShowDeleteModal(false);
      setApplicationToDelete(null);
    } catch (error) {
      console.error("Failed to delete application", error);
      setError("Failed to delete application. Please try again.");
    }
  };

  const handleDeleteClick = (app: Application): void => {
    setApplicationToDelete(app);
    setShowDeleteModal(true);
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'All') return true;
    return app.jobId?.jobType === filter;
  });

  const filterOptions: FilterType[] = ['All', 'Part Time', 'Full Time', 'Internship'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2D9AA5]"></div>
            <span className="ml-2 text-gray-600">Loading applications...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Applications</h2>
          <p className="text-gray-600">{applications.length} total applications</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === type
                    ? 'bg-[#2D9AA5] text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Applications */}
        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-500">
              {filter === 'All' ? 'No applications yet.' : `No ${filter} applications found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((app) => (
              <div key={app._id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Left: Job & Applicant Info */}
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{app.jobId?.jobTitle}</h3>
                        <p className="text-gray-600 text-sm mt-1">
                          {app.jobId?.location} • {app.jobId?.jobType}
                        </p>
                      </div>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 sm:mt-0 ${
                        app.status === 'contacted' ? 'bg-green-100 text-green-800' :
                        app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {app.status || "Pending"}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Applicant:</span>
                        <span className="ml-2 font-medium text-gray-900">{app.applicantId?.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Role:</span>
                        <span className="ml-2 text-gray-900">{app.applicantId?.role}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <a href={`mailto:${app.applicantId?.email}`} className="ml-2 text-[#2D9AA5] hover:underline">
                          {app.applicantId?.email}
                        </a>
                      </div>
                      <div>
                        <span className="text-gray-500">Phone:</span>
                        <a href={`tel:${app.applicantId?.phone}`} className="ml-2 text-[#2D9AA5] hover:underline">
                          {app.applicantId?.phone}
                        </a>
                      </div>

                      {/* ✅ Resume link */}
                      {app.resumeUrl && (
                        <div className="col-span-2">
                          <span className="text-gray-500">Resume:</span>
                          <a
                            href={app.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-[#2D9AA5] hover:underline"
                          >
                            View Resume
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-row lg:flex-col gap-2 lg:min-w-[140px]">
                    <button
                      className="px-4 py-2 bg-[#2D9AA5] hover:bg-[#247a84] text-white rounded-lg text-sm font-medium transition-colors flex-1 lg:flex-none"
                      onClick={() => updateStatus(app._id, "contacted")}
                    >
                      Contact
                    </button>
                    <button
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors flex-1 lg:flex-none"
                      onClick={() => updateStatus(app._id, "rejected")}
                    >
                      Reject
                    </button>
                    <button
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors flex-1 lg:flex-none"
                      onClick={() => handleDeleteClick(app)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Confirm Delete</h3>
            <p className="text-gray-600 mb-4">
              Delete application from <strong>{applicationToDelete?.applicantId?.name}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                onClick={() => applicationToDelete && deleteApplication(applicationToDelete._id)}
              >
                Delete
              </button>
              <button
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium transition-colors"
                onClick={() => {
                  setShowDeleteModal(false);
                  setApplicationToDelete(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationsDashboard;
