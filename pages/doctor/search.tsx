"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import {
  Heart,
  MapPin,
  Search,
  Star,
  Phone,
  Navigation,
  Shield,
  Calendar,
  X,
  Clock3,
  HeartHandshake,
  Zap,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import AuthModal from "../../components/AuthModal";
import dayjs from "dayjs";
import Image from "next/image";
import SearchCard from "../../components/SearchCard";
import CalculatorGames from "../../components/CalculatorGames";
import Blog from "../../components/blog";

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

  // Add ref for results section
  const resultsRef = useRef<HTMLDivElement>(null);

  // Add missing state variables
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('relevance');

  // Add the clearAllFilters function
  const clearFilters = () => {
    setPriceRange([0, 5000]);
    setSelectedTimes([]);
    setStarFilter(0);
    setSortBy('relevance');
    // Don't clear search results, only reset filters
  };

  const clearAllFilters = () => {
    clearFilters();
    clearSearch();
  };

  // Add the getSortedDoctors function
  const getSortedDoctors = (doctors: Doctor[]) => {
    const sorted = [...doctors];

    switch (sortBy) {
      case 'price-low-high':
        return sorted.sort((a, b) => (a.consultationFee || 0) - (b.consultationFee || 0));
      case 'price-high-low':
        return sorted.sort((a, b) => (b.consultationFee || 0) - (a.consultationFee || 0));
      case 'rating-high-low':
        return sorted.sort((a, b) => {
          const ratingA = doctorReviews[a._id]?.averageRating || 0;
          const ratingB = doctorReviews[b._id]?.averageRating || 0;
          return ratingB - ratingA;
        });
      case 'experience-high-low':
        return sorted.sort((a, b) => (b.experience || 0) - (a.experience || 0));
      default:
        return sorted;
    }
  };

  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  // Add state for dynamic available times
  const [dynamicAvailableTimes, setDynamicAvailableTimes] = useState<string[]>([]);

  // Function to extract available times from doctor time slots
  const extractAvailableTimes = (doctors: Doctor[]) => {
    const timeSet = new Set<string>();

    doctors.forEach(doctor => {
      if (doctor.timeSlots) {
        doctor.timeSlots.forEach(slot => {
          // Add morning slots
          if (slot.sessions.morning && slot.sessions.morning.length > 0) {
            slot.sessions.morning.forEach(time => {
              timeSet.add(time);
            });
          }
          // Add evening slots
          if (slot.sessions.evening && slot.sessions.evening.length > 0) {
            slot.sessions.evening.forEach(time => {
              timeSet.add(time);
            });
          }
        });
      }
    });

    // Convert to array and sort
    const times = Array.from(timeSet).sort();

    // Add special availability options
    const specialOptions = [
      'Available Today',
      'Available Tomorrow',
      'Weekend Available'
    ];

    return [...times, ...specialOptions];
  };

  // Update dynamic times when doctors change
  useEffect(() => {
    if (doctors.length > 0) {
      const times = extractAvailableTimes(doctors);
      setDynamicAvailableTimes(times);
    }
  }, [doctors]);

  // Add scroll to results functionality
  useEffect(() => {
    if (doctors.length > 0 && !loading && resultsRef.current) {
      // Add a small delay to ensure the results are rendered
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  }, [doctors, loading]);

  // Fallback to static times if no dynamic times available
  const availableTimes = dynamicAvailableTimes.length > 0 ? dynamicAvailableTimes : [
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

  const availableTreatments = [
    'Infertility Treatments',
    'Cosmetic Surgery',
    'Dental Treatments',
    'Orthopedic Surgery',
    'Cardiac Surgery',
    'Oncology Treatments',
    'Bariatric / Weight-Loss Surgery',
    'LASIK & Eye Procedures',
    'Preventive Health Screenings',
    'Sports Medicine & Rehabilitation',
    'Dermatology & Skin Treatments',
    'Hair Transplantation',
    'Botox & Fillers',
    'Non-invasive Energy Treatments',
    'Lymphatic & Body Sculpting Massages',
    'Spa-based Wellness Retreats & Detox Programs',
    'Ayurvedic Treatments',
    'Acupuncture & Traditional Chinese Medicine',
    'Physiotherapy & Post-operative Rehabilitation',
    'Hormonal / PCOS Treatment & Women\'s Wellness',
    'Psoriasis & Autoimmune Skin Disorder Therapies',
    'Isotretinoin',
    'Teeth Veneers & Cosmetic Dental Whitening',
    'Cryotherapy & Hyperbaric Oxygen Therapy',
    'Breathwork, Yoga & Mindfulness Therapies'
  ];

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

  const clearLocation = () => {
    setManualPlace("");
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

  const filteredDoctors = getSortedDoctors(
    doctors.filter(doctor => {
      // Existing filters...
      const matchesService = !selectedService ||
        (doctor.degree && doctor.degree.toLowerCase().includes(selectedService.toLowerCase()));

      const matchesStars = starFilter === 0 ||
        (doctorReviews[doctor._id]?.averageRating >= starFilter);

      // New filters
      const matchesPrice = !doctor.consultationFee ||
        (doctor.consultationFee >= priceRange[0] && doctor.consultationFee <= priceRange[1]);

      // Add timing filter logic based on your timeSlots structure
      const matchesTiming = selectedTimes.length === 0 || selectedTimes.some(selectedTime => {
        // Handle special availability options
        if (selectedTime === 'Available Today') {
          const today = dayjs().startOf('day');
          return doctor.timeSlots?.some(slot => {
            const slotDate = dayjs(capitalizeMonth(slot.date) + ' ' + dayjs().year(), 'DD MMMM YYYY');
            return slotDate.isSame(today, 'day') && slot.availableSlots > 0;
          });
        }

        if (selectedTime === 'Available Tomorrow') {
          const tomorrow = dayjs().add(1, 'day').startOf('day');
          return doctor.timeSlots?.some(slot => {
            const slotDate = dayjs(capitalizeMonth(slot.date) + ' ' + dayjs().year(), 'DD MMMM YYYY');
            return slotDate.isSame(tomorrow, 'day') && slot.availableSlots > 0;
          });
        }

        if (selectedTime === 'Weekend Available') {
          return doctor.timeSlots?.some(slot => {
            const slotDate = dayjs(capitalizeMonth(slot.date) + ' ' + dayjs().year(), 'DD MMMM YYYY');
            const dayOfWeek = slotDate.day(); // 0 = Sunday, 6 = Saturday
            return (dayOfWeek === 0 || dayOfWeek === 6) && slot.availableSlots > 0;
          });
        }

        // Handle specific time slots
        return doctor.timeSlots?.some(slot => {
          const morningSlots = slot.sessions.morning || [];
          const eveningSlots = slot.sessions.evening || [];
          return (morningSlots.includes(selectedTime) || eveningSlots.includes(selectedTime)) && slot.availableSlots > 0;
        });
      });

      return matchesService && matchesStars && matchesPrice && matchesTiming;
    })
  );
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
                        <span className="text-sm font-medium text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 hover:scale-105 font-medium shadow-sm"
                        >
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

  // const WhyChooseUs = () => (
  //   <div className="bg-gray-50 p-8">
  //     <div className="flex items-center mb-8">
  //       <div className="bg-blue-100 p-2 rounded-lg mr-4">
  //         <Leaf className="w-6 h-6 text-blue-600" />
  //       </div>
  //       <h3 className="text-2xl font-semibold text-blue-700">
  //         Why Choose Our Doctors?
  //       </h3>
  //     </div>

  //     <div className="space-y-6">
  //       {[
  //         {
  //           icon: <Shield className="w-5 h-5 text-blue-600" />,
  //           title: "Verified Professionals",
  //           desc: "All doctors are verified and certified with proven expertise",
  //         },
  //         {
  //           icon: <Clock3 className="w-5 h-5 text-blue-600" />,
  //           title: "Quick Appointments",
  //           desc: "Get appointments within 24 hours with flexible scheduling",
  //         },
  //         {
  //           icon: <HeartHandshake className="w-5 h-5 text-blue-600" />,
  //           title: "Personalized Care",
  //           desc: "Tailored treatment plans designed specifically for each patient",
  //         },
  //         {
  //           icon: <ThumbsUp className="w-5 h-5 text-blue-600" />,
  //           title: "High Success Rate",
  //           desc: "95% patient satisfaction rate with proven treatment outcomes",
  //         },
  //         {
  //           icon: <Zap className="w-5 h-5 text-blue-600" />,
  //           title: "Modern Equipment",
  //           desc: "Latest medical technology and state-of-the-art equipment",
  //         },
  //       ].map((item, index) => (
  //         <div key={index} className="flex items-start space-x-4">
  //           <div className="bg-blue-100 p-3 rounded-lg flex-shrink-0">
  //             {item.icon}
  //           </div>
  //           <div>
  //             <h4 className="font-semibold text-blue-700 text-lg mb-2">
  //               {item.title}
  //             </h4>
  //             <p className="text-gray-600 leading-relaxed">{item.desc}</p>
  //           </div>
  //         </div>
  //       ))}
  //     </div>
  //   </div>
  // );

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
      <div className="">
        <div className="">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
                Find. Connect. Heal. With the Right <span className="text-[#2D9AA5]">Doctor</span>.
              </h1>
              <div className="flex justify-center items-center mb-4 sm:mb-6 w-full">
                <div className="w-full max-w-4xl">

                </div>
              </div>
            </div>

            <div className="">
              <div className="">
                {/* Desktop Layout */}
                <div className="hidden lg:flex gap-4 xl:gap-6 items-center justify-center">
                  <div className="relative flex-1 max-w-lg xl:max-w-xl">
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
                      }}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                      className="w-full pl-12 pr-12 py-4 text-gray-900 bg-gray-50/70 border border-gray-200/60 rounded-xl focus:border-[#2D9AA5] focus:ring-2 focus:ring-[#2D9AA5]/20 focus:bg-white transition-all placeholder:text-gray-500 text-sm backdrop-blur-sm"
                      ref={searchInputRef}
                    />
                    {query && (
                      <button
                        onClick={clearSearch}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center z-20 hover:bg-gray-100/50 rounded-r-xl transition-colors"
                        title="Clear search"
                      >
                        <X className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                      </button>
                    )}

                    {/* Desktop Suggestions Dropdown */}
                    {suggestions.length > 0 && (
                      <div
                        className="absolute top-full left-0 right-0 z-50 mt-2 bg-white/95 backdrop-blur-md border border-gray-200/50 rounded-2xl shadow-2xl max-h-80 overflow-auto"
                        ref={suggestionsDropdownRef}
                      >
                        <div className="p-2">
                          {suggestions.map((s, i) => (
                            <div
                              key={i}
                              className="flex items-center px-4 py-4 hover:bg-[#2D9AA5]/10 cursor-pointer transition-all duration-200 border-b border-gray-100/50 last:border-b-0 rounded-xl mx-1 group"
                              onClick={() => {
                                clearPersistedState();
                                setSelectedService(s.value);
                                setQuery(s.value);
                                setSuggestions([]);
                                if (coords)
                                  fetchDoctors(coords.lat, coords.lng, s.value);
                              }}
                            >
                              <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-[#2D9AA5]/20 to-[#2D9AA5]/30 flex items-center justify-center mr-4">
                                <span className="text-lg">
                                  {s.type === "clinic"
                                    ? "🏥"
                                    : s.type === "treatment"
                                      ? "💊"
                                      : "👨‍⚕️"}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 group-hover:text-[#2D9AA5] transition-colors text-sm xl:text-base truncate">
                                  {s.value}
                                </p>
                                <p className="text-xs xl:text-sm text-gray-500 capitalize font-medium">
                                  {s.type}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="h-12 w-px bg-gradient-to-b from-transparent via-gray-300/60 to-transparent"></div>

                  <div className="flex-1 relative group max-w-lg xl:max-w-xl">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <MapPin className="h-5 w-5 text-[#2D9AA5] transition-colors" />
                    </div>
                    <input
                      placeholder="City, area, or postal code"
                      value={manualPlace}
                      onChange={(e) => setManualPlace(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && searchByPlace()}
                      className="w-full pl-12 pr-12 py-4 text-gray-900 bg-gray-50/70 border border-gray-200/60 rounded-xl focus:border-[#2D9AA5] focus:ring-2 focus:ring-[#2D9AA5]/20 focus:bg-white transition-all placeholder:text-gray-500 text-sm backdrop-blur-sm"
                    />
                    {manualPlace && (
                      <button
                        onClick={clearLocation}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center z-20 hover:bg-gray-100/50 rounded-r-xl transition-colors"
                        title="Clear location"
                      >
                        <X className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                      </button>
                    )}
                  </div>

                  <div className="h-12 w-px bg-gradient-to-b from-transparent via-gray-300/60 to-transparent"></div>

                  <button
                    onClick={locateMe}
                    disabled={loading}
                    className="flex items-center px-4 xl:px-6 py-4 bg-gradient-to-r from-[#2D9AA5] to-[#2D9AA5]/90 text-white rounded-xl cursor-pointer hover:from-[#2D9AA5]/90 hover:to-[#2D9AA5]/80 transition-all font-medium disabled:opacity-50 whitespace-nowrap shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100"
                  >
                    <Navigation className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span className="hidden xl:inline">Near Me</span>
                  </button>

                  <button
                    onClick={handleSearch}
                    className="px-4 xl:px-6 py-4 bg-gradient-to-r from-[#2D9AA5] to-[#2D9AA5]/90 text-white rounded-xl font-medium cursor-pointer hover:from-[#2D9AA5]/90 hover:to-[#2D9AA5]/80 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Search Doctor
                  </button>
                </div>

                {/* Tablet Layout */}
                <div className="hidden md:flex lg:hidden gap-3 items-center justify-center">
                  <div className="relative flex-1 max-w-md">
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
                      }}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                      className="w-full pl-12 pr-12 py-3.5 text-gray-900 bg-gray-50/70 border border-gray-200/60 rounded-xl focus:border-[#2D9AA5] focus:ring-2 focus:ring-[#2D9AA5]/20 focus:bg-white transition-all placeholder:text-gray-500 text-sm backdrop-blur-sm"
                      ref={searchInputRef}
                    />
                    {query && (
                      <button
                        onClick={clearSearch}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center z-20 hover:bg-gray-100/50 rounded-r-xl transition-colors"
                        title="Clear search"
                      >
                        <X className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                      </button>
                    )}

                    {/* Tablet Suggestions Dropdown */}
                    {suggestions.length > 0 && (
                      <div
                        className="absolute top-full left-0 right-0 z-[9999] mt-2 bg-white/95 backdrop-blur-md border border-gray-200/50 rounded-2xl shadow-2xl max-h-64 overflow-auto"
                        ref={suggestionsDropdownRef}
                      >
                        <div className="p-2">
                          {suggestions.map((s, i) => (
                            <div
                              key={i}
                              className="flex items-center px-3 py-3 hover:bg-[#2D9AA5]/10 cursor-pointer transition-all duration-200 border-b border-gray-100/50 last:border-b-0 rounded-lg mx-1 group"
                              onClick={() => {
                                clearPersistedState();
                                setSelectedService(s.value);
                                setQuery(s.value);
                                setSuggestions([]);
                                if (coords)
                                  fetchDoctors(coords.lat, coords.lng, s.value);
                              }}
                            >
                              <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-[#2D9AA5]/20 to-[#2D9AA5]/30 flex items-center justify-center mr-3">
                                <span className="text-sm">
                                  {s.type === "clinic"
                                    ? "🏥"
                                    : s.type === "treatment"
                                      ? "💊"
                                      : "👨‍⚕️"}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 group-hover:text-[#2D9AA5] transition-colors text-sm truncate">
                                  {s.value}
                                </p>
                                <p className="text-xs text-gray-500 capitalize font-medium">
                                  {s.type}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={locateMe}
                    disabled={loading}
                    className="flex items-center justify-center px-4 py-3.5 bg-gradient-to-r from-[#2D9AA5] to-[#2D9AA5]/90 text-white rounded-xl cursor-pointer hover:from-[#2D9AA5]/90 hover:to-[#2D9AA5]/80 transition-all font-medium disabled:opacity-50 flex-shrink-0 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100"
                    title="Near Me"
                  >
                    <Navigation className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleSearch}
                    className="px-5 py-3.5 bg-gradient-to-r from-[#2D9AA5] to-[#2D9AA5]/90 text-white rounded-xl font-medium cursor-pointer hover:from-[#2D9AA5]/90 hover:to-[#2D9AA5]/80 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 whitespace-nowrap"
                  >
                    Search
                  </button>
                </div>

                {/* Mobile Layout */}
                <div className="md:hidden space-y-4">
                  {/* Search Input Row with Near Me Button */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none z-10">
                        <Search className="h-4 w-4 sm:h-5 sm:w-5 text-[#2D9AA5]" />
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
                        className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-3.5 text-gray-900 bg-gray-50/70 border border-gray-200/60 rounded-xl focus:border-[#2D9AA5] focus:ring-2 focus:ring-[#2D9AA5]/20 focus:bg-white transition-all placeholder:text-gray-500 text-sm backdrop-blur-sm"
                        ref={searchInputRef}
                      />
                      {query && (
                        <button
                          onClick={clearSearch}
                          className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center z-20 hover:bg-gray-100/50 rounded-r-xl transition-colors"
                          title="Clear search"
                        >
                          <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                        </button>
                      )}

                      {/* Mobile Suggestions Dropdown */}
                      {suggestions.length > 0 && (
                        <div
                          className="absolute top-full left-0 right-0 z-[9999] mt-2 bg-white/95 backdrop-blur-md border border-gray-200/50 rounded-2xl shadow-2xl max-h-60 overflow-auto"
                          ref={suggestionsDropdownRef}
                        >
                          <div className="p-1 sm:p-2">
                            {suggestions.map((s, i) => (
                              <div
                                key={i}
                                className="flex items-center px-3 py-3 hover:bg-[#2D9AA5]/10 cursor-pointer transition-all duration-200 border-b border-gray-100/50 last:border-b-0 rounded-lg mx-1 group"
                                onClick={() => {
                                  clearPersistedState();
                                  setSelectedService(s.value);
                                  setQuery(s.value);
                                  setSuggestions([]);
                                  if (coords)
                                    fetchDoctors(coords.lat, coords.lng, s.value);
                                }}
                              >
                                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-[#2D9AA5]/20 to-[#2D9AA5]/30 flex items-center justify-center mr-3">
                                  <span className="text-sm">
                                    {s.type === "clinic"
                                      ? "🏥"
                                      : s.type === "treatment"
                                        ? "💊"
                                        : "👨‍⚕️"}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900 group-hover:text-[#2D9AA5] transition-colors text-sm truncate">
                                    {s.value}
                                  </p>
                                  <p className="text-xs text-gray-500 capitalize font-medium">
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
                      className="flex items-center justify-center px-3 sm:px-4 py-3 sm:py-3.5 bg-gradient-to-r from-[#2D9AA5] to-[#2D9AA5]/90 text-white rounded-xl cursor-pointer hover:from-[#2D9AA5]/90 hover:to-[#2D9AA5]/80 transition-all font-medium disabled:opacity-50 flex-shrink-0 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100"
                      title="Near Me"
                    >
                      <Navigation className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Location Input */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none z-10">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-[#2D9AA5]" />
                    </div>
                    <input
                      placeholder="City, area, or postal code"
                      value={manualPlace}
                      onChange={(e) => setManualPlace(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && searchByPlace()}
                      className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-3.5 text-gray-900 bg-gray-50/70 border border-gray-200/60 rounded-xl focus:border-[#2D9AA5] focus:ring-2 focus:ring-[#2D9AA5]/20 focus:bg-white transition-all placeholder:text-gray-500 text-sm backdrop-blur-sm"
                    />
                    {manualPlace && (
                      <button
                        onClick={clearLocation}
                        className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center z-20 hover:bg-gray-100/50 rounded-r-xl transition-colors"
                        title="Clear location"
                      >
                        <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                      </button>
                    )}
                  </div>

                  {/* Mobile Search Button */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleSearch}
                      className="flex-1 px-4 py-3 sm:py-3.5 bg-gradient-to-r from-[#2D9AA5] to-[#2D9AA5]/90 text-white rounded-xl font-medium cursor-pointer hover:from-[#2D9AA5]/90 hover:to-[#2D9AA5]/80 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                    >
                      Search Doctor
                    </button>
                  </div>
                </div>
              </div>

              {/* Specialty Buttons - Ultra Responsive */}
              {/* <div className="mt-6 sm:mt-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
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
                        clearPersistedState();
                        setQuery(specialty);
                        setSelectedService(specialty);
                        if (coords) {
                          fetchDoctors(coords.lat, coords.lng, specialty);
                        } else {
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
                      className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 bg-white/90 hover:bg-white text-gray-700 hover:text-[#2D9AA5] rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200/50 hover:border-[#2D9AA5]/30 backdrop-blur-sm transform hover:scale-105 min-h-[3rem] sm:min-h-[3.5rem] flex items-center justify-center text-center leading-tight"
                    >
                      <span className="line-clamp-2">{specialty}</span>
                    </button>
                  ))}
                </div>
              </div> */}
            </div>
          </div>
        </div>
        <SearchCard
          hideCards={["doctor"]}
        />
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8" ref={resultsRef}>
        {doctors.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
            {/* Filters Sidebar */}
            <div className="lg:w-1/4">
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sticky top-4">
                {/* Price Range Filter */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Range</h3>
                  <div className="px-2">
                    {/* Price Display */}
                    <div className="flex justify-between items-center mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
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
                          checked={starFilter === rating}
                          onChange={(e) => setStarFilter(parseInt(e.target.value))}
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
                        checked={starFilter === 0}
                        onChange={(e) => setStarFilter(parseInt(e.target.value))}
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

            {/* Doctors List */}
            <div className="lg:w-3/4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4 sm:gap-0">
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                    Found {filteredDoctors.length} Doctors
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
                  {doctors.length > 0 && (
                    <button
                      onClick={clearSearch}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all font-medium text-sm flex items-center justify-center shadow-sm hover:shadow-md"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear Search
                    </button>
                  )}
                  {/* Sort options moved to sidebar */}
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col sm:flex-row items-center justify-center py-12 sm:py-16">
                  <div className="relative mb-4 sm:mb-0">
                    <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-blue-100 border-t-[#2D9AA5]"></div>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#2D9AA5] to-blue-400 opacity-20 animate-pulse"></div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
                  {filteredDoctors.map((doctor, index) => {
                    const hasRating = doctorReviews[doctor._id]?.totalReviews > 0;
                    const reviewsLoaded = doctorReviews[doctor._id] !== undefined;
                    const isLoadingReviews = reviewsLoading[doctor._id];

                    return (
                      <div
                        key={index}
                        className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                      >
                        {/* Doctor Image */}
                        <div className="relative h-36 w-full bg-gradient-to-br from-blue-100 to-purple-100 overflow-hidden">
                          {doctor.photos?.[0] ? (
                            <Image
                              src={doctor.photos[0]}
                              alt={doctor.user?.name || "Doctor Image"}
                              fill
                              className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                              <div className="text-center">
                                <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-2">
                                  <svg
                                    className="w-8 h-8 text-blue-600"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                  </svg>
                                </div>
                                <span className="text-sm text-blue-600 font-medium">
                                  {doctor.user?.name?.split(" ")[0]}
                                </span>
                              </div>
                            </div>
                          )}

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
                            <div className="absolute bottom-3 left-3 bg-[#2D9AA5] text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                              <Navigation className="w-2 h-2 mr-1" />
                              {formatDistance(doctor.distance)}
                            </div>
                          )}

                          {/* Heart icon */}
                          <button className="absolute top-3 left-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors">
                            <Heart className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors" />
                          </button>
                        </div>

                        {/* Doctor Info */}
                        <div className="p-3">
                          {/* Doctor basic info */}
                          <div className="mb-2">
                            <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">
                              {doctor.user?.name}
                            </h3>
                            <p className="text-[#2D9AA5] font-medium text-sm mb-1">
                              {doctor.degree}
                            </p>
                            <p className="text-gray-600 text-xs line-clamp-2">
                              {doctor.address}
                            </p>
                          </div>

                          {/* Experience and Fee */}
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <p className="text-xs text-gray-500">Experience</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {doctor.experience} years
                              </p>
                            </div>
                            {typeof doctor.consultationFee === "number" && doctor.consultationFee > 0 && (
                              <div className="text-right">
                                <p className="text-xs text-gray-500">Fee</p>
                                <p className="text-lg font-bold text-[#2D9AA5]">
                                  AED {doctor.consultationFee}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Rating */}
                          <div className="flex items-center gap-2 mb-2">
                            {isLoadingReviews ? (
                              <span className="text-xs text-gray-500">Loading...</span>
                            ) : hasRating ? (
                              <>
                                <div className="flex">
                                  {renderStars(doctorReviews[doctor._id].averageRating)}
                                </div>
                                <span className="text-sm font-medium text-gray-700">
                                  {doctorReviews[doctor._id].averageRating.toFixed(1)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({doctorReviews[doctor._id].totalReviews})
                                </span>
                              </>
                            ) : reviewsLoaded ? (
                              <span className="text-xs text-gray-500">No reviews yet</span>
                            ) : null}
                          </div>

                          {/* Availability */}
                          <div className="mb-3">
                            {(() => {
                              const today = dayjs().startOf("day");
                              const todaySlot = doctor.timeSlots && doctor.timeSlots.find((ts) => {
                                const slotDate = dayjs(
                                  capitalizeMonth(ts.date) + " " + dayjs().year(),
                                  "DD MMMM YYYY"
                                );
                                return slotDate.isSame(today, "day");
                              });

                              if (!doctor.timeSlots || doctor.timeSlots.length === 0) {
                                return (
                                  <span className="inline-flex items-center px-2 py-1 bg-red-50 border border-red-200 text-red-700 rounded-md font-medium text-xs">
                                    ✗ No appointments
                                  </span>
                                );
                              } else if (todaySlot && todaySlot.availableSlots > 0) {
                                return (
                                  <span className="inline-flex items-center px-2 py-1 bg-green-50 border border-green-200 text-green-700 rounded-md font-medium text-xs">
                                    ✓ Available today
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="inline-flex items-center px-2 py-1 bg-red-50 border border-red-200 text-red-700 rounded-md font-medium text-xs">
                                    ✗ No appointment today
                                  </span>
                                );
                              }
                            })()}
                          </div>

                          {/* Action buttons */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedDoctor(doctor);
                                setShowCalendarModal(true);
                              }}
                              className="flex-1 flex items-center justify-center px-3 py-2 bg-gradient-to-r from-[#2D9AA5] to-[#2D9AA5]/90 text-white rounded-lg hover:from-[#2D9AA5]/90 hover:to-[#2D9AA5] transition-all duration-200 text-xs font-medium shadow-sm hover:shadow-md"
                            >
                              <Calendar className="w-3 h-3 mr-1" />
                              View Slot
                            </button>

                            <button
                              onClick={() => handleReviewClick(doctor)}
                              className="flex items-center justify-center px-3 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-200 text-xs font-medium shadow-sm hover:shadow-md"
                            >
                              <Star className="w-3 h-3" />
                            </button>

                            {doctor.location?.coordinates?.length === 2 && (
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${doctor.location.coordinates[1]},${doctor.location.coordinates[0]}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center px-3 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 text-xs font-medium shadow-sm hover:shadow-md"
                              >
                                <Navigation className="w-3 h-3" />
                              </a>
                            )}
                          </div>

                          {/* Contact */}
                          {doctor.clinicContact && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <a
                                href={`tel:${doctor.clinicContact}`}
                                className="flex items-center justify-center text-xs text-gray-600 hover:text-green-600 transition-colors font-medium"
                              >
                                <Phone className="w-3 h-3 mr-1 text-green-500" />
                                {doctor.clinicContact}
                              </a>
                            </div>
                          )}

                          {/* Recent Reviews Toggle */}
                          {doctorReviews[doctor._id]?.reviews?.length > 0 && (
                            <div className="border-t border-gray-100 pt-2 mt-2">
                              <button
                                className="font-semibold text-gray-800 text-xs flex items-center hover:text-[#2D9AA5] transition-colors w-full"
                                onClick={() =>
                                  setShowReviewsFor(
                                    showReviewsFor === doctor._id ? null : doctor._id
                                  )
                                }
                              >
                                Recent Reviews
                                <ChevronDown
                                  className={`ml-1 w-3 h-3 transition-transform ${showReviewsFor === doctor._id ? "rotate-180" : ""
                                    }`}
                                />
                              </button>
                              {showReviewsFor === doctor._id && (
                                <div className="space-y-1 mt-1">
                                  {doctorReviews[doctor._id].reviews
                                    .slice(0, 2)
                                    .map((review, idx) => (
                                      <div key={idx} className="bg-gray-50 rounded-lg p-1.5">
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
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <CalculatorGames />

      {/* // Section: Why Choose Our Doctors - ZEVA */}
      <div className="py-16 bg-gradient-to-br from-slate-50 to-white">
        {/* Container to center content and add padding */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section Heading */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4" style={{ color: '#2D9AA5' }}>
              Why Choose Our Doctors at ZEVA
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience healthcare excellence with our carefully selected, verified medical professionals who are committed to your wellbeing.
            </p>
          </div>

          {/* Grid for listing reasons/features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">

            {/* Feature Card 1 */}
            <div className="bg-white border border-[#2D9AA5] p-5 rounded-lg shadow-sm hover:shadow-lg hover:border-2 transition-all duration-300 group">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#2D9AA5] rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-[#2D9AA5]">Board-Certified Excellence</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Verified credentials and rigorous background checks for your safety.</p>
                </div>
              </div>
            </div>

            {/* Feature Card 2 */}
            <div className="bg-white border border-[#2D9AA5] p-5 rounded-lg shadow-sm hover:shadow-lg hover:border-2 transition-all duration-300 group">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#2D9AA5] rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-[#2D9AA5]">24/7 Availability</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Round-the-clock consultations with instant appointment booking.</p>
                </div>
              </div>
            </div>

            {/* Feature Card 3 */}
            <div className="bg-white border border-[#2D9AA5] p-5 rounded-lg shadow-sm hover:shadow-lg hover:border-2 transition-all duration-300 group">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#2D9AA5] rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-[#2D9AA5]">Diverse Specializations</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">General practitioners to cardiology, dermatology, and pediatrics.</p>
                </div>
              </div>
            </div>

            {/* Feature Card 4 */}
            <div className="bg-white border border-[#2D9AA5] p-5 rounded-lg shadow-sm hover:shadow-lg hover:border-2 transition-all duration-300 group">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#2D9AA5] rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-[#2D9AA5]">Patient-Reviewed Excellence</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">High satisfaction ratings with continuous feedback monitoring.</p>
                </div>
              </div>
            </div>

            {/* Feature Card 5 */}
            <div className="bg-white border border-[#2D9AA5] p-5 rounded-lg shadow-sm hover:shadow-lg hover:border-2 transition-all duration-300 group">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#2D9AA5] rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-[#2D9AA5]">Advanced Technology</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Secure video consultations and digital prescription management.</p>
                </div>
              </div>
            </div>

            {/* Feature Card 6 */}
            <div className="bg-white border border-[#2D9AA5] p-5 rounded-lg shadow-sm hover:shadow-lg hover:border-2 transition-all duration-300 group">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#2D9AA5] rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-[#2D9AA5]">Compassionate Care</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Patient-centered care with personalized treatment plans.</p>
                </div>
              </div>
            </div>

          </div>

          {/* Call to Action */}
          <div className="text-center mt-12">
            <p className="text-lg text-gray-600 mb-6">Join thousands of satisfied patients who trust ZEVA for their healthcare needs.</p>
            <a href="#" className="inline-block bg-[#2D9AA5] hover:bg-[#248A94] text-white font-semibold py-4 px-8 rounded-lg transition-colors duration-300 shadow-lg hover:shadow-xl">
              Find Your Doctor Today
            </a>
          </div>
        </div>
      </div>
      <div>
        <Blog />
      </div>





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
    </div>
  );
}
