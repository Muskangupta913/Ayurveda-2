// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { Calendar, X, Star, Navigation } from 'lucide-react';
import dayjs from 'dayjs';
import CalculatorGames from '../../components/CalculatorGames'
import { useAuth } from '../../context/AuthContext';
import AuthModal from '../../components/AuthModal';

interface DoctorProfile {
  _id: string;
  user: { name: string; email?: string; phone?: string };
  degree?: string;
  address?: string;
  photos?: string[];
  treatments?: Array<{ mainTreatment: string; subTreatments?: Array<{ name: string }> }>;
  experience?: number;
  consultationFee?: number;
  clinicContact?: string;
  location?: { coordinates?: [number, number] };
  timeSlots?: Array<{
    date: string;
    availableSlots: number;
    sessions: { morning: string[]; evening: string[] };
  }>;
}

interface ReviewData {
  averageRating: number;
  totalReviews: number;
  reviews: Array<{
    comment: string;
    userId: { name: string };
  }>;
}

export default function DoctorDetail() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [pendingAction, setPendingAction] = useState<null | { type: 'enquiry' | 'review' }>(null);
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionForm, setPrescriptionForm] = useState({
    healthIssue: '',
    symptoms: ''
  });
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get<{ profile: DoctorProfile }>(`/api/doctor/profile/${id}`);
        setProfile(res.data?.profile ?? null);
      } catch (err) {
        setError('Failed to load doctor');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  useEffect(() => {
    if (!profile?._id) return;
    const fetchReviews = async () => {
      setReviewsLoading(true);
      try {
        const res = await axios.get<{ success: boolean; data: ReviewData }>(`/api/doctor/reviews/${profile._id}`);
        if (res.data?.success) {
          setReviewData(res.data.data);
        } else {
          setReviewData({ averageRating: 0, totalReviews: 0, reviews: [] });
        }
      } catch {
        setReviewData({ averageRating: 0, totalReviews: 0, reviews: [] });
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [profile?._id]);

  const renderStars = (rating: number) => {
    const stars: React.ReactElement[] = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }
    if (hasHalfStar) {
      stars.push(<Star key="half" className="w-4 h-4 fill-yellow-400/50 text-yellow-400" />);
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }
    return stars;
  };

  const handleReviewClick = () => {
    if (!profile) return;
    if (!isAuthenticated) {
      setPendingAction({ type: 'review' });
      setAuthModalMode('login');
      setShowAuthModal(true);
      return;
    }
    const params = new URLSearchParams({ doctorId: profile._id, doctorName: profile.user.name });
    router.push(`/doctor/review-form?${params.toString()}`);
  };

  const handleEnquiryClick = () => {
    if (!profile) return;
    if (!isAuthenticated) {
      setPendingAction({ type: 'enquiry' });
      setAuthModalMode('login');
      setShowAuthModal(true);
      return;
    }
    const params = new URLSearchParams({ doctorId: profile._id, doctorName: profile.user.name, specialization: profile.degree || '' });
    router.push(`/doctor/enquiry-form?${params.toString()}`);
  };

  const handlePrescriptionRequest = () => {
    if (!profile) return;
    if (!isAuthenticated) {
      setPendingAction({ type: 'prescription' });
      setAuthModalMode('login');
      setShowAuthModal(true);
      return;
    }
    setShowPrescriptionModal(true);
  };

  const handlePrescriptionSubmit = async () => {
    if (!prescriptionForm.healthIssue.trim()) {
      alert('Please describe your health issue');
      return;
    }

    setPrescriptionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/prescription/request', {
        doctorId: id,
        healthIssue: prescriptionForm.healthIssue,
        symptoms: prescriptionForm.symptoms
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        alert('Prescription request sent successfully!');
        setShowPrescriptionModal(false);
        setPrescriptionForm({ healthIssue: '', symptoms: '' });
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to send prescription request');
    } finally {
      setPrescriptionLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    if (!profile || !pendingAction) return;
    if (pendingAction.type === 'enquiry') {
      const params = new URLSearchParams({ doctorId: profile._id, doctorName: profile.user.name, specialization: profile.degree || '' });
      router.push(`/doctor/enquiry-form?${params.toString()}`);
    } else if (pendingAction.type === 'review') {
      const params = new URLSearchParams({ doctorId: profile._id, doctorName: profile.user.name });
      router.push(`/doctor/review-form?${params.toString()}`);
    } else if (pendingAction.type === 'prescription') {
      setShowPrescriptionModal(true);
    }
    setPendingAction(null);
  };

  const handleAuthModalClose = () => {
    setShowAuthModal(false);
    setPendingAction(null);
  };

  const capitalizeMonth = (dateStr: string) =>
    dateStr.replace(/\b([a-z])/g, (match, p1, offset) => {
      if (offset > 0 && dateStr[offset - 1] === ' ') return p1.toUpperCase();
      return match;
    });

  const isTodayOrFuture = (dateStr: string) => {
    const parsed = dayjs(capitalizeMonth(dateStr) + ' ' + dayjs().year(), 'DD MMMM YYYY');
    const today = dayjs().startOf('day');
    return parsed.isValid() && (parsed.isSame(today, 'day') || parsed.isAfter(today, 'day'));
  };

  const futureSlots = (profile?.timeSlots || []).filter((ts) => isTodayOrFuture(ts.date));

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error || !profile) return <div className="min-h-screen flex items-center justify-center">{error || 'Not found'}</div>;

  return (
  <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
    <AuthModal isOpen={showAuthModal} onClose={handleAuthModalClose} onSuccess={handleAuthSuccess} initialMode={authModalMode} />
    
    <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header Section with Circular Photo and Info */}
      <div className="bg-gray-50 px-6 py-8 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          {/* Profile Photo - Circular */}
          <div className="flex justify-center lg:justify-start">
            {profile.photos?.[0] ? (
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
                <img 
                  src={profile.photos[0]} 
                  alt={profile.user?.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white shadow-lg bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-lg">No Photo</span>
              </div>
            )}
          </div>

          {/* Doctor Info */}
          <div className="flex-1 text-center lg:text-left text-gray-800">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">{profile.user?.name}</h1>
            {profile.degree && (
              <p className="text-xl font-medium text-[#2D9AA5] mb-3">{profile.degree}</p>
            )}
            {profile.address && (
              <p className="text-gray-600 mb-3">{profile.address}</p>
            )}
            
            {/* Rating */}
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
              {reviewsLoading ? (
                <span className="text-gray-600">Loading rating...</span>
              ) : reviewData && reviewData.totalReviews > 0 ? (
                <>
                  <div className="flex items-center">{renderStars(reviewData.averageRating)}</div>
                  <span className="font-medium text-gray-800">{reviewData.averageRating.toFixed(1)}</span>
                  <span className="text-gray-600">({reviewData.totalReviews} reviews)</span>
                </>
              ) : (
                <span className="text-gray-600">No reviews yet</span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-3">
              {futureSlots.length > 0 && (
                <button
                  onClick={() => setShowCalendarModal(true)}
                  className="inline-flex items-center justify-center px-6 py-3 bg-[#2D9AA5] hover:bg-[#2D9AA5]/90 text-white rounded-lg transition-all font-medium shadow-md"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  View Slots
                </button>
              )}
              <button
                onClick={handleReviewClick}
                className="inline-flex items-center justify-center px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-all font-medium shadow-md"
              >
                Write a Review
              </button>
              <button
                onClick={handlePrescriptionRequest}
                className="inline-flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all font-medium shadow-md"
              >
                Request Prescription
              </button>
              
              {/* Directions Button */}
              {(() => {
                const coords = profile.location?.coordinates;
                const mapsHref = coords && coords.length === 2
                  ? `https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}`
                  : (profile.address ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(profile.address)}` : null);
                return mapsHref ? (
                  <a
                    href={mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all font-medium shadow-md"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Directions
                  </a>
                ) : null;
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Doctor Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Experience, Fee, Contact Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {typeof profile.experience === 'number' && (
                <div className="p-4 bg-gradient-to-br from-[#2D9AA5]/10 to-[#2D9AA5]/5 rounded-lg border border-[#2D9AA5]/20">
                  <h3 className="font-semibold text-gray-800 mb-1">Experience</h3>
                  <p className="text-gray-700 text-lg font-medium">{profile.experience} years</p>
                </div>
              )}
              {typeof profile.consultationFee === 'number' && (
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-25 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-gray-800 mb-1">Consultation Fee</h3>
                  <p className="text-gray-700 text-lg font-medium">AED {profile.consultationFee}</p>
                </div>
              )}
              {profile.clinicContact && (
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-25 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-gray-800 mb-1">Contact</h3>
                  <a href={`tel:${profile.clinicContact}`} className="text-blue-600 hover:underline text-lg font-medium">
                    {profile.clinicContact}
                  </a>
                </div>
              )}
            </div>

            {/* Treatments Section */}
            {profile.treatments && profile.treatments.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-4 text-xl">Treatments & Services</h3>
                <div className="space-y-4">
                  {profile.treatments.map((t, idx) => (
                    <div key={idx} className="p-4 bg-gradient-to-br from-purple-50 to-purple-25 border border-purple-200 rounded-lg">
                      <div className="mb-3">
                        <span className="px-4 py-2 rounded-full bg-purple-600 text-white text-sm font-medium inline-block">
                          {t.mainTreatment}
                        </span>
                      </div>
                      {t.subTreatments && t.subTreatments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {t.subTreatments.map((s, i) => (
                            <span key={i} className="px-3 py-1 rounded-full bg-white text-purple-700 text-xs border border-purple-300 shadow-sm">
                              {s.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Slots Section */}
            {futureSlots.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-4 text-xl">Available Appointments</h3>
                <div className="space-y-4">
                  {futureSlots.map((slot, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-gradient-to-br from-gray-50 to-white">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 text-lg">{slot.date}</h4>
                        <span className="text-sm font-medium text-[#2D9AA5] bg-[#2D9AA5]/10 px-3 py-1 rounded-full border border-[#2D9AA5]/20">
                          {slot.availableSlots} slots available
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {slot.sessions?.morning?.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Morning Sessions</h5>
                            <div className="flex flex-wrap gap-2">
                              {slot.sessions.morning.map((t, i) => (
                                <button key={i} className="px-3 py-2 bg-white text-gray-800 rounded-lg text-sm border border-gray-200 hover:border-[#2D9AA5] hover:text-[#2D9AA5] transition shadow-sm">
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {slot.sessions?.evening?.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Evening Sessions</h5>
                            <div className="flex flex-wrap gap-2">
                              {slot.sessions.evening.map((t, i) => (
                                <button key={i} className="px-3 py-2 bg-white text-gray-800 rounded-lg text-sm border border-gray-200 hover:border-[#2D9AA5] hover:text-[#2D9AA5] transition shadow-sm">
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Reviews */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800 text-xl">Recent Reviews</h3>
                  {reviewData && reviewData.reviews.length > 0 && (
                    <button
                      className="text-sm text-[#2D9AA5] hover:text-[#2D9AA5]/80 font-medium"
                      onClick={() => setShowReviews((v) => !v)}
                    >
                      {showReviews ? 'Hide' : 'Show All'}
                    </button>
                  )}
                </div>
                
                {reviewsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2D9AA5] mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading reviews...</p>
                  </div>
                ) : reviewData && reviewData.reviews.length > 0 ? (
                  showReviews && (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {reviewData.reviews.slice(0, 6).map((r, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-[#2D9AA5] rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {r.userId.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-800 mb-2 leading-relaxed">"{r.comment}"</p>
                              <p className="text-xs text-gray-500 font-medium">- {r.userId.name}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-gray-400 text-2xl">💬</span>
                    </div>
                    <p className="text-gray-500">No reviews yet</p>
                    <p className="text-gray-400 text-sm mt-1">Be the first to leave a review!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Appointment Modal */}
    {showCalendarModal && futureSlots.length > 0 && (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col">
          <div className="sticky top-0 bg-gradient-to-r from-[#2D9AA5] to-[#2D9AA5]/90 text-white p-6 flex items-center justify-between">
            <h3 className="text-xl font-semibold">Available Appointments</h3>
            <button 
              onClick={() => setShowCalendarModal(false)} 
              className="p-2 hover:bg-white/20 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto">
            <div className="space-y-6">
              {futureSlots.map((slot, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl p-5 bg-gradient-to-br from-gray-50 to-white shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 text-lg">{slot.date}</h4>
                    <span className="text-sm font-medium text-[#2D9AA5] bg-[#2D9AA5]/10 px-4 py-2 rounded-full border border-[#2D9AA5]/20">
                      {slot.availableSlots} slots available
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {slot.sessions?.morning?.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                          <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                          Morning Sessions
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {slot.sessions.morning.map((t, i) => (
                            <button key={i} className="px-4 py-2 bg-white text-gray-800 rounded-lg text-sm border border-gray-200 hover:border-[#2D9AA5] hover:text-[#2D9AA5] hover:bg-[#2D9AA5]/5 transition shadow-sm">
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {slot.sessions?.evening?.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                          <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                          Evening Sessions
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {slot.sessions.evening.map((t, i) => (
                            <button key={i} className="px-4 py-2 bg-white text-gray-800 rounded-lg text-sm border border-gray-200 hover:border-[#2D9AA5] hover:text-[#2D9AA5] hover:bg-[#2D9AA5]/5 transition shadow-sm">
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Prescription Request Modal */}
    {showPrescriptionModal && (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col">
          <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white p-6 flex items-center justify-between">
            <h3 className="text-xl font-semibold">Request Prescription</h3>
            <button 
              onClick={() => setShowPrescriptionModal(false)} 
              className="p-2 hover:bg-white/20 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Health Issue *
                </label>
                <textarea
                  value={prescriptionForm.healthIssue}
                  onChange={(e) => setPrescriptionForm(prev => ({ ...prev, healthIssue: e.target.value }))}
                  placeholder="Describe your health issue in detail..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symptoms (Optional)
                </label>
                <textarea
                  value={prescriptionForm.symptoms}
                  onChange={(e) => setPrescriptionForm(prev => ({ ...prev, symptoms: e.target.value }))}
                  placeholder="Describe any symptoms you're experiencing..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handlePrescriptionSubmit}
                  disabled={prescriptionLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                >
                  {prescriptionLoading ? 'Sending...' : 'Send Request'}
                </button>
                <button
                  onClick={() => setShowPrescriptionModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
}