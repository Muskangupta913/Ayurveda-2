import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// TypeScript interfaces
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  isVisible: boolean;
  onClose: () => void;
}

interface FormData {
  name: string;
  phone: string;
  location: string;
  query: string;
}

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  isVisible: boolean;
}

// Toast Component
const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose }) => {
  if (!isVisible) return null;

  const getToastStyles = () => {
    const baseStyles = "fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl backdrop-blur-md border transform transition-all duration-500 ease-in-out max-w-md";

    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-500/20 border-green-400/30 text-green-100`;
      case 'error':
        return `${baseStyles} bg-red-500/20 border-red-400/30 text-red-100`;
      case 'warning':
        return `${baseStyles} bg-yellow-500/20 border-yellow-400/30 text-yellow-100`;
      default:
        return `${baseStyles} bg-blue-500/20 border-blue-400/30 text-blue-100`;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className={`${getToastStyles()} ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <span className="text-2xl">{getIcon()}</span>
        </div>
        <div className="flex-1">
          <p className="font-medium text-base leading-relaxed">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-4 text-gray-300 hover:text-white transition-colors"
        >
          <span className="text-xl">×</span>
        </button>
      </div>
    </div>
  );
};

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: 'Register Doctor', href: '/' },
    { name: 'Search Doctor', href: '/doctor/search' },
    { name: 'Search Clinic', href: '/' },
  ];

  const treatments = [
    { name: 'Ayurvedic Hairfall Treatment' },
    { name: 'Panchakarma Treatment' },
    { name: 'Gastric Disorders Treatment' },
    { name: 'PCOS Treatment' },
    { name: 'Ayurvedic Diet Plan' },
    { name: 'Skin Diseases Treatment' },
  ];

  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    location: '',
    query: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast state
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'success',
    isVisible: false
  });

  // Enhanced validation function
  const validateForm = () => {
    const errors: string[] = [];

    // Name validation
    if (!formData.name || formData.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    }

    // Phone validation - handle both local and international formats
    const phoneRegex = /^\d{10}$/;

    if (!formData.phone) {
      errors.push('Phone number is required');
    } else {
      // Clean the phone number - remove spaces and keep only digits and +
      const cleanedPhone = formData.phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');

      // Debug logging
      console.log('Phone validation:', {
        original: formData.phone,
        cleaned: cleanedPhone,
        startsWith971: cleanedPhone.startsWith('971'),
        startsWithPlus971: cleanedPhone.startsWith('+971')
      });

      // Check if it's a UAE number (starts with +971 or 971)
      if (cleanedPhone.startsWith('+971') || cleanedPhone.startsWith('971')) {
        // Remove country code and check if remaining digits are 9
        const localNumber = cleanedPhone.replace(/^(\+971|971)/, '');
        console.log('UAE number check:', { localNumber, length: localNumber.length });

        if (localNumber.length !== 9) {
          errors.push('UAE phone number must be 9 digits after country code (e.g., +971501234567)');
        }
      } else {
        // Check for local 10-digit format
        console.log('Local number check:', { cleanedPhone, isValid: phoneRegex.test(cleanedPhone) });
        if (!phoneRegex.test(cleanedPhone)) {
          errors.push('Phone number must be exactly 10 digits (e.g., 0501234567) or valid UAE format (+971501234567)');
        }
      }
    }

    // Location validation
    if (!formData.location || formData.location.trim().length < 2) {
      errors.push('Location must be at least 2 characters long');
    }

    // Query validation
    if (!formData.query || formData.query.trim().length < 10) {
      errors.push('Query must be at least 10 characters long');
    }

    return errors;
  };

  // Toast functions
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setToast({
      message,
      type,
      isVisible: true
    });

    // Auto hide after 6 seconds for error messages, 4 seconds for success
    const timeout = type === 'error' ? 6000 : 4000;
    setTimeout(() => {
      setToast(prev => ({ ...prev, isVisible: false }));
    }, timeout);
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getDetailedErrorMessage = (error: Error | null, response: Response | null) => {
    // Check for specific HTTP status codes
    if (response) {
      switch (response.status) {
        case 400:
          return 'Invalid form data submitted. Please check all fields and try again.';
        case 401:
          return 'Authentication failed. Please refresh the page and try again.';
        case 403:
          return 'Access denied. You may not have permission to submit this form.';
        case 404:
          return 'Service not found. Please contact support if this issue persists.';
        case 408:
          return 'Request timeout. The server took too long to respond. Please try again.';
        case 409:
          return 'Duplicate submission detected. Please wait before submitting again.';
        case 422:
          return 'Please check your input and try again.';
        case 429:
          return 'Too many requests. Please wait a few minutes before trying again.';
        case 500:
          return 'Internal server error. Our team has been notified. Please try again later.';
        case 502:
          return 'Bad gateway. The server is temporarily unavailable. Please try again.';
        case 503:
          return 'Service temporarily unavailable. Please try again in a few minutes.';
        case 504:
          return 'Gateway timeout. The request took too long to process. Please try again.';
        default:
          return `Server error (${response.status}). Please try again or contact support.`;
      }
    }

    // Check for network-related errors
    if (error?.name === 'TypeError' && error.message.includes('fetch')) {
      return 'Network connection failed. Please check your internet connection and try again.';
    }

    if (error?.name === 'AbortError') {
      return 'Request was cancelled. Please try submitting the form again.';
    }

    if (error?.message.includes('NetworkError')) {
      return 'Network error occurred. Please check your connection and try again.';
    }

    if (error?.message.includes('CORS')) {
      return 'Cross-origin request blocked. Please contact support for assistance.';
    }

    // Generic fallback
    return `Submission failed: ${error?.message || 'Unknown error occurred'}. Please try again.`;
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Client-side validation
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      // Show specific error messages for each validation failure
      const errorMessage = validationErrors.length === 1
        ? validationErrors[0]
        : `Please fix the following issues: ${validationErrors.join(', ')}`;

      showToast(` ${errorMessage}`, 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch('/api/users/get-in-touch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        console.log('Success:', result.message);
        setFormData({
          name: '',
          phone: '',
          location: '',
          query: '',
        });
        showToast('🎉 Query submitted successfully! We&apos;ll get back to you soon.', 'success');
      } else {
        // Try to parse error response
        let errorMessage = 'Unknown server error occurred';
        let errorDetails = '';

        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || getDetailedErrorMessage(null, response);
          errorDetails = errorData.details || errorData.errors?.join(', ') || '';
        } catch {
          // Removed unused parseError variable
          errorMessage = getDetailedErrorMessage(null, response);
        }

        console.error('Server Error:', errorMessage);

        // Show detailed error message if available
        const finalErrorMessage = errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage;
        showToast(`❌ ${finalErrorMessage}`, 'error');
      }
    } catch (error: Error | unknown) {
      console.error('Network/Client Error:', error);
      const detailedError = getDetailedErrorMessage(error as Error, null);
      showToast(`🔄 ${detailedError}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      <footer className="text-white relative overflow-hidden">
        {/* Background with enhanced gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-[#2D9AA5] to-[#1a6b73]"></div>

        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-16 h-16 rounded-full bg-white/20 animate-pulse"></div>
          <div className="absolute top-32 right-20 w-12 h-12 rounded-full bg-white/15 animate-pulse delay-75"></div>
          <div className="absolute bottom-40 left-1/4 w-20 h-20 rounded-full bg-white/10 animate-pulse delay-150"></div>
          <div className="absolute bottom-20 right-16 w-14 h-14 rounded-full bg-white/20 animate-pulse delay-300"></div>
          <div className="absolute top-1/2 left-1/2 w-24 h-24 rounded-full bg-white/5 animate-pulse delay-500"></div>
        </div>

        {/* Decorative medical icons */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-16 left-20 text-4xl transform rotate-12">⚕️</div>
          <div className="absolute top-40 right-32 text-3xl transform -rotate-12">🩺</div>
          <div className="absolute bottom-60 left-1/3 text-5xl transform rotate-45">💊</div>
          <div className="absolute bottom-32 right-20 text-3xl transform -rotate-45">🏥</div>
          <div className="absolute top-1/3 right-16 text-2xl transform rotate-12">❤️</div>
        </div>

        <div className="relative z-10">
          {/* Main Footer Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

              {/* Left Side - Footer Links (8 columns on large screens) */}
              <div className="lg:col-span-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

                  {/* Brand Section - Enhanced */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4 mb-8">
                      <div className="relative">
                        <div className="w-14 h-14 bg-gradient-to-r from-[#2D9AA5] to-[#48c5d2] rounded-full flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform duration-300">
                          <Image 
                            src="/assets/health_treatments_logo.png" 
                            alt="Treatment Icon" 
                            width={32}
                            height={32}
                            className="w-8 h-8"
                          />
                        </div>
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#2D9AA5] to-[#48c5d2] rounded-full blur opacity-25"></div>
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                          ZEVA
                        </h3>
                        <p className="text-sm text-gray-300 font-medium">Medical Care Network</p>
                      </div>
                    </div>

                    <p className="text-gray-200 leading-relaxed text-base">
                      Connecting you with quality healthcare providers and medical treatments.
                    </p>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 text-gray-200 hover:text-white transition-colors">
                        <div className="w-8 h-8 bg-[#2D9AA5]/20 rounded-full flex items-center justify-center">
                          <span className="text-sm">✉️</span>
                        </div>
                        <span className="text-sm font-medium">info@zeva.com</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Links - Enhanced */}
                  <div className="space-y-6">
                    <h4 className="text-xl font-bold text-white flex items-center">
                      <div className="w-8 h-8 bg-[#2D9AA5]/20 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm">🔗</span>
                      </div>
                      Quick Links
                    </h4>
                    <ul className="space-y-3">
                      {quickLinks.map((link) => (
                        <li key={link.name} className="transform hover:translate-x-2 transition-transform duration-300">
                          <Link href={link.href} legacyBehavior>
                            <a className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group text-sm">
                              <div className="w-5 h-5 bg-[#2D9AA5]/20 rounded-full flex items-center justify-center mr-3 group-hover:bg-[#2D9AA5]/40 transition-colors">
                                <span className="text-xs group-hover:translate-x-0.5 transition-transform">→</span>
                              </div>
                              <span className="group-hover:font-medium transition-all">{link.name}</span>
                            </a>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Medical Specialties - Enhanced */}
                  <div className="space-y-6">
                    <h4 className="text-xl font-bold text-white flex items-center">
                      <div className="w-8 h-8 bg-[#2D9AA5]/20 rounded-full flex items-center justify-center mr-3">
                        <Image 
                          src="/assets/health_treatments_logo.png" 
                          alt="Treatment Icon" 
                          width={16}
                          height={16}
                          className="w-4 h-4"
                        />
                      </div>
                      Medical Specialties
                    </h4>
                    <ul className="space-y-3">
                      {treatments.map((treatment) => (
                        <li key={treatment.name} className="transform hover:translate-x-2 transition-transform duration-300">
                          <a className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group cursor-pointer text-sm">
                            <div className="w-5 h-5 bg-[#2D9AA5]/20 rounded-full flex items-center justify-center mr-3 group-hover:bg-[#2D9AA5]/40 transition-colors">
                              <span className="text-xs group-hover:translate-x-0.5 transition-transform">→</span>
                            </div>
                            <span className="group-hover:font-medium transition-all">{treatment.name}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Healthcare Services - Enhanced */}
                  <div className="space-y-6">
                    <h4 className="text-xl font-bold text-white flex items-center">
                      <div className="w-8 h-8 bg-[#2D9AA5]/20 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm">⚕️</span>
                      </div>
                      Our Services
                    </h4>
                    <ul className="space-y-3">
                      {['Doctor Consultation', 'Online Booking', 'Emergency Care', 'Health Checkups', 'Lab Tests'].map((service) => (
                        <li key={service} className="transform hover:translate-x-2 transition-transform duration-300">
                          <a className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group cursor-pointer text-sm">
                            <div className="w-5 h-5 bg-[#2D9AA5]/20 rounded-full flex items-center justify-center mr-3 group-hover:bg-[#2D9AA5]/40 transition-colors">
                              <span className="text-xs group-hover:translate-x-0.5 transition-transform">→</span>
                            </div>
                            <span className="group-hover:font-medium transition-all">{service}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Right Side - Contact Form (4 columns on large screens) */}
              <div className="lg:col-span-4">
                <div className="bg-white/10 backdrop-blur-md p-6 shadow-2xl rounded-2xl border border-white/20 h-fit">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-[#2D9AA5] to-[#48c5d2] rounded-full mb-4 shadow-lg">
                      <span className="text-lg">📞</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Request Call Back</h3>
                    <p className="text-sm text-gray-200">We&apos;d love to hear from you</p>
                  </div>

                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label htmlFor="name" className="block text-xs font-semibold text-white">
                        Full Name
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={handleFormChange}
                        required
                        disabled={isSubmitting}
                        className="w-full px-3 py-2.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-gray-900 placeholder-gray-600 focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] transition-all duration-300 resize-none focus:bg-white/30 text-sm disabled:opacity-50 disabled:cursor-not-allowed
"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="phone" className="block text-xs font-semibold text-white">
                        Phone Number
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        inputMode="numeric"
                        pattern="\d*"
                        placeholder="Enter phone number (e.g. 0501234567 or +971501234567)"
                        value={formData.phone}
                        onChange={(e) => {
                          const numericValue = e.target.value.replace(/\D/g, "");
                          setFormData((prev) => ({ ...prev, phone: numericValue }));
                        }}
                        required
                        disabled={isSubmitting}
                        className="w-full px-3 py-2.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-gray-900 placeholder-gray-600 focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] transition-all duration-300 resize-none focus:bg-white/30 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>



                    <div className="space-y-1">
                      <label htmlFor="location" className="block text-xs font-semibold text-white">
                        Location
                      </label>
                      <input
                        id="location"
                        name="location"
                        type="text"
                        placeholder="Enter your location"
                        value={formData.location}
                        onChange={handleFormChange}
                        required
                        disabled={isSubmitting}
                        className="w-full px-3 py-2.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-gray-900 placeholder-gray-600 focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] transition-all duration-300 resize-none focus:bg-white/30 text-sm disabled:opacity-50 disabled:cursor-not-allowed
"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="query" className="block text-xs font-semibold text-white">
                        Your Query
                      </label>
                      <textarea
                        id="query"
                        name="query"
                        placeholder="Tell us about your question (minimum 10 characters)..."
                        value={formData.query}
                        onChange={handleFormChange}
                        required
                        rows={3}
                        disabled={isSubmitting}
                        className="w-full px-3 py-2.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-gray-900 placeholder-gray-600 focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] transition-all duration-300 resize-none focus:bg-white/30 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-[#2D9AA5] to-[#48c5d2] hover:from-[#48c5d2] hover:to-[#2D9AA5] text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-xl hover:shadow-[#2D9AA5]/25 transform hover:scale-[1.02] text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      <span className="flex items-center justify-center space-x-2">
                        {isSubmitting ? (
                          <>
                            <span className="animate-spin">⏳</span>
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Message</span>
                            <span className="text-base">📤</span>
                          </>
                        )}
                      </span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Bottom Bar */}
          <div className="border-t border-white/10 bg-gradient-to-r from-gray-900/50 to-[#1a6b73]/50 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                <div className="text-gray-300 text-center sm:text-left">
                  <p className="text-base font-medium">
                    © {currentYear} <span className="text-white font-bold">Zeva Network</span>. All rights reserved.
                  </p>
                </div>

                <div className="flex items-center space-x-3 text-gray-300">
                  <span className="text-base">Made with</span>
                  <div className="relative">
                    <span className="text-red-400 text-xl animate-pulse">❤️</span>
                    <div className="absolute inset-0 text-red-400 text-xl animate-ping opacity-20">❤️</div>
                  </div>
                  <span className="text-base font-medium text-white">for your health</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;