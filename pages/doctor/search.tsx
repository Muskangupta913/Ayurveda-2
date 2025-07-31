"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import {
  Leaf,
  MapPin,
  Search,
  Star,
  Phone,
  Navigation,
  Shield,
  Calendar,
  X,
  Filter,
  ThumbsUp,
  Clock3,
  HeartHandshake,
  Zap,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import AuthModal from "../../components/AuthModal";
import dayjs from "dayjs";
import Image from "next/image";

interface Doctor {
  _id: string;
  user: { name: string; phone?: string; email?: string; _id?: string };
  degree: string;
  address: string;
  photos: string[];
  verified: boolean;
  distance?: number;
  consultationFee?: number;
  timeSlots: Array<{
    date: string;
    availableSlots: number;
    sessions: {
      morning: string[];
      evening: string[];
    };
  }>;
  treatments?: Array<{
    mainTreatment: string;
    mainTreatmentSlug: string;
    subTreatments: Array<{
      name: string;
      slug: string;
    }>;
  }>;
  treatment?: string | string[]; // Keep for backward compatibility
  experience: number;
  clinicContact: string;
  location: {
    coordinates: [number, number];
  };
}

interface Suggestion {
  type: string;
  value: string;
}

interface ReviewData {
  averageRating: number;
  totalReviews: number;
  reviews: Array<{
    comment: string;
    userId: { name: string };
  }>;
}

