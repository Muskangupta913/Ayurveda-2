"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import AdminLayout from "../../components/AdminLayout";
import withAdminAuth from "../../components/withAdminAuth";
import type { NextPageWithLayout } from "../_app";
import {
  Search,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Grid,
  List,
  Key,
  Eye,
  EyeOff,
} from "lucide-react";

interface Doctor {
  _id: string;
  specialization: string;
  experience: string;
  address: string;
  resumeUrl?: string;
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

function AdminDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "pending" | "approved" | "declined"
  >("pending");
  const [settingId, setSettingId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy] = useState<string>("");
  const [sortOrder] = useState<string>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  // const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
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

  const itemsPerPage = 12;

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/getAllDoctors");
      setDoctors(res.data.doctorProfiles);
    } catch (err) {
      console.error("Failed to fetch doctors", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleAction = async (
    userId: string,
    action: "approve" | "decline" | "delete"
  ) => {
    try {
      await axios.post("/api/admin/action", { userId, action });
      fetchDoctors();
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleSetCredentials = async (userId: string) => {
    if (!newPassword.trim()) {
      // alert("Password is required");
      return;
    }
    try {
      await axios.post("/api/admin/setDoctorCredentials", {
        userId,
        password: newPassword,
      });
      setSettingId(null);
      setNewPassword("");
      fetchDoctors();
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error(err.message || "An error occurred");
    }
  };

  const filteredDoctors = doctors.filter((doc) => {
    const user = doc.user;
    if (!user) return false;

    // Filter by tab
    let tabMatch = false;
    if (activeTab === "pending")
      tabMatch = user.isApproved === false && user.declined === false;
    if (activeTab === "approved") tabMatch = user.isApproved === true;
    if (activeTab === "declined")
      tabMatch = user.isApproved === false && user.declined === true;

    if (!tabMatch) return false;

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.phone.toLowerCase().includes(searchLower) ||
        doc.specialization.toLowerCase().includes(searchLower) ||
        doc.address.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  const sortedDoctors = [...filteredDoctors].sort((a, b) => {
    let aValue = "";
    let bValue = "";

    switch (sortBy) {
      case "name":
        aValue = a.user?.name || "";
        bValue = b.user?.name || "";
        break;
      case "email":
        aValue = a.user?.email || "";
        bValue = b.user?.email || "";
        break;
      case "specialization":
        aValue = a.specialization || "";
        bValue = b.specialization || "";
        break;
      case "experience":
        aValue = a.experience || "";
        bValue = b.experience || "";
        break;
      default:
        aValue = a.user?.name || "";
        bValue = b.user?.name || "";
    }

    return sortOrder === "asc"
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });

  const totalPages = Math.ceil(sortedDoctors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDoctors = sortedDoctors.slice(
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
    const actions = {
      pending: ["approve", "decline", "delete"],
      approved: ["decline", "delete"],
      declined: ["approve", "delete"],
    };
    return actions[tab as keyof typeof actions] || [];
  };

  // const toggleExpansion = (doctorId: string) => {
  //   setExpandedCards((prev) => {
  //     const newSet = new Set(prev);
  //     if (newSet.has(doctorId)) {
  //       newSet.delete(doctorId);
  //     } else {
  //       newSet.add(doctorId);
  //     }
  //     return newSet;
  //   });
  // };

  const handleAddressClick = async (address: string) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json`,
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

  // Helper function to get tab button classes
  const getTabButtonClasses = (color: string, isActive: boolean) => {
    if (!isActive) {
      return "border-transparent text-black hover:text-gray-700 hover:border-gray-300";
    }

    switch (color) {
      case "yellow":
        return "border-yellow-500 text-yellow-600";
      case "green":
        return "border-green-500 text-green-600";
      case "red":
        return "border-red-500 text-red-600";
      default:
        return "border-gray-500 text-gray-600";
    }
  };

  // Helper function to get tab badge classes
  const getTabBadgeClasses = (color: string, isActive: boolean) => {
    if (!isActive) {
      return "bg-gray-100 text-black";
    }

    switch (color) {
      case "yellow":
        return "bg-yellow-100 text-yellow-800";
      case "green":
        return "bg-green-100 text-green-800";
      case "red":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const DoctorCard = ({ doctor }: { doctor: Doctor }) => {
    const actions = getTabActions(activeTab);
    const isEditing = settingId === doctor.user._id;
    const hasPassword =
      doctor.user.password && doctor.user.password.trim() !== "";

    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-300 hover:shadow-lg transition-all duration-200">
        <div className="p-3 sm:p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-black truncate">
                  {doctor.user.name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-700 truncate">
                  {doctor.specialization}
                </p>
                <p className="text-xs text-gray-600 break-all">
                  {doctor.user.email}
                </p>
                <div className="flex items-center text-xs sm:text-sm text-black">
                  <MapPin size={12} className="mr-2 flex-shrink-0" />
                  <span
                    className="text-blue-600 cursor-pointer break-all underline"
                    onClick={() => handleAddressClick(doctor.address)}
                  >
                    {doctor.address}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Info for Grid View */}
          {viewMode === "grid" && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center text-xs sm:text-sm text-black">
                <Phone size={12} className="mr-2 flex-shrink-0" />
                <span className="truncate">{doctor.user.phone}</span>
              </div>
              <div className="flex items-center text-xs sm:text-sm text-black">
                <Briefcase size={12} className="mr-2 flex-shrink-0" />
                <span className="truncate">{doctor.experience}</span>
              </div>
            </div>
          )}

          {/* Always Visible Content (Previously Expanded Content) */}
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
            {viewMode === "list" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center text-xs sm:text-sm text-black">
                  <Phone size={12} className="mr-2 flex-shrink-0" />
                  <span className="truncate">{doctor.user.phone}</span>
                </div>
                <div className="flex items-center text-xs sm:text-sm text-black">
                  <Briefcase size={12} className="mr-2 flex-shrink-0" />
                  <span className="truncate">{doctor.experience}</span>
                </div>
              </div>
            )}

            <div className="flex items-center text-xs sm:text-sm text-black">
              <Mail size={12} className="mr-2 flex-shrink-0" />
              <span>{doctor.user.email}</span>
            </div>

            {/* Password Management for Approved Doctors */}
            {activeTab === "approved" && (
              <div className="border-t pt-3">
                {isEditing ? (
                  <div key={doctor.user._id} className="space-y-2">
                    <div className="flex items-center text-xs sm:text-sm text-black mb-2">
                      <Key size={12} className="mr-2 flex-shrink-0" />
                      <span>Set Login Credentials</span>
                    </div>

                    {/* Password input with show/hide toggle */}
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="New Password"
                        className="w-full text-black border border-gray-300 rounded px-3 py-2 text-sm pr-10"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoFocus
                      />
                      <div
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-600"
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                        onClick={() => handleSetCredentials(doctor.user._id)}
                      >
                        Save
                      </button>
                      <button
                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
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
                    <div className="flex items-center text-xs sm:text-sm">
                      <Key size={12} className="mr-2 flex-shrink-0" />
                      {hasPassword ? (
                        <span className="text-green-600 font-medium">
                          ✅ Credentials Set
                        </span>
                      ) : (
                        <span className="text-gray-600">
                          No credentials set
                        </span>
                      )}
                    </div>
                    <button
                      className="text-blue-600 hover:text-blue-800 text-sm underline"
                      onClick={() => setSettingId(doctor.user._id)}
                    >
                      {hasPassword ? "Change Password" : "Set Credentials"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
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
                  className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex-1 sm:flex-none ${action === "approve"
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
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-black">Loading doctors...</p>
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
            Doctor Management Dashboard
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-700 mt-1">
            Manage doctor applications and approvals
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
                  count: counts.pending,
                  color: "yellow",
                },
                {
                  key: "approved",
                  label: "Approved",
                  count: counts.approved,
                  color: "green",
                },
                {
                  key: "declined",
                  label: "Declined",
                  count: counts.declined,
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
                  className={`py-2 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${getTabButtonClasses(
                    tab.color,
                    activeTab === tab.key
                  )}`}
                >
                  {tab.label}
                  <span
                    className={`ml-1 sm:ml-2 py-0.5 px-1.5 sm:px-2 rounded-full text-xs ${getTabBadgeClasses(
                      tab.color,
                      activeTab === tab.key
                    )}`}
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
                placeholder="Search doctors, specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-black w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        </div>

        {/* Results */}
        <div className="mb-3 sm:mb-4 text-xs sm:text-sm text-black">
          Showing {startIndex + 1}-
          {Math.min(startIndex + itemsPerPage, sortedDoctors.length)} of{" "}
          {sortedDoctors.length} doctors
        </div>

        {/* Doctors Grid/List */}
        {paginatedDoctors.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <User
              size={28}
              className="mx-auto text-gray-400 mb-3 sm:mb-4 sm:w-8 sm:h-8"
            />
            <h3 className="text-base sm:text-lg font-medium text-black mb-2">
              No doctors found
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
            {paginatedDoctors.map((doctor) => (
              <DoctorCard key={doctor.user._id} doctor={doctor} />
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
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 sm:w-8 sm:h-8 text-green-600"
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
                Are you sure you want to {confirmAction.type} this doctor?
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
                    setConfirmAction({ show: false, type: "", doctorId: null })
                  }
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium text-sm sm:text-base transition-all duration-200 hover:shadow-md"
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
                  className={`flex-1 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium text-sm sm:text-base transition-all duration-200 hover:shadow-md ${confirmAction.type === "approve"
                      ? "bg-green-500 hover:bg-green-600"
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
                Doctor Location
              </h3>
              <button
                onClick={() => setMapVisible(false)}
                className="text-gray-400 hover:text-black p-1 text-xl sm:text-2xl w-8 h-8 flex items-center justify-center"
                aria-label="Close map"
              >
                ×
              </button>
            </div>
            <div className="p-3 sm:p-4">
              <div className="w-full h-48 sm:h-64 md:h-96">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0, borderRadius: "8px" }}
                  src={`https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}&z=16&output=embed`}
                  allowFullScreen
                  aria-hidden="false"
                  tabIndex={0}
                  title="Doctor Location Map"
                />
              </div>
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
