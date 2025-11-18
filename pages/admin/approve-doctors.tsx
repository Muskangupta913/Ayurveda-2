"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import AdminLayout from "../../components/AdminLayout";
import withAdminAuth from "../../components/withAdminAuth";
import type { NextPageWithLayout } from "../_app";
import { useAgentPermissions } from "../../hooks/useAgentPermissions";
import {
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  BriefcaseIcon,
  BeakerIcon,
  DocumentTextIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { GoogleMap, Marker } from "@react-google-maps/api";

interface Doctor {
  _id: string;
  degree: string;
  experience: number;
  address: string;
  resumeUrl: string;
  treatments: Array<{
    mainTreatment: string;
    mainTreatmentSlug: string;
    subTreatments: Array<{
      name: string;
      slug: string;
    }>;
  }>;
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    isApproved: boolean;
    declined: boolean;
    password?: string;
  };
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

// Toast Component
const Toast = ({ toast, onClose }: { toast: Toast; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircleIcon className="w-5 h-5" />,
    error: <XCircleIcon className="w-5 h-5" />,
    info: <InformationCircleIcon className="w-5 h-5" />,
    warning: <ExclamationTriangleIcon className="w-5 h-5" />,
  };

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
  };

  return (
    <div
      className={`${colors[toast.type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-md animate-slide-in`}
    >
      {icons[toast.type]}
      <span className="flex-1 text-sm font-medium">{toast.message}</span>
      <button
        onClick={onClose}
        className="hover:bg-white/20 rounded p-1 transition-colors"
        aria-label="Close"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

// Toast Container
const ToastContainer = ({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) => (
  <div className="fixed top-4 right-4 z-50 space-y-2">
    {toasts.map((toast) => (
      <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
    ))}
  </div>
);

function AdminDoctors() {
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "pending" | "approved" | "declined"
  >("pending");
  const [settingId, setSettingId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address?: string;
  } | null>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    show: boolean;
    type: string;
    doctorId: string | null;
  }>({
    show: false,
    type: "",
    doctorId: null,
  });
  const [treatmentsModal, setTreatmentsModal] = useState<{
    open: boolean;
    doctor: Doctor | null;
  }>({ open: false, doctor: null });

  const itemsPerPage = 12;

  // Toast helper functions
  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Check if user is an admin or agent - use state to ensure reactivity
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAgent, setIsAgent] = useState<boolean>(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const adminToken = !!localStorage.getItem('adminToken');
      const agentToken = !!localStorage.getItem('agentToken');
      const isAgentRoute = router.pathname?.startsWith('/agent/') || window.location.pathname?.startsWith('/agent/');
      
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
  
  const agentPermissionsData: any = useAgentPermissions(isAgent ? "admin_approval_doctors" : (null as any));
  const agentPermissions = isAgent ? agentPermissionsData?.permissions : null;
  const permissionsLoading = isAgent ? agentPermissionsData?.loading : false;

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
      const token = adminToken || agentToken;

      if (!token) {
        console.error("No token found");
        setLoading(false);
        return;
      }

      const res = await axios.get<{ doctorProfiles: Doctor[] }>(
        "/api/admin/getAllDoctors",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      ).catch(err => {
        if (err.response?.status === 403) {
          return { data: { doctorProfiles: [] } };
        }
        throw err;
      });
      setDoctors(res.data.doctorProfiles || []);
      if (res.data.doctorProfiles && res.data.doctorProfiles.length > 0) {
        showToast(`Loaded ${res.data.doctorProfiles.length} doctor(s)`, 'success');
      }
    } catch (error: any) {
      console.error("Failed to fetch doctors", error);
      if (error.response?.status === 403) {
        setDoctors([]);
        showToast('You do not have permission to view doctors', 'error');
      } else {
        showToast('Failed to load doctors. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchDoctors();
    } else if (isAgent) {
      if (!permissionsLoading) {
        if (agentPermissions && (agentPermissions.canRead === true || agentPermissions.canAll === true)) {
          fetchDoctors();
        } else {
          setLoading(false);
        }
      }
    } else {
      setLoading(false);
    }
  }, [isAdmin, isAgent, permissionsLoading, agentPermissions]);

  const handleAction = async (
    userId: string,
    action: "approve" | "decline" | "delete"
  ) => {
    try {
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
      const token = adminToken || agentToken;

      if (!token) {
        showToast("No token found. Please login again.", 'error');
        return;
      }

      const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
      const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
      const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
      
      if ((isAgentRoute || isAgent) && agentTokenExists && !adminTokenExists && agentPermissions) {
        if ((action === "approve" || action === "decline") && agentPermissions.canApprove !== true && agentPermissions.canAll !== true) {
          showToast("You do not have permission to approve/decline doctors", 'error');
          return;
        }
        if (action === "delete" && agentPermissions.canDelete !== true && agentPermissions.canAll !== true) {
          showToast("You do not have permission to delete doctors", 'error');
          return;
        }
      }

      await axios.post("/api/admin/action", { userId, action }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast(`Doctor ${action}d successfully`, 'success');
      fetchDoctors();
    } catch (err: any) {
      console.error("Error:", err);
      showToast(err.response?.data?.message || `Failed to ${action} doctor`, 'error');
    }
  };

  const handleSetCredentials = async (userId: string) => {
    if (!newPassword.trim()) {
      return;
    }

    const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
    const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
    const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
    
    if ((isAgentRoute || isAgent) && agentTokenExists && !adminTokenExists && agentPermissions && agentPermissions.canUpdate !== true && agentPermissions.canAll !== true) {
      showToast("You do not have permission to update doctor credentials", 'error');
      return;
    }

    try {
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
      const token = adminToken || agentToken;

      if (!token) {
        showToast("No token found. Please login again.", 'error');
        return;
      }

      await axios.post("/api/admin/setDoctorCredentials", {
        userId,
        password: newPassword,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettingId(null);
      setNewPassword("");
      showToast('Credentials set successfully', 'success');
      fetchDoctors();
    } catch (error: any) {
      console.error(error);
      showToast(error.response?.data?.message || "An error occurred", 'error');
    }
  };

  const filteredDoctors = doctors.filter((doc) => {
    const user = doc.user;
    if (!user) return false;

    let tabMatch = false;
    if (activeTab === "pending")
      tabMatch = user.isApproved === false && user.declined === false;
    if (activeTab === "approved") tabMatch = user.isApproved === true;
    if (activeTab === "declined")
      tabMatch = user.isApproved === false && user.declined === true;

    if (!tabMatch) return false;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const basicMatch =
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.phone.toLowerCase().includes(searchLower) ||
        doc.degree.toLowerCase().includes(searchLower) ||
        doc.address.toLowerCase().includes(searchLower);

      if (basicMatch) return true;

      if (doc.treatments && doc.treatments.length > 0) {
        const treatmentMatch = doc.treatments.some(
          (treatment) =>
            treatment.mainTreatment.toLowerCase().includes(searchLower) ||
            treatment.subTreatments.some((sub) =>
              sub.name.toLowerCase().includes(searchLower)
            )
        );
        if (treatmentMatch) return true;
      }

      return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDoctors = filteredDoctors.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const getDoctorCounts = () => {
    const pending = doctors.filter(
      (doc) =>
        doc.user && doc.user.isApproved === false && doc.user.declined === false
    ).length;
    const approved = doctors.filter(
      (doc) => doc.user && doc.user.isApproved === true
    ).length;
    const declined = doctors.filter(
      (doc) =>
        doc.user && doc.user.isApproved === false && doc.user.declined === true
    ).length;
    return { pending, approved, declined };
  };

  const counts = getDoctorCounts();

  const getTabActions = (tab: string) => {
    const allActions = {
      pending: ["approve", "decline", "delete"],
      approved: ["decline", "delete"],
      declined: ["approve", "delete"],
    };
    
    const availableActions = allActions[tab as keyof typeof allActions] || [];
    
    const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
    const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
    const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
    
    if (!isAgentRoute && adminTokenExists && isAdmin) {
      return availableActions;
    }
    
    if ((isAgentRoute || isAgent) && agentTokenExists) {
      if (permissionsLoading || !agentPermissions) {
        return [];
      }
      
      return availableActions.filter(action => {
        if (action === "approve" || action === "decline") {
          return agentPermissions.canApprove === true || agentPermissions.canAll === true;
        }
        if (action === "delete") {
          return agentPermissions.canDelete === true || agentPermissions.canAll === true;
        }
        return true;
      });
    }
    
    return [];
  };

  const handleAddressClick = async (address: string) => {
    try {
      const response = await axios.get<{
        results: Array<{
          geometry: { location: { lat: number; lng: number } };
        }>;
      }>(`https://maps.googleapis.com/maps/api/geocode/json`, {
        params: {
          address,
          key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      });

      const location = response.data.results[0]?.geometry?.location;
      if (location) {
        setSelectedLocation({ ...location, address });
        setMapVisible(true);
      } else {
        setSelectedLocation({ lat: 0, lng: 0, address });
        setMapVisible(true);
      }
    } catch (err) {
      console.error("Map fetch failed:", err);
      setSelectedLocation({ lat: 0, lng: 0, address });
      setMapVisible(true);
    }
  };

  const DoctorCard = ({ doctor }: { doctor: Doctor }) => {
    const actions = getTabActions(activeTab);
    const isEditing = settingId === doctor.user._id;
    const hasPassword =
      doctor.user.password && doctor.user.password.trim() !== "";

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
        <div className="p-6">
          {/* Header */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {doctor.user.name}
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <BriefcaseIcon className="w-4 h-4" />
                <span>{doctor.degree}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <EnvelopeIcon className="w-4 h-4" />
                <span>{doctor.user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <PhoneIcon className="w-4 h-4" />
                <span>{doctor.user.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <MapPinIcon className="w-4 h-4" />
                <span
                  className="text-gray-700 hover:text-gray-900 cursor-pointer underline"
                  onClick={() => handleAddressClick(doctor.address)}
                >
                  {doctor.address}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <BriefcaseIcon className="w-4 h-4" />
                <span>{doctor.experience} years experience</span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2 mb-4">
            <button
              onClick={() => setTreatmentsModal({ open: true, doctor })}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
            >
              <BeakerIcon className="w-4 h-4" />
              <span>View Treatments ({doctor.treatments.length})</span>
            </button>
            {doctor.resumeUrl && (
              <a
                href={doctor.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
                onClick={(e) => {
                  e.preventDefault();
                  let safeUrl = doctor.resumeUrl;
                  if (safeUrl.includes("uploads/clinic/")) {
                    const filenameMatch = safeUrl.match(
                      /uploads\/clinic\/[^\/]+$/
                    );
                    if (filenameMatch) {
                      const baseUrl =
                        process.env.NEXT_PUBLIC_BASE_URL ||
                        "http://localhost:3001";
                      safeUrl = `${baseUrl}/${filenameMatch[0]}`;
                    }
                  }
                  window.open(safeUrl, "_blank");
                }}
              >
                <DocumentTextIcon className="w-4 h-4" />
                <span>View Resume</span>
              </a>
            )}
          </div>

          {/* Password Management for Approved Doctors */}
          {activeTab === "approved" && (
            <div className="border-t border-gray-200 pt-4 mb-4">
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                    <KeyIcon className="w-4 h-4" />
                    <span>Set Login Credentials</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="New Password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-gray-800"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoFocus
                    />
                    <button
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-700 hover:text-gray-900"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      onClick={() => handleSetCredentials(doctor.user._id)}
                    >
                      Save
                    </button>
                    <button
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      onClick={() => {
                        setSettingId(null);
                        setNewPassword("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <KeyIcon className="w-4 h-4" />
                    {hasPassword ? (
                      <span className="text-green-600 font-medium">
                        Credentials Set
                      </span>
                    ) : (
                      <span className="text-gray-600">
                        No credentials set
                      </span>
                    )}
                  </div>
                  {(() => {
                    const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
                    const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
                    const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
                    
                    if (!isAgentRoute && adminTokenExists && isAdmin) {
                      return (
                        <button
                          className="text-gray-700 hover:text-gray-900 text-sm underline"
                          onClick={() => setSettingId(doctor.user._id)}
                        >
                          {hasPassword ? "Change Password" : "Set Credentials"}
                        </button>
                      );
                    }
                    
                    if ((isAgentRoute || isAgent) && agentTokenExists) {
                      if (permissionsLoading || !agentPermissions) {
                        return null;
                      }
                      
                      const hasUpdatePermission = agentPermissions.canUpdate === true || agentPermissions.canAll === true;
                      if (hasUpdatePermission) {
                        return (
                          <button
                            className="text-gray-700 hover:text-gray-900 text-sm underline"
                            onClick={() => setSettingId(doctor.user._id)}
                          >
                            {hasPassword ? "Change Password" : "Set Credentials"}
                          </button>
                        );
                      }
                    }
                    
                    return null;
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
            {actions.map((action) => (
              <button
                key={action}
                onClick={() =>
                  setConfirmAction({
                    show: true,
                    type: action,
                    doctorId: doctor.user._id,
                  })
                }
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  action === "approve"
                    ? "bg-gray-800 hover:bg-gray-700 text-white"
                    : action === "decline"
                    ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                    : "bg-red-500 hover:bg-red-600 text-white"
                }`}
              >
                {action.charAt(0).toUpperCase() + action.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const hasReadPermission = isAdmin || (isAgent && agentPermissions && (agentPermissions.canRead === true || agentPermissions.canAll === true));

  if (loading || (isAgent && permissionsLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading doctors...</p>
        </div>
      </div>
    );
  }

  if (isAgent && !hasReadPermission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircleIcon className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-700">
            You do not have permission to view doctor approvals.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="bg-gray-800 p-3 rounded-lg">
                <UserGroupIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Doctor Management
                </h1>
                <p className="text-gray-700">
                  Manage doctor applications and approvals
                </p>
              </div>
            </div>
            <button
              onClick={fetchDoctors}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors self-start lg:self-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: 'Pending', value: counts.pending, icon: ClockIcon, color: 'bg-yellow-500' },
            { title: 'Approved', value: counts.approved, icon: CheckCircleIcon, color: 'bg-green-500' },
            { title: 'Declined', value: counts.declined, icon: XCircleIcon, color: 'bg-red-500' },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg text-white`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-6">
              {[
                { key: "pending", label: "Pending", count: counts.pending, color: "yellow" },
                { key: "approved", label: "Approved", count: counts.approved, color: "green" },
                { key: "declined", label: "Declined", count: counts.declined, color: "red" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key as "pending" | "approved" | "declined");
                    setCurrentPage(1);
                  }}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? "border-gray-800 text-gray-900"
                      : "border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      activeTab === tab.key
                        ? "bg-gray-800 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Search and View Controls */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search doctors, degree, treatments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-800 focus:border-gray-800 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg border transition-colors ${
                  viewMode === "grid"
                    ? "bg-gray-800 text-white border-gray-800"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg border transition-colors ${
                  viewMode === "list"
                    ? "bg-gray-800 text-white border-gray-800"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-4 text-sm text-gray-700">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredDoctors.length)} of {filteredDoctors.length} doctors
          </div>

          {/* Doctors Grid/List */}
          {paginatedDoctors.length === 0 ? (
            <div className="text-center py-12">
              <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
              <p className="text-gray-700">Try adjusting your search criteria.</p>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }
            >
              {paginatedDoctors.map((doctor) => (
                <DoctorCard key={doctor.user._id} doctor={doctor} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmAction.show && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center">
                {confirmAction.type === "approve" && (
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircleIcon className="w-8 h-8 text-green-600" />
                  </div>
                )}
                {confirmAction.type === "decline" && (
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                    <ClockIcon className="w-8 h-8 text-yellow-600" />
                  </div>
                )}
                {confirmAction.type === "delete" && (
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircleIcon className="w-8 h-8 text-red-600" />
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 capitalize">
                Confirm {confirmAction.type}
              </h2>
              <p className="text-gray-700 mb-8">
                Are you sure you want to {confirmAction.type} this doctor?
                {confirmAction.type === "delete" && (
                  <span className="block mt-2 text-red-600 font-medium">
                    This action cannot be undone.
                  </span>
                )}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setConfirmAction({ show: false, type: "", doctorId: null })
                  }
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (confirmAction.doctorId) {
                      await handleAction(
                        confirmAction.doctorId,
                        confirmAction.type as "approve" | "decline" | "delete"
                      );
                    }
                    setConfirmAction({ show: false, type: "", doctorId: null });
                  }}
                  className={`flex-1 text-white px-6 py-3 rounded-lg font-medium transition-colors ${
                    confirmAction.type === "approve"
                      ? "bg-gray-800 hover:bg-gray-700"
                      : confirmAction.type === "decline"
                      ? "bg-yellow-500 hover:bg-yellow-600"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {confirmAction.type === "approve"
                    ? "Approve"
                    : confirmAction.type === "decline"
                    ? "Decline"
                    : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Modal */}
      {mapVisible && selectedLocation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Doctor Location</h3>
              <button
                onClick={() => setMapVisible(false)}
                className="text-gray-700 hover:text-gray-900"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4">
              <div className="w-full h-96">
                {selectedLocation.lat !== 0 && selectedLocation.lng !== 0 ? (
                  <GoogleMap
                    mapContainerStyle={{ width: "100%", height: "100%" }}
                    center={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
                    zoom={15}
                  >
                    <Marker position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }} />
                  </GoogleMap>
                ) : (
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0, borderRadius: "8px" }}
                    src={`https://www.google.com/maps?q=${encodeURIComponent(
                      selectedLocation.address || ""
                    )}&z=16&output=embed`}
                    allowFullScreen
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Treatments Modal */}
      {treatmentsModal.open && treatmentsModal.doctor && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Available Treatments</h2>
              <button
                onClick={() => setTreatmentsModal({ open: false, doctor: null })}
                className="text-gray-700 hover:text-gray-900"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              {treatmentsModal.doctor.treatments && treatmentsModal.doctor.treatments.length > 0 ? (
                <div className="space-y-4">
                  {treatmentsModal.doctor.treatments.map((treatment, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">{treatment.mainTreatment}</h3>
                      {treatment.subTreatments && treatment.subTreatments.length > 0 && (
                        <ul className="list-disc pl-6 space-y-1">
                          {treatment.subTreatments.map((sub, subIdx) => (
                            <li key={subIdx} className="text-sm text-gray-700">
                              {sub.name}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BeakerIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-700">No treatments available for this doctor.</p>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setTreatmentsModal({ open: false, doctor: null })}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

AdminDoctors.getLayout = function PageLayout(page: React.ReactNode) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedDashboard: NextPageWithLayout = withAdminAuth(AdminDoctors);
ProtectedDashboard.getLayout = AdminDoctors.getLayout;

export default ProtectedDashboard;
