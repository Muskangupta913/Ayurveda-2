'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { MapPin, Clock, DollarSign, User, Mail, Phone, MessageSquare, Home } from 'lucide-react';


function EnquiryFormPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clinicId = searchParams.get('clinicId');
  const clinicName = searchParams.get('clinicName');
  const clinicAddress = searchParams.get('clinicAddress');

  interface ClinicDetails {
    timings?: string;
    pricing?: string;
    [key: string]: unknown;
  }
  const [clinicDetails, setClinicDetails] = useState<ClinicDetails | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (clinicId) {
      axios
        .get(`/api/clinics/${clinicId}`)
        .then((res) => setClinicDetails(res.data.clinic))
        .catch((err) => console.error(err));
    }
  }, [clinicId]);

  // Handle name input - only allow letters and spaces
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only letters, spaces, and common name characters
    const namePattern = /^[a-zA-Z\s]*$/;
    if (namePattern.test(value)) {
      setFormData({ ...formData, name: value });
    }
  };

  // Handle phone input - only allow numbers
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers
    const phonePattern = /^[0-9]*$/;
    if (phonePattern.test(value)) {
      setFormData({ ...formData, phone: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token'); // adjust if you're using cookies or another method

      await axios.post(
        '/api/clinics/enquiry',
        { ...formData, clinicId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSubmitted(true);
    } catch {
      alert('Failed to send enquiry');
    }
  };

  // Navigate to homepage
  const goToHomepage = () => {
    router.push('/');
  };

  if (!clinicDetails) return <p className="p-4">Loading clinic info...</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="grid lg:grid-cols-2 min-h-[600px]">
            
            {/* Clinic Details - Left Side */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-8 lg:p-12 flex flex-col justify-center">
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold mb-4 leading-tight">{clinicName}</h1>
                  <div className="flex items-start space-x-3 mb-6">
                    <MapPin className="w-5 h-5 mt-1 text-blue-200" />
                    <p className="text-blue-100 text-lg">{clinicAddress}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center space-x-4 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                    <Clock className="w-6 h-6 text-blue-200" />
                    <div>
                      <p className="font-semibold text-blue-100">Operating Hours</p>
                      <p className="text-white">{clinicDetails.timings}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                    <DollarSign className="w-6 h-6 text-blue-200" />
                    <div>
                      <p className="font-semibold text-blue-100">Consultation Fees</p>
                      <p className="text-white">{clinicDetails.pricing}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <p className="text-blue-200 text-lg">Ready to book your appointment? Fill out the form and we&apos;ll get back to you shortly.</p>
                </div>
              </div>
            </div>

            {/* Form - Right Side */}
            <div className="p-8 lg:p-12 flex flex-col justify-center">
              {submitted ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Thank You!</h2>
                  <p className="text-gray-600 text-lg">Your enquiry has been sent successfully. We&apos;ll contact you soon.</p>
                  
                  {/* Homepage Button */}
                  <button
                    onClick={goToHomepage}
                    className="mt-6 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl mx-auto"
                  >
                    <Home className="w-5 h-5" />
                    <span>Go to Homepage</span>
                  </button>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">Send Enquiry</h2>
                  <p className="text-gray-600 mb-8">Get in touch with us for appointments and consultations</p>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Your Full Name"
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-700"
                        value={formData.name}
                        onChange={handleNameChange}
                        required
                      />
                    </div>

                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        placeholder="Email Address"
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-700"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-700"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        required
                      />
                    </div>

                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-4 text-gray-400 w-5 h-5" />
                      <textarea
                        placeholder="Your Message"
                        rows={4}
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-700 resize-none"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Send Enquiry
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export default EnquiryFormPage;


// Layout added 
EnquiryFormPage.getLayout = function PageLayout(page: React.ReactNode) {
  return page;
};