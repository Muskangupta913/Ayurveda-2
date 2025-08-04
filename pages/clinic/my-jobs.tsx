import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ClinicLayout from "../../components/ClinicLayout";
import withClinicAuth from "../../components/withClinicAuth";
import type { NextPageWithLayout } from "../_app";

const MyJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

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

  const handleToggleJob = (jobId, currentStatus, jobTitle) => {
    setConfirmAction({
      type: 'toggle',
      jobId,
      currentStatus,
      jobTitle,
      action: currentStatus ? 'deactivate' : 'activate'
    });
    setShowConfirmModal(true);
  };

  const handleDeleteJob = (jobId, jobTitle) => {
    setConfirmAction({
      type: 'delete',
      jobId,
      jobTitle,
      action: 'delete'
    });
    setShowConfirmModal(true);
  };

  const executeAction = async () => {
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

  const cancelAction = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  // Confirmation Modal Component
  const ConfirmationModal = () => (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={cancelAction}
      />
      
      {/* Modal */}
      <div className="fixed inset-x-4 top-1/2 transform -translate-y-1/2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[400px] z-50">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          
          {/* Header */}
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

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-700 mb-4">
              Are you sure you want to <strong>{confirmAction?.action}</strong> the job posting:
            </p>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="font-semibold text-gray-900">{confirmAction?.jobTitle}</p>
            </div>
          </div>

          {/* Actions */}
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0V6a2 2 0 00-2 2v6.001" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Job Posts Yet</h3>
              <p className="text-gray-600 mb-6">Start by creating your first job posting to attract candidates.</p>
              <button className="bg-[#2D9AA5] text-white px-6 py-3 rounded-xl hover:bg-[#247a83] transition-colors font-medium">
                Create Your First Job
              </button>
            </div>
          ) : (
            jobs.map(job => (
              <div key={job._id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="p-4">
                  
                  {/* Job Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                        
                        {/* Job Details */}
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-600">
                          {job.department && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l7-3 7 3z" />
                              </svg>
                              {job.department}
                            </span>
                          )}
                          {job.jobType && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {job.jobType}
                            </span>
                          )}
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              {job.location}
                            </span>
                          )}
                        </div>
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
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && <ConfirmationModal />}
    </div>
  );
};

MyJobs.getLayout = function PageLayout(page: React.ReactNode) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

// ✅ Apply HOC and assign correct type
const ProtectedDashboard: NextPageWithLayout = withClinicAuth(MyJobs);

// ✅ Reassign layout (TS-safe now)
ProtectedDashboard.getLayout = MyJobs.getLayout;

export default ProtectedDashboard;