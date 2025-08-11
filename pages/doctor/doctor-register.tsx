import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { ChangeEvent, FormEvent } from "react";
import React from "react";
import type { KeyboardEvent } from "react";

export default function DoctorRegister() {
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const registrationRef = useRef<HTMLDivElement>(null);

  // State variables
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

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState<{ show: boolean; message: string }>({
    show: false,
    message: "",
  });
  const [resumeFileName, setResumeFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const [specializationType, setSpecializationType] = useState<"dropdown" | "other">("dropdown");
  const [customSpecialization, setCustomSpecialization] = useState("");
  const [treatments, setTreatments] = useState<string[]>([]);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    show: false,
    message: "",
    type: 'info'
  });

  // Fetch treatments from backend API
  useEffect(() => {
    const fetchTreatments = async () => {
      try {
        const res = await axios.get("/api/doctor/getTreatment");
        if (res.data && Array.isArray(res.data.treatments)) {
          setTreatments(
            res.data.treatments.map((t: { name: string }) => t.name)
          );
        }
      } catch {
        setTreatments([]);
      }
    };
    fetchTreatments();
  }, []);

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

  // Toast notification function
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: 'info' });
    }, 5000);
  };

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
      // Limit phone to 10 digits
      if (name === "phone") {
        const onlyNums = value.replace(/[^0-9]/g, "").slice(0, 10);
        setForm((prev) => ({ ...prev, [name]: onlyNums }));
      } else {
        setForm((prev) => ({ ...prev, [name]: value }));
      }
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Phone validation: must be exactly 10 digits
    if (!form.phone || form.phone.length !== 10) {
      showToast("Please enter a valid 10-digit phone number.", 'error');
      return;
    }
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
      showToast("Registration successful! Welcome to our network.", 'success');
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
      setTimeout(() => {
        window.location.href = '/';
      }, 6000);
    } catch (err: unknown) {
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

      showToast(message, 'error');
    }
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
    <>
      {/* Toast Notifications */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className={`bg-white rounded-lg p-4 shadow-lg border-l-4 flex items-center gap-3 animate-slide-in ${toast.type === 'success' ? 'border-[#2D9AA5]' :
              toast.type === 'error' ? 'border-red-500' :
                'border-[#2D9AA5]'
            }`}>
            <div className="flex-shrink-0">
              {toast.type === 'success' && (
                <svg className="w-5 h-5 text-[#2D9AA5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {toast.type === 'error' && (
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 9l-6 6m0-6l6 6" />
                </svg>
              )}
              {toast.type === 'info' && (
                <svg className="w-5 h-5 text-[#2D9AA5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-black">{toast.message}</p>
              {/* Show redirect message for success toast */}
              {toast.type === 'success' && (
                <p className="text-xs text-[#2D9AA5] mt-1">
                  Redirecting to home page...
                </p>
              )}
            </div>
            <button
              className="text-black hover:text-[#2D9AA5] transition-colors p-1 rounded"
              onClick={() => setToast({ show: false, message: "", type: 'info' })}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto h-full">

          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#2D9AA5] to-cyan-600 rounded-full mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black mb-3">Join Our Ayurvedic Network</h1>
            <p className="text-base sm:text-lg text-black/70 max-w-3xl mx-auto leading-relaxed">
              Expand your practice and connect with thousands of patients seeking authentic Ayurvedic care
            </p>
          </div>

          {/* Main Content - Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 xl:gap-12 items-start">

            {/* Left Side - Registration Form */}
            <div className="order-2 lg:order-1" ref={registrationRef}>
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 h-full">
                {/* Form Header */}
                <div className="bg-gradient-to-r from-[#2D9AA5] to-cyan-600 text-white p-6 text-center">
                  <h2 className="text-xl font-bold mb-2">Doctor Registration</h2>
                  <p className="text-cyan-100 text-sm">Join our network of Ayurvedic practitioners</p>
                </div>

                {/* Form Body */}
                <div className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Name and Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="relative">
                        <input
                          name="name"
                          type="text"
                          placeholder="Full Name"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#2D9AA5] focus:ring-2 focus:ring-[#2D9AA5]/20 transition-all text-black placeholder-black/50"
                          onChange={handleChange}
                          value={form.name || ""}
                          required
                        />
                      </div>
                      <div className="relative">
                        <input
                          name="phone"
                          type="tel"
                          placeholder="Phone Number"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#2D9AA5] focus:ring-2 focus:ring-[#2D9AA5]/20 transition-all text-black placeholder-black/50"
                          onChange={handleChange}
                          onKeyPress={handlePhoneKeyPress}
                          onInput={handlePhoneInput}
                          value={form.phone || ""}
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="relative">
                      <input
                        name="email"
                        type="email"
                        placeholder="Email Address"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#2D9AA5] focus:ring-2 focus:ring-[#2D9AA5]/20 transition-all text-black placeholder-black/50"
                        onChange={handleChange}
                        value={form.email || ""}
                        required
                      />
                    </div>

                    {/* Specialization */}
                    <div className="relative">
                      <select
                        id="specialization"
                        name="specialization"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#2D9AA5] focus:ring-2 focus:ring-[#2D9AA5]/20 transition-all appearance-none bg-white text-black"
                        value={
                          specializationType === "dropdown"
                            ? form.specialization
                            : "other"
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            setSpecializationType("dropdown");
                            setForm((prev) => ({
                              ...prev,
                              specialization: "",
                            }));
                            setCustomSpecialization("");
                          } else if (value === "other") {
                            setSpecializationType("other");
                            setForm((prev) => ({
                              ...prev,
                              specialization: "",
                            }));
                          } else {
                            setSpecializationType("dropdown");
                            setForm((prev) => ({
                              ...prev,
                              specialization: value,
                            }));
                          }
                        }}
                        required
                      >
                        <option value="" disabled hidden>
                          Select Specialization
                        </option>
                        {treatments.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                        <option value="other">
                          Other
                        </option>
                      </select>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    {/* Custom Specialization Input */}
                    {specializationType === "other" && (
                      <div className="relative">
                        <input
                          type="text"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#2D9AA5] focus:ring-2 focus:ring-[#2D9AA5]/20 transition-all text-black placeholder-black/50"
                          placeholder="Enter your specialization"
                          value={customSpecialization}
                          onChange={(e) => {
                            setCustomSpecialization(e.target.value);
                            setForm((prev) => ({
                              ...prev,
                              specialization: e.target.value,
                            }));
                          }}
                          required
                        />
                      </div>
                    )}

                    {/* Experience and Degree */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="relative">
                        <input
                          name="experience"
                          type="text"
                          placeholder="Experience (Years)"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#2D9AA5] focus:ring-2 focus:ring-[#2D9AA5]/20 transition-all text-black placeholder-black/50"
                          onChange={handleChange}
                          onKeyPress={handleExperienceKeyPress}
                          onInput={handleExperienceInput}
                          value={form.experience || ""}
                          required
                        />
                      </div>
                      <div className="relative">
                        <input
                          name="degree"
                          type="text"
                          placeholder="Degree"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#2D9AA5] focus:ring-2 focus:ring-[#2D9AA5]/20 transition-all text-black placeholder-black/50"
                          onChange={handleChange}
                          value={form.degree || ""}
                          required
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div className="relative">
                      <textarea
                        name="address"
                        placeholder="Enter Full Address"
                        rows={2}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#2D9AA5] focus:ring-2 focus:ring-[#2D9AA5]/20 transition-all resize-none text-black placeholder-black/50"
                        onChange={handleChange}
                        value={form.address || ""}
                        required
                      ></textarea>
                    </div>

                    {/* File Upload */}
                    <div className="relative">
                      <div className="relative">
                        <input
                          type="file"
                          name="resume"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const maxSize = 1024 * 1024; // 1MB in bytes
                              if (file.size > maxSize) {
                                setFileError("File is too large");
                                e.target.value = "";
                                return;
                              }
                              setFileError("");
                              handleChange(e);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          required
                        />
                        <div className="w-full px-4 py-3 border-2 border-dashed border-gray-300 bg-gray-50 text-black/60 cursor-pointer hover:bg-[#2D9AA5]/5 hover:border-[#2D9AA5] transition-all rounded-lg text-center">
                          {resumeFileName ? `📄 ${resumeFileName}` : "Upload Resume (PDF, DOC, DOCX)"}
                        </div>
                      </div>
                      <div className={`text-xs mt-1 ${fileError ? "text-red-500" : "text-black/50"}`}>
                        {fileError || "Max file size: 1MB"}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-[#2D9AA5] to-cyan-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-[#238892] hover:to-cyan-700 transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Register as Doctor
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Right Side - Benefits Section */}
            <div className="order-1 lg:order-2 flex flex-col justify-center">
              <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 border border-gray-100 h-full">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-[#2D9AA5] to-cyan-600 rounded-full mb-4 shadow-lg">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-black mb-3">Why Register With Us?</h2>
                  <p className="text-sm sm:text-base text-black/70 leading-relaxed">
                    Join thousands of practitioners who trust our platform to grow their practice
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
                  {/* Personal Dashboard */}
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-[#2D9AA5]/5 to-cyan-50 border border-[#2D9AA5]/10">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#2D9AA5] to-cyan-600 rounded-lg flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-black text-base mb-2">Personal Dashboard</h3>
                      <p className="text-sm text-black/70 leading-relaxed">
                        Get comprehensive analytics and insights to manage your practice effectively with real-time data
                      </p>
                    </div>
                  </div>

                  {/* Job Postings */}
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-[#2D9AA5]/5 to-cyan-50 border border-[#2D9AA5]/10">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#2D9AA5] to-cyan-600 rounded-lg flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6.294a1 1 0 01-.757.97l-2 .5a1 1 0 00-.757.97V17a2 2 0 00-2 2v1a1 1 0 00.894.447l2.105-.263A2 2 0 0018 18.118V8a2 2 0 012-2V6z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-black text-base mb-2">Post Job Opportunities</h3>
                      <p className="text-sm text-black/70 leading-relaxed">
                        Hire qualified staff by posting job openings in your clinic and find the perfect candidates
                      </p>
                    </div>
                  </div>

                  {/* Blog Writing */}
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-[#2D9AA5]/5 to-cyan-50 border border-[#2D9AA5]/10">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#2D9AA5] to-cyan-600 rounded-lg flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-black text-base mb-2">Write & Share Blogs</h3>
                      <p className="text-sm text-black/70 leading-relaxed">
                        Share your knowledge through blog posts to establish authority and attract more patients
                      </p>
                    </div>
                  </div>

                  {/* Patient Network */}
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-[#2D9AA5]/5 to-cyan-50 border border-[#2D9AA5]/10">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#2D9AA5] to-cyan-600 rounded-lg flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-black text-base mb-2">Extensive Patient Network</h3>
                      <p className="text-sm text-black/70 leading-relaxed">
                        Connect with thousands of patients actively seeking authentic Ayurvedic treatments
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Features */}
                <div className="mt-6 p-4 bg-gradient-to-r from-[#2D9AA5]/10 to-cyan-100/50 rounded-xl border border-[#2D9AA5]/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#2D9AA5] to-cyan-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h4 className="font-bold text-black">Additional Benefits</h4>
                  </div>
                  <ul className="space-y-2 text-sm text-black/70">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[#2D9AA5] rounded-full"></div>
                      24/7 customer support for all practitioners
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[#2D9AA5] rounded-full"></div>
                      Free marketing tools and promotional materials
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[#2D9AA5] rounded-full"></div>
                      Secure patient data management system
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
  .animate-slide-in {
    animation: slideIn 0.5s ease-out forwards;
  }
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  input:focus, select:focus, textarea:focus {
    outline: none;
  }
  
  /* Custom scrollbar for select */
  select {
    scrollbar-width: thin;
    scrollbar-color: #2D9AA5 #f1f5f9;
  }
  
  select::-webkit-scrollbar {
    width: 6px;
  }
  
  select::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }
  
  select::-webkit-scrollbar-thumb {
    background: #2D9AA5;
    border-radius: 3px;
  }

  /* Responsive adjustments */
  @media (max-width: 1023px) {
    .order-1 {
      order: 1;
    }
    .order-2 {
      order: 2;
    }
  }
  
  @media (min-width: 1024px) {
    .lg\\:order-1 {
      order: 1;
    }
    .lg\\:order-2 {
      order: 2;
    }
  }
`}</style>
    </>
  );
}
DoctorRegister.getLayout = function PageLayout(page: React.ReactNode) {
  return page; // No layout
};
