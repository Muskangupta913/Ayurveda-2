'use client';
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import toast, { Toaster } from 'react-hot-toast';
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import CreateAgentModal from '../../components/CreateAgentModal';
import AgentPermissionModal from '../../components/AgentPermissionModal';
import AdminLayout from '../../components/AdminLayout';
import withAdminAuth from '../../components/withAdminAuth';
import type { NextPageWithLayout } from '../_app';
import { useAgentPermissions } from '../../hooks/useAgentPermissions';

interface Agent {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isApproved: boolean;
  declined: boolean;
  role?: string;
}

const ManageAgentsPage: NextPageWithLayout = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [doctorStaff, setDoctorStaff] = useState<Agent[]>([]);
  const [activeView, setActiveView] = useState<'agents' | 'doctorStaff'>('agents');
  const [menuAgentId, setMenuAgentId] = useState<string | null>(null);
  const [passwordAgent, setPasswordAgent] = useState<Agent | null>(null);
  const [permissionAgent, setPermissionAgent] = useState<Agent | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 15;

  const router = useRouter();
  
  // Check if user is an admin or agent - use state to ensure reactivity
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAgent, setIsAgent] = useState<boolean>(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const adminToken = !!localStorage.getItem('adminToken');
      const agentToken = !!localStorage.getItem('agentToken');
      const isAgentRoute = router.pathname?.startsWith('/agent/') || window.location.pathname?.startsWith('/agent/');
      
      console.log('Create Agent - Initial Token Check:', { 
        adminToken, 
        agentToken, 
        isAgentRoute,
        pathname: router.pathname,
        locationPath: window.location.pathname
      });
      
      // CRITICAL: If on agent route, prioritize agentToken over adminToken
      if (isAgentRoute && agentToken) {
        setIsAdmin(false);
        setIsAgent(true);
      } else if (adminToken) {
        setIsAdmin(true);
        setIsAgent(false);
      } else if (agentToken) {
        setIsAdmin(false);
        setIsAgent(true);
      } else {
        setIsAdmin(false);
        setIsAgent(false);
      }
    }
  }, [router.pathname]);
  
  // Always call the hook (React rules), but only use it if isAgent is true
  const agentPermissionsData: any = useAgentPermissions(isAgent ? "create_agent" : (null as any));
  const agentPermissions = isAgent ? agentPermissionsData?.permissions : null;
  const permissionsLoading = isAgent ? agentPermissionsData?.loading : false;

  const adminToken =
    typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  const agentToken =
    typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;

  async function loadAgents() {
    try {
      setLoading(true);
      const token = adminToken || agentToken;
      const { data } = await axios.get('/api/lead-ms/get-agents?role=agent', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setAgents(data.agents);
        toast.success(`Loaded ${data.agents.length} agent(s) successfully`);
      }
    } catch (err: any) {
      console.error(err);
      // Handle 403 permission denied errors
      if (err.response?.status === 403) {
        setAgents([]);
        toast.error('You do not have permission to view agents');
      } else {
        toast.error('Failed to load agents. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadDoctorStaff() {
    try {
      setLoading(true);
      const token = adminToken || agentToken;
      const { data } = await axios.get('/api/lead-ms/get-agents?role=doctorStaff', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setDoctorStaff(data.agents);
        toast.success(`Loaded ${data.agents.length} doctor staff member(s) successfully`);
      }
    } catch (err: any) {
      console.error(err);
      // Handle 403 permission denied errors
      if (err.response?.status === 403) {
        setDoctorStaff([]);
        toast.error('You do not have permission to view doctor staff');
      } else {
        toast.error('Failed to load doctor staff. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadAll() {
    await Promise.all([loadAgents(), loadDoctorStaff()]);
  }

  useEffect(() => {
    if (isAdmin) {
      loadAll();
    } else if (isAgent) {
      if (!permissionsLoading) {
        if (agentPermissions && (agentPermissions.canRead === true || agentPermissions.canAll === true)) {
          loadAll();
        }
      }
    } else {
      // Neither admin nor agent - don't fetch
    }
  }, [isAdmin, isAgent, permissionsLoading, agentPermissions]);

  async function handleAction(agentId: string, action: string) {
    // CRITICAL: Check route and tokens to determine if user is admin or agent
    const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
    const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
    const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
    
    // Check permissions only for agents - admins bypass all checks
    if ((isAgentRoute || isAgent) && agentTokenExists && !adminTokenExists && agentPermissions) {
      if (action === 'approve' || action === 'decline') {
        if (agentPermissions.canApprove !== true && agentPermissions.canAll !== true) {
          toast.error("You do not have permission to approve/decline agents");
          return;
        }
      }
    }
    
    const token = adminToken || agentToken;
    const loadingToast = toast.loading(`${action === 'approve' ? 'Approving' : 'Declining'} agent...`);
    try {
      const { data } = await axios.patch(
        '/api/lead-ms/get-agents',
        { agentId, action },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (data.success) {
        toast.dismiss(loadingToast);
        if (data.agent.role === 'doctorStaff') {
          setDoctorStaff((prev) =>
            prev.map((a) => (a._id === agentId ? data.agent : a))
          );
        } else {
          setAgents((prev) =>
            prev.map((a) => (a._id === agentId ? data.agent : a))
          );
        }
        toast.success(`Agent ${action === 'approve' ? 'approved' : 'declined'} successfully`);
      }
    } catch (err: any) {
      console.error(err);
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.message || `Failed to ${action} agent. Please try again.`);
    }
  }

  async function handleResetPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordAgent) return;
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    // Check permissions for agents
    const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
    const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
    const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
    
    if ((isAgentRoute || isAgent) && agentTokenExists && !adminTokenExists && agentPermissions) {
      if (agentPermissions.canUpdate !== true && agentPermissions.canAll !== true) {
        toast.error("You do not have permission to reset passwords");
        return;
      }
    }
    
    const token = adminToken || agentToken;
    const loadingToast = toast.loading('Updating password...');
    try {
      const { data } = await axios.patch(
        '/api/lead-ms/get-agents',
        { agentId: passwordAgent._id, action: 'resetPassword', newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        if (data.agent.role === 'doctorStaff') {
          setDoctorStaff((prev) => prev.map((a) => (a._id === passwordAgent._id ? data.agent : a)));
        } else {
          setAgents((prev) => prev.map((a) => (a._id === passwordAgent._id ? data.agent : a)));
        }
        setPasswordAgent(null);
        setNewPassword('');
        setConfirmPassword('');
        setMenuAgentId(null);
        toast.dismiss(loadingToast);
        toast.success('Password updated successfully');
      } else {
        toast.dismiss(loadingToast);
        toast.error(data?.message || 'Failed to reset password');
      }
    } catch (err: any) {
      console.error(err);
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.message || 'Failed to reset password. Please try again.');
    }
  }

  // Filter and paginate data
  const filteredList = useMemo(() => {
    const list = activeView === 'agents' ? agents : doctorStaff;
    if (!searchTerm.trim()) return list;
    
    const term = searchTerm.toLowerCase().trim();
    return list.filter((agent) => 
      agent.name?.toLowerCase().includes(term) ||
      agent.email?.toLowerCase().includes(term) ||
      agent.phone?.toLowerCase().includes(term)
    );
  }, [activeView, agents, doctorStaff, searchTerm]);

  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedList = filteredList.slice(startIndex, endIndex);

  // Reset to page 1 when search term or view changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeView]);

  const currentList = paginatedList;
  const totalAgents = agents.length;
  const approvedAgents = agents.filter((a: Agent) => a.isApproved).length;
  const declinedAgents = agents.filter((a: Agent) => a.declined).length;
  const totalDoctorStaff = doctorStaff.length;
  const approvedDoctorStaff = doctorStaff.filter((a: Agent) => a.isApproved).length;
  const declinedDoctorStaff = doctorStaff.filter((a: Agent) => a.declined).length;

  // Check if agent has read permission
  const hasReadPermission = isAdmin || (isAgent && agentPermissions && (agentPermissions.canRead === true || agentPermissions.canAll === true));

  // Show loading spinner while checking permissions
  if (isAgent && permissionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-10 h-10 sm:w-12 sm:h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
          <p className="mt-4 text-sm sm:text-base text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Show access denied message if agent doesn't have read permission
  if (isAgent && !hasReadPermission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You do not have permission to view agent management. Please contact your administrator to request access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#374151',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800">Agent management</h1>
          <p className="text-xs text-gray-600 mt-0.5">Create and manage agent accounts</p>
        </div>

        {/* Toggle Slider - Subtle integration */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm w-full sm:w-auto">
            <button
              onClick={() => setActiveView('agents')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs font-medium rounded-md transition-colors ${
                activeView === 'agents'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Agents ({totalAgents})
            </button>
            <button
              onClick={() => setActiveView('doctorStaff')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs font-medium rounded-md transition-colors ${
                activeView === 'doctorStaff'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Doctor Staff ({totalDoctorStaff})
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="relative w-full sm:w-auto sm:min-w-[280px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-gray-800 placeholder-gray-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Stats + Create Button */}
        <div className="mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm">
              <div className="text-[10px] uppercase tracking-wide text-gray-600 font-medium">Total {activeView === 'agents' ? 'agents' : 'staff'}</div>
              <div className="mt-2 text-xl sm:text-2xl font-semibold text-gray-800">{activeView === 'agents' ? totalAgents : totalDoctorStaff}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm">
              <div className="text-[10px] uppercase tracking-wide text-gray-600 font-medium">Approved</div>
              <div className="mt-2 text-xl sm:text-2xl font-semibold text-green-700">{activeView === 'agents' ? approvedAgents : approvedDoctorStaff}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm">
              <div className="text-[10px] uppercase tracking-wide text-gray-600 font-medium">Declined</div>
              <div className="mt-2 text-xl sm:text-2xl font-semibold text-red-700">{activeView === 'agents' ? declinedAgents : declinedDoctorStaff}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm flex items-center justify-end">
              {(() => {
                const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
                const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
                const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
                
                // Helper function to check if action should be shown
                const shouldShowAction = (action: 'create' | 'update' | 'approve') => {
                  // Admin always sees all actions - but ONLY if NOT on agent route
                  if (!isAgentRoute && adminTokenExists && isAdmin) {
                    return true;
                  }
                  
                  // For agents: Check permissions
                  if ((isAgentRoute || isAgent) && agentTokenExists) {
                    if (permissionsLoading || !agentPermissions) {
                      return false;
                    }
                    
                    if (action === 'create') {
                      return agentPermissions.canCreate === true || agentPermissions.canAll === true;
                    }
                    if (action === 'approve') {
                      return agentPermissions.canApprove === true || agentPermissions.canAll === true;
                    }
                  }
                  
                  return false;
                };
                
                return shouldShowAction('create') ? (
                  <button 
                    onClick={() => setIsCreateOpen(true)} 
                    className="px-3 sm:px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-md transition-colors w-full sm:w-auto shadow-sm"
                  >
                    + Create agent
                  </button>
                ) : null;
              })()}
            </div>
          </div>
        </div>

        {/* Results Info */}
        {searchTerm && (
          <div className="mb-4 text-sm text-gray-700">
            Showing {filteredList.length} result(s) for "{searchTerm}"
          </div>
        )}

        {/* Agents Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-800">{activeView === 'agents' ? 'Agents' : 'Doctor Staff'}</h2>
            <p className="text-[11px] text-gray-600 mt-0.5">Approve, decline and update password</p>
          </div>

          {loading ? (
            <div className="px-5 py-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
              <p className="mt-4 text-sm text-gray-700">Loading...</p>
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-visible">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      activeView === 'agents' ? 'Agent Name' : 'Staff Name',
                      'Email Address',
                      'Phone Number',
                      'Status',
                      'Actions',
                    ].map((header) => (
                      <th
                        key={header}
                        className="px-3 sm:px-5 py-2.5 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {currentList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 sm:px-5 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <svg
                            className="w-12 h-12 text-gray-300 mb-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          <p className="text-sm font-medium text-gray-800">
                            {searchTerm ? 'No results found' : `No ${activeView === 'agents' ? 'agents' : 'doctor staff'} found`}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {searchTerm 
                              ? 'Try adjusting your search terms' 
                              : 'Create your first agent to get started'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentList.map((agent) => (
                      <tr key={agent._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 sm:px-5 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-7 w-7 flex-shrink-0 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 text-white flex items-center justify-center text-[11px] font-semibold shadow-sm">
                              {agent.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-2 sm:ml-3">
                              <div className="text-xs font-medium text-gray-800">
                                {agent.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-5 py-3 whitespace-nowrap text-xs text-gray-700">
                          <div className="max-w-[150px] sm:max-w-none truncate" title={agent.email}>
                            {agent.email}
                          </div>
                        </td>
                        <td className="px-3 sm:px-5 py-3 whitespace-nowrap text-xs text-gray-700">
                          {agent.phone || '-'}
                        </td>
                        <td className="px-3 sm:px-5 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              agent.declined
                                ? 'bg-red-50 text-red-800 border border-red-200'
                                : agent.isApproved
                                ? 'bg-green-50 text-green-800 border border-green-200'
                                : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                            }`}
                          >
                            {agent.declined
                              ? 'Declined'
                              : agent.isApproved
                              ? 'Approved'
                              : 'Pending'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-5 py-3 text-xs font-medium">
                          <div className="flex gap-1 sm:gap-2 items-center flex-wrap">
                          {(() => {
                            const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
                            const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
                            const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
                            
                            // Helper function to check if action should be shown
                            const shouldShowAction = (action: 'create' | 'update' | 'approve') => {
                              // Admin always sees all actions - but ONLY if NOT on agent route
                              if (!isAgentRoute && adminTokenExists && isAdmin) {
                                return true;
                              }
                              
                              // For agents: Check permissions
                              if ((isAgentRoute || isAgent) && agentTokenExists) {
                                if (permissionsLoading || !agentPermissions) {
                                  return false;
                                }
                                
                                if (action === 'approve') {
                                  return agentPermissions.canApprove === true || agentPermissions.canAll === true;
                                }
                              }
                              
                              return false;
                            };
                            
                            return (
                              <>
                                {shouldShowAction('approve') && (
                                  <>
                                    <button
                                      onClick={() => handleAction(agent._id, 'approve')}
                                      disabled={agent.isApproved}
                                      className={`px-2 sm:px-3 py-1.5 rounded-md text-[10px] sm:text-[11px] font-medium transition-colors whitespace-nowrap ${
                                        agent.isApproved
                                          ? 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200'
                                          : 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm'
                                      }`}
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleAction(agent._id, 'decline')}
                                      disabled={agent.declined}
                                      className={`px-2 sm:px-3 py-1.5 rounded-md text-[10px] sm:text-[11px] font-medium transition-colors whitespace-nowrap ${
                                        agent.declined
                                          ? 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200'
                                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200'
                                      }`}
                                    >
                                      Decline
                                    </button>
                                  </>
                                )}
                              </>
                            );
                          })()}
                            <div className="relative inline-block">
                              <button
                                type="button"
                                onClick={() => setMenuAgentId(menuAgentId === agent._id ? null : agent._id)}
                                className="w-7 h-7 inline-flex items-center justify-center rounded-md hover:bg-gray-100 border border-gray-200 transition-colors flex-shrink-0"
                                aria-label="More actions"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                                </svg>
                              </button>
                              {menuAgentId === agent._id && (
                                <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50" style={{ minWidth: '160px' }}>
                                  <div className="py-1">
                                    <button
                                      className="w-full text-left px-3 py-2 text-[11px] text-gray-800 hover:bg-gray-50 transition-colors whitespace-nowrap"
                                      onClick={() => {
                                        setPasswordAgent(agent);
                                        setMenuAgentId(null);
                                      }}
                                    >
                                      Change password
                                    </button>
                                    <button
                                      className="w-full text-left px-3 py-2 text-[11px] text-gray-800 hover:bg-gray-50 transition-colors border-t border-gray-200 whitespace-nowrap"
                                      onClick={() => {
                                        setPermissionAgent(agent);
                                        setMenuAgentId(null);
                                      }}
                                    >
                                      Rights
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {filteredList.length > itemsPerPage && (
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(endIndex, filteredList.length)}</span> of{' '}
                  <span className="font-medium">{filteredList.length}</span> results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCurrentPage((prev) => Math.max(1, prev - 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-800 hover:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => {
                            setCurrentPage(pageNum);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            currentPage === pageNum
                              ? 'bg-gray-900 text-white'
                              : 'bg-white text-gray-800 hover:bg-gray-100 border border-gray-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => {
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-800 hover:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Agent Modal */}
      <CreateAgentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          loadAll();
          toast.success('Agent created successfully');
        }}
        token={agentToken || undefined}
        doctorToken={undefined}
        adminToken={adminToken || undefined}
      />

      {/* Agent Permission Modal */}
      {permissionAgent && (
        <AgentPermissionModal
          isOpen={!!permissionAgent}
          onClose={() => setPermissionAgent(null)}
          agentId={permissionAgent._id}
          agentName={permissionAgent.name}
          token={adminToken || null}
          userRole="admin"
        />
      )}

      {/* Change Password Modal */}
      {passwordAgent && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto"
          onClick={() => {
            setPasswordAgent(null);
            setNewPassword('');
            setConfirmPassword('');
          }}
        >
          <div 
            className="w-full max-w-sm bg-white rounded-lg border border-gray-200 shadow-xl my-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-gray-200 bg-gray-50 flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <h3 className="text-sm sm:text-base font-semibold text-gray-800">Change password</h3>
                <p className="text-[10px] sm:text-[11px] text-gray-600 mt-0.5 break-words">
                  {passwordAgent.name} • {passwordAgent.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPasswordAgent(null);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="flex-shrink-0 p-1 rounded-md hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleResetPasswordSubmit} className="p-4 sm:p-5">
              <div className="space-y-4 sm:space-y-3.5">
                <div>
                  <label className="block text-[11px] sm:text-xs font-medium text-gray-800 mb-1.5">
                    New password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-md text-gray-800 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-colors placeholder-gray-500"
                    placeholder="Enter new password (min. 6 characters)"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block text-[11px] sm:text-xs font-medium text-gray-800 mb-1.5">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-md text-gray-800 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-colors placeholder-gray-500"
                    placeholder="Re-enter password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-5 sm:mt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordAgent(null);
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="w-full sm:w-auto px-4 sm:px-3.5 py-2.5 sm:py-2 rounded-md border border-gray-300 text-sm sm:text-[11px] font-medium text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 sm:px-3.5 py-2.5 sm:py-2 bg-gray-900 hover:bg-gray-800 active:bg-gray-950 text-white text-sm sm:text-[11px] font-medium rounded-md transition-colors shadow-sm"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Apply Layout
ManageAgentsPage.getLayout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;

// Preserve layout on wrapped component
const ProtectedManageAgentsPage: NextPageWithLayout = withAdminAuth(ManageAgentsPage) as any;
ProtectedManageAgentsPage.getLayout = ManageAgentsPage.getLayout;

export default ProtectedManageAgentsPage;

