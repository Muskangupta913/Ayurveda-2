"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import {
  MapPin,
  Search,
  Star,
  Clock,
  Navigation,
  Shield,
  X,
} from "lucide-react";
import React from "react";
// import { useAuth } from "../context/AuthContext";
import AuthModal from "../components/AuthModal";
import Image from "next/image";
import SearchCard from "../components/SearchCard";
import Index1 from "../components/Index1";
import Blog from "../components/blog";
// import LatestJobs from "@/components/LatestJobs";

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
  treatments?: Array<{
    mainTreatment: string;
    mainTreatmentSlug: string;
    subTreatments: Array<{
      name: string;
      slug: string;
    }>;
  }>;
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
// interface ErrorModalState {
//   show: boolean;
//   message: string;
// }

export default function Home(): React.ReactElement {
  const [query, setQuery] = useState("");
  // const searchRef = useRef<HTMLDivElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  // const [clinicsPerPage] = useState(5); // You can change this number
  // const [setExpandedTreatments] = useState<
  //   Record<string, boolean>
  // >({});
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
  const [authModalMode] = useState<"login" | "register">(
    "login"
  );
  const [pendingAction, setPendingAction] = useState<{
    type: "enquiry" | "review";
    clinic: Clinic;
  } | null>(null);

  const router = useRouter();
  // const { isAuthenticated} = useAuth();




  const [clinicReviews, setClinicReviews] = useState<{
    [key: string]: ReviewData;
  }>({});

  const [isVisible, setIsVisible] = useState(false);

  // Add missing state variables for filters
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('relevance');

  // Add the clearFilters function
  const clearFilters = () => {
    setPriceRange([0, 5000]);
    setSelectedTimes([]);
    setRatingFilter(0);
    setSortBy('relevance');
    // Don't clear search results, only reset filters
  };

  // Add the getSortedClinics function
  const getSortedClinics = (clinics: Clinic[]) => {
    const sorted = [...clinics];

    switch (sortBy) {
      case 'price-low-high':
        return sorted.sort((a, b) => {
          const priceA = parseInt(a.pricing || '0');
          const priceB = parseInt(b.pricing || '0');
          return priceA - priceB;
        });
      case 'price-high-low':
        return sorted.sort((a, b) => {
          const priceA = parseInt(a.pricing || '0');
          const priceB = parseInt(b.pricing || '0');
          return priceB - priceA;
        });
      case 'rating-high-low':
        return sorted.sort((a, b) => {
          const ratingA = clinicReviews[a._id]?.averageRating || 0;
          const ratingB = clinicReviews[b._id]?.averageRating || 0;
          return ratingB - ratingA;
        });
      case 'experience-high-low':
        // Since clinics don't have experience field, we'll sort by name
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return sorted;
    }
  };

  // Add available times array
  const availableTimes = [
    'Early Morning (4 AM - 6 AM)',
    'Morning (6 AM - 12 PM)',
    'Late Morning (10 AM - 12 PM)',
    'Afternoon (12 PM - 6 PM)',
    'Late Afternoon (3 PM - 6 PM)',
    'Evening (6 PM - 10 PM)',
    'Late Night (10 PM - 12 AM)',
    'Night (12 AM - 4 AM)',
    'Available Today',
    'Available Tomorrow',
    'Weekend Available'
  ];

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const suggestionsDropdownRef = useRef<HTMLDivElement | null>(null);

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



  const getFilteredClinics = (): Clinic[] => {
    const filtered = clinics.filter((clinic) => {
      const rating = clinicReviews[clinic._id]?.averageRating ?? 0;
      const matchesRating = rating >= ratingFilter;

      // Price filter
      const clinicPrice = parseInt(clinic.pricing || '0');
      const matchesPrice = clinicPrice >= priceRange[0] && clinicPrice <= priceRange[1];

      // Timing filter (simplified since clinics don't have detailed time slots)
      const matchesTiming = selectedTimes.length === 0 || true; // Always true for clinics since they don't have detailed time slots

      return matchesRating && matchesPrice && matchesTiming;
    });

    return getSortedClinics(filtered);
  };

  // Distance Badge

  // const handleEnquiryClick = (clinic: Clinic) => {
  //   if (!isAuthenticated) {
  //     // Store the pending action and show auth modal
  //     setPendingAction({ type: "enquiry", clinic });
  //     setAuthModalMode("login");
  //     setShowAuthModal(true);
  //     return;
  //   }

  //   // User is authenticated, proceed with enquiry
  //   const params = new URLSearchParams({
  //     clinicId: clinic._id,
  //     clinicName: clinic.name,
  //     clinicAddress: clinic.address,
  //   });

  //   router.push(`/clinic/enquiry-form?${params.toString()}`);
  // };

  // const handleReviewClick = (clinic: Clinic) => {
  //   if (!isAuthenticated) {
  //     // Store the pending action and show auth modal
  //     setPendingAction({ type: "review", clinic });
  //     setAuthModalMode("login");
  //     setShowAuthModal(true);
  //     return;
  //   }

  //   // User is authenticated, proceed with review
  //   const params = new URLSearchParams({
  //     clinicId: clinic._id,
  //     clinicName: clinic.name,
  //   });

  //   router.push(`/clinic/review-form?${params.toString()}`);
  // };

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
        axios.get("/api/clinics/search?q=" + encodeURIComponent(q)),
        axios.get("/api/clinics/searchByClinic?q=" + encodeURIComponent(q)),
      ]);

      const treatmentSuggestions = (treatRes.data.treatments || []).map(
        (t: { type: string; value: string }) => ({
          type: t.type,
          value: t.value,
        })
      );

      const clinicSuggestions = (clinicRes.data.clinics || []).map(
        (c: { name: string }) => ({
          type: "clinic",
          value: c.name,
        })
      );

      setSuggestions([...treatmentSuggestions, ...clinicSuggestions]);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
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

      // Scroll to results section when clinics are loaded
      setTimeout(() => {
        if (resultsRef.current && clinicsWithDistance.length > 0) {
          resultsRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 100);
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
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
              Discover Trusted <span className="text-[#2D9AA5]">Clinics</span> & <span className="text-[#2D9AA5]">Hospitals</span> Near You
            </h1>
          </div>

          {/* Simple Search Bar */}
          <div className="w-full max-w-6xl mx-auto mb-8 px-2 sm:px-4 md:px-6 lg:px-8">
            <div className="">
              {/* Desktop Layout */}
              <div className="hidden md:flex gap-4 items-center justify-center">
                <div className="relative flex-1 max-w-lg">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <Search className="h-5 w-5 text-[#2D9AA5]" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search doctors, treatments, specialties..."
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      fetchSuggestions(e.target.value);
                      // Clear selected service when input is cleared
                      if (e.target.value === "") {
                        setSelectedService("");
                      }
                    }}
                    onKeyPress={(e) => e.key === "Enter" && searchByPlace()}
                    className="w-full pl-12 pr-4 py-3.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:bg-white transition-all placeholder:text-gray-500 text-sm"
                    ref={searchInputRef}
                  />

                  {/* Desktop Suggestions Dropdown - FIXED */}
                  {suggestions.length > 0 && (
                    <div
                      className="absolute top-full left-0 right-0 z-[99999] mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-96 overflow-y-auto pointer-events-auto"
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
                                {s.type === "treatment" ? "⚕️" : "🕉️"}
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
                    <MapPin className="h-5 w-5 text-[#2D9AA5] transition-colors" />
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
                  className="flex items-center px-4 xl:px-6 py-4 bg-gradient-to-r from-[#2D9AA5] to-[#2D9AA5]/90 text-white rounded-xl cursor-pointer hover:from-[#2D9AA5]/90 hover:to-[#2D9AA5]/80 transition-all font-medium disabled:opacity-50 whitespace-nowrap shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100"
                >
                  <Navigation className="w-5 h-5 mr-2" />
                  <span className="hidden md:inline">Near Me</span>
                </button>

                <button
                  onClick={searchByPlace}
                  className="px-4 xl:px-6 py-4 bg-gradient-to-r from-[#2D9AA5] to-[#2D9AA5]/90 text-white rounded-xl font-medium cursor-pointer hover:from-[#2D9AA5]/90 hover:to-[#2D9AA5]/80 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
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
                      <Search className="h-5 w-5 text-[#2D9AA5]" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search doctors, treatments..."
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        fetchSuggestions(e.target.value);
                        // Clear selected service when input is cleared
                        if (e.target.value === "") {
                          setSelectedService("");
                        }
                      }}
                      onKeyPress={(e) => e.key === "Enter" && searchByPlace()}
                      className="w-full pl-12 pr-4 py-3.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:bg-white transition-all placeholder:text-gray-500 text-sm"
                      ref={searchInputRef}
                    />

                    {/* Mobile Suggestions Dropdown - FIXED */}
                    {suggestions.length > 0 && (
                      <div
                        className="absolute top-full left-0 right-0 z-[99999] mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-96 overflow-y-auto pointer-events-auto"
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
                              {/* Icon Box */}
                              <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mr-4">
                                <span className="text-lg">
                                  {s.type === "treatment"
                                    ? "⚕️"
                                    : s.type === "subcategory"
                                      ? "🌱"
                                      : "🪔"}
                                </span>
                              </div>

                              {/* Text Content */}
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors text-sm md:text-base">
                                  {s.value}
                                </p>
                                <p className="text-xs md:text-sm text-green-600 capitalize font-medium">
                                  {s.type === "treatment"
                                    ? "Main Treatment"
                                    : s.type === "subcategory"
                                      ? "Subcategory"
                                      : "Other"}
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
                    className="flex items-center justify-center px-4 py-3.5 bg-[#2D9AA5] text-white rounded-xl cursor-pointer hover:bg-[#247d8d] transition-all font-medium disabled:opacity-50 flex-shrink-0 shadow-md hover:shadow-lg"
                    title="Near Me"
                  >
                    <Navigation className="w-4 h-4" />
                  </button>
                </div>

                {/* Location Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <MapPin className="h-5 w-5 text-[#2D9AA5]" />
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
                    className="flex-1 px-4 py-3.5 bg-[#2D9AA5] text-white rounded-xl font-medium cursor-pointer hover:bg-[#247f8c] transition-all shadow-md hover:shadow-lg"
                  >
                    Find Healers
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Searchcard */}
        <SearchCard
          hideCards={["clinic"]}
        />
      </div>



      {/* Results Section */}
      <div ref={resultsRef} className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        {clinics.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
            {/* Filters Sidebar */}
            <div className="lg:w-1/4">
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sticky top-4">
                {/* Price Range Filter */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Range</h3>
                  <div className="px-2">
                    {/* Price Display */}
                    <div className="flex justify-between items-center mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Min Price</p>
                        <p className="text-lg font-bold text-[#2D9AA5]">₹ {priceRange[0].toLocaleString()}</p>
                      </div>
                      <div className="w-px h-8 bg-gray-300"></div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Max Price</p>
                        <p className="text-lg font-bold text-[#2D9AA5]">₹ {priceRange[1].toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Separate Range Sliders */}
                    <div className="space-y-4">
                      {/* Min Price Slider */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Minimum Price: ₹{priceRange[0].toLocaleString()}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="10000"
                          value={priceRange[0]}
                          onChange={(e) => {
                            const newMin = parseInt(e.target.value);
                            if (newMin < priceRange[1]) {
                              setPriceRange([newMin, priceRange[1]]);
                            }
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                          style={{
                            background: `linear-gradient(to right, #2D9AA5 0%, #2D9AA5 ${(priceRange[0] / 10000) * 100}%, #e5e7eb ${(priceRange[0] / 10000) * 100}%, #e5e7eb 100%)`
                          }}
                        />
                      </div>

                      {/* Max Price Slider */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Maximum Price: ₹{priceRange[1].toLocaleString()}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="10000"
                          value={priceRange[1]}
                          onChange={(e) => {
                            const newMax = parseInt(e.target.value);
                            if (newMax > priceRange[0]) {
                              setPriceRange([priceRange[0], newMax]);
                            }
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                          style={{
                            background: `linear-gradient(to right, #2D9AA5 0%, #2D9AA5 ${(priceRange[1] / 10000) * 100}%, #e5e7eb ${(priceRange[1] / 10000) * 100}%, #e5e7eb 100%)`
                          }}
                        />
                      </div>
                    </div>

                    {/* Price Labels */}
                    <div className="flex justify-between text-xs text-gray-500 mt-3">
                      <span>₹0</span>
                      <span>₹10,000</span>
                    </div>
                  </div>
                </div>

                {/* Sort By Filter */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Sort By</h3>
                  <div className="space-y-2">
                    {[
                      { value: 'relevance', label: 'Relevance' },
                      { value: 'price-low-high', label: 'Price: Low to High' },
                      { value: 'price-high-low', label: 'Price: High to Low' },
                      { value: 'rating-high-low', label: 'Rating: High to Low' },
                      { value: 'experience-high-low', label: 'Experience: High to Low' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="sortBy"
                          value={option.value}
                          checked={sortBy === option.value}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="w-4 h-4 text-[#2D9AA5] bg-gray-100 border-gray-300 focus:ring-[#2D9AA5] focus:ring-2"
                        />
                        <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Timing Filter */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Availability</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {availableTimes.map((time, index) => (
                      <label key={index} className="flex items-start">
                        <input
                          type="checkbox"
                          checked={selectedTimes.includes(time)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTimes([...selectedTimes, time]);
                            } else {
                              setSelectedTimes(selectedTimes.filter(t => t !== time));
                            }
                          }}
                          className="w-4 h-4 text-[#2D9AA5] bg-gray-100 border-gray-300 rounded focus:ring-[#2D9AA5] focus:ring-2 mt-0.5"
                        />
                        <span className="ml-2 text-sm text-gray-700 leading-relaxed">{time}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Star Rating Filter */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating</h3>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <label key={rating} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="rating"
                          value={rating}
                          checked={ratingFilter === rating}
                          onChange={(e) => setRatingFilter(parseInt(e.target.value))}
                          className="w-4 h-4 text-[#2D9AA5] bg-gray-100 border-gray-300 focus:ring-[#2D9AA5] focus:ring-2"
                        />
                        <div className="ml-2 flex items-center">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                          <span className="ml-1 text-sm text-gray-700">& above</span>
                        </div>
                      </label>
                    ))}
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="rating"
                        value={0}
                        checked={ratingFilter === 0}
                        onChange={(e) => setRatingFilter(parseInt(e.target.value))}
                        className="w-4 h-4 text-[#2D9AA5] bg-gray-100 border-gray-300 focus:ring-[#2D9AA5] focus:ring-2"
                      />
                      <span className="ml-2 text-sm text-gray-700">All Ratings</span>
                    </label>
                  </div>
                </div>

                {/* Clear Filters Button */}
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-medium text-sm flex items-center justify-center shadow-md hover:shadow-lg"
                  >
                    <span className="mr-1">✕</span>
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Clinics List */}
            <div className="lg:w-3/4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4 sm:gap-0">
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                    Found {getFilteredClinics().length} results
                  </h2>
                  {selectedService && (
                    <p className="text-sm sm:text-base text-gray-600 flex items-center">
                      <span className="w-2 h-2 bg-[#2D9AA5] rounded-full mr-2"></span>
                      Showing results for &quot;
                      <span className="font-medium text-[#2D9AA5]">
                        {selectedService}
                      </span>
                      &quot;
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                  {/* Clear Search Button */}
                  {clinics.length > 0 && (
                    <button
                      onClick={clearSearch}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all font-medium text-sm flex items-center justify-center shadow-sm hover:shadow-md"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear Search
                    </button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col sm:flex-row items-center justify-center py-12 sm:py-16">
                  <div className="relative mb-4 sm:mb-0">
                    <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-green-100 border-t-[#2D9AA5]"></div>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#2D9AA5] to-green-400 opacity-20 animate-pulse"></div>
                  </div>
                  <span className="ml-0 sm:ml-4 text-gray-600 font-medium text-sm sm:text-base text-center">
                    Finding the best clinics for you...
                  </span>
                </div>
              ) : getFilteredClinics().length === 0 ? (
                <div className="text-center py-12 sm:py-16 bg-gradient-to-br from-gray-50 to-green-50 rounded-2xl sm:rounded-3xl border border-gray-100 mx-2 sm:mx-0">
                  <div className="bg-white rounded-2xl p-4 sm:p-6 w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 shadow-lg">
                    <Search className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mt-1 sm:mt-2" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 px-4">
                    No results found
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto text-sm sm:text-base px-4">
                    Try adjusting your search criteria or explore different
                    specializations
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
                  {getFilteredClinics().map((clinic, index) => {
                    const hasRating = clinicReviews[clinic._id]?.totalReviews > 0;
                    const reviewsLoaded = clinicReviews[clinic._id] !== undefined;
                    // i need form here  

                    return (
                      <div
                        key={index}
                        className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                      >
                        {/* Clinic Image - Reduced height */}
                        <div className="relative h-28 w-full bg-gradient-to-br from-green-100 to-emerald-100 overflow-hidden">
                          {clinic.photos?.[0] ? (
                            <Image
                              src={clinic.photos[0]}
                              alt={clinic.name || "Clinic Image"}
                              fill
                              className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                              <div className="text-center">
                                <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center mx-auto mb-1">
                                  <svg
                                    className="w-6 h-6 text-green-600"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                  </svg>
                                </div>
                                <span className="text-xs text-green-600 font-medium">
                                  {clinic.name?.split(" ")[0]}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Overlay badges */}
                          <div className="absolute top-2 right-2 flex flex-col gap-1">
                            {clinic.verified && (
                              <div className="bg-green-500 text-white px-1.5 py-0.5 rounded-full text-xs font-medium flex items-center">
                                <Shield className="w-2 h-2 mr-0.5" />
                                Verified
                              </div>
                            )}
                          </div>

                          {clinic.distance && (
                            <div className="absolute bottom-2 left-2 bg-[#2D9AA5] text-white px-1.5 py-0.5 rounded-full text-xs font-medium flex items-center">
                              <Navigation className="w-2 h-2 mr-0.5" />
                              {formatDistance(clinic.distance)}
                            </div>
                          )}

                          {/* Heart icon */}
                          {/* <button className="absolute top-2 left-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors">
                            <Heart className="w-3 h-3 text-gray-400 hover:text-red-500 transition-colors" />
                          </button> */}
                        </div>

                        {/* Clinic Info - Reduced padding */}
                        <div className="p-2.5">
                          {/* Rating section - Moved to top */}
                          <div className="flex items-center gap-2 mb-1.5">
                            {hasRating ? (
                              <>
                                <div className="flex">
                                  {renderStars(clinicReviews[clinic._id].averageRating)}
                                </div>
                                <span className="text-sm font-medium text-gray-700">
                                  {clinicReviews[clinic._id].averageRating.toFixed(1)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({clinicReviews[clinic._id].totalReviews})
                                </span>
                              </>
                            ) : reviewsLoaded ? (
                              <span className="text-xs text-gray-500">No reviews yet</span>
                            ) : null}
                          </div>

                          {/* Clinic basic info - Name and address on left, timings on right */}
                          <div className="flex justify-between items-start mb-1.5">
                            <div className="flex-1 pr-2">
                              <h3 className="text-base font-bold text-gray-900 leading-tight mb-0.5">
                                {clinic.name}
                              </h3>
                              <p className="text-gray-600 text-xs line-clamp-2">
                                {clinic.address}
                              </p>
                            </div>

                            {clinic.timings && (
                              <div className="flex items-center text-right">
                                <Clock className="w-3 h-3 text-blue-500 mr-1" />
                                <span className="text-xs font-medium text-gray-700">
                                  {clinic.timings}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Clinic Type and Fee - Balanced layout */}
                          <div className="flex justify-between items-center mb-1.5">
                            <div>
                              <p className="text-[#2D9AA5] font-medium text-sm">
                                Health Center
                              </p>
                            </div>
                            {clinic.pricing && (
                              <div className="text-right">
                                <p className="text-xs text-gray-500">Fee</p>
                                <p className="text-base font-bold text-[#2D9AA5]">
                                  AED {clinic.pricing}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Action buttons - Slightly smaller padding */}
                          <div className="flex gap-1.5">
                            {/* <button
                              onClick={() => handleEnquiryClick(clinic)}
                              className="flex-1 flex items-center justify-center px-2.5 py-1.5 bg-gradient-to-r from-[#2D9AA5] to-[#2D9AA5]/90 text-white rounded-lg hover:from-[#2D9AA5]/90 hover:to-[#2D9AA5] transition-all duration-200 text-xs font-medium shadow-sm hover:shadow-md"
                            >
                              <MessageCircle className="w-3 h-3 mr-1" />
                              Enquiry
                            </button> */}

                            {/* <button
                              onClick={() => handleReviewClick(clinic)}
                              className="flex items-center justify-center px-2.5 py-1.5 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-200 text-xs font-medium shadow-sm hover:shadow-md"
                            >
                              <Star className="w-3 h-3" />
                            </button> */}

                            {clinic.location?.coordinates?.length === 2 && (
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${clinic.location.coordinates[1]},${clinic.location.coordinates[0]}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center px-2.5 py-1.5 bg-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 text-xs font-medium shadow-sm hover:shadow-md"
                              >
                                <Navigation className="w-3 h-3" />
                              </a>
                            )}

                            {/* View Full Details */}
                            <button
                              onClick={() => router.push(`/clinics/${clinic._id}`)}
                              className="flex-1 flex items-center justify-center px-2.5 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:cursor-pointer transition-all duration-200 text-xs font-medium shadow-sm hover:shadow-md"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>


      {isVisible && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="cursor-pointer fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300"
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

      {/* CSS Styles for Slider Thumb */}
      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #2D9AA5;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 0 0 1px rgba(45, 154, 165, 0.3);
        }

        .slider-thumb::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #2D9AA5;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 0 0 1px rgba(45, 154, 165, 0.3);
        }
      `}</style>
      <Index1 />
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Blog />
      </div>
    </div>

  );
}
