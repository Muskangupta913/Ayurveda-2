"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import {
  MapPin,
  Search,
  Star,
  Clock,
  Phone,
  Navigation,
  Heart,
  Shield,
  Award,
  Filter,
  Stethoscope,
  Mail,
  GraduationCap,
  FileText,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Users,
  Leaf,
  TrendingUp,
  Globe,
  Calendar,
  Video,
  BookOpen,
  Target,
  CheckCircle,
} from "lucide-react";
import { ChangeEvent, FormEvent } from "react";
import React from "react";
import type { KeyboardEvent } from "react";
import { useAuth } from "../context/AuthContext";
import AuthModal from "../components/AuthModal";
import Image from "next/image";

// Types
interface Clinic {
  _id: string;
  name: string;
  address: string;
  location?: {
    coordinates: [number, number];
  };
  verified?: boolean;
  photos?: string[];
  isDubaiPrioritized?: boolean;
  distance?: number | null;
  treatments?: string[];
  servicesName?: string[];
  pricing?: string;
  timings?: string;
  phone?: string;
}
interface ReviewData {
  averageRating: number;
  totalReviews: number;
  reviews: unknown[];
}
interface ErrorModalState {
  show: boolean;
  message: string;
}




export default function Home(): React.ReactElement {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLDivElement | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [clinicsPerPage] = useState(5); // You can change this number
  const [expandedTreatments, setExpandedTreatments] = useState<
    Record<string, boolean>
  >({});
  const [suggestions, setSuggestions] = useState<
    { type: string; value: string }[]
  >([]);
  const [selectedService, setSelectedService] = useState("");
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [ratingFilter, setRatingFilter] = useState(0);
  const [manualPlace, setManualPlace] = useState("");
  const [loading, setLoading] = useState(false);

  // Auth Modal states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">(
    "login"
  );
  const [pendingAction, setPendingAction] = useState<{
    type: "enquiry" | "review";
    clinic: Clinic;
  } | null>(null);

  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  // Add state to track if a search has been performed
  // Removed: searchPerformed, specializationFocused, handleSearchClick, res

  // Add a ref for the registration section
  const registrationRef = useRef<HTMLDivElement | null>(null);

  // Add a state variable for the selected file name
  const [resumeFileName, setResumeFileName] = useState<string>("");

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState<ErrorModalState>({
    show: false,
    message: "",
  });

  // Add state for treatments and specialization type
  const [treatments, setTreatments] = useState<string[]>([]);
  const [specializationType, setSpecializationType] = useState<
    "dropdown" | "other"
  >("dropdown");
  const [customSpecialization, setCustomSpecialization] = useState("");

  const [clinicReviews, setClinicReviews] = useState<{
    [key: string]: ReviewData;
  }>({});

  const [isVisible, setIsVisible] = useState(false);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const suggestionsDropdownRef = useRef<HTMLDivElement | null>(null);
  const [fileError, setFileError] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      // Show button when scrolled down more than 100px
      setIsVisible(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);

    // Cleanup
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  // Load persisted search state from localStorage on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check for session token
      let sessionToken = sessionStorage.getItem("ayurvedaSessionToken");
      if (!sessionToken) {
        // This is a new session (all tabs were closed)
        localStorage.removeItem("ayurvedaSearchState");
        // Generate and store a new session token
        sessionToken = Math.random().toString(36).substr(2, 9) + Date.now();
        sessionStorage.setItem("ayurvedaSessionToken", sessionToken);
      }
    }
    const loadPersistedState = () => {
      try {
        const persistedState = localStorage.getItem("ayurvedaSearchState");
        if (persistedState) {
          const state = JSON.parse(persistedState);
          // Check if state is not older than 24 hours
          const now = Date.now();
          const stateAge = now - (state.timestamp || 0);
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

          if (stateAge < maxAge && state.clinics && state.clinics.length > 0) {
            setClinics(state.clinics);
            setCoords(state.coords);
            setSelectedService(state.selectedService || "");
            setManualPlace(state.manualPlace || "");
            setCurrentPage(state.currentPage || 1);
            setRatingFilter(state.ratingFilter || 0);

            // Fetch reviews for all persisted clinics
            state.clinics.forEach((clinic: Clinic) => {
              if (clinic._id) {
                fetchReviewsForClinic(clinic._id);
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
    };

    loadPersistedState();
  }, []);

  // Save search state to localStorage whenever it changes
  useEffect(() => {
    if (clinics.length > 0 && coords) {
      const stateToPersist = {
        clinics,
        coords,
        selectedService,
        manualPlace,
        currentPage,
        ratingFilter,
        timestamp: Date.now(),
      };
      localStorage.setItem(
        "ayurvedaSearchState",
        JSON.stringify(stateToPersist)
      );
    }
  }, [
    clinics,
    coords,
    selectedService,
    manualPlace,
    currentPage,
    ratingFilter,
  ]);

  // Clear persisted state when user performs a new search
  const clearPersistedState = () => {
    localStorage.removeItem("ayurvedaSearchState");
  };

  // Fetch treatments for specialization dropdown
  useEffect(() => {
    const fetchTreatments = async () => {
      try {
        const res = await axios.get("/api/doctor/getTreatment");
        if (res.data && Array.isArray(res.data.treatments)) {
          setTreatments(
            res.data.treatments.map(
              (t: { treatment_name: string }) => t.treatment_name
            )
          );
        }
      } catch {
        setTreatments([]);
      }
    };
    fetchTreatments();
  }, []);

  const getFilteredClinics = (): Clinic[] => {
    return clinics.filter((clinic) => {
      const rating = clinicReviews[clinic._id]?.averageRating ?? 0;
      return rating >= ratingFilter;
    });
  };

  // Doctor details
  const [form, setForm] = useState<{
    name: string;
    phone: string;
    email: string;
    specialization: string;
    degree: string;
    experience: string;
    address: string;
    resume: File | null;
  }>({
    name: "",
    phone: "",
    email: "",
    specialization: "",
    degree: "",
    experience: "",
    address: "",
    resume: null,
  });
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setSuggestions([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, files } = e.target as HTMLInputElement;
    if (files && files.length > 0) {
      setForm((prev) => ({ ...prev, [name]: files[0] }));
      if (name === "resume") {
        setResumeFileName(files[0].name);
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      // Only append if value is not null or undefined
      if (value !== null && value !== undefined) {
        data.append(key, value as string | Blob);
      }
    });
    try {
      await axios.post("/api/doctor/register", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setShowSuccessModal(true);
      // Reset the form fields
      setForm({
        name: "",
        phone: "",
        email: "",
        specialization: "",
        degree: "",
        experience: "",
        address: "",
        resume: null,
      });
      setResumeFileName("");
    } catch (err: unknown) {
      // console.error("Registration error:", err);
      let message = "Registration failed";

      interface AxiosErrorWithMessage {
        response?: {
          data?: {
            message?: string;
          };
        };
      }

      const axiosError = err as AxiosErrorWithMessage;

      if (typeof axiosError.response?.data?.message === "string") {
        message = axiosError.response.data.message;
      }

      setErrorModal({ show: true, message });
    }

  };

  // Distance Badge

  const handleEnquiryClick = (clinic: Clinic) => {
    if (!isAuthenticated) {
      // Store the pending action and show auth modal
      setPendingAction({ type: "enquiry", clinic });
      setAuthModalMode("login");
      setShowAuthModal(true);
      return;
    }

    // User is authenticated, proceed with enquiry
    const params = new URLSearchParams({
      clinicId: clinic._id,
      clinicName: clinic.name,
      clinicAddress: clinic.address,
    });

    router.push(`/clinic/enquiry-form?${params.toString()}`);
  };

  const handleReviewClick = (clinic: Clinic) => {
    if (!isAuthenticated) {
      // Store the pending action and show auth modal
      setPendingAction({ type: "review", clinic });
      setAuthModalMode("login");
      setShowAuthModal(true);
      return;
    }

    // User is authenticated, proceed with review
    const params = new URLSearchParams({
      clinicId: clinic._id,
      clinicName: clinic.name,
    });

    router.push(`/clinic/review-form?${params.toString()}`);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);

    // Execute the pending action after successful auth
    if (pendingAction) {
      if (pendingAction.type === "enquiry") {
        const params = new URLSearchParams({
          clinicId: pendingAction.clinic._id,
          clinicName: pendingAction.clinic.name,
          clinicAddress: pendingAction.clinic.address,
        });
        router.push(`/clinic/enquiry-form?${params.toString()}`);
      } else if (pendingAction.type === "review") {
        const params = new URLSearchParams({
          clinicId: pendingAction.clinic._id,
          clinicName: pendingAction.clinic.name,
        });
        router.push(`/clinic/review-form?${params.toString()}`);
      }
      setPendingAction(null);
    }
  };

  const handleAuthModalClose = () => {
    setShowAuthModal(false);
    setPendingAction(null);
  };

  // Haversine formula to calculate distance between two points
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
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
    const distance = R * c;
    return Math.round(distance * 10) / 10;
  };

  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance}km`;
  };

  const fetchSuggestions = async (q: string): Promise<void> => {
    if (!q.trim()) return setSuggestions([]);
    try {
      const [treatRes, clinicRes] = await Promise.all([
        axios.get("/api/clinics/search?q=" + q),
        axios.get("/api/clinics/searchByClinic?q=" + q),
      ]);
      const treatmentSuggestions = treatRes.data.treatments.map(
        (t: string) => ({
          type: "treatment",
          value: t,
        })
      );
      const clinicSuggestions = clinicRes.data.clinics.map(
        (c: { name: string }) => ({
          type: "clinic",
          value: c.name,
        })
      );
      setSuggestions([...treatmentSuggestions, ...clinicSuggestions]);
    } catch {
      // console.error("Error fetching suggestions:", err);
      setSuggestions([]);
    }
  };

  // Add clear search function
  const clearSearch = () => {
    setClinics([]);
    setCoords(null);
    setSelectedService("");
    setManualPlace("");
    setQuery("");
    setCurrentPage(1);
    setRatingFilter(0);
    setSuggestions([]);
    clearPersistedState();
  };

  const fetchClinics = async (lat: number, lng: number): Promise<void> => {
    setLoading(true);
    try {
      const res = await axios.get("/api/clinics/nearby", {
        params: { lat, lng, service: selectedService },
      });
      const clinicsWithDistance = res.data.clinics.map((clinic: Clinic) => {
        if (
          clinic.location &&
          clinic.location.coordinates &&
          clinic.location.coordinates.length === 2
        ) {
          const clinicLng = clinic.location.coordinates[0];
          const clinicLat = clinic.location.coordinates[1];
          const distance = calculateDistance(lat, lng, clinicLat, clinicLng);
          return {
            ...clinic,
            distance: distance,
          };
        } else {
          return { ...clinic, distance: null };
        }
      });
      // Sort by distance, but keep Dubai prioritized clinics at top
      clinicsWithDistance.sort((a: Clinic, b: Clinic) => {
        // If both have Dubai priority, sort by distance
        if (a.isDubaiPrioritized && b.isDubaiPrioritized) {
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return (a.distance ?? 0) - (b.distance ?? 0);
        }
        // Dubai prioritized clinics always come first
        if (a.isDubaiPrioritized) return -1;
        if (b.isDubaiPrioritized) return 1;
        // Regular distance sorting
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return (a.distance ?? 0) - (b.distance ?? 0);
      });
      setClinics(clinicsWithDistance);
    } catch {
      // console.error("Error fetching clinics:", err);
    } finally {
      setLoading(false);
    }
  };

  const locateMe = () => {
    setLoading(true);
    clearPersistedState(); // Clear old state when starting new search
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        fetchClinics(latitude, longitude);
      },
      () => {
        alert("Geolocation permission denied");
        setLoading(false);
      }
    );
  };

  const searchByPlace = async () => {
    if (!manualPlace.trim()) return;

    setLoading(true);
    clearPersistedState(); // Clear old state when starting new search
    try {
      const res = await axios.get("/api/clinics/geocode", {
        params: { place: manualPlace },
      });

      setCoords({ lat: res.data.lat, lng: res.data.lng });
      fetchClinics(res.data.lat, res.data.lng);
    } catch {
      // console.error("Error in manual place search:", err);
      setLoading(false);
    }
  };



  const renderStars = (rating = 4.0) => {
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

  // Function to fetch reviews for a single clinic
  const fetchReviewsForClinic = async (clinicId: string) => {
    try {
      const res = await axios.get(`/api/clinics/reviews/${clinicId}`);
      if (res.data.success) {
        setClinicReviews((prev) => ({
          ...prev,
          [clinicId]: res.data.data,
        }));
      }
    } catch {
      setClinicReviews((prev) => ({
        ...prev,
        [clinicId]: {
          averageRating: 0,
          totalReviews: 0,
          reviews: [],
        },
      }));
    }
  };

  useEffect(() => {
    if (!clinics || clinics.length === 0) return;
    const fetchReviews = async () => {
      // Set loading state for all clinics
      const loadingState: { [key: string]: boolean } = {};
      clinics.forEach((clinic) => {
        loadingState[clinic._id] = true;
      });

      const reviewsObj: { [key: string]: ReviewData } = {};
      await Promise.all(
        clinics.map(async (clinic) => {
          try {
            const res = await axios.get(`/api/clinics/reviews/${clinic._id}`);
            if (res.data.success) {
              reviewsObj[clinic._id] = res.data.data;
            }
          } catch {
            reviewsObj[clinic._id] = {
              averageRating: 0,
              totalReviews: 0,
              reviews: [],
            };
          }
        })
      );
      setClinicReviews(reviewsObj);

      // Clear loading state for all clinics
      const clearLoadingState: { [key: string]: boolean } = {};
      clinics.forEach((clinic) => {
        clearLoadingState[clinic._id] = false;
      });
    };
    fetchReviews();
  }, [clinics]);

  const handleDoctorSearch = (
    e: FormEvent<HTMLFormElement> | React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/doctor/search?query=${encodeURIComponent(query)}`);
    } else {
      router.push("/doctor/search");
    }
  };

  // Helper functions to add
  const totalPages = Math.ceil(getFilteredClinics().length / clinicsPerPage);

  const getPaginatedClinics = (): Clinic[] => {
    const filteredClinics = getFilteredClinics();
    const startIndex = (currentPage - 1) * clinicsPerPage;
    const endIndex = startIndex + clinicsPerPage;
    return filteredClinics.slice(startIndex, endIndex);
  };

  const toggleTreatments = (clinicId: string) => {
    setExpandedTreatments((prev) => ({
      ...prev,
      [clinicId]: !prev[clinicId],
    }));
  };

  const handlePhoneKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!/[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handlePhoneInput = (e: ChangeEvent<HTMLInputElement>) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");
  };

  const handleExperienceKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!/[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleExperienceInput = (e: ChangeEvent<HTMLInputElement>) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={handleAuthModalClose}
        onSuccess={handleAuthSuccess}
        initialMode={authModalMode}
      />
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Find the Best <span className="text-green-600">Ayurvedic</span>{" "}
              Healing Near You
            </h1>
            {isAuthenticated && user && (
              <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200">
                <Shield className="w-4 h-4 mr-2" />
                Welcome back, {user.name}!
              </div>
            )}
          </div>

          {/* Simple Search Bar */}
          <div className="w-full max-w-6xl mx-auto mb-8 px-2 sm:px-4 md:px-6 lg:px-8">
            <div className="bg-white rounded-2xl p-4 md:p-6 shadow-lg border border-gray-100">
              {/* Desktop Layout */}
              <div className="hidden md:flex gap-4 items-center justify-center">
                <div className="relative flex-1 max-w-lg">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <Search className="h-5 w-5 text-green-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search doctors, treatments, specialties..."
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      fetchSuggestions(e.target.value);
                      // Clear selected service when input is cleared
                      if (e.target.value === '') {
                        setSelectedService('');
                      }
                    }}
                    onKeyPress={(e) => e.key === "Enter" && searchByPlace()}
                    className="w-full pl-12 pr-4 py-3.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:bg-white transition-all placeholder:text-gray-500 text-sm"
                    ref={searchInputRef}
                  />

                  {/* Desktop Suggestions Dropdown - FIXED */}
                  {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-[99999] mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-96 overflow-y-auto pointer-events-auto"
                      ref={suggestionsDropdownRef}
                    >
                      <div className="p-2">
                        {suggestions.map((s, i) => (
                          <div
                            key={i}
                            className="flex items-center px-4 py-4 hover:bg-green-50 cursor-pointer transition-all duration-200 border-b border-gray-100 last:border-b-0 rounded-xl mx-1 group"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedService(s.value);
                              setQuery(s.value);
                              setSuggestions([]);
                              searchInputRef.current?.blur();
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          >
                            <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mr-4">
                              <span className="text-lg">
                                {s.type === "treatment" ? "🌿" : "🕉️"}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors text-sm md:text-base">
                                {s.value}
                              </p>
                              <p className="text-xs md:text-sm text-green-600 capitalize font-medium">
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
                    <MapPin className="h-5 w-5 text-green-500 transition-colors" />
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
                  onClick={searchByPlace}
                  className="px-6 py-3.5 bg-green-600 text-white rounded-xl font-medium cursor-pointer hover:bg-green-700 transition-all shadow-md hover:shadow-lg"
                >
                  Find Healers
                </button>
              </div>

              {/* Mobile Layout */}
              <div className="md:hidden space-y-4">
                {/* Search Input Row with Near Me Button */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <Search className="h-5 w-5 text-green-500" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search doctors, treatments..."
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        fetchSuggestions(e.target.value);
                        // Clear selected service when input is cleared
                        if (e.target.value === '') {
                          setSelectedService('');
                        }
                      }}
                      onKeyPress={(e) => e.key === "Enter" && searchByPlace()}
                      className="w-full pl-12 pr-4 py-3.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:bg-white transition-all placeholder:text-gray-500 text-sm"
                      ref={searchInputRef}
                    />

                    {/* Mobile Suggestions Dropdown - FIXED */}
                    {suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-[99999] mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-96 overflow-y-auto pointer-events-auto"
                        ref={suggestionsDropdownRef}
                      >
                        <div className="p-2">
                          {suggestions.map((s, i) => (
                            <div
                              key={i}
                              className="flex items-center px-4 py-4 hover:bg-green-50 cursor-pointer transition-all duration-200 border-b border-gray-100 last:border-b-0 rounded-xl mx-1 group"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedService(s.value);
                                setQuery(s.value);
                                setSuggestions([]);
                                searchInputRef.current?.blur();
                              }}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                            >
                              <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mr-4">
                                <span className="text-lg">
                                  {s.type === "treatment" ? "🌿" : "🕉️"}
                                </span>
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors text-sm md:text-base">
                                  {s.value}
                                </p>
                                <p className="text-xs md:text-sm text-green-600 capitalize font-medium">
                                  {s.type}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Near Me Button for Mobile Only */}
                  <button
                    type="button"
                    onClick={locateMe}
                    disabled={loading}
                    className="flex items-center justify-center px-4 py-3.5 bg-green-600 text-white rounded-xl cursor-pointer hover:bg-green-700 transition-all font-medium disabled:opacity-50 flex-shrink-0 shadow-md hover:shadow-lg"
                    title="Near Me"
                  >
                    <Navigation className="w-4 h-4" />
                  </button>
                </div>

                {/* Location Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
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
                    onClick={searchByPlace}
                    className="flex-1 px-4 py-3.5 bg-green-600 text-white rounded-xl font-medium cursor-pointer hover:bg-green-700 transition-all shadow-md hover:shadow-lg"
                  >
                    Find Healers
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Sticky Register Doctor Button on the left */}
          {clinics.length > 0 && (
            <div className="md:w-1/5 flex-shrink-0 flex md:block justify-center md:justify-start">
              <div className="md:sticky md:top-8">
                <button
                  className="cursor-pointer sm:flex items-center space-x-4 bg-gradient-to-r from-green-800 to-emerald-600 text-white px-6 py-2.5 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group"
                  style={{ minWidth: 180 }}
                  onClick={() => {
                    if (registrationRef.current) {
                      registrationRef.current.scrollIntoView({
                        behavior: "smooth",
                      });
                    }
                  }}
                >
                  <span>⚕️</span>
                  <span>Register Doctor</span>
                  <span className="group-hover:translate-x-1 transition-transform duration-300">
                    →
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Results with Filter */}
          <div className="">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Results Section - Left Side */}
              <div className="flex-1 lg:w-2/3">
                {/* Results Header with Filter */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-green-700">
                      {clinics.length > 0
                        ? `🌿 Found ${clinics.length} Ayurvedic Clinics`
                        : ""}
                    </h2>
                    {selectedService && (
                      <p className="text-green-600 mt-1">
                        Showing results for &quot;{selectedService}&quot;
                      </p>
                    )}
                  </div>

                  {/* Filter Options */}
                  {clinics.length > 0 && (
                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        onClick={clearSearch}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium text-sm flex items-center clear-search-btn"
                      >
                        <span className="mr-1">✕</span>
                        Clear Search
                      </button>
                      <div className="relative">
                        <select
                          value={ratingFilter}
                          onChange={(e) =>
                            setRatingFilter(Number(e.target.value))
                          }
                          className="bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-green-700 font-medium focus:border-green-500 focus:ring-2 focus:ring-green-200"
                        >
                          <option value={0}>All Ratings</option>
                          <option value={1}>1+ Stars</option>
                          <option value={2}>2+ Stars</option>
                          <option value={3}>3+ Stars</option>
                          <option value={4}>4+ Stars</option>
                          <option value={5}>5 Stars</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2">
                        <Filter className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                          Filter
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Loading State */}
                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-12 w-12 border-3 border-green-200 border-t-green-600"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl">🌿</span>
                      </div>
                    </div>
                    <span className="ml-4 text-lg font-medium text-green-700">
                      Finding the best Ayurvedic healers for you...
                    </span>
                  </div>
                )}

                {/* No Results */}
                {!loading && clinics.length === 0 && coords && (
                  <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="max-w-md mx-auto">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🔍</span>
                      </div>
                      <h3 className="text-xl font-bold text-green-800 mb-2">
                        No Ayurvedic clinics found
                      </h3>
                      <p className="text-green-600">
                        Try adjusting your search criteria or explore nearby
                        areas
                      </p>
                    </div>
                  </div>
                )}

                {/* Results List */}
                {!loading && clinics.length > 0 && (
                  <>
                    <div className="space-y-4">
                      {getPaginatedClinics().map((clinic, index) => (
                        <div
                          key={index}
                          className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all flex flex-col md:flex-row md:items-stretch md:gap-0 gap-4"
                        >
                          {/* Clinic Image */}
                          <div className="w-full h-48 sm:h-56 md:w-64 md:h-56 self-start flex-shrink-0 relative overflow-hidden rounded-t-lg md:rounded-t-none md:rounded-l-lg">
                            <Image
                              src={clinic.photos?.[0] || "/placeholder-clinic.svg"}
                              alt={`${clinic.name} clinic`}
                              className="w-full h-full object-contain"
                              width={256}
                              height={256}
                              unoptimized={true}
                            />

                            {clinic.distance !== null &&
                              clinic.distance !== undefined && (
                                <div className="absolute bottom-3 left-3 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                                  <Navigation className="w-3 h-3 mr-1" />
                                  {formatDistance(clinic.distance)}
                                </div>
                              )}
                          </div>

                          {/* Clinic Info */}
                          <div className="flex-1 flex flex-col justify-between p-4 sm:p-6">
                            <div>
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                                <div>
                                  <h3 className="text-lg sm:text-xl font-bold text-green-800 mb-1 break-words">
                                    {clinic.name}
                                  </h3>
                                  <p className="text-gray-600 flex items-center text-sm break-words">
                                    <MapPin className="w-4 h-4 mr-1 text-green-500" />
                                    {clinic.address}
                                  </p>
                                </div>
                                {/* Rating */}
                                {clinicReviews[clinic._id]?.totalReviews >
                                  0 && (
                                    <div className="flex items-center bg-green-50 rounded-lg p-2 mt-2 sm:mt-0">
                                      <div className="flex items-center mr-2">
                                        {renderStars(
                                          clinicReviews[clinic._id]
                                            ?.averageRating ?? 0
                                        )}
                                      </div>
                                      <span className="text-sm font-bold text-green-800">
                                        {clinicReviews[
                                          clinic._id
                                        ]?.averageRating?.toFixed(1) ?? "0.0"}
                                      </span>
                                      <span className="text-xs text-green-600 ml-1">
                                        (
                                        {clinicReviews[clinic._id]
                                          ?.totalReviews ?? 0}
                                        )
                                      </span>
                                    </div>
                                  )}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                {/* Treatments */}
                                <div>
                                  <h4 className="text-sm font-bold text-green-700 mb-2 flex items-center">
                                    <span className="mr-2">🌿</span>
                                    Treatments:
                                  </h4>
                                  <div className="flex flex-wrap gap-1">
                                    {expandedTreatments[clinic._id]
                                      ? clinic.treatments?.map(
                                        (treatment: string, idx: number) => (
                                          <span
                                            key={idx}
                                            className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium"
                                          >
                                            {treatment}
                                          </span>
                                        )
                                      )
                                      : clinic.treatments
                                        ?.slice(0, 3)
                                        .map(
                                          (
                                            treatment: string,
                                            idx: number
                                          ) => (
                                            <span
                                              key={idx}
                                              className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium"
                                            >
                                              {treatment}
                                            </span>
                                          )
                                        )}
                                    {(clinic.treatments?.length ?? 0) > 3 && (
                                      <span
                                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium cursor-pointer hover:bg-gray-200"
                                        onClick={() =>
                                          toggleTreatments(clinic._id)
                                        }
                                      >
                                        {expandedTreatments[clinic._id]
                                          ? "Show less"
                                          : `+${(clinic.treatments?.length ?? 0) -
                                          3
                                          } more`}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {/* Services */}
                                {clinic.servicesName &&
                                  clinic.servicesName.length > 0 && (
                                    <div>
                                      <h4 className="text-sm font-bold text-green-700 mb-2 flex items-center">
                                        <span className="mr-2">🕉️</span>
                                        Categories:
                                      </h4>
                                      <div className="flex flex-wrap gap-1">
                                        {clinic.servicesName
                                          .slice(0, 3)
                                          .map((service, idx) => (
                                            <span
                                              key={idx}
                                              className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium"
                                            >
                                              {service}
                                            </span>
                                          ))}
                                        {clinic.servicesName.length > 3 && (
                                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                                            +{clinic.servicesName.length - 3}{" "}
                                            more
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                              </div>
                              {/* Details */}
                              <div className="flex flex-wrap gap-3 mb-4">
                                {clinic.pricing && (
                                  <div className="flex items-center text-sm text-gray-700 bg-green-50 rounded-lg px-3 py-1">
                                    <Award className="w-4 h-4 mr-1 text-green-500" />
                                    <span className="font-medium">Fee:</span>
                                    <span className="ml-1 font-bold text-green-700">
                                      AED {clinic.pricing}
                                    </span>
                                  </div>
                                )}
                                {clinic.timings && (
                                  <div className="flex items-center text-sm text-gray-700 bg-green-50 rounded-lg px-3 py-1">
                                    <Clock className="w-4 h-4 mr-1 text-green-500" />
                                    <span className="font-medium">Timing:</span>
                                    <span className="ml-1 font-bold text-green-700">
                                      {clinic.timings}
                                    </span>
                                  </div>
                                )}
                                {clinic.phone && (
                                  <div className="flex items-center text-sm text-gray-700 bg-green-50 rounded-lg px-3 py-1">
                                    <Phone className="w-4 h-4 mr-1 text-green-500" />
                                    <span className="font-medium">Phone:</span>
                                    <span className="ml-1 font-bold text-green-700">
                                      {clinic.phone}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                              <button
                                onClick={() => handleEnquiryClick(clinic)}
                                className="cursor-pointer flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-all font-medium text-sm flex items-center justify-center"
                              >
                                Enquiry
                                <MessageCircle className="w-4 h-4 ml-2" />
                              </button>
                              <button
                                onClick={() => handleReviewClick(clinic)}
                                className="cursor-pointer flex-1 bg-[#fdc700] text-white py-2 px-4 rounded-lg hover:bg-[#e6b400] transition-all font-medium text-sm flex items-center justify-center"
                              >
                                <Star className="w-4 h-4 mr-2" />
                                Review
                              </button>
                              {clinic.location &&
                                clinic.location.coordinates &&
                                clinic.location.coordinates.length === 2 && (
                                  <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${clinic.location.coordinates[1]},${clinic.location.coordinates[0]}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-all font-medium text-sm flex items-center justify-center"
                                  >
                                    Directions
                                    <Navigation className="w-4 h-4 ml-2" />
                                  </a>
                                )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {clinics.length > clinicsPerPage && (
                      <div className="flex justify-center items-center mt-8 space-x-2">
                        <button
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={currentPage === 1}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            const pageNumber =
                              Math.max(
                                1,
                                Math.min(currentPage - 2, totalPages - 4)
                              ) + i;
                            return (
                              <button
                                key={pageNumber}
                                onClick={() => setCurrentPage(pageNumber)}
                                className={`px-3 py-2 rounded-lg transition-all ${currentPage === pageNumber
                                  ? "bg-green-600 text-white"
                                  : "bg-white text-green-600 border border-green-600 hover:bg-green-50"
                                  }`}
                              >
                                {pageNumber}
                              </button>
                            );
                          }
                        )}

                        <button
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages)
                            )
                          }
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Why Choose Us Section - Right Side (Hidden on mobile) */}
              {clinics.length > 0 && (
                <div className="hidden lg:block lg:w-1/3">
                  <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 sticky top-4">
                    <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center">
                      <span className="mr-2">🌿</span>
                      Why Choose Our Ayurvedic Clinics?
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Shield className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-green-700 mb-1">
                            Verified Practitioners
                          </h4>
                          <p className="text-sm text-gray-600">
                            All our clinics have certified Ayurvedic doctors
                            with proven expertise
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Award className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-green-700 mb-1">
                            Authentic Treatments
                          </h4>
                          <p className="text-sm text-gray-600">
                            Traditional Panchakarma and modern Ayurvedic
                            therapies
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Star className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-green-700 mb-1">
                            Highly Rated
                          </h4>
                          <p className="text-sm text-gray-600">
                            Top-rated clinics based on real patient reviews and
                            experiences
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Clock className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-green-700 mb-1">
                            Convenient Booking
                          </h4>
                          <p className="text-sm text-gray-600">
                            Easy online booking system with flexible appointment
                            slots
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-green-700 mb-1">
                            Location Based
                          </h4>
                          <p className="text-sm text-gray-600">
                            Find the nearest quality Ayurvedic clinics in your
                            area
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>{" "}
      {/* <-- Add this missing closing div for the previous container */}
      {/* Doctor Search & Registration Section */}
      <div className="flex flex-col xl:grid xl:grid-cols-2 gap-8 max-w-7xl mx-auto">
        {/* Doctor Search Card */}
        <div className="mb-6 xl:mb-0">
          <div
            className="doctor-card-parent cursor-pointer"
            onClick={handleDoctorSearch}
          >
            <div className="doctor-card">
              <div className="doctor-image-container">
                <div className="doctor-image w-32 h-32 rounded-full overflow-hidden mx-auto mb-4">
                  <Image
                    src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                    alt="Doctor"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="doctor-content">
                <h3 className="doctor-title">Find Expert Doctors</h3>
                <p className="doctor-subtitle">
                  Connect with certified Ayurvedic practitioners
                </p>

                <div className="doctor-rating">
                  <div className="rating-stars">
                    <span className="star">★</span>
                    <span className="star">★</span>
                    <span className="star">★</span>
                    <span className="star">★</span>
                    <span className="star">★</span>
                  </div>
                  <span className="rating-text">
                    4.9/5 from 2,500+ patients
                  </span>
                </div>
              </div>

              <div className="doctor-cta">
                <span className="cta-text">Click to find doctors →</span>
              </div>

              {/* Hover Overlay */}
              {/* <div className="hover-overlay">
                      <span className="hover-message">
                        Click here to search for doctors
                      </span>
                    </div> */}
            </div>
          </div>
          <div className="hidden xl:block mt-8">
            <div className="benefits-container">
              <div className="benefits-card">
                <div className="benefits-header">
                  <div className="benefits-badge">
                    <span className="benefits-badge-text">🩺</span>
                  </div>
                  <h4 className="benefits-title">
                    Why Doctors Should Register on Our Platform
                  </h4>
                </div>
                <div className="benefits-grid">
                  <div className="benefit-item">
                    <div className="benefit-icon">
                      <Users className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="benefit-content">
                      <h5 className="benefit-title">Expand Patient Base</h5>
                      <p className="benefit-text">
                        Reach thousands of patients seeking Ayurvedic care
                      </p>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <div className="benefit-icon">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="benefit-content">
                      <h5 className="benefit-title">Grow Your Practice</h5>
                      <p className="benefit-text">
                        Increase consultations and build your reputation
                      </p>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <div className="benefit-icon">
                      <Award className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div className="benefit-content">
                      <h5 className="benefit-title">
                        Professional Recognition
                      </h5>
                      <p className="benefit-text">
                        Showcase credentials and expertise to patients
                      </p>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <div className="benefit-icon">
                      <Clock className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="benefit-content">
                      <h5 className="benefit-title">Flexible Schedule</h5>
                      <p className="benefit-text">
                        Manage appointments and consultations easily
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <div className="w-full xl:w-auto mt-2 xl:mt-0">
          <div className="registration-container" ref={registrationRef}>
            <div className="registration-card">
              {/* Header Section */}
              <div className="registration-header">
                <div className="header-bg"></div>
                <div className="header-content">
                  <div className="header-icon">
                    <Leaf className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h2 className="header-title text-xl sm:text-2xl">
                    Doctor Details
                  </h2>
                  <p className="header-subtitle text-sm sm:text-base">
                    Share your details and we will reach out to you with the
                    next steps
                  </p>
                  <div className="header-stats flex-col sm:flex-row gap-2 sm:gap-4">
                    <div className="header-stat">
                      <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm">
                        Growing Network
                      </span>
                    </div>
                    <div className="header-stat">
                      <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm">
                        Pan-Dubai Reach
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Section */}
              <div className="registration-form">
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 sm:space-y-5"
                >
                  <div className="form-row flex-col sm:flex-row gap-4 sm:gap-6">
                    <div className="form-group flex-1 relative">
                      {/* Icon stays absolutely positioned */}
                      <Award className="absolute left-3 top-1/2 -translate-y-1/2 text-black pointer-events-none z-10" />

                      {/* Input with proper left padding to avoid overlapping the icon */}
                      <input
                        name="name"
                        type="text"
                        placeholder="Full Name"
                        className="form-input w-full pl-10 placeholder-black z-0"
                        onChange={handleChange}
                        value={form.name || ""}
                        required
                      />
                    </div>


                    <div className="form-group flex-1 relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-black pointer-events-none z-10" />
                      <input
                        name="phone"
                        type="tel"
                        placeholder="Phone Number"
                        className="form-input w-full pl-10 placeholder-black z-0"
                        onChange={handleChange}
                        onKeyPress={handlePhoneKeyPress}
                        onInput={handlePhoneInput}
                        value={form.phone || ""}
                        required
                      />
                    </div>

                  </div>

                  <div className="form-group relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-black pointer-events-none z-10" />
                    <input
                      name="email"
                      type="email"
                      placeholder="Email Address"
                      className="form-input w-full pl-10 placeholder-black z-0"
                      onChange={handleChange}
                      value={form.email || ""}
                      required
                    />
                  </div>


                  <div className="form-col flex flex-col gap-4 items-stretch">

                    {/* Specialization */}
                    <div className="form-group relative">
                      {/* Dropdown with icon */}
                      <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 text-black pointer-events-none z-10" />
                      <select
                        id="specialization"
                        name="specialization"
                        className="form-input w-full pl-10 pr-12 text-black appearance-none bg-white border border-green-500 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm sm:text-base"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23000000' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 1rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1em 1em',
                          minHeight: '48px',
                        }}
                        value={specializationType === 'dropdown' ? form.specialization : 'other'}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            setSpecializationType('dropdown');
                            setForm((prev) => ({ ...prev, specialization: '' }));
                            setCustomSpecialization('');
                          } else if (value === 'other') {
                            setSpecializationType('other');
                            setForm((prev) => ({ ...prev, specialization: '' }));
                          } else {
                            setSpecializationType('dropdown');
                            setForm((prev) => ({ ...prev, specialization: value }));
                          }
                        }}
                        required
                      >
                        <option value="" disabled hidden>Select Specialization</option>
                        {treatments.map((t) => (
                          <option key={t} value={t} className="text-black">{t}</option>
                        ))}
                        <option value="other" className="text-black">Other</option>
                      </select>
                    </div>

                    {/* Custom input when 'Other' is selected */}
                    {specializationType === 'other' && (
                      <div className="form-group relative">
                        <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 text-black pointer-events-none z-10" />
                        <input
                          type="text"
                          className="form-input w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm sm:text-base"
                          placeholder="Enter your specialization"
                          value={customSpecialization}
                          onChange={(e) => {
                            setCustomSpecialization(e.target.value);
                            setForm((prev) => ({
                              ...prev,
                              specialization: e.target.value,
                            }));
                          }}
                          style={{ minHeight: '48px' }}
                          required
                        />
                      </div>
                    )}

                    {/* Experience Input */}
                    <div className="form-group relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-black pointer-events-none z-10" />
                      <input
                        name="experience"
                        type="text"
                        placeholder="Experience (Years)"
                        className="form-input w-full pl-10 placeholder-black z-0 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                        onChange={handleChange}
                        onKeyPress={handleExperienceKeyPress}
                        onInput={handleExperienceInput}
                        value={form.experience || ''}
                        required
                      />
                    </div>

                  </div>



                  <div className="form-group relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-black pointer-events-none z-10" />
                    <input
                      name="degree"
                      type="text"
                      placeholder="Degree & Qualifications"
                      className="form-input w-full pl-10 placeholder-black z-0"
                      onChange={handleChange}
                      value={form.degree || ""}
                      required
                    />
                  </div>


                  <div className="form-group relative">
                    <MapPin className="absolute left-3 top-4 text-black pointer-events-none z-10" />
                    <textarea
                      name="address"
                      placeholder="Clinic Address"
                      rows={3}
                      className="form-input form-textarea w-full pl-10 placeholder-black resize-none z-0"
                      onChange={handleChange}
                      value={form.address || ""}
                      required
                    ></textarea>
                  </div>


                  <div className="form-group relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-black pointer-events-none z-10" />

                    <div className="relative w-full">
                      <input
                        type="file"
                        name="resume"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const maxSize = 1024 * 1024; // 1MB in bytes
                            if (file.size > maxSize) {
                              setFileError('File is too large');
                              e.target.value = '';
                              return;
                            }
                            setFileError('');
                            handleChange(e);
                          }
                        }}
                        className="form-input form-file absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        required
                      />

                      <div className="form-input border-2 border-dashed border-gray-300 bg-gray-50 text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors py-3 pl-10 pr-4 text-sm sm:text-base z-0">
                        {resumeFileName ? "Change Resume" : "Upload Resume"}
                      </div>
                    </div>

                    {/* File size message */}
                    <div className={`text-xs mt-1 ${fileError ? 'text-red-500' : 'text-gray-500'}`}>
                      {fileError || 'Please upload a file less than 1MB'}
                    </div>
                  </div>

                  {resumeFileName && (
                    <div className="text-green-700 text-sm mt-2 font-medium break-all">
                      {resumeFileName}
                    </div>
                  )}
                  <button type="submit" className="submit-button w-full">
                    <div className="button-content">
                      <Leaf className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      <span className="text-sm sm:text-base">
                        Register as Ayurvedic Doctor
                      </span>
                    </div>
                    <div className="button-shine"></div>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Why Choose Us Section */}
      <div className="why-choose-section">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                <Heart className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Why Choose Our Ayurveda Platform?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Connect with authentic Ayurvedic practitioners and clinics for
                holistic healing and wellness solutions
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              <div className="feature-card">
                <div className="feature-icon">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="feature-title">Verified Practitioners</h3>
                <p className="feature-description">
                  All doctors and clinics are thoroughly verified and certified
                  by Ayurvedic boards
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <MapPin className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="feature-title">Location-Based Search</h3>
                <p className="feature-description">
                  Find nearby Ayurvedic practitioners and clinics in your area
                  instantly
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="feature-title">Easy Appointment Booking</h3>
                <p className="feature-description">
                  Book appointments online with your preferred doctors and
                  clinics
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <Video className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="feature-title">Online Consultations</h3>
                <p className="feature-description">
                  Get expert advice through secure video consultations from
                  anywhere
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="feature-title">Digital Health Records</h3>
                <p className="feature-description">
                  Maintain your health records digitally with secure cloud
                  storage
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="feature-title">Personalized Treatment</h3>
                <p className="feature-description">
                  Get customized Ayurvedic treatment plans based on your
                  constitution
                </p>
              </div>
            </div>

            {/* Stats Section */}
            <div className="stats-section">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="stat-card">
                  <div className="stat-number">500+</div>
                  <div className="stat-label">Verified Doctors</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">200+</div>
                  <div className="stat-label">Partner Clinics</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">10K+</div>
                  <div className="stat-label">Happy Patients</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">50+</div>
                  <div className="stat-label">Cities Covered</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Registration Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative animate-fade-in">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-lime-400/20 to-green-400/20 rounded-full translate-y-8 -translate-x-8"></div>
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all duration-200 z-50 cursor-pointer"
              aria-label="Close"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="flex flex-col items-center text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold text-green-700 mb-2">
                Registration Successful!
              </h2>
              <p className="text-gray-700 text-lg mb-4">
                We will reach out to you soon.
              </p>
              <button
                className="mt-2 px-6 py-2 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white rounded-xl font-semibold shadow hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 transition-all cursor-pointer"
                onClick={() => setShowSuccessModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Registration Error Modal */}
      {errorModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative animate-fade-in">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-400/20 to-rose-400/20 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-rose-400/20 to-red-400/20 rounded-full translate-y-8 -translate-x-8"></div>
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setErrorModal({ show: false, message: "" })}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all duration-200 z-50 cursor-pointer"
              aria-label="Close"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="flex flex-col items-center text-center">
              <svg
                className="w-16 h-16 text-red-500 mb-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 9l-6 6m0-6l6 6"
                />
              </svg>
              <h2 className="text-2xl font-bold text-red-700 mb-2">
                Registration Failed
              </h2>
              <p className="text-gray-700 text-lg mb-4">{errorModal.message}</p>
              <button
                className="mt-2 px-6 py-2 bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 text-white rounded-xl font-semibold shadow hover:from-red-700 hover:via-rose-700 hover:to-pink-700 transition-all"
                onClick={() => setErrorModal({ show: false, message: "" })}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {isVisible && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="cursor-pointer fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300"
          style={{ zIndex: 9999 }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
      )}
      <style jsx>{`
       /* Doctor Search Card */
.doctor-card-parent {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

/* Only apply hover effects on devices with hover capability */
@media (hover: hover) {
  .doctor-card-parent {
    transition: transform 0.2s ease;
  }
  
  .doctor-card-parent:hover {
    transform: translateY(-4px);
  }
}

.doctor-card {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-radius: 16px;
  padding: 32px 24px 24px 24px;
  box-shadow: 0 4px 20px rgba(5, 150, 105, 0.15);
  border: 1px solid #bbf7d0;
  position: relative;
  min-height: 350px;
  overflow: hidden;
  transition: all 0.3s ease;
}

/* Hover effects only for devices with hover capability */
@media (hover: hover) {
  .doctor-card:hover {
    box-shadow: 0 8px 32px rgba(5, 150, 105, 0.25);
    border-color: #059669;
    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  }
}

.doctor-image-container {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.doctor-image {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #ffffff;
  box-shadow: 0 8px 24px rgba(5, 150, 105, 0.3);
  position: relative;
  transition: transform 0.3s ease;
}

@media (hover: hover) {
  .doctor-card:hover .doctor-image {
    transform: scale(1.05);
    box-shadow: 0 12px 32px rgba(5, 150, 105, 0.4);
  }
}

.doctor-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: transform 0.3s ease;
}

@media (hover: hover) {
  .doctor-card:hover .doctor-image img {
    transform: scale(1.1);
  }
}

.doctor-content {
  text-align: center;
  margin-bottom: 20px;
}

.doctor-title {
  color: #064e3b;
  font-size: clamp(18px, 4vw, 24px);
  font-weight: 700;
  margin-bottom: 8px;
  line-height: 1.2;
}

.doctor-subtitle {
  color: #047857;
  font-size: clamp(14px, 3vw, 16px);
  margin-bottom: 20px;
  line-height: 1.4;
  font-weight: 500;
}

.doctor-rating {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.rating-stars {
  display: flex;
  gap: 2px;
}

.star {
  color: #fbbf24;
  font-size: clamp(14px, 3vw, 18px);
}

.rating-text {
  color: #047857;
  font-size: clamp(12px, 2.5vw, 14px);
  font-weight: 500;
}

.doctor-cta {
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid #bbf7d0;
}

.cta-text {
  color: #059669;
  font-size: clamp(12px, 2.5vw, 14px);
  font-weight: 600;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

@media (hover: hover) {
  .doctor-card:hover .cta-text {
    opacity: 1;
  }
}

/* Hover Overlay - only for hover-capable devices */
.hover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(5, 150, 105, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  border-radius: 16px;
  backdrop-filter: blur(2px);
  transition: opacity 0.3s ease;
}

.hover-message {
  color: white;
  font-size: clamp(14px, 3vw, 18px);
  font-weight: 600;
  text-align: center;
  padding: 0 20px;
  transform: translateY(10px);
  transition: transform 0.3s ease;
}

@media (hover: hover) {
  .doctor-card:hover .hover-overlay {
    opacity: 1;
  }
  
  .doctor-card:hover .hover-message {
    transform: translateY(0);
  }
}

/* Responsive Breakpoints */

/* Small tablets and large phones */
@media (max-width: 768px) {
  .doctor-card {
    padding: 24px 20px 20px 20px;
    min-height: 300px;
    max-width: 350px;
    margin: 0 auto;
  }

  .doctor-image {
    width: 100px;
    height: 100px;
    border-width: 3px;
  }

  .doctor-content {
    margin-bottom: 16px;
  }

  .doctor-subtitle {
    margin-bottom: 16px;
  }

  .doctor-cta {
    padding-top: 12px;
  }
}

/* Mobile phones */
@media (max-width: 480px) {
  .doctor-card-parent {
    max-width: 100%;
    padding: 0 10px;
  }

  .doctor-card {
    max-width: 100%;
    min-height: 280px;
    padding: 20px 16px 16px 16px;
    margin: 0;
  }

  .doctor-image {
    width: 80px;
    height: 80px;
    border-width: 2px;
  }

  .doctor-image-container {
    margin-bottom: 16px;
  }

  .doctor-content {
    margin-bottom: 12px;
  }

  .doctor-subtitle {
    margin-bottom: 12px;
  }

  .rating-stars {
    gap: 1px;
  }

  .doctor-rating {
    gap: 6px;
  }

  .doctor-cta {
    padding-top: 8px;
  }
}

/* Extra small phones */
@media (max-width: 360px) {
  .doctor-card {
    min-height: 260px;
    padding: 16px 12px 12px 12px;
  }

  .doctor-image {
    width: 70px;
    height: 70px;
  }

  .doctor-image-container {
    margin-bottom: 12px;
  }

  .doctor-title {
    margin-bottom: 6px;
  }

  .doctor-subtitle {
    margin-bottom: 10px;
  }
}

/* Large tablets */
@media (min-width: 769px) and (max-width: 1024px) {
  .doctor-card {
    max-width: 380px;
    min-height: 340px;
  }

  .doctor-image {
    width: 120px;
    height: 120px;
  }
}

/* Desktop and larger screens */
@media (min-width: 1025px) {
  .doctor-card {
    max-width: 400px;
    min-height: 370px;
    padding: 36px 28px 28px 28px;
  }

  .doctor-image {
    width: 150px;
    height: 150px;
  }

  .doctor-image-container {
    margin-bottom: 28px;
  }

  .doctor-content {
    margin-bottom: 24px;
  }
}

        /* Enhanced Registration Form */
        .registration-container {
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
  padding: 0 16px; /* Add padding for mobile */
}

.registration-card {
  background: white;
  border-radius: 32px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.registration-header {
  position: relative;
  padding: 40px 32px;
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  color: white;
  min-height: 250px; /* Changed from fixed height to min-height */
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
    repeat;
  opacity: 0.1;
}

.header-content {
  position: relative;
  z-index: 2;
  text-align: center;
}

.header-icon {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.header-title {
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.header-subtitle {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 20px;
  line-height: 1.5;
}

.header-stats {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap; /* Allow wrapping on small screens */
}

.header-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.registration-form {
  padding: 40px 32px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #6b7280;
  z-index: 2;
}

.textarea-icon {
  top: 20px;
  transform: none;
}

.form-input {
  width: 100%;
  padding: 16px 16px 16px 48px;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 500;
  background: white;
  color: #1f2937;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #059669;
  box-shadow: 0 0 0 4px rgba(5, 150, 105, 0.1);
  transform: translateY(-1px);
}

.form-textarea {
  resize: none;
  padding-top: 16px;
}

.form-file {
  padding: 12px 16px 12px 48px;
}

.form-file::file-selector-button {
  margin-right: 16px;
  padding: 8px 16px;
  border: none;
  border-radius: 12px;
  background: #f3f4f6;
  color: #374151;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.submit-button {
  width: 100%;
  padding: 18px 24px;
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  color: white;
  border: none;
  border-radius: 18px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 25px rgba(5, 150, 105, 0.3);
  margin-top: 8px;
}

.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
}

.button-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  transition: left 0.5s ease;
}

/* Mobile-first responsive design */
@media screen and (max-width: 768px) {
  .registration-container {
    padding: 0 12px;
  }
  
  .registration-card {
    border-radius: 24px;
  }
  
  .registration-header {
    padding: 32px 24px;
    min-height: 220px;
  }
  
  .header-icon {
    width: 50px;
    height: 50px;
    margin-bottom: 16px;
  }
  
  .header-title {
    font-size: 24px;
    margin-bottom: 6px;
  }
  
  .header-subtitle {
    font-size: 14px;
    margin-bottom: 16px;
  }
  
  .header-stats {
    gap: 16px;
  }
  
  .header-stat {
    font-size: 12px;
  }
  
  .registration-form {
    padding: 32px 24px;
  }
  
  .form-row {
    grid-template-columns: 1fr; /* Stack form fields on mobile */
    gap: 16px;
  }
  
  .form-group {
    margin-bottom: 16px;
  }
  
  .form-input {
    padding: 14px 14px 14px 44px;
    font-size: 14px;
    border-radius: 14px;
  }
  
  .input-icon {
    left: 14px;
    width: 16px;
    height: 16px;
  }
  
  .submit-button {
    padding: 16px 20px;
    font-size: 15px;
    border-radius: 16px;
  }
}

@media screen and (max-width: 480px) {
  .registration-container {
    padding: 0 8px;
  }
  
  .registration-card {
    border-radius: 20px;
  }
  
  .registration-header {
    padding: 24px 20px;
    min-height: 200px;
  }
  
  .header-icon {
    width: 45px;
    height: 45px;
    margin-bottom: 12px;
  }
  
  .header-title {
    font-size: 22px;
  }
  
  .header-subtitle {
    font-size: 13px;
    margin-bottom: 12px;
  }
  
  .header-stats {
    gap: 12px;
    flex-direction: column; /* Stack stats vertically on very small screens */
    align-items: center;
  }
  
  .registration-form {
    padding: 24px 20px;
  }
  
  .form-input {
    padding: 12px 12px 12px 40px;
    border-radius: 12px;
  }
  
  .input-icon {
    left: 12px;
    width: 14px;
    height: 14px;
  }
  
  .submit-button {
    padding: 14px 18px;
    border-radius: 14px;
  }
}

@media screen and (max-width: 320px) {
  .registration-header {
    padding: 20px 16px;
    min-height: 180px;
  }
  
  .header-title {
    font-size: 20px;
  }
  
  .registration-form {
    padding: 20px 16px;
  }
}

        /* Why Choose Us Section */
        .why-choose-section {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          margin-top: 80px;
          border-radius: 40px;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .feature-card {
          background: white;
          padding: 32px 24px;
          border-radius: 24px;
          border: 1px solid rgba(0, 0, 0, 0.06);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .feature-icon {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #dcfce7, #bbf7d0);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .feature-title {
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 12px;
          line-height: 1.3;
        }

        .feature-description {
          color: #6b7280;
          font-size: 15px;
          line-height: 1.6;
          font-weight: 500;
        }

        .stats-section {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          border-radius: 32px;
          padding: 48px 32px;
          margin-top: 32px;
          position: relative;
          overflow: hidden;
        }

        .stats-section::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
            repeat;
          opacity: 0.1;
        }

        .stat-card {
          text-align: center;
          position: relative;
          z-index: 2;
        }

        .stat-number {
          font-size: 48px;
          font-weight: 900;
          color: white;
          margin-bottom: 8px;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          line-height: 1;
        }

        .stat-label {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Form States */
        .form-input:focus + .input-icon {
          color: #059669;
        }

        .form-input:valid {
          border-color: #10b981;
        }

        .form-input:valid + .input-icon {
          color: #10b981;
        }

        .form-input:invalid:not(:focus):not(:placeholder-shown) {
          border-color: #ef4444;
        }

        .form-input:invalid:not(:focus):not(:placeholder-shown) + .input-icon {
          color: #ef4444;
        }

        /* Fix for specialization select - ensure gray border initially */
        select.form-input:invalid:not(:focus) {
          border-color: #e5e7eb;
        }

        select.form-input:invalid:not(:focus) + .input-icon {
          color: #000;
        }


        /* Benefits Section Styles */
        .benefits-container {
          padding: 0;
        }

        .benefits-card {
          background: linear-gradient(135deg, #f8fffe 0%, #e6f7f5 100%);
          border: 1px solid #e0f2f1;
          border-radius: 24px;
          padding: 28px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .benefits-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #10b981, #047857);
        }

        .benefits-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
        }

        .benefits-header {
          display: flex;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e0f2f1;
        }

        .benefits-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #10b981, #047857);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .benefits-icon .w-6 {
          color: white;
        }

        .benefits-title {
          font-size: 20px;
          font-weight: 700;
          color: #064e3b;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .benefits-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }

        .benefit-item {
          display: flex;
          align-items: flex-start;
          padding: 16px;
          background: white;
          border-radius: 16px;
          border: 1px solid #f0fdf4;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .benefit-item::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: linear-gradient(180deg, #10b981, #047857);
          transform: scaleY(0);
          transition: transform 0.3s ease;
        }

        .benefit-item:hover::before {
          transform: scaleY(1);
        }

        .benefit-item:hover {
          transform: translateX(4px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
          background: #f8fffe;
        }

        .benefit-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid #f0f9ff;
          transition: all 0.3s ease;
        }

        .benefit-item:hover .benefit-icon {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .benefit-content {
          flex: 1;
        }

        .benefit-title {
          font-size: 16px;
          font-weight: 600;
          color: #065f46;
          margin: 0 0 4px 0;
          line-height: 1.3;
        }

        .benefit-text {
          font-size: 14px;
          color: #047857;
          margin: 0;
          line-height: 1.4;
          opacity: 0.8;
        }

        /* Responsive adjustments */
        @media (min-width: 1536px) {
          .benefits-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }

          .benefit-item {
            padding: 14px;
          }

          .benefit-title {
            font-size: 15px;
          }

          .benefit-text {
            font-size: 13px;
          }
        }

        /* Enhance dropdown menu (option list) for Doctor Details specialization */
        .specialization-dropdown option {
          color: #065f46;
          background: #fff;
          font-weight: 600;
          font-size: 1.08rem;
          padding: 0.75rem 1.25rem;
          border-radius: 10px;
          margin-bottom: 4px;
        }
        @media (min-width: 1024px) {
          .specialization-dropdown option {
            font-size: 1.18rem;
            padding: 1rem 2rem;
          }
        }
        /* Note: For a fully custom dropdown menu (with custom scroll, shadow, hover, etc.), use a custom dropdown component (e.g., Headless UI, Radix UI, or your own implementation) */

        /* Make Clear Search button always visible and accessible on mobile */
        .clear-search-btn {
          display: flex;
        }
        @media (max-width: 600px) {
          .clear-search-btn {
            width: 100%;
            justify-content: center;
            margin-bottom: 8px;
            font-size: 1.1rem;
            padding: 14px 0;
          }
        }
        /* Specialization icon outside select */
        .doctor-form-specialization-row {
          display: flex;
          align-items: center;
          gap: 18px;
        }
        .doctor-form-specialization-icon-outer {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 32px;
        }
        .doctor-form-specialization-row .specialization-dropdown {
          margin: 0;
          flex: 1 1 0;
          width: 100%;
        }
        /* Make specialization select match input fields */
        .specialization-dropdown {
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          background: #f9fafb;
          color: #1f2937;
          font-size: 1rem;
          font-weight: 500;
          transition: all 0.3s ease;
          height: 52px;
          min-height: 52px;
          box-shadow: none;
        }
        .specialization-dropdown:focus {
          outline: none;
          border-color: #059669;
          box-shadow: 0 0 0 4px rgba(5, 150, 105, 0.1);
          background: #fff;
        }
        @media (max-width: 600px) {
          .specialization-dropdown {
            height: 44px;
            min-height: 44px;
            font-size: 0.98rem;
          }
        }
      `}</style>
    </div>
  );
}
