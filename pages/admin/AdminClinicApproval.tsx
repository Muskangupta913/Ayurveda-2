"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import AdminLayout from "../../components/AdminLayout";
import withAdminAuth from "../../components/withAdminAuth";
import type { NextPageWithLayout } from "../_app";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useAgentPermissions } from "../../hooks/useAgentPermissions";
import {
  HomeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserGroupIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  BeakerIcon,
} from "@heroicons/react/24/outline";

interface Clinic {
  _id: string;
  name: string;
  address: string;
  pricing: string;
  timings: string;
  treatments: Array<{
    mainTreatment: string;
    mainTreatmentSlug: string;
    subTreatments: Array<{
      name: string;
      slug: string;
    }>;
  }>;
  photos: string[];
  owner: {
    name: string;
    email: string;
    phone?: string;
  };
}

interface GeocodeResponse {
  results: Array<{
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    formatted_address: string;
  }>;
  plus_code?: {
    global_code: string;
  };
}

function AdminClinicApproval() {
  const [clinics, setClinics] = useState<{
    pending: Clinic[];
    approved: Clinic[];
    declined: Clinic[];
  }>({
    pending: [],
    approved: [],
    declined: [],
  });
  const [activeTab, setActiveTab] = useState<
    "pending" | "approved" | "declined"
  >("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    show: boolean;
    type: string;
    clinicId: string | null;
  }>({
    show: false,
    type: "",
    clinicId: null,
  });
  const [plusCode, setPlusCode] = useState<string | null>(null);
  const [addressSummary, setAddressSummary] = useState<string | null>(null);
  const [selectedClinicForTreatments, setSelectedClinicForTreatments] = useState<Clinic | null>(null);

  const router = useRouter();
  
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
  
  const agentPermissionsData: any = useAgentPermissions(isAgent ? "admin_approval_clinic" : (null as any));
  const agentPermissions = isAgent ? agentPermissionsData?.permissions : null;
  const permissionsLoading = isAgent ? agentPermissionsData?.loading : false;

  const itemsPerPage = 12;

  useEffect(() => {
    if (isAdmin) {
      fetchClinics();
    } else if (isAgent && !permissionsLoading) {
      if (agentPermissions && (agentPermissions.canRead === true || agentPermissions.canAll === true)) {
        fetchClinics();
      }
    }
  }, [isAdmin, isAgent, permissionsLoading, agentPermissions]);

  const fetchClinics = async () => {
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

      const [pending, approved, declined] = await Promise.all([
        axios.get<{ clinics: Clinic[] }>("/api/admin/pending-clinics", {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => {
          if (err.response?.status === 403) {
            return { data: { clinics: [] } };
          }
          throw err;
        }),
        axios.get<{ clinics: Clinic[] }>("/api/admin/approved-clinics", {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => {
          if (err.response?.status === 403) {
            return { data: { clinics: [] } };
          }
          throw err;
        }),
        axios.get<{ clinics: Clinic[] }>("/api/admin/declined-clinics", {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => {
          if (err.response?.status === 403) {
            return { data: { clinics: [] } };
          }
          throw err;
        }),
      ]);

      setClinics({
        pending: pending.data.clinics || [],
        approved: approved.data.clinics || [],
        declined: declined.data.clinics || [],
      });
    } catch (error: any) {
      console.error("Failed to fetch clinics:", error);
      if (error.response?.status === 403) {
        setClinics({
          pending: [],
          approved: [],
          declined: [],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (type: string, clinicId: string) => {
    const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
    const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
    const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
    
    if ((isAgentRoute || isAgent) && agentTokenExists && !adminTokenExists && agentPermissions) {
      if ((type === "approve" || type === "decline") && agentPermissions.canApprove !== true && agentPermissions.canAll !== true) {
        alert("You do not have permission to approve/decline clinics");
        return;
      }
      if (type === "delete" && agentPermissions.canDelete !== true && agentPermissions.canAll !== true) {
        alert("You do not have permission to delete clinics");
        return;
      }
    }

    try {
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
      const token = adminToken || agentToken;

      if (!token) {
        alert("No token found. Please login again.");
        return;
      }

      const endpoints = {
        approve: "/api/admin/update-approve",
        decline: "/api/admin/update-decline",
        delete: "/api/admin/delete-clinic",
      };

      if (type === "delete") {
        await axios.request({
          url: endpoints[type as keyof typeof endpoints],
          method: 'DELETE',
          data: { clinicId },
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(endpoints[type as keyof typeof endpoints], {
          clinicId,
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      fetchClinics();
    } catch (error: any) {
      console.error(`Failed to ${type} clinic:`, error);
      alert(error.response?.data?.message || `Failed to ${type} clinic`);
    }
  };

  const handleAddressClick = async (address: string) => {
    try {
      const response = await axios.get<GeocodeResponse>(
        "https://maps.googleapis.com/maps/api/geocode/json",
        {
          params: { address, key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY },
        }
      );

      const location = response.data.results[0]?.geometry?.location;
      if (location) {
        setSelectedLocation(location);
        setMapVisible(true);
      }
    } catch (err) {
      console.error("Map fetch failed:", err);
    }
  };

  const currentClinics = clinics[activeTab];
  const filteredClinics = currentClinics.filter(
    (clinic) =>
      clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.owner?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredClinics.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClinics = filteredClinics.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const getTabActions = (tab: string) => {
    const allActions = {
      pending: ["approve", "decline", "delete"],
      approved: ["decline", "delete"],
      declined: ["approve", "delete"],
    };
    
    const availableActions = allActions[tab as keyof typeof allActions] || [];
    
    if (isAgent && !permissionsLoading && agentPermissions) {
      return availableActions.filter(action => {
        if (action === "approve" || action === "decline") {
          return agentPermissions.canApprove || agentPermissions.canAll;
        }
        if (action === "delete") {
          return agentPermissions.canDelete || agentPermissions.canAll;
        }
        return true;
      });
    }
    
    return availableActions;
  };

  const ClinicCard = ({ clinic }: { clinic: Clinic }) => {
    const actions = getTabActions(activeTab);

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
        <div className="p-6">
          {/* Header */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {clinic.name}
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <UserGroupIcon className="w-4 h-4" />
                <span>{clinic.owner?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <EnvelopeIcon className="w-4 h-4" />
                <span>{clinic.owner?.email}</span>
              </div>
              {clinic.owner?.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <PhoneIcon className="w-4 h-4" />
                  <span>{clinic.owner.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <MapPinIcon className="w-4 h-4" />
                <span className="truncate">{clinic.address}</span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="font-medium">Pricing:</span>
              <span>AED {clinic.pricing}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <ClockIcon className="w-4 h-4" />
              <span>{clinic.timings}</span>
            </div>
            <button
              onClick={() => {
                setSelectedClinicForTreatments(clinic);
              }}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 mt-2"
            >
              <BeakerIcon className="w-4 h-4" />
              <span>View Treatments ({clinic.treatments.length})</span>
            </button>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
            {actions.map((action) => (
              <button
                key={action}
                onClick={() =>
                  setConfirmAction({
                    show: true,
                    type: action,
                    clinicId: clinic._id,
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

  function convertToDMS(lat: number, lng: number) {
    function toDMS(deg: number, pos: string, neg: string) {
      const absolute = Math.abs(deg);
      const degrees = Math.floor(absolute);
      const minutesNotTruncated = (absolute - degrees) * 60;
      const minutes = Math.floor(minutesNotTruncated);
      const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(1);
      return `${degrees}°${minutes}'${seconds}\"${deg >= 0 ? pos : neg}`;
    }
    return `${toDMS(lat, "N", "S")} ${toDMS(lng, "E", "W")}`;
  }

  useEffect(() => {
    if (selectedLocation) {
      axios
        .get<GeocodeResponse>("https://maps.googleapis.com/maps/api/geocode/json", {
          params: {
            latlng: `${selectedLocation.lat},${selectedLocation.lng}`,
            key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
          },
        })
        .then((res) => {
          const plus = res.data.plus_code?.global_code || null;
          setPlusCode(plus);
          const summary = res.data.results?.[0]?.formatted_address || null;
          setAddressSummary(summary);
        })
        .catch(() => {
          setPlusCode(null);
          setAddressSummary(null);
        });
    }
  }, [selectedLocation]);

  const hasReadPermission = isAdmin || (isAgent && agentPermissions && (agentPermissions.canRead === true || agentPermissions.canAll === true));

  if (loading || (isAgent && permissionsLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading clinics...</p>
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
            You do not have permission to view clinic approvals.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Clinic Management
              </h1>
              <p className="text-gray-700">
                Manage clinic applications and approvals
              </p>
            </div>
            <button
              onClick={fetchClinics}
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
            { title: 'Pending', value: clinics.pending.length, icon: ClockIcon, color: 'bg-yellow-500' },
            { title: 'Approved', value: clinics.approved.length, icon: CheckCircleIcon, color: 'bg-green-500' },
            { title: 'Declined', value: clinics.declined.length, icon: XCircleIcon, color: 'bg-red-500' },
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
                { key: "pending", label: "Pending", count: clinics.pending.length, color: "yellow" },
                { key: "approved", label: "Approved", count: clinics.approved.length, color: "green" },
                { key: "declined", label: "Declined", count: clinics.declined.length, color: "red" },
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
                placeholder="Search clinics, owners, addresses..."
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
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredClinics.length)} of {filteredClinics.length} clinics
          </div>

          {/* Clinics Grid/List */}
          {paginatedClinics.length === 0 ? (
            <div className="text-center py-12">
              <HomeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No clinics found</h3>
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
              {paginatedClinics.map((clinic) => (
                <ClinicCard key={clinic._id} clinic={clinic} />
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
                Are you sure you want to {confirmAction.type} this clinic?
                {confirmAction.type === "delete" && (
                  <span className="block mt-2 text-red-600 font-medium">
                    This action cannot be undone.
                  </span>
                )}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setConfirmAction({ show: false, type: "", clinicId: null })
                  }
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (confirmAction.clinicId) {
                      await handleAction(
                        confirmAction.type,
                        confirmAction.clinicId
                      );
                    }
                    setConfirmAction({ show: false, type: "", clinicId: null });
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
              <h3 className="text-lg font-semibold text-gray-900">Clinic Location</h3>
              <button
                onClick={() => setMapVisible(false)}
                className="text-gray-700 hover:text-gray-900 p-1"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-sm text-gray-700">
                    {convertToDMS(selectedLocation.lat, selectedLocation.lng)}
                  </span>
                  {plusCode && (
                    <span className="text-sm text-gray-700">
                      {plusCode} {addressSummary}
                    </span>
                  )}
                </div>
                <div className="flex gap-3 mt-3">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedLocation.lat},${selectedLocation.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-700 hover:text-gray-900 font-medium underline"
                  >
                    Directions
                  </a>
                  <a
                    href={`https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-700 hover:text-gray-900 font-medium underline"
                  >
                    View larger map
                  </a>
                </div>
              </div>
              <div className="w-full h-96">
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  center={selectedLocation}
                  zoom={15}
                >
                  <Marker position={selectedLocation} />
                </GoogleMap>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Treatments Modal */}
      {selectedClinicForTreatments && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Available Treatments</h2>
              <button
                onClick={() => setSelectedClinicForTreatments(null)}
                className="text-gray-700 hover:text-gray-900"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <div className="space-y-4">
                {selectedClinicForTreatments.treatments.map((treatment, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">{treatment.mainTreatment}</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      {treatment.subTreatments.map((subTreatment, subIndex) => (
                        <li key={subIndex} className="text-sm text-gray-700">
                          {subTreatment.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setSelectedClinicForTreatments(null)}
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

AdminClinicApproval.getLayout = function PageLayout(page: React.ReactNode) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedDashboard: NextPageWithLayout =
  withAdminAuth(AdminClinicApproval);
ProtectedDashboard.getLayout = AdminClinicApproval.getLayout;

export default ProtectedDashboard;