export default function FindDoctor() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [manualPlace, setManualPlace] = useState("");
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [starFilter, setStarFilter] = useState(0);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">(
    "login"
  );
  const [pendingAction, setPendingAction] = useState<{
    type: string;
    doctor: Doctor;
  } | null>(null);
  const [doctorReviews, setDoctorReviews] = useState<{
    [key: string]: ReviewData;
  }>({});
  const [reviewsLoading, setReviewsLoading] = useState<{
    [key: string]: boolean;
  }>({});
  const [showReviewsFor, setShowReviewsFor] = useState<string | null>(null);
  const [expandedTreatments, setExpandedTreatments] = useState<
    Record<string, boolean>
  >({});

  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const suggestionsDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Use a per-page session token for doctor search
      const sessionToken = sessionStorage.getItem(
        "ayurvedaDoctorSearchSession"
      );
      if (!sessionToken) {
        // This is a new session for doctor search (all tabs were closed)
        localStorage.removeItem("ayurvedaDoctorSearchState");
        // Generate and store a new session token
        const newSessionToken =
          Math.random().toString(36).substr(2, 9) + Date.now();
        sessionStorage.setItem("ayurvedaDoctorSearchSession", newSessionToken);
      }
      // Only THEN load persisted state
      try {
        const persistedState = localStorage.getItem(
          "ayurvedaDoctorSearchState"
        );
        if (persistedState) {
          const state = JSON.parse(persistedState);
          // Check if state is not older than 24 hours
          const now = Date.now();
          const stateAge = now - (state.timestamp || 0);
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

          if (stateAge < maxAge && state.doctors && state.doctors.length > 0) {
            setDoctors(state.doctors);
            setCoords(state.coords);
            setSelectedService(state.selectedService || "");
            setManualPlace(state.manualPlace || "");
            setQuery(state.query || "");
            setStarFilter(state.starFilter || 0);
            setViewMode(state.viewMode || "list");

            // Fetch reviews for all persisted doctors
            state.doctors.forEach((doctor: Doctor) => {
              if (doctor._id) {
                fetchDoctorReviews(doctor._id);
              }
            });
          } else {
            // Clear expired state
            clearPersistedState();
          }
        }
      } catch {
        // console.error("Error loading persisted state:", error);
        clearPersistedState();
      }
    }
  }, []);

  // Save search state to localStorage whenever it changes
  useEffect(() => {
    if (doctors.length > 0 && coords) {
      const stateToPersist = {
        doctors,
        coords,
        selectedService,
        manualPlace,
        query,
        starFilter,
        viewMode,
        timestamp: Date.now(),
      };
      localStorage.setItem(
        "ayurvedaDoctorSearchState",
        JSON.stringify(stateToPersist)
      );
    }
  }, [
    doctors,
    coords,
    selectedService,
    manualPlace,
    query,
    starFilter,
    viewMode,
  ]);

  // Clear persisted state when user performs a new search
  const clearPersistedState = () => {
    localStorage.removeItem("ayurvedaDoctorSearchState");
  };

  // Add clear search function
  const clearSearch = () => {
    setDoctors([]);
    setCoords(null);
    setSelectedService("");
    setManualPlace("");
    setQuery("");
    setStarFilter(0);
    setSuggestions([]);
    clearPersistedState();
  };

  // Function to fetch reviews for a single doctor
  const fetchDoctorReviews = async (doctorId: string) => {
    setReviewsLoading((prev) => ({ ...prev, [doctorId]: true }));
    try {
      const res = await axios.get(`/api/doctor/reviews/${doctorId}`);
      if (res.data.success) {
        setDoctorReviews((prev) => ({
          ...prev,
          [doctorId]: res.data.data,
        }));
      }
    } catch {
      setDoctorReviews((prev) => ({
        ...prev,
        [doctorId]: {
          averageRating: 0,
          totalReviews: 0,
          reviews: [],
        },
      }));
    } finally {
      setReviewsLoading((prev) => ({ ...prev, [doctorId]: false }));
    }
  };

  const handleReviewClick = (doctor: Doctor) => {
    if (!isAuthenticated) {
      setPendingAction({ type: "review", doctor });
      setAuthModalMode("login");
      setShowAuthModal(true);
      return;
    }

    const params = new URLSearchParams({
      doctorId: doctor._id,
      doctorName: doctor.user.name,
    });

    router.push(`/doctor/review-form?${params.toString()}`);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    if (pendingAction) {
      if (pendingAction.type === "enquiry") {
        const params = new URLSearchParams({
          doctorId: pendingAction.doctor._id,
          doctorName: pendingAction.doctor.user.name,
          specialization: pendingAction.doctor.degree,
        });
        router.push(`/doctor/enquiry-form?${params.toString()}`);
      } else if (pendingAction.type === "review") {
        const params = new URLSearchParams({
          doctorId: pendingAction.doctor._id,
          doctorName: pendingAction.doctor.user.name,
        });
        router.push(`/doctor/review-form?${params.toString()}`);
      }
      setPendingAction(null);
    }
  };

  const handleAuthModalClose = () => {
    setShowAuthModal(false);
    setPendingAction(null);
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance}km`;
  };

  const fetchSuggestions = async (q: string) => {
    if (!q.trim()) return setSuggestions([]);

    try {
      const response = await axios.get(`/api/doctor/search?q=${q}`);
      const treatmentSuggestions = response.data.treatments.map(
        (t: string) => ({
          type: "treatment",
          value: t,
        })
      );
      setSuggestions(treatmentSuggestions);
    } catch {
      // console.error("Error fetching suggestions:", err);
    }
  };

  // Update fetchDoctors to accept a service parameter
  type FetchDoctorsType = (
    lat: number,
    lng: number,
    service?: string
  ) => Promise<void>;

  const fetchDoctors: FetchDoctorsType = async (lat, lng, service) => {
    setLoading(true);
    try {
      const res = await axios.get("/api/doctor/nearby", {
        params: { lat, lng, service: service ?? selectedService },
      });

      const doctorsWithDistance = res.data.doctors.map((doctor: Doctor) => {
        if (doctor.location?.coordinates?.length === 2) {
          const doctorLng = doctor.location.coordinates[0];
          const doctorLat = doctor.location.coordinates[1];
          const distance = calculateDistance(lat, lng, doctorLat, doctorLng);
          return { ...doctor, distance };
        }
        return { ...doctor, distance: null };
      });

      doctorsWithDistance.sort((a: Doctor, b: Doctor) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return (a.distance || 0) - (b.distance || 0);
      });

      setDoctors(doctorsWithDistance);

      // Fetch reviews for all doctors
      doctorsWithDistance.forEach((doctor: Doctor) => {
        if (doctor._id) {
          fetchDoctorReviews(doctor._id);
        }
      });
    } catch {
      // console.error("Error fetching doctors:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Star
          key="half"
          className="w-4 h-4 fill-yellow-400/50 text-yellow-400"
        />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }

    return stars;
  };

  // Update locateMe to pass selectedService
  const locateMe = () => {
    setLoading(true);
    clearPersistedState(); // Clear old state when starting new search
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        fetchDoctors(latitude, longitude, selectedService);
      },
      () => {
        alert("Geolocation permission denied");
        setLoading(false);
      }
    );
  };

  // Update searchByPlace to pass selectedService
  const searchByPlace = async () => {
    if (!manualPlace.trim()) return;

    setLoading(true);
    clearPersistedState(); // Clear old state when starting new search
    try {
      const res = await axios.get("/api/doctor/geocode", {
        params: { place: manualPlace },
      });
      setCoords({ lat: res.data.lat, lng: res.data.lng });
      fetchDoctors(res.data.lat, res.data.lng, selectedService);
    } catch {
      // console.error("Error in manual place search:", err);
      setLoading(false);
    }
  };

  // Update handleSearch to pass query as service
  const handleSearch = async () => {
    if (query.trim() && coords) {
      clearPersistedState(); // Clear old state when starting new search
      setSelectedService(query);
      fetchDoctors(coords.lat, coords.lng, query);
    } else if (manualPlace.trim()) {
      searchByPlace();
    }
  };

  const filteredDoctors = doctors.filter((doctor) => {
    if (starFilter === 0) return true;
    const rating = doctorReviews[doctor._id]?.averageRating || 0;
    return rating >= starFilter;
  });
  // Fix modal scroll lock and ReferenceError
  useEffect(() => {
    if (showCalendarModal || showAuthModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showCalendarModal, showAuthModal]);

  useEffect(() => {
    if (suggestions.length === 0) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node) &&
        suggestionsDropdownRef.current &&
        !suggestionsDropdownRef.current.contains(event.target as Node)
      ) {
        setSuggestions([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [suggestions]);

  // Helper function to label slot dates as Today, Tomorrow, or the actual date
  function capitalizeMonth(dateStr: string) {
    return dateStr.replace(/\b([a-z])/g, (match, p1, offset) => {
      if (offset > 0 && dateStr[offset - 1] === " ") {
        return p1.toUpperCase();
      }
      return match;
    });
  }

  // Helper to filter out past slots
  function isTodayOrFuture(slotDateStr: string) {
    const slotDate = dayjs(
      capitalizeMonth(slotDateStr) + " " + dayjs().year(),
      "DD MMMM YYYY"
    );
    const today = dayjs().startOf("day");
    return (
      slotDate.isValid() &&
      (slotDate.isSame(today, "day") || slotDate.isAfter(today, "day"))
    );
  }

  // Helper function to sort time slots by date
  const sortTimeSlotsByDate = (
    timeSlots: {
      date: string;
      availableSlots: number;
      sessions: { morning: string[]; evening: string[] };
    }[]
  ) => {
    if (!timeSlots || !Array.isArray(timeSlots)) return [];

    return [...timeSlots].sort((a, b) => {
      const dateA = dayjs(
        capitalizeMonth(a.date) + " " + dayjs().year(),
        "DD MMMM YYYY"
      );
      const dateB = dayjs(
        capitalizeMonth(b.date) + " " + dayjs().year(),
        "DD MMMM YYYY"
      );

      // Handle invalid dates by putting them at the end
      if (!dateA.isValid() && !dateB.isValid()) return 0;
      if (!dateA.isValid()) return 1;
      if (!dateB.isValid()) return -1;

      return dateA.valueOf() - dateB.valueOf();
    });
  };

  // Updated CalendarModal component with sorting
  const CalendarModal = ({
    doctor,
    onClose,
  }: {
    doctor: Doctor;
    onClose: () => void;
  }) => (
    <div
      className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      style={{ overflow: "hidden" }}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col">
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 p-6 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Available Appointments
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-105"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              {doctor.user.name}
            </h3>
            <p className="text-blue-600 font-medium">{doctor.degree}</p>
          </div>

          {(() => {
            const futureSlots = sortTimeSlotsByDate(
              doctor.timeSlots?.filter((ts) => isTodayOrFuture(ts.date)) || []
            );
            const today = dayjs().startOf("day");
            const hasTodaySlot = futureSlots.some((ts) => {
              const slotDate = dayjs(
                capitalizeMonth(ts.date) + " " + dayjs().year(),
                "DD MMMM YYYY"
              );
              return slotDate.isSame(today, "day") && ts.availableSlots > 0;
            });

            if (futureSlots.length > 0) {
              return (
                <div className="space-y-4">
                  {futureSlots.map((timeSlot, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-2xl p-5 bg-gradient-to-br from-white to-gray-50 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-gray-800 text-lg">
                          {(() => {
                            const slotDate = dayjs(
                              capitalizeMonth(timeSlot.date) +
                                " " +
                                dayjs().year(),
                              "DD MMMM YYYY"
                            );
                            const today = dayjs().startOf("day");
                            const tomorrow = today.add(1, "day");
                            if (slotDate.isSame(today, "day")) return "Today";
                            if (slotDate.isSame(tomorrow, "day"))
                              return "Tomorrow";
                            return slotDate.isValid()
                              ? slotDate.format("DD MMMM")
                              : timeSlot.date;
                          })()}
                        </h4>
                        <span className="text-sm font-medium text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full border border-blue-200">
                          {timeSlot.availableSlots} slots available
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {timeSlot.sessions.morning?.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              Morning
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {timeSlot.sessions.morning.map(
                                (slot: string, slotIndex: number) => (
                                  <button
                                    key={slotIndex}
                                    className="px-4 py-2 bg-blue-50 text-blue-800 rounded-full text-sm border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 hover:scale-105 font-medium shadow-sm"
                                  >
                                    {slot}
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        )}
                        {timeSlot.sessions.evening?.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              Evening
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {timeSlot.sessions.evening.map(
                                (slot: string, slotIndex: number) => (
                                  <button
                                    key={slotIndex}
                                    className="px-4 py-2 bg-orange-50 text-orange-800 rounded-full text-sm border border-orange-200 hover:bg-orange-100 hover:border-orange-300 transition-all duration-200 hover:scale-105 font-medium shadow-sm"
                                  >
                                    {slot}
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {hasTodaySlot && (
                    <div className="text-center py-4">
                      <span className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold text-lg border border-green-200">
                        Available Today
                      </span>
                    </div>
                  )}
                </div>
              );
            } else {
              return (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-lg">
                    No time slots available
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    Please check back later
                  </p>
                </div>
              );
            }
          })()}
        </div>
      </div>
    </div>
  );

  const WhyChooseUs = () => (
    <div className="bg-gray-50 p-8">
      <div className="flex items-center mb-8">
        <div className="bg-blue-100 p-2 rounded-lg mr-4">
          <Leaf className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="text-2xl font-semibold text-blue-700">
          Why Choose Our Doctors?
        </h3>
      </div>

      <div className="space-y-6">
        {[
          {
            icon: <Shield className="w-5 h-5 text-blue-600" />,
            title: "Verified Professionals",
            desc: "All doctors are verified and certified with proven expertise",
          },
          {
            icon: <Clock3 className="w-5 h-5 text-blue-600" />,
            title: "Quick Appointments",
            desc: "Get appointments within 24 hours with flexible scheduling",
          },
          {
            icon: <HeartHandshake className="w-5 h-5 text-blue-600" />,
            title: "Personalized Care",
            desc: "Tailored treatment plans designed specifically for each patient",
          },
          {
            icon: <ThumbsUp className="w-5 h-5 text-blue-600" />,
            title: "High Success Rate",
            desc: "95% patient satisfaction rate with proven treatment outcomes",
          },
          {
            icon: <Zap className="w-5 h-5 text-blue-600" />,
            title: "Modern Equipment",
            desc: "Latest medical technology and state-of-the-art equipment",
          },
        ].map((item, index) => (
          <div key={index} className="flex items-start space-x-4">
            <div className="bg-blue-100 p-3 rounded-lg flex-shrink-0">
              {item.icon}
            </div>
            <div>
              <h4 className="font-semibold text-blue-700 text-lg mb-2">
                {item.title}
              </h4>
              <p className="text-gray-600 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-20">
      <AuthModal
        isOpen={showAuthModal}
        onClose={handleAuthModalClose}
        onSuccess={handleAuthSuccess}
        initialMode={authModalMode}
      />

      {showCalendarModal && selectedDoctor && (
        <CalendarModal
          doctor={selectedDoctor}
          onClose={() => setShowCalendarModal(false)}
        />
      )}

      {/* Header */}
      <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
        <div className="bg-white/80 backdrop-blur-sm shadow-2xl border-b border-gray-100/50">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Find the Right <span className="text-blue-600">Doctor</span>
              </h1>
              {isAuthenticated && user && (
                <div className="mt-4 inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200">
                  <Shield className="w-4 h-4 mr-2" />
                  Welcome back, {user.name}!
                </div>
              )}
            </div>

            <div className="w-full max-w-6xl mx-auto mb-8 px-2 sm:px-4 md:px-6 lg:px-8">
              <div className="bg-white rounded-2xl p-4 md:p-6 shadow-lg border border-gray-100">
                {/* Desktop Layout */}
                <div className="hidden md:flex gap-4 items-center justify-center">
                  <div className="relative flex-1 max-w-lg">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-blue-500" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search doctors, treatments, specialties..."
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        fetchSuggestions(e.target.value);
                      }}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                      className="w-full pl-12 pr-4 py-3.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:bg-white transition-all placeholder:text-gray-500 text-sm"
                      ref={searchInputRef}
                    />

                    {/* Desktop Suggestions Dropdown */}
                    {suggestions.length > 0 && (
                      <div
                        className="absolute top-full left-0 right-0 z-50 mt-2 bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-2xl max-h-80 overflow-auto"
                        ref={suggestionsDropdownRef}
                      >
                        <div className="p-2">
                          {suggestions.map((s, i) => (
                            <div
                              key={i}
                              className="flex items-center px-4 py-4 hover:bg-blue-50/80 cursor-pointer transition-all duration-200 border-b border-gray-100/50 last:border-b-0 rounded-xl mx-1 group"
                              onClick={() => {
                                clearPersistedState(); // Clear old state when starting new search
                                setSelectedService(s.value);
                                setQuery(s.value);
                                setSuggestions([]);
                                if (coords)
                                  fetchDoctors(coords.lat, coords.lng, s.value);
                              }}
                            >
                              <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mr-4">
                                <span className="text-lg">
                                  {s.type === "clinic"
                                    ? "🏥"
                                    : s.type === "treatment"
                                    ? "💊"
                                    : "👨‍⚕️"}
                                </span>
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors text-sm md:text-base">
                                  {s.value}
                                </p>
                                <p className="text-xs md:text-sm text-gray-500 capitalize font-medium">
                                  {s.type}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="h-12 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>

                  <div className="flex-1 relative group">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none z-10">
                      <MapPin className="h-5 w-5 text-blue-500 transition-colors" />
                    </div>
                    <input
                      placeholder="City, area, or postal code"
                      value={manualPlace}
                      onChange={(e) => setManualPlace(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && searchByPlace()}
                      className="w-full pl-12 pr-4 py-3.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:bg-white transition-all placeholder:text-gray-500 text-sm"
                    />
                  </div>

                  <div className="h-12 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>

                  <button
                    onClick={locateMe}
                    disabled={loading}
                    className="flex items-center px-6 py-3.5 bg-blue-600 text-white rounded-xl cursor-pointer hover:bg-blue-700 transition-all font-medium disabled:opacity-50 whitespace-nowrap shadow-md hover:shadow-lg"
                  >
                    <Navigation className="w-5 h-5 mr-2" />
                    <span className="hidden md:inline">Near Me</span>
                  </button>

                  <button
                    onClick={handleSearch}
                    className="px-6 py-3.5 bg-blue-600 text-white rounded-xl font-medium cursor-pointer hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                  >
                    Search Doctor
                  </button>
                </div>

                {/* Mobile Layout */}
                <div className="md:hidden space-y-4">
                  {/* Search Input Row with Near Me Button */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-blue-500" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search doctors, treatments..."
                        value={query}
                        onChange={(e) => {
                          setQuery(e.target.value);
                          fetchSuggestions(e.target.value);
                        }}
                        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                        className="w-full pl-12 pr-4 py-3.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:bg-white transition-all placeholder:text-gray-500 text-sm"
                        ref={searchInputRef}
                      />
                    </div>
                    {/* Near Me Button for Mobile Only */}
                    <button
                      type="button"
                      onClick={locateMe}
                      disabled={loading}
                      className="flex items-center justify-center px-4 py-3.5 bg-blue-600 text-white rounded-xl cursor-pointer hover:bg-green-700 transition-all font-medium disabled:opacity-50 flex-shrink-0 shadow-md hover:shadow-lg flex md:hidden"
                      title="Near Me"
                    >
                      <Navigation className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Location Input */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      placeholder="City, area, or postal code"
                      value={manualPlace}
                      onChange={(e) => setManualPlace(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && searchByPlace()}
                      className="w-full pl-12 pr-4 py-3.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:bg-white transition-all placeholder:text-gray-500 text-sm"
                    />
                  </div>

                  {/* Mobile Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleSearch}
                      className="flex-1 px-4 py-3.5 bg-blue-600 text-white rounded-xl font-medium cursor-pointer hover:bg-green-700 transition-all shadow-md hover:shadow-lg"
                    >
                      Search Doctor
                    </button>
                  </div>
                </div>
              </div>

              {/* Specialty Buttons - Responsive */}
              <div className="mt-6 flex flex-wrap justify-center gap-2 md:gap-3">
                {[
                  "Gastric Disorders Treatment",
                  "Ayurvedic Hairfall Treatment",
                  "Pediatrician",
                  "Dentist",
                  "PCOS Treatment",
                  "Ayurvedic Diet Plan",
                ].map((specialty) => (
                  <button
                    key={specialty}
                    onClick={() => {
                      clearPersistedState(); // Clear old state when starting new search
                      setQuery(specialty);
                      setSelectedService(specialty);
                      if (coords) {
                        fetchDoctors(coords.lat, coords.lng, specialty);
                      } else {
                        // If no coords, trigger location prompt and search after getting location
                        setLoading(true);
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            const { latitude, longitude } = pos.coords;
                            setCoords({ lat: latitude, lng: longitude });
                            fetchDoctors(latitude, longitude, specialty);
                          },
                          () => {
                            alert("Geolocation permission denied");
                            setLoading(false);
                          }
                        );
                      }
                    }}
                    className="px-3 py-2 md:px-5 md:py-2 bg-white/80 hover:bg-white text-gray-700 hover:text-blue-600 rounded-full text-xs md:text-sm font-medium shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200/50 hover:border-blue-200"
                  >
                    {specialty}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        {doctors.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
            {/* Doctors List */}
            <div className="lg:w-2/3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4 sm:gap-0">
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                    Found {filteredDoctors.length} Doctors
                  </h2>
                  {selectedService && (
                    <p className="text-sm sm:text-base text-gray-600 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      Showing results for &quot;
                      <span className="font-medium text-blue-600">
                        {selectedService}
                      </span>
                      &quot;
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                  <button
                    onClick={clearSearch}
                    className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium text-sm flex items-center justify-center"
                  >
                    <span className="mr-1">✕</span>
                    Clear Search
                  </button>
                  <div className="flex items-center gap-2 bg-white rounded-xl shadow-sm border border-gray-200 px-3 sm:px-4 py-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select
                      value={starFilter}
                      onChange={(e) => setStarFilter(Number(e.target.value))}
                      className="bg-transparent border-none outline-none text-sm font-medium text-gray-700 w-full sm:w-auto"
                    >
                      <option value={0}>All Ratings</option>
                      <option value={1}>1+ Stars</option>
                      <option value={2}>2+ Stars</option>
                      <option value={3}>3+ Stars</option>
                      <option value={4}>4+ Stars</option>
                    </select>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col sm:flex-row items-center justify-center py-12 sm:py-16">
                  <div className="relative mb-4 sm:mb-0">
                    <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-blue-100 border-t-blue-600"></div>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-20 animate-pulse"></div>
                  </div>
                  <span className="ml-0 sm:ml-4 text-gray-600 font-medium text-sm sm:text-base text-center">
                    Finding the best doctors for you...
                  </span>
                </div>
              ) : filteredDoctors.length === 0 ? (
                <div className="text-center py-12 sm:py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl sm:rounded-3xl border border-gray-100 mx-2 sm:mx-0">
                  <div className="bg-white rounded-2xl p-4 sm:p-6 w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 shadow-lg">
                    <Search className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mt-1 sm:mt-2" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 px-4">
                    No doctors found
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto text-sm sm:text-base px-4">
                    Try adjusting your search criteria or explore different
                    specializations
                  </p>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {filteredDoctors.map((doctor, index) => {
                    // Check for today's slot (unused, so remove)
                    const hasRating =
                      doctorReviews[doctor._id]?.totalReviews > 0;
                    const reviewsLoaded =
                      doctorReviews[doctor._id] !== undefined;
                    const isLoadingReviews = reviewsLoading[doctor._id];
                    let treatments: string[] = [];

                    // Handle new treatments structure
                    if (doctor.treatments && Array.isArray(doctor.treatments)) {
                      treatments = doctor.treatments.map(
                        (t) => t.mainTreatment
                      );
                    }
                    // Fallback to old treatment structure for backward compatibility
                    else if (Array.isArray(doctor.treatment)) {
                      treatments = (doctor.treatment as string[]).filter(
                        Boolean
                      );
                    } else if (
                      typeof doctor.treatment === "string" &&
                      doctor.treatment.trim()
                    ) {
                      treatments = doctor.treatment
                        .split(",")
                        .map((t: string) => t.trim())
                        .filter(Boolean);
                    }

                    const isExpanded = expandedTreatments[doctor._id];

                    return (
                      <div
                        key={index}
                        className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 mx-2 sm:mx-0"
                      >
                        <div className="flex flex-col md:flex-row">
                          {/* Doctor Image - Enhanced for mobile visibility */}
                          <div className="md:w-40 md:h-40 w-full h-64 sm:h-56 md:h-40 relative overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 flex-shrink-0">
                            {doctor.photos?.[0] ? (
                              <Image
                                src={doctor.photos[0]}
                                alt={doctor.user?.name || "Doctor Image"}
                                fill
                                className="object-cover object-center"
                              />
                            ) : null}
                            {/* Fallback placeholder */}
                            <div
                              className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center"
                              style={{
                                display: doctor.photos?.[0] ? "none" : "flex",
                              }}
                            >
                              <div className="text-center">
                                <div className="w-16 h-16 sm:w-12 sm:h-12 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-2">
                                  <svg
                                    className="w-8 h-8 sm:w-6 sm:h-6 text-blue-600"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                  </svg>
                                </div>
                                <span className="text-sm sm:text-xs text-blue-600 font-medium">
                                  {doctor.user?.name?.split(" ")[0]}
                                </span>
                              </div>
                            </div>

                            {/* Overlay badges */}
                            <div className="absolute top-3 right-3 flex flex-col gap-2">
                              {doctor.verified && (
                                <div className="bg-green-500 text-white px-2 py-0.5 rounded-full text-xs font-medium flex items-center">
                                  <Shield className="w-2 h-2 mr-1" />
                                  Verified
                                </div>
                              )}
                            </div>

                            {doctor.distance && (
                              <div className="absolute bottom-3 left-3 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                                <Navigation className="w-2 h-2 mr-1" />
                                {formatDistance(doctor.distance)}
                              </div>
                            )}
                          </div>

                          {/* Doctor Info */}
                          <div className="flex-1 p-3 sm:p-4">
                            <div className="flex flex-col gap-3">
                              {/* Doctor details and fee section */}
                              <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                                    {doctor.user?.name} ({doctor.experience}{" "}
                                    years exp)
                                  </h3>
                                  <p className="text-blue-600 font-medium text-sm">
                                    {doctor.degree}
                                  </p>
                                  <p className="text-gray-600 text-xs mt-0.5 line-clamp-2 sm:truncate">
                                    {doctor.address}
                                  </p>
                                </div>

                                {/* Fee and contact - Better mobile layout */}
                                <div className="flex flex-row sm:flex-col justify-between sm:items-end gap-2 sm:gap-1 flex-shrink-0">
                                  {typeof doctor.consultationFee === "number" &&
                                    doctor.consultationFee > 0 && (
                                      <div className="text-left sm:text-right">
                                        <p className="text-xs text-gray-500">
                                          Fee
                                        </p>
                                        <p className="text-sm font-bold text-green-600">
                                          AED {doctor.consultationFee}
                                        </p>
                                      </div>
                                    )}

                                  {doctor.clinicContact && (
                                    <a
                                      href={`tel:${doctor.clinicContact}`}
                                      className="flex items-center text-xs text-gray-600 hover:text-green-600 transition-colors"
                                    >
                                      <Phone className="w-3 h-3 mr-1 text-green-500" />
                                      <span className="truncate max-w-28 sm:max-w-24">
                                        {doctor.clinicContact}
                                      </span>
                                    </a>
                                  )}
                                </div>
                              </div>

                              {/* Rating and availability - Better mobile spacing */}
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                {/* Rating section */}
                                <div className="flex items-center gap-1 flex-wrap">
                                  {isLoadingReviews ? (
                                    <span className="text-xs text-gray-500">
                                      Loading...
                                    </span>
                                  ) : hasRating ? (
                                    <>
                                      <div className="flex">
                                        {renderStars(
                                          doctorReviews[doctor._id]
                                            .averageRating
                                        )}
                                      </div>
                                      <span className="text-xs font-medium text-gray-700">
                                        {doctorReviews[
                                          doctor._id
                                        ].averageRating.toFixed(1)}
                                        (
                                        {doctorReviews[doctor._id].totalReviews}
                                        )
                                      </span>
                                      <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                                        Verified
                                      </span>
                                    </>
                                  ) : reviewsLoaded ? (
                                    <span className="text-xs text-gray-500">
                                      No reviews yet
                                    </span>
                                  ) : null}
                                </div>

                                {/* Availability badge */}
                                <div className="flex-shrink-0 w-full sm:w-auto">
                                  {(() => {
                                    const today = dayjs().startOf("day");
                                    // Find if there is a slot for today
                                    const todaySlot =
                                      doctor.timeSlots &&
                                      doctor.timeSlots.find((ts) => {
                                        const slotDate = dayjs(
                                          capitalizeMonth(ts.date) +
                                            " " +
                                            dayjs().year(),
                                          "DD MMMM YYYY"
                                        );
                                        return slotDate.isSame(today, "day");
                                      });
                                    if (
                                      !doctor.timeSlots ||
                                      doctor.timeSlots.length === 0
                                    ) {
                                      return (
                                        <span className="inline-flex items-center justify-center w-full sm:w-auto px-2 py-1 bg-red-50 border border-red-200 text-red-700 rounded-md font-medium text-xs">
                                          ✗ No appointments
                                        </span>
                                      );
                                    } else if (
                                      todaySlot &&
                                      todaySlot.availableSlots > 0
                                    ) {
                                      return (
                                        <span className="inline-flex items-center justify-center w-full sm:w-auto px-2 py-1 bg-green-50 border border-green-200 text-green-700 rounded-md font-medium text-xs">
                                          ✓ Available today
                                        </span>
                                      );
                                    } else {
                                      return (
                                        <span className="inline-flex items-center justify-center w-full sm:w-auto px-2 py-1 bg-red-50 border border-red-200 text-red-700 rounded-md font-medium text-xs">
                                          ✗ No appointment today
                                        </span>
                                      );
                                    }
                                  })()}
                                </div>
                              </div>

                              {/* Treatments */}
                              <div className="mb-3">
                                <div className="flex items-center mb-1">
                                  <div className="w-1 h-2 bg-blue-500 rounded-full mr-2"></div>
                                  <h4 className="text-xs font-semibold text-gray-800">
                                    Treatments:
                                  </h4>
                                </div>
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-2 border border-blue-100">
                                  {treatments.length > 0 ? (
                                    <div className="flex flex-wrap items-center gap-1">
                                      {(isExpanded
                                        ? treatments
                                        : treatments.slice(0, 2)
                                      ).map((treatment, idx) => (
                                        <span
                                          key={idx}
                                          className="text-green-600 font-medium text-xs"
                                        >
                                          {treatment}
                                          {idx <
                                          (isExpanded
                                            ? treatments.length - 1
                                            : Math.min(
                                                1,
                                                treatments.length - 1
                                              ))
                                            ? ","
                                            : ""}
                                        </span>
                                      ))}
                                      {treatments.length > 2 && (
                                        <button
                                          className="text-blue-600 text-xs font-semibold hover:underline focus:outline-none ml-1"
                                          onClick={() =>
                                            setExpandedTreatments((prev) => ({
                                              ...prev,
                                              [doctor._id]: !isExpanded,
                                            }))
                                          }
                                        >
                                          {isExpanded
                                            ? "Show less"
                                            : `+${treatments.length - 2} more`}
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 text-xs">
                                      No treatments listed
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Action buttons - Better mobile layout */}
                              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedDoctor(doctor);
                                    setShowCalendarModal(true);
                                  }}
                                  className="flex items-center justify-center px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-xs font-medium shadow-sm hover:shadow-md"
                                >
                                  <Calendar className="w-3 h-3 mr-1" />
                                  View Slot
                                </button>

                                <button
                                  onClick={() => handleReviewClick(doctor)}
                                  className="flex items-center justify-center px-3 py-1.5 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-200 text-xs font-medium shadow-sm hover:shadow-md"
                                >
                                  <Star className="w-3 h-3 mr-1" />
                                  Review
                                </button>

                                {doctor.location?.coordinates?.length === 2 && (
                                  <div className="col-span-2 sm:col-span-1">
                                    <a
                                      href={`https://www.google.com/maps/dir/?api=1&destination=${doctor.location.coordinates[1]},${doctor.location.coordinates[0]}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center justify-center w-full px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 text-xs font-medium shadow-sm hover:shadow-md"
                                    >
                                      <Navigation className="w-3 h-3 mr-1" />
                                      Direction
                                    </a>
                                  </div>
                                )}
                              </div>

                              {/* Recent Reviews Toggle */}
                              {doctorReviews[doctor._id]?.reviews?.length >
                                0 && (
                                <div className="border-t border-gray-100 pt-2 mt-3">
                                  <button
                                    className="font-semibold text-gray-800 text-xs flex items-center hover:text-blue-600 transition-colors"
                                    onClick={() =>
                                      setShowReviewsFor(
                                        showReviewsFor === doctor._id
                                          ? null
                                          : doctor._id
                                      )
                                    }
                                  >
                                    Recent Reviews
                                    <ChevronDown
                                      className={`ml-1 w-3 h-3 transition-transform ${
                                        showReviewsFor === doctor._id
                                          ? "rotate-180"
                                          : ""
                                      }`}
                                    />
                                  </button>
                                  {showReviewsFor === doctor._id && (
                                    <div className="space-y-1 mt-2">
                                      {doctorReviews[doctor._id].reviews
                                        .slice(0, 2)
                                        .map((review, idx) => (
                                          <div
                                            key={idx}
                                            className="bg-gray-50 rounded-lg p-2"
                                          >
                                            <p className="text-xs text-gray-700 mb-1 line-clamp-3">
                                              &quot;{review.comment}&quot;
                                            </p>
                                            <p className="text-xs text-gray-500">
                                              - {review.userId.name}
                                            </p>
                                          </div>
                                        ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Sidebar - Hidden on mobile/tablet, shown on large screens */}
            <div className="hidden lg:block lg:w-1/3">
              <div className="sticky top-4">
                <WhyChooseUs />
              </div>
            </div>
          </div>
        )}

        {/* Show search bar only when no results */}
        {doctors.length === 0 && !loading && (
          <div className="text-center py-12 sm:py-16">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl sm:rounded-3xl p-8 sm:p-12 max-w-md mx-auto mx-2 sm:mx-auto">
              <div className="bg-white rounded-2xl p-4 sm:p-6 w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 shadow-lg">
                <Search className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mt-1 sm:mt-2" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                Search for Doctors
              </h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Use the search bar above to find the best doctors near you
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
