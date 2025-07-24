// pages/doctor/review-form.js
"use client";

import React, { useState} from "react";
import { useRouter } from "next/router";
import { Star, MessageSquare, User, ArrowLeft, Send, CheckCircle, Heart } from "lucide-react";

function DoctorReviewForm() {
  const router = useRouter();
  const { doctorId, doctorName } = router.query as { doctorId?: string; doctorName?: string };
  
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showEmojiAnimation, setShowEmojiAnimation] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      
      if (!token) {
        setError("Authentication required. Please log in.");
        return;
      }

      const response = await fetch("/api/doctor/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctorId,
          rating,
          comment: comment.trim(),
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.back();
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.message || "Failed to submit review");
      }
    } catch (err) {
      console.error("Review submission error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getRatingEmoji = (rating: number): string => {
    const emojis: { [key: number]: string } = {
      1: "😞",
      2: "😐", 
      3: "🙂",
      4: "😊",
      5: "🤩"
    };
    return emojis[rating] || "";
  };

  const getRatingText = (rating: number): string => {
    const texts: { [key: number]: string } = {
      1: "Poor",
      2: "Fair", 
      3: "Good",
      4: "Very Good",
      5: "Excellent"
    };
    return texts[rating] || "";
  };

  const getRatingColor = (rating: number): string => {
    const colors: { [key: number]: string } = {
      1: "text-red-500",
      2: "text-orange-500",
      3: "text-yellow-500",
      4: "text-green-500",
      5: "text-emerald-500"
    };
    return colors[rating] || "text-gray-500";
  };

  const handleStarClick = (starValue: number) => {
    setRating(starValue);
    setShowEmojiAnimation(true);
    setTimeout(() => setShowEmojiAnimation(false), 600);
  };

  const renderStars = (): React.ReactNode[] => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const isActive = starValue <= (hoverRating || rating);
      
      return (
        <button
          key={index}
          type="button"
          className={`relative w-10 h-10 transition-all duration-300 transform hover:scale-125 ${
            isActive
              ? "text-yellow-400 drop-shadow-lg"
              : "text-gray-300 hover:text-yellow-200"
          }`}
          onClick={() => handleStarClick(starValue)}
          onMouseEnter={() => setHoverRating(starValue)}
          onMouseLeave={() => setHoverRating(0)}
        >
          <Star 
            className={`w-full h-full fill-current transition-all duration-300 ${
              isActive ? "animate-pulse" : ""
            }`} 
          />
          {isActive && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
          )}
        </button>
      );
    });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-100 rounded-full translate-y-12 -translate-x-12 opacity-30"></div>
            
            <div className="relative z-10">
              <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Review Submitted!</h2>
              <p className="text-gray-600 mb-6 text-lg">
                Thank you for your feedback. Your review has been successfully submitted.
              </p>
              <div className="text-sm text-gray-500">
                Redirecting you back...
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-all duration-200 hover:translate-x-1"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Write a Review
              </h1>
              <p className="text-gray-600 mt-2 text-lg">Share your experience with Dr. {doctorName}</p>
            </div>
          </div>
        </div>

        {/* Review Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 relative overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full -translate-y-20 translate-x-20 opacity-50"></div>
          
          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            {/* Doctor Info */}
            <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center shadow-md">
                <User className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Dr. {doctorName}</h3>
                <p className="text-gray-600">Healthcare Provider</p>
              </div>
            </div>

            {/* Rating Section */}
            <div className="text-center bg-gray-50 rounded-xl p-8">
              <label className="block text-lg font-medium text-gray-700 mb-6">
                Rate your experience
              </label>
              
              <div className="flex justify-center gap-3 mb-6">
                {renderStars()}
              </div>
              
              {/* Emoji and Rating Display */}
              <div className="flex items-center justify-center gap-4 mb-4">
                {(hoverRating || rating) > 0 && (
                  <>
                    <div className={`text-3xl transition-all duration-300 ${
                      showEmojiAnimation ? 'animate-bounce scale-125' : ''
                    }`}>
                      {getRatingEmoji(hoverRating || rating)}
                    </div>
                    <div className="text-center">
                      <p className={`text-2xl font-bold transition-colors duration-300 ${
                        getRatingColor(hoverRating || rating)
                      }`}>
                        {getRatingText(hoverRating || rating)}
                      </p>
                      <p className="text-gray-600 text-lg">
                        ({hoverRating || rating}/5)
                      </p>
                    </div>
                  </>
                )}
              </div>
              
              {/* Rating feedback text */}
              {rating > 0 && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">
                    {rating <= 2 && "We're sorry to hear about your experience. Your feedback helps us improve."}
                    {rating === 3 && "Thank you for your feedback. We appreciate your honest review."}
                    {rating >= 4 && "We're delighted to hear about your positive experience!"}
                  </p>
                </div>
              )}
            </div>

            {/* Comment Section */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-4">
                Share your thoughts (optional)
              </label>
              <div className="relative">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="text-gray-700 w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 hover:border-gray-300 placeholder-black"
                  placeholder="Tell us about your experience with this doctor..."
                  maxLength={500}
                />
                <div className="absolute bottom-3 right-3">
                  <Heart className="w-4 h-4 text-gray-300" />
                </div>
              </div>
              <div className="flex justify-between text-sm text-gray-500 mt-3">
                <span>Your feedback helps other patients make informed decisions</span>
                <span className={`font-medium ${comment.length > 450 ? 'text-orange-500' : ''}`}>
                  {comment.length}/500
                </span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 animate-pulse">
                <p className="text-red-600 font-medium">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 shadow-lg ${
                loading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:shadow-xl"
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Submit Review</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

DoctorReviewForm.getLayout = function PageLayout(page: React.ReactNode) {
  return page;
};



export default DoctorReviewForm;