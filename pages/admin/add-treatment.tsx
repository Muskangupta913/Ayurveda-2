'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import withAdminAuth from '../../components/withAdminAuth'; 

type SubTreatment = {
  name: string;
  slug: string;
};

type Treatment = {
  _id: string;
  name: string;
  slug: string;
  subcategories: SubTreatment[];
};

type NextPageWithLayout = React.FC & {
  getLayout?: (page: React.ReactNode) => React.ReactNode;
};

const AddTreatment: NextPageWithLayout = () => {
  const [newMainTreatment, setNewMainTreatment] = useState<string>('');
  const [newSubTreatment, setNewSubTreatment] = useState<string>('');
  const [selectedMainTreatment, setSelectedMainTreatment] = useState<string>('');
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Array<{id: number, message: string, type: 'success' | 'error'}>>([]);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [treatmentToDelete, setTreatmentToDelete] = useState<{id: string, name: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const fetchTreatments = async () => {
    try {
      const res = await axios.get('/api/doctor/getTreatment');
      setTreatments(res.data.treatments);
    } catch {
      console.error('Failed to fetch treatments');
    }
  };

  useEffect(() => {
    fetchTreatments();
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showDeleteModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDeleteModal]);

  const handleAddMainTreatment = async () => {
    if (!newMainTreatment.trim()) {
      showToast('Main treatment name cannot be empty', 'error');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await axios.post('/api/admin/addTreatment', {
        name: newMainTreatment,
        slug: newMainTreatment.toLowerCase().replace(/\s+/g, '-'),
      });

      if (res.status === 201) {
        showToast('Main treatment added successfully', 'success');
        setNewMainTreatment('');
        fetchTreatments();
      }
    } catch (err: unknown) {
      let message = 'Error adding main treatment';
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data?.message
      ) {
        message = (err as { response: { data: { message: string } } }).response.data.message;
      }
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubTreatment = async () => {
    if (!selectedMainTreatment) {
      showToast('Please select a main treatment first', 'error');
      return;
    }

    if (!newSubTreatment.trim()) {
      showToast('Sub-treatment name cannot be empty', 'error');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await axios.post('/api/admin/addSubTreatment', {
        mainTreatmentId: selectedMainTreatment,
        subTreatmentName: newSubTreatment,
        subTreatmentSlug: newSubTreatment.toLowerCase().replace(/\s+/g, '-'),
      });

      if (res.status === 201) {
        showToast('Sub-treatment added successfully', 'success');
        setNewSubTreatment('');
        setSelectedMainTreatment('');
        fetchTreatments();
      }
    } catch (err: unknown) {
      let message = 'Error adding sub-treatment';
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data?.message
      ) {
        message = (err as { response: { data: { message: string } } }).response.data.message;
      }
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setTreatmentToDelete({ id, name });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!treatmentToDelete) return;

    setIsDeleting(true);
    
    try {
      await axios.delete(`/api/admin/deleteTreatment?id=${treatmentToDelete.id}`);
      showToast('Treatment deleted successfully', 'success');
      fetchTreatments();
      setShowDeleteModal(false);
      setTreatmentToDelete(null);
    } catch {
      showToast('Error deleting treatment', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setTreatmentToDelete(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent, type: 'main' | 'sub') => {
    if (e.key === 'Enter') {
      if (type === 'main') {
        handleAddMainTreatment();
      } else {
        handleAddSubTreatment();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 sm:mb-6">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
            Treatment Management
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Manage main treatments and their sub-treatments efficiently
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 max-w-7xl mx-auto">
          
          {/* Add Treatment Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 sm:px-8 py-6 sm:py-8">
              <div className="flex items-center">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 mr-4">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Add New Treatment</h2>
                  <p className="text-blue-100 text-sm sm:text-base">Create main treatments and sub-treatments</p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="space-y-6">
                {/* Add Main Treatment */}
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Main Treatment Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newMainTreatment}
                      onChange={(e) => setNewMainTreatment(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, 'main')}
                      placeholder="Enter main treatment name (e.g., Physical Therapy, Medication)"
                      className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 sm:py-4 pl-12 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-gray-700 placeholder-gray-400 text-sm sm:text-base"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleAddMainTreatment}
                  disabled={loading}
                  className={`w-full py-3 sm:py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 text-base sm:text-lg ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding Main Treatment...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Main Treatment
                    </div>
                  )}
                </button>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Sub-Treatment</h3>
                  
                  {/* Select Main Treatment */}
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Select Main Treatment</label>
                    <select
                      value={selectedMainTreatment}
                      onChange={(e) => setSelectedMainTreatment(e.target.value)}
                      className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 sm:py-4 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-gray-700 text-sm sm:text-base"
                    >
                      <option value="">Choose a main treatment...</option>
                      {treatments.map((treatment) => (
                        <option key={treatment._id} value={treatment._id}>
                          {treatment.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Add Sub-Treatment Input */}
                  <div className="relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Sub-Treatment Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={newSubTreatment}
                        onChange={(e) => setNewSubTreatment(e.target.value)}
                        onKeyPress={(e) => handleKeyPress(e, 'sub')}
                        placeholder="Enter sub-treatment name"
                        className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 sm:py-4 pl-12 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-gray-700 placeholder-gray-400 text-sm sm:text-base"
                      />
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleAddSubTreatment}
                    disabled={loading || !selectedMainTreatment}
                    className={`w-full py-3 sm:py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 text-base sm:text-lg mt-4 ${
                      loading || !selectedMainTreatment
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Adding Sub-Treatment...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Sub-Treatment
                      </div>
                    )}
                  </button>
                </div>

                {/* Status Messages */}
                {error && (
                  <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-red-700 font-medium text-sm sm:text-base">{error}</p>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-green-700 font-medium text-sm sm:text-base">{success}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Existing Treatments Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 sm:px-8 py-6 sm:py-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 mr-4">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Treatment Library</h2>
                    <p className="text-green-100 text-sm sm:text-base">Manage existing treatments</p>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1 sm:py-2">
                  <span className="text-white font-semibold text-sm sm:text-base">
                    {treatments.length} treatments
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="max-h-96 sm:max-h-[28rem] lg:max-h-[32rem] overflow-y-auto custom-scrollbar">
                {treatments.length === 0 ? (
                  <div className="text-center py-12 sm:py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-2xl mb-4 sm:mb-6">
                      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No treatments yet</h3>
                    <p className="text-gray-500 text-sm sm:text-base">Add your first treatment to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {treatments.map((treatment, index) => (
                      <div
                        key={treatment._id}
                        className="group bg-gray-50 hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-300 rounded-xl p-4 sm:p-5 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center min-w-0 flex-1">
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs sm:text-sm font-bold w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                              {index + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate pr-2">
                                {treatment.name}
                              </h4>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteClick(treatment._id, treatment.name)}
                            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white p-2 sm:p-2.5 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ml-3 flex-shrink-0"
                          >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        
                        {/* Sub-treatments */}
                        {treatment.subcategories && treatment.subcategories.length > 0 && (
                          <div className="ml-11 sm:ml-14">
                            <h5 className="text-xs font-medium text-gray-600 mb-2">Sub-treatments:</h5>
                            <div className="flex flex-wrap gap-2">
                              {treatment.subcategories.map((sub, subIndex) => (
                                <span
                                  key={subIndex}
                                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                                >
                                  {sub.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-8 sm:mt-12 bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-xl mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{treatments.length}</h3>
              <p className="text-sm sm:text-base text-gray-600">Main Treatments</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-xl mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                {treatments.reduce((total, treatment) => total + (treatment.subcategories?.length || 0), 0)}
              </h3>
              <p className="text-sm sm:text-base text-gray-600">Sub-Treatments</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-xl mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Fast</h3>
              <p className="text-sm sm:text-base text-gray-600">Management</p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={handleDeleteCancel}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
            <div className="p-6 sm:p-8">
              {/* Icon */}
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              {/* Content */}
              <div className="text-center mb-8">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  Delete Treatment
                </h3>
                <p className="text-gray-600 text-sm sm:text-base mb-2">
                  Are you sure you want to delete this treatment and all its sub-treatments?
                </p>
                <div className="bg-gray-50 rounded-lg p-3 mx-2">
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">
                    &quot;{treatmentToDelete?.name}&quot;
                  </p>
                </div>
                <p className="text-red-600 text-sm mt-3">
                  This action cannot be undone.
                </p>
              </div>
              
              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 text-white bg-red-600 hover:bg-red-700 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center p-4 rounded-lg shadow-lg border-l-4 min-w-[300px] transform transition-all duration-300 ease-in-out ${
              toast.type === 'success'
                ? 'bg-green-50 border-green-400 text-green-700'
                : 'bg-red-50 border-red-400 text-red-700'
            }`}
          >
            <div className="flex-shrink-0">
              {toast.type === 'success' ? (
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </div>
  );
};

AddTreatment.getLayout = function PageLayout(page: React.ReactNode) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedDashboard: NextPageWithLayout = withAdminAuth(AddTreatment);
ProtectedDashboard.getLayout = AddTreatment.getLayout;

export default ProtectedDashboard;
