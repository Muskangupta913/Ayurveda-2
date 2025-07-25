import { useState } from 'react';
import { Star, MessageCircle, CheckCircle, Sparkles } from 'lucide-react';
import { useRouter } from 'next/router';
import axios from 'axios';


interface StarIconProps {
  filled: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  index: number;
}

interface RatingInfo {
  text: string;
  color: string;
  emoji: string;
}

function ReviewForm() {
  const [rating, setRating] = useState<number>(5);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const router = useRouter();
  const { clinicId, clinicName } = router.query;

  // Mock data for demo
  // const displayName = (clinicName as string) || "HealthCare Plus Medical Center";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        alert('Please login to submit a review');
        return;
      }

      const response = await axios.post(
        '/api/clinics/giveReview',
        {
          clinicId,
          rating,
          ...(comment.trim() ? { comment: comment.trim() } : {})
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('Review submitted:', response.data);
      setSubmitted(true);
      setTimeout(() => router.push('/'), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const StarIcon: React.FC<Omit<StarIconProps, 'index'>> = ({ filled, onClick, onMouseEnter, onMouseLeave }) => (
    <div
      className={`relative cursor-pointer transition-all duration-300 transform hover:scale-110 ${filled ? 'text-yellow-400' : 'text-gray-300'
        }`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Star
        className={`w-10 h-10 transition-all duration-300 ${filled ? 'fill-current drop-shadow-lg' : 'hover:text-yellow-300'
          }`}
      />
      {filled && (
        <div className="absolute inset-0 animate-pulse">
          <Star className="w-10 h-10 text-yellow-200 fill-current opacity-50" />
        </div>
      )}
    </div>
  );

  const getRatingText = (rating: number): RatingInfo => {
    const ratingTexts: Record<number, RatingInfo> = {
      1: { text: 'Poor', color: 'text-red-600 bg-red-50 border-red-200', emoji: '😞' },
      2: { text: 'Fair', color: 'text-orange-600 bg-orange-50 border-orange-200', emoji: '😐' },
      3: { text: 'Good', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', emoji: '🙂' },
      4: { text: 'Very Good', color: 'text-green-600 bg-green-50 border-green-200', emoji: '😊' },
      5: { text: 'Excellent', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', emoji: '🤩' }
    };
    return ratingTexts[rating] || ratingTexts[5];
  };

  const currentRating = getRatingText(hoveredRating || rating);

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center animate-bounce-in">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-black text-2xl font-bold text-black-800 mb-4">Thank You! 🎉</h2>
          <p className="text-gray-600 mb-6">Your review has been submitted successfully and will help others make informed decisions.</p>
          <div className="flex items-center justify-center space-x-1 text-yellow-400 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className={`w-6 h-6 ${star <= rating ? 'fill-current' : ''}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header Card */}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 transform ">
            <div className="text-center">
              {/* <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Heart className="w-10 h-10 text-white animate-pulse" />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full animate-ping opacity-20"></div>
              </div> */}
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Share Your Experience
              </h1>
              <p className="text-gray-600 text-lg">
                Help others by reviewing{' '}
                <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {clinicName}
                </span>
              </p>
              <div className="flex items-center justify-center mt-4 space-x-2">
                <Sparkles className="w-5 h-5 text-yellow-400 animate-spin" />
                <span className="text-sm text-gray-500">Your opinion matters</span>
                <Sparkles className="w-5 h-5 text-yellow-400 animate-spin" />
              </div>
            </div>
          </div>

          {/* Review Form Card */}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 md:p-10">
            <div className="space-y-10">
              {/* Star Rating Section */}
              <div className="text-center">
                <label className="block text-2xl font-bold text-gray-800 mb-6 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 mr-3 text-blue-600" />
                  How would you rate your experience?
                </label>

                <div className="flex justify-center space-x-2 mb-4 transform scale-75">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      filled={star <= (hoveredRating || rating)}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                    />
                  ))}
                </div>

                <div className="flex justify-center">
                  <div
                    className={`inline-flex items-center px-4 py-2 rounded-full border-2 transition-all duration-300 ${currentRating.color}`}
                  >
                    <span className="text-sm mr-2">{currentRating.emoji}</span>
                    <span className="font-medium text-sm">
                      {currentRating.text} ({hoveredRating || rating}/5)
                    </span>
                  </div>
                </div>
              </div>

              {/* Comment Section */}
              <div className="space-y-4">
                <label className="block text-xl font-bold text-gray-800 flex items-center">
                  <MessageCircle className="w-5 h-5 mr-3 text-purple-600" />
                  Tell us about your experience
                </label>
                <div className="relative">
                  <textarea
                    maxLength={500}
                    value={comment}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
                    className="text-black w-full p-6 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all duration-300 resize-none bg-gray-50/50 backdrop-blur-sm hover:bg-white/70 text-lg"
                    rows={6}
                    placeholder="Share details about your visit, the staff, facilities, or any other feedback that could help others..."
                  />
                  <div className="absolute bottom-4 right-4 text-sm text-gray-400">
                    {comment.length}/500
                  </div>
                </div>
                <p className="text-sm text-gray-600 flex items-center">
                  <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span>
                  Your review helps others make informed decisions
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)}
                  className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg relative overflow-hidden"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                      Submitting...
                    </div>
                  ) : (
                    <>
                      <span className="relative z-10">Submit Review</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Info Card */}
          {/* <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200/50 rounded-2xl p-6 mt-8 backdrop-blur-sm">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-blue-800 leading-relaxed">
                  <span className="font-bold text-lg">Your review matters!</span>
                  <br />
                  It helps other patients make informed decisions and helps healthcare providers improve their services. Every review contributes to building a better healthcare community.
                </p>
              </div>
            </div>
          </div> */}
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}

export default ReviewForm;



ReviewForm.getLayout = function PageLayout(page: React.ReactNode) {
  return page;
};

