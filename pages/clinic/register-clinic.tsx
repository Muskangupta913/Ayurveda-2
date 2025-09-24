"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { auth } from "../../lib/firebase";
import {
  Eye,
  EyeOff,
  Mail,
  Building,
  Phone,
  MapPin,
  Clock,
  Leaf,
  Heart,
  Users,
  Shield,
  Star,
} from "lucide-react";
import {
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendSignInLinkToEmail,
} from "firebase/auth";
import axios from "axios";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";

// Types for SuccessPopup and Toast
interface SuccessPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const SuccessPopup: React.FC<SuccessPopupProps> = ({ isOpen, onClose }) => {
  const router = useRouter();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!isOpen) return null;

  const handleRedirect = () => {
    onClose(); // Close popup first (optional)
    router.push("/"); // Navigate to home (change path if needed)
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-hidden">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all duration-500 ease-out">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-transform duration-300 hover:scale-110" style={{backgroundColor: '#2D9AA5'}}>
            <span className="text-3xl text-white">🎉</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2 transition-opacity duration-700">
            Registration Complete!
          </h3>
          <p className="text-gray-600 mb-6 transition-opacity duration-700 delay-100">
            Your Health Center has been registered. Pending approval from ZEVA
          </p>
          <button
            onClick={handleRedirect}
            className="text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
            style={{background: `linear-gradient(to right, #2D9AA5, #258A94)`}}
          >
            Continue to ZEVA
          </button>
        </div>
      </div>
    </div>
  );
};

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  visible: boolean;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, visible, onClose }) => {
  if (!visible || !message) return null;
  const styles = {
    success: "bg-green-500 border-green-600",
    error: "bg-red-500 border-red-600",
    info: "bg-blue-500 border-blue-600",
  };
  const icons = {
    success: "✓",
    error: "✕",
    info: "ℹ",
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 ${styles[type]} text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 min-w-[300px] animate-slide-in`}
    >
      <span className="text-xl">{icons[type]}</span>
      <span className="flex-1">{message}</span>
      <button
        onClick={onClose}
        className="text-white/80 hover:text-white text-xl"
      >
        ×
      </button>
    </div>
  );
};

// Types for form, errors, treatments, etc.
interface ContactInfo {
  name: string;
  phone: string;
}

interface FormState {
  email: string;
  name: string;
  address: string;
  pricing: string;
  timings: string;
  latitude: number;
  longitude: number;
}

interface Errors {
  name?: string;
  treatments?: string;
  address?: string;
  location?: string;
  clinicPhoto?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  emailVerification?: string;
  password?: string;
}
interface TreatmentType {
  name: string;
  slug: string;
}

interface ToastState {
  message: string;
  type: "success" | "error" | "info";
}

const RegisterClinic: React.FC & {
  getLayout?: (page: React.ReactNode) => React.ReactNode;
} = () => {
  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const [ownerPassword, setOwnerPassword] = useState<string>("");
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    name: "",
    phone: "",
  });
  const [addressDebounceTimer, setAddressDebounceTimer] =
    useState<NodeJS.Timeout | null>(null);
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState<boolean>(false);
  const [errors, setErrors] = useState<Errors>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [form, setForm] = useState<FormState>({
    email: "",
    name: "",
    address: "",
    pricing: "",
    timings: "",
    latitude: 0,
    longitude: 0,
  });
  const [treatments, setTreatments] = useState<TreatmentType[]>([]);
  const [selectedTreatments, setSelectedTreatments] = useState<
    (TreatmentType | string)[]
  >([]);

  const [otherTreatments, setOtherTreatments] = useState<string[]>([]);
  const [newOther, setNewOther] = useState<string>("");
  const [clinicPhoto, setClinicPhoto] = useState<File | null>(null);
  const [licenseDoc, setLicenseDoc] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState>({
    message: "",
    type: "success",
  });
  const [showToast, setShowToast] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const showToastMessage = (
    message: string,
    type: "success" | "error" | "info" = "success"
  ) => {
    setToast({ message, type });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const validateForm = (): boolean => {
    const newErrors: Errors = {};
    if (!form.name.trim()) newErrors.name = "Clinic name is required";
    {
      const resolvedSelected = selectedTreatments.includes("other")
        ? [
            ...selectedTreatments.filter((t) => t !== "other"),
            ...Array.from(
              new Set(
                otherTreatments
                  .map((s) => s.trim())
                  .filter((s) => s.length > 0)
                  .slice(0, 5)
              )
            ),
          ]
        : selectedTreatments;
      if (resolvedSelected.length === 0)
      newErrors.treatments = "Please select at least one service";
    }
    if (!form.address.trim()) newErrors.address = "Address is required";
    if (form.latitude === 0 && form.longitude === 0)
      newErrors.location = "Please set location on map";
    if (!clinicPhoto) newErrors.clinicPhoto = "Clinic photo is required";
    if (!contactInfo.name.trim())
      newErrors.contactName = "Your name is required";
    if (!contactInfo.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(contactInfo.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Phone number must be exactly 10 digits";
    }
    if (!form.email.trim()) newErrors.email = "Email is required";
    if (!emailVerified) newErrors.emailVerification = "Email must be verified";
    if (!ownerPassword.trim()) newErrors.password = "Password is required";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const firstKey = Object.keys(newErrors)[0];
      showToastMessage(newErrors[firstKey as keyof Errors] || "", "error");
    }
    return Object.keys(newErrors).length === 0;
  };

  const onMapLoad = useCallback(() => {
    const geocoderInstance = new window.google.maps.Geocoder();
    setGeocoder(geocoderInstance);
  }, []);

  const geocodeAddress = useCallback(
    (address: string) => {
      if (!geocoder || !address.trim()) return;
      setIsGeocoding(true);
      geocoder.geocode({ address: address }, (results, status) => {
        setIsGeocoding(false);
        if (status === "OK" && results && results[0]) {
          const location = results[0].geometry.location;
          setForm((f) => ({
            ...f,
            latitude: location.lat(),
            longitude: location.lng(),
          }));
          setStatus("📍 Address located on map automatically!");
          setTimeout(() => setStatus(""), 3000);
          if (errors.location)
            setErrors((prev) => ({ ...prev, location: undefined }));
        } else {
          setStatus(
            "⚠️ Could not locate address automatically. Please click on the map to set location manually."
          );
          setTimeout(() => setStatus(""), 5000);
        }
      });
    },
    [geocoder, errors.location]
  );

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value;
    setForm((f) => ({ ...f, address: newAddress }));
    if (errors.address) setErrors((prev) => ({ ...prev, address: undefined }));
    if (addressDebounceTimer) clearTimeout(addressDebounceTimer);
    const timer = setTimeout(() => {
      if (newAddress.trim().length > 10) geocodeAddress(newAddress);
    }, 1000);
    setAddressDebounceTimer(timer);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setContactInfo({ ...contactInfo, phone: value });
      if (value.length === 10 && errors.phone) {
        setErrors((prev) => ({ ...prev, phone: undefined }));
      }
    }
  };

  useEffect(() => {
    const fetchTreatments = async () => {
      try {
        const response = await axios.get("/api/clinics/treatments");
        if (response.data.success) {
          setTreatments(response.data.treatments);
        } 
      } catch (error: unknown) {
        if (error instanceof Error) {
          // console.error('Error fetching treatments:', error.message);
        } else {
          // console.error('Error fetching treatments:', error);
        }
      }
    };
    fetchTreatments();

    if (isSignInWithEmailLink(auth, window.location.href)) {
      const stored = localStorage.getItem("clinicEmail") || "";
      signInWithEmailLink(auth, stored, window.location.href)
        .then(() => {
          setForm((f) => ({ ...f, email: stored || "" }));
          setEmailVerified(true);
          setEmailSent(true);
          setStatus("✅ Email verified successfully!");
          setErrors((prev) => ({
            ...prev,
            email: undefined,
            emailVerification: undefined,
          }));
        })
        .catch(() => setStatus("❌ Invalid verification link"));
    }
    return () => {
      if (addressDebounceTimer) clearTimeout(addressDebounceTimer);
    };
  }, [addressDebounceTimer]);

  const sendVerificationLink = () => {
    if (!form.email) {
      setStatus("❌ Please enter an email address");
      return;
    }
    sendSignInLinkToEmail(auth, form.email, {
      url: window.location.href,
      handleCodeInApp: true,
    });
    localStorage.setItem("clinicEmail", form.email);
    setEmailSent(true);
    setStatus("📧 Verification link sent! Check your inbox.");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const isValid = validateForm();
    if (!isValid) return;
    setStatus("✅ All details are valid. Submitting...");

    if (selectedTreatments.includes("other")) {
      const uniqueCustoms = Array.from(
        new Set(
          otherTreatments
            .map((s) => s.trim())
            .filter((s) => s.length > 0)
            .slice(0, 5)
        )
      );
      for (const custom of uniqueCustoms) {
      try {
        await axios.post("/api/clinics/treatments", {
            treatment_name: custom,
        });
      } catch (error: unknown) {
          if (!(axios.isAxiosError(error) && error.response?.status === 409)) {
            // Ignore non-409 errors for custom additions so registration can proceed
          }
        }
      }
      if (uniqueCustoms.length > 0) {
        const updatedTreatments = selectedTreatments
          .filter((t) => t !== "other")
          .concat(uniqueCustoms);
        setSelectedTreatments(updatedTreatments);
      }
    }

    try {
      await axios.post("/api/clinics/registerOwner", {
        email: form.email,
        password: ownerPassword,
        name: contactInfo.name,
        phone: contactInfo.phone,
      });
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setStatus(
          "❌ Owner registration failed: " +
            (error.response?.data?.message || "Unknown error")
        );
        showToastMessage(
          "Owner registration failed: " +
            (error.response?.data?.message ||
              "Unknown error" ||
              "Unknown error"),
          "error"
        );
      } else {
        setStatus("❌ Owner registration failed: Unknown error");
        showToastMessage("Owner registration failed: Unknown error", "error");
      }
      return;
    }

    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v.toString()));

    // Convert treatments to the required format with mainTreatment and mainTreatmentSlug
    const finalTreatments = (() => {
      if (selectedTreatments.includes("other")) {
        const customs = Array.from(
          new Set(
            otherTreatments
              .map((s) => s.trim())
              .filter((s) => s.length > 0)
              .slice(0, 5)
          )
        );
        return customs.length > 0
          ? [...selectedTreatments.filter((t) => t !== "other"), ...customs]
          : selectedTreatments.filter((t) => t !== "other");
      }
      return selectedTreatments;
    })();

    // Create treatment objects with mainTreatment and mainTreatmentSlug
    const treatmentObjects = finalTreatments.map((treatment) => {
      if (typeof treatment === "string") {
        // For string treatments (like "other" treatments), create slug from name
        return {
          mainTreatment: treatment,
          mainTreatmentSlug: treatment.toLowerCase().replace(/\s+/g, "-"),
        };
      } else {
        // For TreatmentType objects
        return {
          mainTreatment: treatment.name,
          mainTreatmentSlug: treatment.slug,
        };
      }
    });

    data.append("treatments", JSON.stringify(treatmentObjects));
    if (clinicPhoto) data.append("clinicPhoto", clinicPhoto);
    if (licenseDoc) data.append("licenseDocument", licenseDoc);

    try {
      await axios.post("/api/clinics/register", data);
      setShowSuccessPopup(true);
      setStatus("");
      showToastMessage("Clinic registered successfully!", "success");
    } catch {
      setStatus("❌ Clinic registration failed");
      showToastMessage("Clinic registration failed", "error");
    }
  };

  const handleTreatmentSelect = (treatment: TreatmentType | string) => {
    const alreadySelected = selectedTreatments.some((t) => {
      if (typeof t === "string" && typeof treatment === "string") {
        return t === treatment;
      } else if (typeof t === "object" && typeof treatment === "object") {
        return t.slug === treatment.slug;
      }
      return false;
    });

    if (alreadySelected) {
      setSelectedTreatments((prev) =>
        prev.filter((t) => {
          if (typeof t === "string" && typeof treatment === "string") {
            return t !== treatment;
          } else if (typeof t === "object" && typeof treatment === "object") {
            return t.slug !== treatment.slug;
          }
          return true;
        })
      );
      if (typeof treatment === "string" && treatment === "other") {
        setOtherTreatments([]);
        setNewOther("");
      }
    } else {
      setSelectedTreatments((prev) => [...prev, treatment]);
    }

    // Close dropdown if "other" is selected
    if (typeof treatment === "string" && treatment === "other") {
      setIsDropdownOpen(false);
      // start with empty input for chip adder
      setNewOther("");
    }
    if (
      (typeof treatment === "string" && treatment === "other") === false &&
      typeof treatment === "string" &&
      treatment !== "other"
    ) {
      // no-op
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 1024 * 1024) {
        // 1MB in bytes
        showToastMessage("Please Upload File Less Than 1MB", "error");
        return;
      }
      setClinicPhoto(file);
      if (errors.clinicPhoto)
        setErrors((prev) => ({ ...prev, clinicPhoto: undefined }));
    }
  };

  const handleLicenseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 1024 * 1024) {
        // 1MB in bytes
        showToastMessage("Please Upload File Less Than 1MB", "error");
        return;
      }
      setLicenseDoc(file);
    }
  };

  // Removed unused function handleAddTreatment
  // const handleAddTreatment = async () => {
  //   if (selectedTreatments.length === 0) {
  //     setErrors({ ...errors, treatments: "Please select at least one treatment" });
  //     return;
  //   }
  //
  //   const mainTreatments = selectedTreatments.filter(
  //     (treatment) => treatment.mainTreatment
  //   );
  //   // Further logic...
  // };

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-100 p-4">
      <div className="max-w-7xl mx-auto">
        <Toast
          message={toast.message}
          type={toast.type}
          visible={showToast}
          onClose={() => setShowToast(false)}
        />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Leaf className="w-12 h-12 text-[#2D9AA5]" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#2D9AA5] to-[#1e6b73] bg-clip-text text-transparent mb-4">
            Register Your Health Center on ZEVA Today
          </h1>
          {/* <p className="text-gray-700 text-lg">
            Join the ancient healing network
          </p> */}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Form */}
          <div className="flex-1 lg:order-1">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Login Section */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-[#2D9AA5]/20">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#2D9AA5] to-[#1e6b73] rounded-full flex items-center justify-center text-white font-bold">
                    1
                  </div>
                  <h2 className="text-2xl font-bold text-[#2D9AA5] flex items-center gap-2">
                    <Mail className="w-6 h-6" />
                    Account Setup
                  </h2>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#2D9AA5] mb-2">
                        Email Address *
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="email"
                          placeholder="Enter your email"
                          className={`text-black flex-1 px-4 py-3 border-2 rounded-xl focus:outline-none transition-all ${
                            errors.email
                              ? "border-red-400 focus:border-red-500"
                              : "border-[#2D9AA5]/30 focus:border-[#2D9AA5]"
                          }`}
                          value={form.email}
                          onChange={(e) => {
                            setForm({ ...form, email: e.target.value });
                            if (errors.email)
                              setErrors((prev) => ({
                                ...prev,
                                email: undefined,
                              }));
                          }}
                          disabled={emailVerified}
                        />
                        <button
                          type="button"
                          className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all duration-200 ${
                            emailVerified
                              ? "bg-[#2D9AA5] text-white"
                              : emailSent
                              ? "bg-[#2D9AA5]/10 text-[#2D9AA5]"
                              : "bg-gradient-to-r from-[#2D9AA5] to-[#1e6b73] hover:from-[#236f7a] hover:to-[#1a5a61] text-white transform hover:scale-105"
                          }`}
                          onClick={() => {
                            if (!form.email.includes("@")) {
                              setErrors((prev) => ({
                                ...prev,
                                email: "Enter a valid email (must include @)",
                              }));
                              return;
                            }

                            sendVerificationLink();
                          }}
                          disabled={emailSent && !emailVerified}
                        >
                          {emailVerified
                            ? "✓ Verified"
                            : emailSent
                            ? "Sent"
                            : "Verify"}
                        </button>
                      </div>
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.email}
                        </p>
                      )}
                      {emailSent && !emailVerified && (
                        <div className="mt-3 p-4 bg-[#2D9AA5]/5 border border-[#2D9AA5]/20 rounded-lg">
                          <p className="text-[#2D9AA5] text-sm">
                            📧 Check your email for verification link
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#2D9AA5] mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        className={`text-black w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all ${
                          errors.password
                            ? "border-red-400 focus:border-red-500"
                            : "border-[#2D9AA5]/30 focus:border-[#2D9AA5]"
                        }`}
                        value={ownerPassword}
                        onChange={(e) => {
                          setOwnerPassword(e.target.value);
                          if (errors.password)
                            setErrors((prev) => ({
                              ...prev,
                              password: undefined,
                            }));
                        }}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#2D9AA5]"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.password}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Clinic Details */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-[#2D9AA5]/20">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#2D9AA5] to-[#1e6b73] rounded-full flex items-center justify-center text-white font-bold">
                    2
                  </div>
                  <h2 className="text-2xl font-bold text-[#2D9AA5] flex items-center gap-2">
                    <Building className="w-6 h-6" />
                    Health Center Information
                  </h2>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#2D9AA5] mb-2">
                      Health Center Name *
                      </label>
                      <input
                        placeholder="Enter Health Center name"
                        className={`text-black w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all ${
                          errors.name
                            ? "border-red-400 focus:border-red-500"
                            : "border-[#2D9AA5]/30 focus:border-[#2D9AA5]"
                        }`}
                        value={form.name}
                        onChange={(e) => {
                          setForm((f) => ({ ...f, name: e.target.value }));
                          if (errors.name)
                            setErrors((prev) => ({ ...prev, name: undefined }));
                        }}
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div className="relative" ref={dropdownRef}>
                      <label className="block text-sm font-semibold text-[#2D9AA5] mb-2">
                        Services *
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`text-black w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all text-left flex items-center justify-between ${
                          errors.treatments
                            ? "border-red-400"
                            : "border-[#2D9AA5]/30 hover:border-[#2D9AA5]/60"
                        }`}
                      >
                        <div className="flex-1">
                          {selectedTreatments.length === 0 ? (
                            <span className="text-gray-500">
                              Select services...
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {selectedTreatments.map((treatment, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-[#2D9AA5]/10 text-[#2D9AA5]"
                                >
                                  {typeof treatment === "string"
                                    ? treatment
                                    : treatment.name}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTreatmentSelect(treatment);
                                    }}
                                    className="ml-1 hover:bg-[#2D9AA5]/20 rounded-full w-4 h-4 flex items-center justify-center"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <svg
                          className={`w-5 h-5 transition-transform ${
                            isDropdownOpen ? "rotate-180" : ""
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
                      </button>
                      {isDropdownOpen && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-[#2D9AA5]/30 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                          {treatments.map((treatment, index) => (
                            <div
                              key={index}
                              onClick={() => handleTreatmentSelect(treatment)}
                              className={`text-black px-4 py-3 cursor-pointer hover:bg-[#2D9AA5]/5 flex items-center justify-between ${
                                selectedTreatments.some(
                                  (t) =>
                                    typeof t === "object" &&
                                    t.slug === treatment.slug
                                )
                                  ? "bg-[#2D9AA5]/5 text-[#2D9AA5]"
                                  : ""
                              }`}
                            >
                              <span>{treatment.name}</span>
                              {selectedTreatments.some(
                                (t) =>
                                  typeof t === "object" &&
                                  t.slug === treatment.slug
                              ) && <span className="text-[#2D9AA5]">✓</span>}
                            </div>
                          ))}

                          <div
                            onClick={() => handleTreatmentSelect("other")}
                            className={`text-black px-4 py-3 cursor-pointer hover:bg-[#2D9AA5]/5 flex items-center justify-between border-t ${
                              selectedTreatments.includes("other")
                                ? "bg-[#2D9AA5]/5 text-[#2D9AA5]"
                                : ""
                            }`}
                          >
                            <span>Other</span>
                            {selectedTreatments.includes("other") && (
                              <span className="text-[#2D9AA5]">✓</span>
                            )}
                          </div>
                        </div>
                      )}
                      {errors.treatments && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.treatments}
                        </p>
                      )}
                      {selectedTreatments.includes("other") && (
                        <div className="mt-3">
                          {otherTreatments.map((t, index) => (
                            <div key={index} className="flex items-center gap-2 mt-2">
                              <span className="px-2 py-1 bg-[#2D9AA5]/10 text-[#2D9AA5] rounded-lg">{t}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...otherTreatments];
                                  updated.splice(index, 1);
                                  setOtherTreatments(updated);
                                }}
                                className="px-2 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          {otherTreatments.length < 5 && (
                            <div className="flex mt-2 gap-2">
                              <input
                                placeholder="Add other treatment"
                                value={newOther}
                                onChange={(e) => setNewOther(e.target.value)}
                                className="text-black px-4 py-2 border-2 border-[#2D9AA5]/30 rounded-xl flex-1 focus:border-[#2D9AA5] focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const trimmed = newOther.trim();
                                  if (!trimmed) return;
                                  if (otherTreatments.length >= 5) return;
                                  setOtherTreatments([...otherTreatments, trimmed]);
                                  setNewOther("");
                                }}
                                className="px-4 py-2 bg-[#2D9AA5] text-white rounded-xl"
                              >
                                Add
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-[#2D9AA5] mb-2 flex items-center gap-2">
                          <div className="w-4 h-4 text-[#2D9AA5] text-sm leading-none">
                            د.إ
                          </div>
                          Pricing
                        </label>

                        <input
                          placeholder="د.إ500-2000"
                          className="text-black w-full px-4 py-3 border-2 border-[#2D9AA5]/30 rounded-xl focus:border-[#2D9AA5] focus:outline-none"
                          value={form.pricing}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, pricing: e.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[#2D9AA5] mb-2 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Timings
                        </label>
                        <input
                          placeholder="9 AM - 6 PM"
                          className="text-black w-full px-4 py-3 border-2 border-[#2D9AA5]/30 rounded-xl focus:border-[#2D9AA5] focus:outline-none"
                          value={form.timings}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, timings: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#2D9AA5] mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Address *{" "}
                        {isGeocoding && (
                          <span className="text-[#2D9AA5] text-sm">
                            🔍 Locating...
                          </span>
                        )}
                      </label>
                      <input
                        placeholder="Enter Health Center address"
                        className={`text-black w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all ${
                          errors.address
                            ? "border-red-400 focus:border-red-500"
                            : "border-[#2D9AA5]/30 focus:border-[#2D9AA5]"
                        }`}
                        value={form.address}
                        onChange={handleAddressChange}
                      />
                      {errors.address && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.address}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#2D9AA5] mb-2">
                        Location on Map *
                      </label>
                      <div
                        className={`h-64 border-2 rounded-xl overflow-hidden ${
                          errors.location
                            ? "border-red-400"
                            : "border-[#2D9AA5]/30"
                        }`}
                      >
                        <GoogleMap
                          zoom={form.latitude !== 0 ? 15 : 12}
                          center={{
                            lat: form.latitude !== 0 ? form.latitude : 28.61,
                            lng: form.longitude !== 0 ? form.longitude : 77.2,
                          }}
                          mapContainerStyle={{ width: "100%", height: "100%" }}
                          onLoad={onMapLoad}
                          onClick={(e) => {
                            if (e.latLng) {
                              const lat = e.latLng.lat();
                              const lng = e.latLng.lng();
                              setForm((f) => ({
                                ...f,
                                latitude: lat,
                                longitude: lng,
                              }));
                              if (errors.location)
                                setErrors((prev) => ({
                                  ...prev,
                                  location: undefined,
                                }));
                            }
                          }}
                        >
                          {form.latitude !== 0 && (
                            <Marker
                              position={{
                                lat: form.latitude,
                                lng: form.longitude,
                              }}
                            />
                          )}
                        </GoogleMap>
                      </div>
                      {errors.location && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.location}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-[#2D9AA5] mb-2">
                        Health Center Photo *
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          className={`text-black w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all ${
                            errors.clinicPhoto
                              ? "border-red-400 focus:border-red-500"
                              : "border-[#2D9AA5]/30 focus:border-[#2D9AA5]"
                          }`}
                          onChange={handleFileChange}
                        />
                        {errors.clinicPhoto && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.clinicPhoto}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[#2D9AA5] mb-2">
                          License (Optional)
                        </label>
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          className="text-black w-full px-4 py-3 border-2 border-[#2D9AA5]/30 rounded-xl focus:border-[#2D9AA5] focus:outline-none"
                          onChange={handleLicenseChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-[#2D9AA5]/20">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#2D9AA5] to-[#1e6b73] rounded-full flex items-center justify-center text-white font-bold">
                    3
                  </div>
                  <h2 className="text-2xl font-bold text-[#2D9AA5] flex items-center gap-2">
                    <Phone className="w-6 h-6" />
                    Contact Information
                  </h2>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-[#2D9AA5] mb-2">
                      Your Name *
                    </label>
                    <input
                      placeholder="Owner's full name"
                      className={`text-black w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all ${
                        errors.contactName
                          ? "border-red-400 focus:border-red-500"
                          : "border-[#2D9AA5]/30 focus:border-[#2D9AA5]"
                      }`}
                      value={contactInfo.name}
                      onChange={(e) => {
                        setContactInfo({
                          ...contactInfo,
                          name: e.target.value,
                        });
                        if (errors.contactName)
                          setErrors((prev) => ({
                            ...prev,
                            contactName: undefined,
                          }));
                      }}
                    />
                    {errors.contactName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.contactName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#2D9AA5] mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      placeholder="10-digit phone number"
                      className={`text-black w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all ${
                        errors.phone
                          ? "border-red-400 focus:border-red-500"
                          : "border-[#2D9AA5]/30 focus:border-[#2D9AA5]"
                      }`}
                      value={contactInfo.phone}
                      onChange={handlePhoneChange}
                      maxLength={10}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-center">
                <button
                  className={`px-12 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform ${
                    emailVerified
                      ? "bg-gradient-to-r from-[#2D9AA5] to-[#1e6b73] hover:from-[#236f7a] hover:to-[#1a5a61] text-white shadow-lg hover:shadow-xl hover:scale-105"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                  type="submit"
                  disabled={!emailVerified}
                >
                  {emailVerified
                    ? "🌿 Register My Health Center"
                    : "⚠️ Verify Email First"}
                </button>
              </div>
            </form>

            {status && (
              <div
                className={`mt-6 p-4 rounded-xl text-center font-medium ${
                  status.includes("✅")
                    ? "bg-[#2D9AA5]/5 text-[#2D9AA5]"
                    : status.includes("❌")
                    ? "bg-red-50 text-red-800"
                    : "bg-[#2D9AA5]/5 text-[#2D9AA5]"
                }`}
              >
                {status}
              </div>
            )}

            <SuccessPopup
              isOpen={showSuccessPopup}
              onClose={() => setShowSuccessPopup(false)}
            />
          </div>

          {/* Why Register Section - Sidebar */}
          <div className="lg:w-80 lg:order-2">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-[#2D9AA5]/20 sticky top-4">
              <h3 className="text-2xl font-bold text-[#2D9AA5] mb-6 text-center flex items-center justify-center gap-2">
                <Star className="w-6 h-6" /> Why Register With Us?
              </h3>
              <div className="space-y-4">
                <div className="text-center p-4 rounded-xl bg-[#2D9AA5]/5 border border-[#2D9AA5]/20">
                  <Users className="w-8 h-8 text-[#2D9AA5] mx-auto mb-2" />
                  <h4 className="font-semibold text-[#2D9AA5] mb-1">
                    Reach More Patients
                  </h4>
                  <p className="text-sm text-[#2D9AA5]">
                    Connect with patients seeking authentic Ayurvedic treatments
                  </p>
                </div>
                <div className="text-center p-4 rounded-xl bg-[#2D9AA5]/5 border border-[#2D9AA5]/20">
                  <Shield className="w-8 h-8 text-[#2D9AA5] mx-auto mb-2" />
                  <h4 className="font-semibold text-[#2D9AA5] mb-1">
                    Post Jobs
                  </h4>
                  <p className="text-sm text-[#2D9AA5]">
                    You can post job opportunities and hire qualified staff
                  </p>
                </div>
                <div className="text-center p-4 rounded-xl bg-[#2D9AA5]/5 border border-[#2D9AA5]/20">
                  <Heart className="w-8 h-8 text-[#2D9AA5] mx-auto mb-2" />
                  <h4 className="font-semibold text-[#2D9AA5] mb-1">
                    Personal Dashboard
                  </h4>
                  <p className="text-sm text-[#2D9AA5]">
                    Manage your Health Center with a comprehensive personal dashboard
                  </p>
                </div>
                <div className="text-center p-4 rounded-xl bg-[#2D9AA5]/5 border border-[#2D9AA5]/20">
                  <span className="w-8 h-8 text-[#2D9AA5] mx-auto mb-2 text-center block text-3xl">
                    د.إ
                  </span>
                  <h4 className="font-semibold text-[#2D9AA5] mb-1">
                    Easy Booking
                  </h4>
                  <p className="text-sm text-[#2D9AA5]">
                    Streamlined appointment system for better management
                  </p>
                </div>
                <div className="text-center p-4 rounded-xl bg-[#2D9AA5]/5 border border-[#2D9AA5]/20">
                  <Leaf className="w-8 h-8 text-[#2D9AA5] mx-auto mb-2" />
                  <h4 className="font-semibold text-[#2D9AA5] mb-1">
                    Write Blogs
                  </h4>
                  <p className="text-sm text-[#2D9AA5]">
                    Share your expertise through blogs and expand your audience
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
export default RegisterClinic;

RegisterClinic.getLayout = function PageLayout(page: React.ReactNode) {
  return <Layout>{page}</Layout>;
};

