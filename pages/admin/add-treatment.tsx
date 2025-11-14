'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import withAdminAuth from '../../components/withAdminAuth';
import { useAgentPermissions } from '../../hooks/useAgentPermissions'; 

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

  const router = useRouter();
  
  // Check if user is an admin or agent - use state to ensure reactivity
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAgent, setIsAgent] = useState<boolean>(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const adminToken = !!localStorage.getItem('adminToken');
      const agentToken = !!localStorage.getItem('agentToken');
      const isAgentRoute = router.pathname?.startsWith('/agent/') || window.location.pathname?.startsWith('/agent/');
      
      console.log('Add Treatment - Initial Token Check:', { 
        adminToken, 
        agentToken, 
        isAgentRoute,
        pathname: router.pathname,
        locationPath: window.location.pathname
      });
      
      // CRITICAL: If on agent route, prioritize agentToken over adminToken
      if (isAgentRoute && agentToken) {
        // On agent route with agentToken = treat as agent (even if adminToken exists)
        setIsAdmin(false);
        setIsAgent(true);
      } else if (adminToken) {
        // Not on agent route, or no agentToken = treat as admin if adminToken exists
        setIsAdmin(true);
        setIsAgent(false);
      } else if (agentToken) {
        // Has agentToken but not on agent route = treat as agent
        setIsAdmin(false);
        setIsAgent(true);
      } else {
        // No tokens = neither
        setIsAdmin(false);
        setIsAgent(false);
      }
    }
  }, [router.pathname]);
  
  // Always call the hook (React rules), but only use it if isAgent is true
  // Pass null as moduleKey if not an agent to skip the API call
  const agentPermissionsData: any = useAgentPermissions(isAgent ? "admin_add_treatment" : (null as any));
  const agentPermissions = isAgent ? agentPermissionsData?.permissions : null;
  const permissionsLoading = isAgent ? agentPermissionsData?.loading : false;

  // Debug logging - always log to see what's happening
  useEffect(() => {
    console.log('Add Treatment - State Update:', {
      isAdmin,
      isAgent,
      permissionsLoading,
      hasAgentPermissions: !!agentPermissions,
      canDelete: agentPermissions?.canDelete,
      canAll: agentPermissions?.canAll
    });
  }, [isAdmin, isAgent, permissionsLoading, agentPermissions]);

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
      // Get token - check for adminToken first, then agentToken (for agents accessing via /agent route)
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
      const token = adminToken || agentToken;

      if (!token) {
        console.error("No token found");
        return;
      }

      const res = await axios.get<{ treatments: Treatment[] }>('/api/doctor/getTreatment', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTreatments(res.data.treatments);
    } catch (err) {
      console.error('Failed to fetch treatments', err);
    }
  };

  useEffect(() => {
    // Fetch treatments immediately for admins, or for agents after permissions load
    if (isAdmin || !isAgent || !permissionsLoading) {
      fetchTreatments();
    }
  }, [isAdmin, isAgent, permissionsLoading]);

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

    // Check permissions only for agents - admins bypass all checks
    if (!isAdmin && isAgent && agentPermissions && !agentPermissions.canCreate && !agentPermissions.canAll) {
      showToast('You do not have permission to create treatments', 'error');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Get token - check for adminToken first, then agentToken (for agents accessing via /agent route)
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
      const token = adminToken || agentToken;

      if (!token) {
        showToast('No token found. Please login again.', 'error');
        setLoading(false);
        return;
      }

      const res = await axios.post('/api/admin/addTreatment', {
        name: newMainTreatment,
        slug: newMainTreatment.toLowerCase().replace(/\s+/g, '-'),
      }, {
        headers: { Authorization: `Bearer ${token}` }
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

    // Check permissions only for agents - admins bypass all checks
    if (!isAdmin && isAgent && agentPermissions && !agentPermissions.canCreate && !agentPermissions.canAll) {
      showToast('You do not have permission to create sub-treatments', 'error');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Get token - check for adminToken first, then agentToken (for agents accessing via /agent route)
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
      const token = adminToken || agentToken;

      if (!token) {
        showToast('No token found. Please login again.', 'error');
        setLoading(false);
        return;
      }

      const res = await axios.post('/api/admin/addSubTreatment', {
        mainTreatmentId: selectedMainTreatment,
        subTreatmentName: newSubTreatment,
        subTreatmentSlug: newSubTreatment.toLowerCase().replace(/\s+/g, '-'),
      }, {
        headers: { Authorization: `Bearer ${token}` }
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

    // Check permissions only for agents - admins bypass all checks
    if (!isAdmin && isAgent && agentPermissions && !agentPermissions.canDelete && !agentPermissions.canAll) {
      showToast('You do not have permission to delete treatments', 'error');
      setShowDeleteModal(false);
      setTreatmentToDelete(null);
      return;
    }

    setIsDeleting(true);
    
    try {
      // Get token - check for adminToken first, then agentToken (for agents accessing via /agent route)
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
      const token = adminToken || agentToken;

      if (!token) {
        showToast('No token found. Please login again.', 'error');
        setIsDeleting(false);
        return;
      }

      await axios.delete(`/api/admin/deleteTreatment?id=${treatmentToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('Treatment deleted successfully', 'success');
      fetchTreatments();
      setShowDeleteModal(false);
      setTreatmentToDelete(null);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error deleting treatment', 'error');
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

  // Show access denied message only for agents without read permission - admins always have access
  if (!isAdmin && isAgent && !permissionsLoading && agentPermissions && !agentPermissions.canRead && !agentPermissions.canAll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600">You do not have permission to view treatments. Please contact your administrator.</p>
        </div>
      </div>
    );
  }

 return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#2D9AA5] rounded-xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            Treatment Management
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Manage treatments efficiently
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Add Treatment Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-[#2D9AA5] rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-800">Add Treatment</h2>
              </div>

              <div className="space-y-4">
                {/* Main Treatment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Main Treatment
                  </label>
                  <input
                    type="text"
                    value={newMainTreatment}
                    onChange={(e) => setNewMainTreatment(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, 'main')}
                    placeholder="Enter treatment name"
                    className="text-black w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-transparent outline-none text-sm"
                  />
                </div>

                {/* Always show Add Main Treatment button for admins, conditionally for agents */}
                {(isAdmin || (isAgent && !permissionsLoading && agentPermissions && (agentPermissions.canCreate || agentPermissions.canAll))) && (
                  <button
                    onClick={handleAddMainTreatment}
                    disabled={loading || (!isAdmin && isAgent && !agentPermissions?.canCreate && !agentPermissions?.canAll)}
                    className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                      loading || (!isAdmin && isAgent && !agentPermissions?.canCreate && !agentPermissions?.canAll)
                        ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                        : 'bg-[#2D9AA5] hover:bg-[#247A83] text-white'
                    }`}
                  >
                    {loading ? 'Adding...' : 'Add Main Treatment'}
                  </button>
                )}

                {/* Divider */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Add Sub-Treatment</h3>
                  
                  {/* Select Main Treatment */}
                  <div className="mb-3">
                    <select
                      value={selectedMainTreatment}
                      onChange={(e) => setSelectedMainTreatment(e.target.value)}
                      className="text-black w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-transparent outline-none text-sm"
                    >
                      <option value="">Select main treatment</option>
                      {treatments.map((treatment) => (
                        <option key={treatment._id} value={treatment._id}>
                          {treatment.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sub-Treatment Input */}
                  <div className="mb-3">
                    <input
                      type="text"
                      value={newSubTreatment}
                      onChange={(e) => setNewSubTreatment(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, 'sub')}
                      placeholder="Enter sub-treatment name"
                      className="text-black w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-transparent outline-none text-sm"
                    />
                  </div>

                  {/* Always show Add Sub-Treatment button for admins, conditionally for agents */}
                  {(isAdmin || (isAgent && !permissionsLoading && agentPermissions && (agentPermissions.canCreate || agentPermissions.canAll))) && (
                    <button
                      onClick={handleAddSubTreatment}
                      disabled={loading || !selectedMainTreatment || (!isAdmin && isAgent && !agentPermissions?.canCreate && !agentPermissions?.canAll)}
                      className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                        loading || !selectedMainTreatment || (!isAdmin && isAgent && !agentPermissions?.canCreate && !agentPermissions?.canAll)
                          ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {loading ? 'Adding...' : 'Add Sub-Treatment'}
                    </button>
                  )}
                </div>

                {/* Messages */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 text-sm">{success}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Treatment List Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-800">Treatments</h2>
                </div>
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                  {treatments.length}
                </span>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {treatments.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">No treatments added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {treatments.map((treatment, index) => (
                      <div
                        key={treatment._id}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-gray-200 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center min-w-0 flex-1">
                            <span className="w-6 h-6 bg-[#2D9AA5] text-white text-xs rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                              {index + 1}
                            </span>
                            <h4 className="font-medium text-gray-800 text-sm truncate">
                              {treatment.name}
                            </h4>
                          </div>
                          {/* Delete button: Only show for admins OR agents with explicit delete permission */}
                          {(() => {
                            // CRITICAL: Check route and tokens to determine if user is admin or agent
                            const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
                            const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
                            const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
                            
                            // Admin always sees delete button - but ONLY if NOT on agent route AND adminToken exists
                            if (!isAgentRoute && adminTokenExists && isAdmin) {
                              return (
                                <button
                                  key={`delete-admin-${treatment._id}`}
                                  onClick={() => handleDeleteClick(treatment._id, treatment.name)}
                                  className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              );
                            }
                            
                            // For agents: Only show if permissions are loaded AND delete permission is explicitly true
                            // ALWAYS log this check to see what's happening
                            console.log('Add Treatment - Delete Button Render Check:', {
                              treatmentId: treatment._id,
                              isAdmin,
                              isAgent,
                              isAgentRoute,
                              adminTokenExists,
                              agentTokenExists,
                              permissionsLoading,
                              hasAgentPermissions: !!agentPermissions,
                              canDelete: agentPermissions?.canDelete,
                              canAll: agentPermissions?.canAll
                            });
                            
                            // Show button for agents if on agent route OR if isAgent is true
                            if ((isAgentRoute || isAgent) && agentTokenExists) {
                              // Don't show if permissions are still loading
                              if (permissionsLoading) {
                                console.log('Add Treatment - Permissions still loading, hiding button');
                                return null;
                              }
                              
                              // Don't show if permissions object doesn't exist
                              if (!agentPermissions) {
                                console.log('Add Treatment - No permissions object:', { isAgent, agentPermissions });
                                return null;
                              }
                              
                              // Only show if canDelete is explicitly true OR canAll is explicitly true
                              // Triple-check: ensure we're checking actual boolean true, not truthy values
                              const canDeleteValue = agentPermissions.canDelete;
                              const canAllValue = agentPermissions.canAll;
                              const hasDeletePermission = (canDeleteValue === true) || (canAllValue === true);
                              
                              console.log('Add Treatment - Delete Button Permission Check:', {
                                treatmentId: treatment._id,
                                canDelete: canDeleteValue,
                                canDeleteType: typeof canDeleteValue,
                                canDeleteStrict: canDeleteValue === true,
                                canAll: canAllValue,
                                canAllType: typeof canAllValue,
                                canAllStrict: canAllValue === true,
                                hasDeletePermission,
                                willShow: hasDeletePermission
                              });
                              
                              if (hasDeletePermission) {
                                return (
                                  <button
                                    key={`delete-agent-${treatment._id}-${canDeleteValue}-${canAllValue}`}
                                    onClick={() => handleDeleteClick(treatment._id, treatment.name)}
                                    className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                );
                              } else {
                                console.log('Add Treatment - Delete permission denied, hiding button');
                              }
                            }
                            
                            // Default: Don't show button
                            return null;
                          })()}
                        </div>
                        
                        {treatment.subcategories && treatment.subcategories.length > 0 && (
                          <div className="mt-3 ml-9">
                            <div className="flex flex-wrap gap-1">
                              {treatment.subcategories.map((sub, subIndex) => (
                                <span
                                  key={subIndex}
                                  className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs"
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

        {/* Stats */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#2D9AA5] rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800">{treatments.length}</h3>
              <p className="text-gray-600 text-sm">Main Treatments</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                {treatments.reduce((total, treatment) => total + (treatment.subcategories?.length || 0), 0)}
              </h3>
              <p className="text-gray-600 text-sm">Sub-Treatments</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Fast</h3>
              <p className="text-gray-600 text-sm">Management</p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-md"
            onClick={handleDeleteCancel}
          />
          
          <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Delete Treatment
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  Are you sure you want to delete this treatment?
                </p>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="font-medium text-gray-800 text-sm">
                    &quot;{treatmentToDelete?.name}&quot;
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium text-sm transition-all disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
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
            className={`flex items-center p-4 rounded-lg shadow-lg border min-w-[280px] transition-all ${
              toast.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex-shrink-0">
              {toast.type === 'success' ? (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
);
};

AddTreatment.getLayout = function PageLayout(page: React.ReactNode) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedDashboard: NextPageWithLayout = withAdminAuth(AddTreatment);
ProtectedDashboard.getLayout = AddTreatment.getLayout;

export default ProtectedDashboard;
