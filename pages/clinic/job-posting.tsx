import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ClinicLayout from "../../components/ClinicLayout";
import withClinicAuth from "../../components/withClinicAuth";
import type { NextPageWithLayout } from "../_app";

const qualifications = ['MBBS', 'BDS', 'BAMS', 'BHMS', 'MD', 'MS', 'PhD', 'Diploma', 'Other'];
const jobTypes = ['Full Time', 'Part Time', 'Internship'];
const departments = ['Software', 'Dental', 'Cardiology', 'Pathology', 'Administration', 'Radiology', 'General Medicine'];

// Toast types
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

function PostJobForm() {
  const [formData, setFormData] = useState({
    companyName: '',
    jobTitle: '',
    department: '',
    qualification: '',
    jobType: '',
    location: '',
    jobTiming: '',
    skills: '',
    perks: '',
    languagesPreferred: '',
    description: '',
    noOfOpenings: '',
    salary: '',
    establishment: '',
    workingDays: '',
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Toast functions
  const addToast = (type: ToastType, title: string, message: string) => {
    const id = Date.now().toString();
    const newToast: Toast = { id, type, title, message };
    setToasts(prev => [...prev, newToast]);

    // Auto remove toast after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.companyName || !formData.jobTitle || !formData.department || !formData.jobType) {
      addToast('error', 'Missing Required Fields', 'Please fill in all required fields (Company Name, Job Title, Department, Job Type)');
      return;
    }

    // Show confirmation modal
    setShowConfirmModal(true);
    addToast('info', 'Review Required', 'Please review your job details carefully before posting');
  };

  const confirmSubmit = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('clinicToken'); // or doctorToken based on role
      const payload = {
        ...formData,
        // Convert comma-separated strings to arrays
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        perks: formData.perks.split(',').map(p => p.trim()).filter(Boolean),
        languagesPreferred: formData.languagesPreferred.split(',').map(l => l.trim()).filter(Boolean),
        noOfOpenings: parseInt(formData.noOfOpenings) || 1,
      };

      const res = await axios.post('/api/job-postings/create', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      addToast('success', 'Job Posted Successfully!', 'Your job posting is now live and candidates can apply');
      setShowConfirmModal(false);

      // Reset form
      setFormData({
        companyName: '',
        jobTitle: '',
        department: '',
        qualification: '',
        jobType: '',
        location: '',
        jobTiming: '',
        skills: '',
        perks: '',
        languagesPreferred: '',
        description: '',
        noOfOpenings: '',
        salary: '',
        establishment: '',
        workingDays: '',
      });
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to Post Job', 'There was an error posting your job. Please try again or contact support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Replace your existing ConfirmationModal component with this updated version

  const ConfirmationModal = () => (
    <div className="fixed inset-0 backdrop-blur-md bg-white/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Job Posting</h3>
                <p className="text-sm text-gray-600">Please review your job details before posting</p>
              </div>
            </div>
            <button
              onClick={() => setShowConfirmModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Job Details Review */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50/80 backdrop-blur-sm p-3 rounded-lg border border-gray-200/50">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Company Name</label>
                <p className="text-sm font-medium text-gray-900 mt-1">{formData.companyName || 'Not specified'}</p>
              </div>
              <div className="bg-gray-50/80 backdrop-blur-sm p-3 rounded-lg border border-gray-200/50">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Job Title</label>
                <p className="text-sm font-medium text-gray-900 mt-1">{formData.jobTitle || 'Not specified'}</p>
              </div>
              <div className="bg-gray-50/80 backdrop-blur-sm p-3 rounded-lg border border-gray-200/50">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Department</label>
                <p className="text-sm font-medium text-gray-900 mt-1">{formData.department || 'Not specified'}</p>
              </div>
              <div className="bg-gray-50/80 backdrop-blur-sm p-3 rounded-lg border border-gray-200/50">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Job Type</label>
                <p className="text-sm font-medium text-gray-900 mt-1">{formData.jobType || 'Not specified'}</p>
              </div>
              <div className="bg-gray-50/80 backdrop-blur-sm p-3 rounded-lg border border-gray-200/50">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Qualification</label>
                <p className="text-sm font-medium text-gray-900 mt-1">{formData.qualification || 'Not specified'}</p>
              </div>
              <div className="bg-gray-50/80 backdrop-blur-sm p-3 rounded-lg border border-gray-200/50">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Location</label>
                <p className="text-sm font-medium text-gray-900 mt-1">{formData.location || 'Not specified'}</p>
              </div>
              <div className="bg-gray-50/80 backdrop-blur-sm p-3 rounded-lg border border-gray-200/50">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Salary</label>
                <p className="text-sm font-medium text-gray-900 mt-1">{formData.salary || 'Not specified'}</p>
              </div>
              <div className="bg-gray-50/80 backdrop-blur-sm p-3 rounded-lg border border-gray-200/50">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Number of Openings</label>
                <p className="text-sm font-medium text-gray-900 mt-1">{formData.noOfOpenings || '1'}</p>
              </div>
            </div>

            {formData.description && (
              <div className="bg-gray-50/80 backdrop-blur-sm p-3 rounded-lg border border-gray-200/50">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Job Description</label>
                <p className="text-sm text-gray-900 mt-1">{formData.description}</p>
              </div>
            )}

            {formData.skills && (
              <div className="bg-gray-50/80 backdrop-blur-sm p-3 rounded-lg border border-gray-200/50">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Required Skills</label>
                <p className="text-sm text-gray-900 mt-1">{formData.skills}</p>
              </div>
            )}

            {formData.perks && (
              <div className="bg-gray-50/80 backdrop-blur-sm p-3 rounded-lg border border-gray-200/50">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Perks & Benefits</label>
                <p className="text-sm text-gray-900 mt-1">{formData.perks}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100/80 backdrop-blur-sm rounded-lg hover:bg-gray-200/80 transition-all duration-200 font-medium border border-gray-200/50"
            >
              Go Back & Edit
            </button>
            <button
              onClick={confirmSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-[#2D9AA5] text-white rounded-lg hover:bg-[#247a83] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Posting Job...
                </>
              ) : (
                "Confirm & Post Job"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Toast Component
  // Replace your existing ToastContainer component with this improved version

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-[9999] space-y-3 max-w-sm w-full">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className={`w-full bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden transform transition-all duration-500 ease-out ${index === toasts.length - 1 ? 'animate-slide-in' : ''
            }`}
          style={{
            animation: index === toasts.length - 1 ? 'slideIn 0.5s ease-out' : 'none'
          }}
        >
          {/* Colored top border */}
          <div className={`h-1 w-full ${toast.type === 'success' ? 'bg-green-500' :
              toast.type === 'error' ? 'bg-red-500' :
                toast.type === 'warning' ? 'bg-yellow-500' :
                  'bg-blue-500'
            }`} />

          <div className="p-4">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${toast.type === 'success' ? 'bg-green-100' :
                  toast.type === 'error' ? 'bg-red-100' :
                    toast.type === 'warning' ? 'bg-yellow-100' :
                      'bg-blue-100'
                }`}>
                {toast.type === 'success' && (
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {toast.type === 'error' && (
                  <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                {toast.type === 'warning' && (
                  <svg className="w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3c4.97 0 9 4.03 9 9s-4.03 9-9 9-9-4.03-9-9 4.03-9 9-9z" />
                  </svg>
                )}
                {toast.type === 'info' && (
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 leading-tight">
                  {toast.title}
                </p>
                <p className="mt-1 text-xs text-gray-600 leading-relaxed break-words">
                  {toast.message}
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 ml-2 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-label="Close notification"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Progress bar for auto-dismiss */}
          <div className="h-1 bg-gray-100">
            <div
              className={`h-full transition-all duration-[5000ms] ease-linear ${toast.type === 'success' ? 'bg-green-400' :
                  toast.type === 'error' ? 'bg-red-400' :
                    toast.type === 'warning' ? 'bg-yellow-400' :
                      'bg-blue-400'
                }`}
              style={{
                width: '100%',
                animation: 'progress 5s linear forwards'
              }}
            />
          </div>
        </div>
      ))}

      {/* CSS animations */}
      <style jsx>{`
      @keyframes progress {
        0% { width: 100%; }
        100% { width: 0%; }
      }
      
      @keyframes slideIn {
        0% {
          transform: translateX(100%);
          opacity: 0;
        }
        100% {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      /* Mobile responsive adjustments */
      @media (max-width: 640px) {
        .fixed.top-4.right-4 {
          top: 1rem;
          right: 1rem;
          left: 1rem;
          max-width: none;
        }
      }
    `}</style>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2D9AA5] rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0V6a2 2 0 00-2 2v6.001" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Post a Job
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Create a new job posting for your clinic
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8">
          {/* Basic Information */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  name="companyName"
                  value={formData.companyName}
                  placeholder="Enter company name"
                  onChange={handleChange}
                  className="text-black w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] transition-colors text-sm sm:text-base placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title *
                </label>
                <input
                  name="jobTitle"
                  value={formData.jobTitle}
                  placeholder="Enter job title"
                  onChange={handleChange}
                  className="text-black w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] transition-colors text-sm sm:text-base placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department *
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="text-gray-800 w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] transition-colors text-sm sm:text-base bg-white placeholder-gray-800"
                >
                  <option value="">Select Department</option>
                  {departments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Required Qualification
                </label>
                <select
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  className="text-gray-800 w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] transition-colors text-sm sm:text-base bg-white placeholder-gray-800"
                >
                  <option value="">Select Qualification</option>
                  {qualifications.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Type *
                </label>
                <select
                  name="jobType"
                  value={formData.jobType}
                  onChange={handleChange}
                  className="text-gray-800 w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] transition-colors text-sm sm:text-base bg-white placeholder-gray-800"
                >
                  <option value="">Select Job Type</option>
                  {jobTypes.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  name="location"
                  value={formData.location}
                  placeholder="Enter location"
                  onChange={handleChange}
                  className="text-black w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] transition-colors text-sm sm:text-base placeholder-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Timing
                </label>
                <input
                  name="jobTiming"
                  value={formData.jobTiming}
                  placeholder="e.g. 9 AM - 6 PM"
                  onChange={handleChange}
                  className="text-black w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] transition-colors text-sm sm:text-base placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Working Days
                </label>
                <input
                  name="workingDays"
                  placeholder="e.g. Monday–Friday"
                  value={formData.workingDays}
                  onChange={handleChange}
                  className="text-black w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] transition-colors text-sm sm:text-base placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salary
                </label>
                <input
                  name="salary"
                  value={formData.salary}
                  placeholder="Enter salary range"
                  onChange={handleChange}
                  className="text-black w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] transition-colors text-sm sm:text-base placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Openings
                </label>
                <input
                  name="noOfOpenings"
                  type="number"
                  value={formData.noOfOpenings}
                  placeholder="Enter number"
                  onChange={handleChange}
                  className="text-black w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] transition-colors text-sm sm:text-base placeholder-gray-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Establishment Year
                </label>
                <input
                  name="establishment"
                  value={formData.establishment}
                  placeholder="Enter establishment year"
                  onChange={handleChange}
                  className="text-black w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] transition-colors text-sm sm:text-base placeholder-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                placeholder="Describe the job role, responsibilities, and requirements..."
                onChange={handleChange}
                rows={5}
                className="text-black w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] transition-colors text-sm sm:text-base resize-none placeholder-gray-500"
              />
            </div>
          </div>

          {/* Additional Requirements */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Requirements</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Required Skills
                  <span className="text-gray-500 text-xs ml-1">(comma separated)</span>
                </label>
                <input
                  name="skills"
                  value={formData.skills}
                  placeholder="e.g. Communication, Team Work, Problem Solving"
                  onChange={handleChange}
                  className="text-black w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] transition-colors text-sm sm:text-base placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Perks & Benefits
                  <span className="text-gray-500 text-xs ml-1">(comma separated)</span>
                </label>
                <input
                  name="perks"
                  value={formData.perks}
                  placeholder="e.g. Health Insurance, Paid Leave, Training"
                  onChange={handleChange}
                  className="text-black w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] transition-colors text-sm sm:text-base placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Languages
                  <span className="text-gray-500 text-xs ml-1">(comma separated)</span>
                </label>
                <input
                  name="languagesPreferred"
                  value={formData.languagesPreferred}
                  placeholder="e.g. English, Hindi, Local Language"
                  onChange={handleChange}
                  className="text-black w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] transition-colors text-sm sm:text-base placeholder-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={handleSubmit}
              className="bg-[#2D9AA5] text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg hover:bg-[#247a83] transition-colors font-medium text-sm sm:text-base"
            >
              Post Job
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && <ConfirmationModal />}

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

PostJobForm.getLayout = function PageLayout(page: React.ReactNode) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

// ✅ Apply HOC and assign correct type
const ProtectedDashboard: NextPageWithLayout = withClinicAuth(PostJobForm);

// ✅ Reassign layout (TS-safe now)
ProtectedDashboard.getLayout = PostJobForm.getLayout;

export default ProtectedDashboard;