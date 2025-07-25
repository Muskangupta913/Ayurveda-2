import React from "react";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import DoctorLayout from "../../components/DoctorLayout";
import toast from "react-hot-toast";
import withDoctorAuth from "../../components/withDoctorAuth";
import type { NextPageWithLayout } from "../_app";
import Image from 'next/image';


interface User {
  name: string;
  email: string;
  phone: string;
}

interface TimeSlot {
  date: string;
  availableSlots: number;
  sessions: {
    morning: string[];
    evening: string[];
  };
}

interface DoctorProfile {
  user: string;
  degree: string;
  experience: number;
  address: string;
  treatment: string[];
  consultationFee: string;
  clinicContact: string;
  timeSlots: TimeSlot[];
  location?: {
    coordinates: [number, number];
  };
  photos?: string[];
}

interface DoctorData {
  user: User;
  doctorProfile: DoctorProfile;
}

interface FormData {
  userId: string;

  degree: string;
  experience: string;
  address: string;
  treatment: string[];
  consultationFee: string;
  clinicContact: string;
  phone: string;
  timeSlots: string;
  latitude: string;
  longitude: string;
}

function DoctorDashboard() {
  const [data, setData] = useState<DoctorData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [form, setForm] = useState<FormData>({
    userId: "",

    degree: "",
    experience: "",
    address: "",
    treatment: [],
    consultationFee: "",
    clinicContact: "",
    phone: "",
    timeSlots: "",
    latitude: "",
    longitude: "",
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [photoFiles, setPhotoFiles] = useState<FileList | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [resumeError, setResumeError] = useState("");
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [treatments, setTreatments] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [geocodingStatus, setGeocodingStatus] = useState<string>("");
  const addressDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchTreatments = async () => {
      try {
        const res = await axios.get("/api/doctor/getTreatment");
        setTreatments(res.data.treatments.map((t: { treatment_name: string }) => t.treatment_name));
      } catch {
        console.error("Error fetching treatments");
      }
    };
    fetchTreatments();
  }, []);

  useEffect(() => {
    const fetchDoctorData = async () => {
      const token = localStorage.getItem("doctorToken");
      if (!token) {
        setError("Not authorized");
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get("/api/doctor/manage", {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Doctor data fetched:", res.data); // Debug log
        setData(res.data);

        const parsedSlots = res.data.doctorProfile?.timeSlots || [];
        setTimeSlots(parsedSlots);

        const treatmentArray = Array.isArray(res.data.doctorProfile?.treatment)
          ? res.data.doctorProfile.treatment
          : [];
        setSelectedTreatments(treatmentArray);

        setForm({
          userId: res.data.doctorProfile?.user || "",
          degree: res.data.doctorProfile?.degree || "",
          experience: res.data.doctorProfile?.experience?.toString() || "",
          address: res.data.doctorProfile?.address || "",
          treatment: treatmentArray,
          consultationFee: res.data.doctorProfile?.consultationFee || "",
          clinicContact: res.data.doctorProfile?.clinicContact || "",
          phone: res.data.user?.phone || "",
          timeSlots: JSON.stringify(parsedSlots),
          latitude:
            res.data.doctorProfile?.location?.coordinates?.[1]?.toString() ||
            "",
          longitude:
            res.data.doctorProfile?.location?.coordinates?.[0]?.toString() ||
            "",
        });
      } catch (err: unknown) {
        if (err && typeof err === 'object' && err !== null && 'response' in err) {
          // @ts-expect-error: err.response may not be typed
          setError(err.response?.data?.message || "Failed to load data");
        } else {
          setError("Failed to load data");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDoctorData();
  }, []);

  const addTimeSlot = () => {
    const newSlot: TimeSlot = {
      date: "",
      availableSlots: 0,
      sessions: { morning: [], evening: [] },
    };
    const updated = [...timeSlots, newSlot];
    setTimeSlots(updated);
    setForm({ ...form, timeSlots: JSON.stringify(updated) });
  };

  const removeTimeSlot = (index: number) => {
    const updated = timeSlots.filter((_, i) => i !== index);
    setTimeSlots(updated);
    setForm({ ...form, timeSlots: JSON.stringify(updated) });
  };

  const updateTimeSlot = (index: number, field: string, value: string | number | string[]) => {
    const updated = [...timeSlots];
    if (field === "sessions.morning" || field === "sessions.evening") {
      const session = field.split(".")[1] as "morning" | "evening";
      updated[index].sessions[session] = (typeof value === 'string' ? value.split(",").map((s) => s.trim()).filter(Boolean) : value) as string[];
    } else {
      if (field === "date") {
        updated[index].date = value as string;
      } else if (field === "availableSlots") {
        updated[index].availableSlots = Number(value);
      }
    }
    setTimeSlots(updated);
    setForm({ ...form, timeSlots: JSON.stringify(updated) });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (file.size > 1024 * 1024) {
        setResumeError("File is too large and you have to upload file less than one mb only");
        setResumeFile(null);
      } else {
        setResumeFile(file);
        setResumeError("");
      }
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Check all selected files for size
      const tooLarge = Array.from(e.target.files).some(file => (file as File).size > 1024 * 1024);
      if (tooLarge) {
        setPhotoError("File is too large and you have to upload file less than one mb only");
        setPhotoFiles(null);
      } else {
        setPhotoFiles(e.target.files);
        setPhotoError("");
      }
    }
  };

  const handleTreatmentToggle = (treatment: string) => {
    const updatedTreatments = selectedTreatments.includes(treatment)
      ? selectedTreatments.filter((t) => t !== treatment)
      : [...selectedTreatments, treatment];

    setSelectedTreatments(updatedTreatments);
    setForm({ ...form, treatment: updatedTreatments });
    setIsDropdownOpen(false); // Close dropdown after selection
  };

  const handleCustomTreatmentAdd = (e: React.FocusEvent<HTMLInputElement>) => {
    const customTreatments = e.target.value
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (customTreatments.length > 0) {
      const updatedTreatments = [...selectedTreatments, ...customTreatments];
      setSelectedTreatments(updatedTreatments);
      setForm({ ...form, treatment: updatedTreatments });
      e.target.value = "";
    }
  };

  // Geocode address and update coordinates in form
  const geocodeAddress = async (address: string) => {
    if (!address.trim()) return;
    setGeocodingStatus("Locating address...");
    try {
      const res = await axios.get("/api/clinics/geocode", {
        params: { place: address },
      });
      if (
        res.data &&
        typeof res.data.lat === "number" &&
        typeof res.data.lng === "number"
      ) {
        setForm((prev) => ({
          ...prev,
          latitude: res.data.lat.toString(),
          longitude: res.data.lng.toString(),
        }));
        setGeocodingStatus("Address located on map!");
        setTimeout(() => setGeocodingStatus(""), 2000);
      } else {
        setGeocodingStatus(
          "Could not locate address. Please check the address."
        );
        setTimeout(() => setGeocodingStatus(""), 4000);
      }
    } catch {
      setGeocodingStatus("Geocoding failed. Please check the address.");
      setTimeout(() => setGeocodingStatus(""), 4000);
    }
  };

  // Enhanced address change handler with debounce and geocoding
  const handleAddressChangeWithGeocode = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, address: value }));
    if (addressDebounceTimer.current)
      clearTimeout(addressDebounceTimer.current);
    if (value.trim().length > 10) {
      addressDebounceTimer.current = setTimeout(() => {
        geocodeAddress(value);
      }, 1000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("doctorToken");
    const formData = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => formData.append(`${key}[]`, String(v)));
      } else {
        formData.append(key, String(value));
      }
    });

    if (resumeFile) formData.append("resume", resumeFile);

    if (photoFiles) {
      Array.from(photoFiles).forEach((file) => {
        formData.append("photos", file as Blob);
      });
    }

    try {
      const res = await axios.put("/api/doctor/edit-profile", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Profile updated successfully");
      setIsEditing(false);
      setData({ ...data!, doctorProfile: res.data.profile });
    } catch {
      toast.error("Please update at least one field.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-black">
            Loading doctor details...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-black">No data available</p>
        </div>
      </div>
    );
  }

  const { user, doctorProfile } = data;

  return (
    <div className="min-h-screen bg-white pb-safe pt-safe">
      {/* <Toaster position="top-right" /> */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 lg:py-16">
        {!isEditing ? (
          /* Professional Profile View */
          <div className="space-y-8">
            {/* Header Section */}
            <div className="bg-white rounded-2xl p-4 sm:p-8 shadow-lg border border-gray-200 relative overflow-hidden min-w-0">
              {/* Wave Background Effect */}
              <div className="absolute inset-0 pointer-events-none">
                <svg
                  className="absolute bottom-0 left-0 w-full h-full opacity-15"
                  viewBox="0 0 1000 200"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,100 C150,200 350,0 500,100 C650,200 850,0 1000,100 L1000,200 L0,200 Z"
                    fill="url(#wave-gradient)"
                  />
                  <defs>
                    <linearGradient
                      id="wave-gradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#1E40AF" />
                      <stop offset="50%" stopColor="#7C3AED" />
                      <stop offset="100%" stopColor="#0891B2" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              {/* Floating Circle Decorations */}
              <div className="absolute top-2 right-2 w-12 h-12 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-sm"></div>
              <div className="absolute top-8 right-8 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-indigo-400/8 to-cyan-400/8 rounded-full blur-md"></div>
              <div className="absolute bottom-4 left-4 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-full blur-sm"></div>
              {/* Existing header content goes here, with relative z-10 */}
              <div className="flex flex-col sm:flex-row items-center justify-between relative z-10 gap-4 sm:gap-0">
                <div className="flex items-center space-x-4 sm:space-x-6">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center">
                    <svg
                      className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-[#9812fa] break-words">
                      Dr. {user.name}
                    </h1>
                    {/* <p className="text-lg sm:text-xl mb-1 text-[#646c7d] break-words">
                      {doctorProfile.specialization}
                    </p> */}
                    <p className="text-[#646c7d] break-words">
                      {doctorProfile.degree}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-4 sm:mt-6 lg:mt-0 bg-white text-blue-600 px-6 sm:px-8 py-2 sm:py-3 rounded-xl font-semibold hover:bg-blue-50 transition duration-200 shadow-lg w-full sm:w-auto"
                >
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Left Column - Main Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Contact Information */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
                  <h3 className="text-lg sm:text-xl font-semibold text-black mb-4">
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-black font-medium">Email</p>
                        <p className="text-black">{user.email}</p>
                      </div>
                    </div>
                    {/* <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-black font-medium">Phone</p>
                        <p className="text-black">{user.phone}</p>
                      </div>
                    </div> */}
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-purple-600"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-black font-medium">
                          Contact
                        </p>
                        <p className="text-black">
                          {doctorProfile.clinicContact || "Not provided"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-orange-600"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <text
                            x="2"
                            y="16"
                            fontSize="23"
                            fontWeight="bold"
                            fill="currentColor"
                          >
                            د.إ
                          </text>
                        </svg>

                      </div>
                      <div>
                        <p className="text-sm text-black font-medium">
                          Consultation Fee
                        </p>
                        <p className="text-black">
                          AED {doctorProfile.consultationFee || "Not set"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Details */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
                  <h3 className="text-lg sm:text-xl font-semibold text-black mb-4">
                    Professional Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <p className="text-sm text-black font-medium mb-1">
                        Experience
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {doctorProfile.experience} years
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-black font-medium mb-1">
                        Address
                      </p>
                      <p className="text-black">{doctorProfile.address}</p>
                    </div>
                  </div>
                </div>

                {/* Treatments */}
                {doctorProfile.treatment &&
                  doctorProfile.treatment.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
                      <h3 className="text-lg sm:text-xl font-semibold text-black mb-4">
                        Treatments Offered
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {doctorProfile.treatment.map((treatment, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium"
                          >
                            {treatment}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Doctor Profile */}
                {doctorProfile.photos && doctorProfile.photos.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
                    <h3 className="text-lg sm:text-xl font-semibold text-black mb-4">
                      Doctor Profile
                    </h3>
                    <div className="flex flex-wrap gap-4">
                      {doctorProfile.photos.map((photo, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-center w-32 h-32 sm:w-40 sm:h-40 bg-gray-100 overflow-hidden rounded-xl"
                        >
                          <Image
                            src={photo}
                            alt={`Clinic photo ${index + 1}`}
                            width={160}
                            height={160}
                            className="object-contain w-full h-full"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                )}

              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-6">
                {/* Available Time Slots */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
                  <h3 className="text-lg sm:text-xl font-semibold text-black mb-4">
                    Available Time Slots
                  </h3>
                  {timeSlots && timeSlots.length > 0 ? (
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                      {timeSlots.map((slot, index) => (
                        <div
                          key={index}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-black">
                              {slot.date}
                            </h4>
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                              {slot.availableSlots} slots
                            </span>
                          </div>
                          <div className="space-y-2">
                            {slot.sessions.morning.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-black">
                                  Morning
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {slot.sessions.morning.map((session, idx) => (
                                    <span
                                      key={idx}
                                      className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs"
                                    >
                                      {session}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {slot.sessions.evening.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-black">
                                  Evening
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {slot.sessions.evening.map((session, idx) => (
                                    <span
                                      key={idx}
                                      className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs"
                                    >
                                      {session}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-black">No time slots available</p>
                  )}
                </div>

                {/* Location Info */}
                {/* {doctorProfile.location && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-xl font-semibold text-black mb-4">Location</h3>
                    <div className="space-y-2">
                      <p className="text-sm text-black"><span className="font-medium">Latitude:</span> {doctorProfile.location.coordinates[1]}</p>
                      <p className="text-sm text-black"><span className="font-medium">Longitude:</span> {doctorProfile.location.coordinates[0]}</p>
                    </div>
                  </div>
                )} */}
              </div>
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="absolute top-2 sm:top-4 left-2 sm:left-4 flex items-center px-3 sm:px-4 py-2 bg-white text-blue-600 rounded-full shadow hover:bg-blue-50 transition z-20"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back
              </button>
              {/* Wave Background Effect and Floating Circles here, then header content */}
              <div className="p-4 pt-12 sm:p-6 sm:pt-16">
                {/* Add pt-16 for spacing below the button */}
                <h2 className="text-xl sm:text-2xl font-bold text-[#9812fa]">
                  Edit Profile
                </h2>
                <p className="text-[#646c7d]">
                  Update your professional information
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-8">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-black mb-4">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {[
                    "degree",
                    "experience",
                    "consultationFee",
                    "clinicContact",
                    "phone",
                  ].map((field) => (
                    <div
                      key={field}
                      className={field === "phone" ? "hidden" : ""}
                    >
                      <label className="block text-sm font-medium text-black mb-2 capitalize">
                        {field
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())}
                      </label>

                      {/* ✅ Add description just above clinicContact input */}
                      {field === "clinicContact" && (
                        <p className="text-xs text-gray-500 mb-1">
                          This contact will help you get in touch with patients
                          professionally.
                        </p>
                      )}

                      <input
                        name={field}
                        type={
                          field === "experience" || field === "consultationFee"
                            ? "number"
                            : "text"
                        }
                        value={form[field as keyof FormData] as string}
                        onChange={handleChange}
                        disabled={field === "phone"} // ✅ Still disabled if needed
                        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-black bg-white ${field === "phone"
                          ? "cursor-not-allowed bg-gray-100"
                          : ""
                          }`}
                        placeholder={`Enter ${field
                          .replace(/([A-Z])/g, " $1")
                          .toLowerCase()}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Address and Location */}
              <div>
                <h3 className="text-lg font-semibold text-black mb-4">
                  Location
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-black mb-2">
                      Address
                    </label>
                    <input
                      name="address"
                      value={form.address}
                      onChange={handleAddressChangeWithGeocode}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition duration-200 text-black"
                      placeholder="Enter address"
                    />
                    {geocodingStatus && (
                      <span className="text-green-600 text-xs ml-2">
                        {geocodingStatus}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Latitude
                    </label>
                    <input
                      name="latitude"
                      value={form.latitude}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-black cursor-not-allowed"
                      placeholder="Auto-filled"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Longitude
                    </label>
                    <input
                      name="longitude"
                      value={form.longitude}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-black cursor-not-allowed"
                      placeholder="Auto-filled"
                    />
                  </div>
                </div>
              </div>

              {/* Treatments */}
              <div>
                <h3 className="text-lg font-semibold text-black mb-4">
                  Treatments
                </h3>
                <div className="space-y-4">
                  <div className="relative" ref={dropdownRef}>
                    <label className="block text-sm font-medium text-black mb-2">
                      Select Treatments
                    </label>
                    <div
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white cursor-pointer flex items-center justify-between text-black"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      <span className="truncate">
                        {selectedTreatments.length > 0
                          ? `${selectedTreatments.length} treatment(s) selected`
                          : "Select treatments"}
                      </span>
                      <svg
                        className={`w-5 h-5 transition-transform ${isDropdownOpen ? "rotate-180" : ""
                          }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>

                    {isDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {treatments.map((treatment, index) => (
                          <div
                            key={index}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center text-black"
                            onClick={() => handleTreatmentToggle(treatment)}
                          >
                            <input
                              type="checkbox"
                              checked={selectedTreatments.includes(treatment)}
                              onChange={() => { }}
                              className="mr-3 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <span className="text-black">{treatment}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected Treatments Display */}
                  {selectedTreatments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedTreatments.map((treatment, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center"
                        >
                          {treatment}
                          <button
                            type="button"
                            onClick={() => handleTreatmentToggle(treatment)}
                            className="ml-2 text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Custom Treatment Input - Show after selecting any treatment */}
                  {selectedTreatments.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Add Custom Treatments
                      </label>
                      <input
                        type="text"
                        placeholder="Enter custom treatments (comma-separated)"
                        onBlur={handleCustomTreatmentAdd}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition duration-200 text-black placeholder-gray-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 sm:gap-0">
                  <h3 className="text-lg font-semibold text-black">
                    Time Slots
                  </h3>
                  <button
                    type="button"
                    onClick={addTimeSlot}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition duration-200 shadow-md hover:shadow-lg w-full sm:w-auto"
                  >
                    + Add Slot
                  </button>
                </div>

                <div className="space-y-6">
                  {timeSlots.map((slot, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-xl p-6 border border-gray-200"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-black">
                          Time Slot {index + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeTimeSlot(index)}
                          className="text-red-600 hover:text-red-800 font-medium transition-colors"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-black mb-2">
                            Date
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 4 July"
                            value={slot.date}
                            onChange={(e) =>
                              updateTimeSlot(index, "date", e.target.value)
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition duration-200 text-black placeholder-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-black mb-2">
                            Available Slots
                          </label>
                          <input
                            type="number"
                            placeholder="Number of slots"
                            value={slot.availableSlots}
                            onChange={(e) =>
                              updateTimeSlot(
                                index,
                                "availableSlots",
                                e.target.value
                              )
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition duration-200 text-black placeholder-gray-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-black mb-2">
                            Morning Sessions
                          </label>
                          <input
                            type="text"
                            placeholder="09:00 AM - 09:30 AM, 10:00 AM - 10:30 AM"
                            value={slot.sessions.morning.join(", ")}
                            onChange={(e) =>
                              updateTimeSlot(
                                index,
                                "sessions.morning",
                                e.target.value
                              )
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition duration-200 text-black placeholder-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-black mb-2">
                            Evening Sessions
                          </label>
                          <input
                            type="text"
                            placeholder="06:00 PM - 06:30 PM, 07:00 PM - 07:30 PM"
                            value={slot.sessions.evening.join(", ")}
                            onChange={(e) =>
                              updateTimeSlot(
                                index,
                                "sessions.evening",
                                e.target.value
                              )
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition duration-200 text-black placeholder-gray-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* File Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Doctor Profile
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      name="photos"
                      accept=".jpg,.jpeg,.png,.gif"
                      multiple
                      onChange={handlePhotoChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition duration-200 text-black file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {photoError && (
                      <p className="text-red-600 text-sm mt-2 font-medium">{photoError}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Resume
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      name="resume"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition duration-200 text-black file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {resumeError && (
                      <p className="text-red-600 text-sm mt-2 font-medium">{resumeError}</p>
                    )}
                  </div>
                  <p className="text-xs text-black mt-1">
                    PDF, JPG, PNG files accepted
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-gray-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-700 transition duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

DoctorDashboard.getLayout = function PageLayout(page: React.ReactNode) {
  return <DoctorLayout>{page}</DoctorLayout>;
};

const ProtectedDashboard: NextPageWithLayout = withDoctorAuth(DoctorDashboard);

// Reassign layout (TS-safe now)
ProtectedDashboard.getLayout = DoctorDashboard.getLayout;

export default ProtectedDashboard;
