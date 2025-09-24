"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import AdminLayout from "../../components/AdminLayout";
import withAdminAuth from "../../components/withAdminAuth";
import type { NextPageWithLayout } from "../_app";
import { GoogleMap, Marker } from "@react-google-maps/api";
import {
  Search,
  MapPin,
  Clock,
  X,
  Grid,
  List,
  User,
  Mail,
  Phone,
} from "lucide-react";

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
    phone?: string; // <-- Add phone here
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
  const [sortBy] = useState<string>("");
  const [sortOrder] = useState<string>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  // const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
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
  const [showTreatmentsPopup, setShowTreatmentsPopup] = useState(false);
  // Clinic state
  const [selectedClinic] = useState<Clinic | null>(null);

  const itemsPerPage = 12;

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    setLoading(true);
    try {
      const [pending, approved, declined] = await Promise.all([
        axios.get<{ clinics: Clinic[] }>("/api/admin/pending-clinics"),
        axios.get<{ clinics: Clinic[] }>("/api/admin/approved-clinics"),
        axios.get<{ clinics: Clinic[] }>("/api/admin/declined-clinics"),
      ]);

      setClinics({
        pending: pending.data.clinics,
        approved: approved.data.clinics,
        declined: declined.data.clinics,
      });
    } catch (error) {
      console.error("Failed to fetch clinics:", error);
    } finally {
      setLoading(false);
    }
  };



  const handleAction = async (type: string, clinicId: string) => {
    try {
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
        });
      } else {
        await axios.post(endpoints[type as keyof typeof endpoints], {
          clinicId,
        });
      }
      fetchClinics();
    } catch {
      // console.error(`Failed to ${type} clinic:`, error);
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

  const sortedClinics = [...filteredClinics].sort((a, b) => {
    if (!sortBy) return 0; // No sorting if sortBy is empty

    let aValue: string;
    let bValue: string;

    if (sortBy === "owner") {
      aValue = a.owner?.name || "";
      bValue = b.owner?.name || "";
    } else {
      aValue = (a[sortBy as keyof Clinic] as string) || "";
      bValue = (b[sortBy as keyof Clinic] as string) || "";
    }

    // Ensure values are strings before calling localeCompare
    const aStr = String(aValue);
    const bStr = String(bValue);

    return sortOrder === "asc"
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });

  const totalPages = Math.ceil(sortedClinics.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClinics = sortedClinics.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const getTabActions = (tab: string) => {
    const actions = {
      pending: ["approve", "decline", "delete"],
      approved: ["decline", "delete"],
      declined: ["approve", "delete"],
    };
    return actions[tab as keyof typeof actions] || [];
  };

  // const toggleExpansion = (clinicId: string) => {
  //   setExpandedCards((prev) => {
  //     const newSet = new Set(prev);
  //     if (newSet.has(clinicId)) {
  //       newSet.delete(clinicId);
  //     } else {
  //       newSet.add(clinicId);
  //     }
  //     return newSet;
  //   });
  // };

  const ClinicCard = ({ clinic }: { clinic: Clinic }) => {
    // const isExpanded = expandedCards.has(clinic._id);
    const actions = getTabActions(activeTab);
    // Image popup state (commented out as it's not currently used)
    // const [_, setImagePopup] = useState<{
    //   show: boolean;
    //   image: string | null;
    // }>({ show: false, image: null });
    const [showTreatmentsPopup, setShowTreatmentsPopup] = useState(false);

    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200 relative">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {clinic.name}
              </h3>
              <p className="text-sm text-gray-600">
                <User size={16} className="inline-block mr-1" />{" "}
                {clinic.owner?.name}
              </p>
              <p className="text-sm text-gray-500">
                <Mail size={16} className="inline-block mr-1" />{" "}
                {clinic.owner?.email}
              </p>
              {clinic.owner?.phone && (
                <p className="text-sm text-gray-500">
                  <Phone size={16} className="inline-block mr-1" />{" "}
                  {clinic.owner.phone}
                </p>
              )}
              <p className="text-sm text-gray-500">
                <MapPin size={16} className="inline-block mr-1" />{" "}
                {clinic.address}
              </p>
            </div>
          </div>

          {/* Quick Info */}
          <div className="mt-2 space-y-2">
            <div className="flex items-center text-sm text-blue-800">
              <MapPin size={16} className="mr-2" />
              <span
                className="underline cursor-pointer"
                onClick={() => handleAddressClick(clinic.address)}
              >
                {clinic.address}
              </span>
            </div>
            <div className="flex items-center text-sm text-gray-800">
              <span> AED {clinic.pricing}</span>
            </div>
            <div className="flex items-center text-sm text-gray-800">
              <Clock size={16} className="mr-2" />
              <span>{clinic.timings}</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              <button
                className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs hover:bg-blue-600"
                onClick={() => {
                  setShowTreatmentsPopup(true);
                }}
              >
                Show Treatments
              </button>
            </div>
          </div>

          {/* Image and Actions */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 mt-2 sm:mt-0">
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
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${action === "approve"
                      ? "bg-green-500 hover:bg-green-600 text-white"
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

        {/* Treatments Pop-up */}
        {showTreatmentsPopup && (
          <div className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto transform transition-all duration-300 ease-out">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#2D9AA5] to-[#3BB5C1] rounded-t-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
                <div className="relative">
                  <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    Available Treatments
                  </h2>
                  <p className="text-white/90 text-sm">
                    Our comprehensive medical services
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  {clinic.treatments.map((treatment, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-2 p-3 rounded-xl bg-gray-50 hover:bg-[#2D9AA5]/5 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-[#2D9AA5] group-hover:scale-125 transition-transform"></div>
                        <span className="text-gray-800 font-medium text-sm group-hover:text-[#2D9AA5] transition-colors">
                          {treatment.mainTreatment}
                        </span>
                      </div>
                      <ul className="list-disc pl-6">
                        {treatment.subTreatments.map(
                          (subTreatment, subIndex) => (
                            <li
                              key={subIndex}
                              className="text-gray-600 text-xs"
                            >
                              {subTreatment.name}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 pt-0">
                <button
                  className="w-full bg-[#2D9AA5] text-white py-3 px-6 rounded-xl font-semibold hover:bg-[#2D9AA5]/90 active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl"
                  onClick={() => setShowTreatmentsPopup(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
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


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-black">Loading clinics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-black">
            Clinic Management Dashboard
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-700 mt-1">
            Manage clinic applications and approvals
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Tabs */}
        <div className="mb-4 sm:mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-3 sm:space-x-6 overflow-x-auto">
              {[
                {
                  key: "pending",
                  label: "Pending",
                  count: clinics.pending.length,
                  color: "yellow",
                },
                {
                  key: "approved",
                  label: "Approved",
                  count: clinics.approved.length,
                  color: "green",
                },
                {
                  key: "declined",
                  label: "Declined",
                  count: clinics.declined.length,
                  color: "red",
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(
                      tab.key as "pending" | "approved" | "declined"
                    );
                    setCurrentPage(1);
                  }}
                  className={`py-2 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${activeTab === tab.key
                      ? `border-[#2D9AA5] text-[#2D9AA5]`
                      : "border-transparent text-black hover:text-gray-700 hover:border-gray-300"
                    }`}
                >
                  {tab.label}
                  <span
                    className={`ml-1 sm:ml-2 py-0.5 px-1.5 sm:px-2 rounded-full text-xs ${activeTab === tab.key
                        ? `bg-[#2D9AA5]/10 text-[#2D9AA5]`
                        : "bg-gray-100 text-black"
                      }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={14}
              />
              <input
                type="text"
                placeholder="Search clinics, owners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-black w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
              <button
                onClick={() => setViewMode("grid")}
                className="text-black flex items-center px-2.5 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Grid size={12} className="sm:hidden" />
                <Grid size={14} className="hidden sm:block" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className="text-black flex items-center px-2.5 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <List size={12} className="sm:hidden" />
                <List size={14} className="hidden sm:block" />
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {/* Removed Filters Panel */}

          {/* Bulk Actions */}
          {/* Removed Bulk Actions section as multi-selection is removed */}
        </div>

        {/* Results */}
        <div className="mb-3 sm:mb-4 text-xs sm:text-sm text-black">
          Showing {startIndex + 1}-
          {Math.min(startIndex + itemsPerPage, sortedClinics.length)} of{" "}
          {sortedClinics.length} clinics
        </div>

        {/* Clinics Grid/List */}
        {paginatedClinics.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Search
              size={28}
              className="mx-auto text-gray-400 mb-3 sm:mb-4 sm:w-8 sm:h-8"
            />
            <h3 className="text-base sm:text-lg font-medium text-black mb-2">
              No clinics found
            </h3>
            <p className="text-sm sm:text-base text-gray-600">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6"
                : "space-y-3 sm:space-y-4"
            }
          >
            {paginatedClinics.map((clinic) => (
              <ClinicCard key={clinic._id} clinic={clinic} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <div className="text-xs sm:text-sm text-black order-2 sm:order-1">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 sm:px-4 py-2 border border-gray-300 rounded-md text-xs sm:text-sm text-black bg-white hover:bg-gray-50 disabled:opacity-50 min-w-[70px] sm:min-w-[80px]"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 sm:px-4 py-2 border border-gray-300 rounded-md text-xs sm:text-sm text-black bg-white hover:bg-gray-50 disabled:opacity-50 min-w-[60px] sm:min-w-[70px]"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmAction.show && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/20 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-8 max-w-xs sm:max-w-md w-full transform transition-all duration-300 ease-out mx-3 sm:mx-0">
            <div className="text-center">
              {/* Icon based on action type */}
              <div className="mx-auto mb-3 sm:mb-4 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center">
                {confirmAction.type === "approve" && (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#2D9AA5]/10 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 sm:w-8 sm:h-8 text-[#2D9AA5]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
                {confirmAction.type === "decline" && (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                )}
                {confirmAction.type === "delete" && (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 sm:w-8 sm:h-8 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Title */}
              <h2 className="text-lg sm:text-2xl font-bold text-gray-800 mb-2 capitalize">
                Confirm {confirmAction.type}
              </h2>

              {/* Message */}
              <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                Are you sure you want to {confirmAction.type} this clinic?
                {confirmAction.type === "delete" && (
                  <span className="block mt-2 text-red-600 font-medium text-sm">
                    This action cannot be undone.
                  </span>
                )}
              </p>

              {/* Action Buttons */}
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() =>
                    setConfirmAction({ show: false, type: "", clinicId: null })
                  }
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium text-sm sm:text-base transition-all duration-200 hover:shadow-md"
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
                  className={`flex-1 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium text-sm sm:text-base transition-all duration-200 hover:shadow-md ${confirmAction.type === "approve"
                      ? "bg-[#2D9AA5] hover:bg-[#2D9AA5]/90"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xs sm:max-w-4xl max-h-[90vh] sm:max-h-[90vh] overflow-hidden mx-2 sm:mx-0">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b">
              <h3 className="text-base sm:text-lg font-semibold text-black">
                Clinic Location
              </h3>
              <button
                onClick={() => setMapVisible(false)}
                className="text-gray-400 hover:text-black p-1"
                aria-label="Close map"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>
            <div className="p-3 sm:p-4">
              {/* Info Box */}
              <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-100 rounded shadow flex flex-col gap-2">
                <div className="flex flex-col">
                  <span className="font-mono text-xs sm:text-sm text-black break-all">
                    {convertToDMS(selectedLocation.lat, selectedLocation.lng)}
                  </span>
                  {plusCode && (
                    <span className="text-xs text-gray-700 break-all">
                      {plusCode} {addressSummary}
                    </span>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedLocation.lat},${selectedLocation.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2D9AA5] hover:underline text-xs sm:text-sm font-medium"
                  >
                    Directions
                  </a>
                  <a
                    href={`https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2D9AA5] hover:underline text-xs sm:text-sm font-medium"
                  >
                    View larger map
                  </a>
                </div>
              </div>
              <div className="w-full h-48 sm:h-64 md:h-96">
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
      {showTreatmentsPopup && selectedClinic && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4">Treatments</h2>
            <ul className="list-disc pl-5">
              {selectedClinic.treatments.map((treatment, index) => (
                <li key={index} className="mb-2">
                  {treatment.mainTreatment}
                </li>
              ))}
            </ul>
            <button
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={() => setShowTreatmentsPopup(false)}
            >
              Close
            </button>
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
