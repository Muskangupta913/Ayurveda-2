import React from "react";

import { useEffect, useState } from "react";
import { Search, Star, Filter, Calendar, User, TrendingUp, MessageSquare } from "lucide-react";
import ClinicLayout from '../../components/ClinicLayout';
import withAdminAuth from '../../components/withClinicAuth';
import type { NextPageWithLayout } from '../_app'

// TypeScript interfaces
interface User {
  name?: string;
  _id?: string;
}

interface Review {
  _id: string;
  userId?: User;
  rating: number;
  comment?: string;
  createdAt: string;
}

interface ApiResponse {
  success: boolean;
  reviews: Review[];
  message?: string;
}

interface RatingStats {
  [key: number]: number;
}

function ClinicReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedRating, setSelectedRating] = useState<string>("all");

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const token =
          localStorage.getItem("clinicToken") ||
          sessionStorage.getItem("clinicToken");

        if (!token) {
          setError("No authentication token found");
          return;
        }

        const response = await fetch("/api/clinics/getReview", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data: ApiResponse = await response.json();

        if (data.success) {
          setReviews(data.reviews || []);
          setFilteredReviews(data.reviews || []);
        } else {
          setError("Failed to fetch reviews");
        }
      } catch (error: unknown) {
        console.error(error);
        const err = error as { response?: { data?: { message?: string } }, message?: string };
        setError(
          err?.response?.data?.message || err?.message || "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  useEffect(() => {
    let filtered = reviews;

    // Filter by rating
    if (selectedRating !== "all") {
      filtered = filtered.filter(
        (review) => review.rating === parseInt(selectedRating)
      );
    }

    // Filter by search term - Fixed the error by adding null checks
    if (searchTerm) {
      filtered = filtered.filter((review) => {
        const comment = review.comment || "";
        const userName = review.userId?.name || "Anonymous";

        return (
          comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
          userName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    setFilteredReviews(filtered);
  }, [reviews, searchTerm, selectedRating]);

  const getRatingStats = (): RatingStats => {
    const stats: RatingStats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5) {
        stats[review.rating] = (stats[review.rating] || 0) + 1;
      }
    });
    return stats;
  };

  const getAverageRating = (): string => {
    if (reviews.length === 0) return "0.0";
    const total = reviews.reduce(
      (sum, review) => sum + (review.rating || 0),
      0
    );
    return (total / reviews.length).toFixed(1);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${index < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
      />
    ));
  };

  const getRatingColor = (rating: number): string => {
    if (rating >= 4) return "text-green-600 bg-green-50 border-green-200";
    if (rating >= 3) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

  const stats = getRatingStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white p-6 rounded-xl shadow-sm border"
                >
                  <div className="h-8 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white p-6 rounded-xl shadow-sm border"
                >
                  <div className="h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Clinic Reviews
              </h1>
              <p className="text-gray-600 mt-1">
                Monitor and manage your patient feedback
              </p>
            </div>
          </div>
        </div>

        {error ? (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-6 mb-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-bold">!</span>
              </div>
              <div>
                <h3 className="font-semibold text-red-800">
                  Error Loading Reviews
                </h3>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            {reviews.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-gray-900">
                        {reviews.length}
                      </div>
                      <div className="text-gray-600 font-medium">
                        Total Reviews
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-gray-900">
                        {getAverageRating()}
                      </div>
                      <div className="flex items-center mt-1 mb-2">
                        {renderStars(
                          Math.round(parseFloat(getAverageRating()))
                        )}
                      </div>
                      <div className="text-gray-600 font-medium">
                        Average Rating
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Star className="w-6 h-6 text-yellow-600 fill-current" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-gray-600 font-medium">
                      Rating Distribution
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center text-sm">
                        <span className="w-3 text-gray-900 font-medium">
                          {rating}
                        </span>
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mx-2" />
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mx-2">
                          <div
                            className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${reviews.length
                                  ? (stats[rating] / reviews.length) * 100
                                  : 0
                                }%`,
                            }}
                          ></div>
                        </div>
                        <span className="w-8 text-gray-600 text-right">
                          {stats[rating]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Search and Filter Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search Bar */}
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search reviews, patient names..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-gray-50 hover:bg-white transition-colors duration-200"
                  />
                </div>

                {/* Rating Filter */}
                <div className="flex items-center gap-3">
                  <Filter className="text-gray-400 w-5 h-5" />
                  <select
                    value={selectedRating}
                    onChange={(e) => setSelectedRating(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-gray-50 hover:bg-white transition-colors duration-200 min-w-[140px]"
                  >
                    <option value="all">All Ratings</option>
                    <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                    <option value="4">⭐⭐⭐⭐ (4)</option>
                    <option value="3">⭐⭐⭐ (3)</option>
                    <option value="2">⭐⭐ (2)</option>
                    <option value="1">⭐ (1)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            {filteredReviews.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 md:p-12 text-center mx-2 sm:mx-4 md:mx-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <User className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 px-2">
                  {reviews.length === 0 ? "No Reviews Yet" : "No Reviews Found"}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 max-w-xs sm:max-w-md mx-auto px-2 leading-relaxed">
                  {reviews.length === 0
                    ? "Your clinic hasn't received any reviews yet. Encourage your patients to share their feedback!"
                    : "Try adjusting your search terms or filter criteria to find specific reviews."}
                </p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6 px-2 sm:px-4 md:px-0">
                {filteredReviews.map((review) => (
                  <div
                    key={review._id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 hover:shadow-md hover:border-gray-200 transition-all duration-200 mx-1 sm:mx-0"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 space-y-2 sm:space-y-0">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                            {review.userId?.name || "Anonymous Patient"}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <div className="flex">
                              {renderStars(review.rating)}
                            </div>
                            <span
                              className={`px-2 py-1 rounded-md text-xs font-medium border ${getRatingColor(
                                review.rating
                              )}`}
                            >
                              {review.rating}/5
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center text-xs sm:text-sm text-gray-500 flex-shrink-0 ml-10 sm:ml-0">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        <span className="whitespace-nowrap">{formatDate(review.createdAt)}</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                      <p className="text-gray-900 leading-relaxed text-xs sm:text-sm break-words">
                        {review.comment || "No comment provided."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

ClinicReviews.getLayout = function PageLayout(page: React.ReactNode) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

// ✅ Apply HOC and assign correct type
const ProtectedDashboard: NextPageWithLayout = withAdminAuth(ClinicReviews);

// ✅ Reassign layout (TS-safe now)
ProtectedDashboard.getLayout = ClinicReviews.getLayout;

export default ProtectedDashboard;
