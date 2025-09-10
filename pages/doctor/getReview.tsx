// pages/doctor/reviews.js
"use client";

import { useEffect, useState } from "react";
import { Search, Star, Filter, Calendar, User, TrendingUp, MessageSquare } from "lucide-react";
import DoctorLayout from '../../components/DoctorLayout'; // Assuming you have a DoctorLayout component
import withDoctorAuth from '../../components/withDoctorAuth';
import type { NextPageWithLayout } from '../_app';


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

function DoctorReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedRating, setSelectedRating] = useState<string>("all");

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const token = localStorage.getItem("doctorToken") || sessionStorage.getItem("doctorToken");

        if (!token) {
          setError("No authentication token found");
          return;
        }

        const response = await fetch("/api/doctor/getReviews", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data: ApiResponse = await response.json();
        console.log(data);

        if (data.success) {
          setReviews(data.reviews || []);
          setFilteredReviews(data.reviews || []);
        } else {
          setError("Failed to fetch reviews");
        }
      } catch (err: unknown) {
        console.error(err);
        if (err && typeof err === 'object' && 'response' in err) {
          // @ts-expect-error: err.response may not be typed
          setError(err.response?.data?.message || err.message || "Something went wrong");
        } else {
          setError("Something went wrong");
        }
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
      filtered = filtered.filter(review => review.rating === parseInt(selectedRating));
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(review => {
        const comment = review.comment || "";
        const userName = review.userId?.name || "Anonymous";

        return comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
          userName.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    setFilteredReviews(filtered);
  }, [reviews, searchTerm, selectedRating]);

  const getRatingStats = (): RatingStats => {
    const stats: RatingStats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        stats[review.rating] = (stats[review.rating] || 0) + 1;
      }
    });
    return stats;
  };

  const getAverageRating = (): string => {
    if (reviews.length === 0) return "0.0";
    const total = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
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
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm border">
                  <div className="h-8 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm border">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
              Patient Reviews
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Monitor and manage your patient feedback
            </p>
          </div>
        </div>

        {/* Error State */}
        {error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg shadow-sm">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  <strong>Error:</strong> {error}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            {reviews.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
                {/* Total Reviews */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-4 sm:p-6 border border-white/20 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-[#2D9AA5] to-[#238B94] rounded-xl flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-medium text-slate-500">Total Reviews</p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800">{reviews.length}</p>
                    </div>
                  </div>
                </div>

                {/* Average Rating */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-4 sm:p-6 border border-white/20 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Icon */}
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center">
                      <Star className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-500 mb-1">Average Rating</p>

                      {/* Number + stars in one line, responsive */}
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-800">
                          {getAverageRating()}
                        </p>
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          {renderStars(Math.round(parseFloat(getAverageRating())))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>


                {/* 5 Star Reviews */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-4 sm:p-6 border border-white/20 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-medium text-slate-500">5 Star Reviews</p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800">{stats[5] || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Recent Reviews */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-4 sm:p-6 border border-white/20 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-500 rounded-xl flex items-center justify-center">
                      <Calendar className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-medium text-slate-500">This Month</p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800">
                        {reviews.filter(r => {
                          const reviewDate = new Date(r.createdAt);
                          const currentDate = new Date();
                          return (
                            reviewDate.getMonth() === currentDate.getMonth() &&
                            reviewDate.getFullYear() === currentDate.getFullYear()
                          );
                        }).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}


            {/* Search and Filter */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/20 p-4 sm:p-6 mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
                {/* Search */}
                <div className="flex-1 max-w-full sm:max-w-md">
                  <div className="relative">
                    <Search className="absolute inset-y-0 left-0 pl-3 h-full w-4 sm:w-5 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search reviews..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="text-slate-800 block w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2D9AA5]/20 focus:border-[#2D9AA5] text-sm transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    />
                  </div>
                </div>

                {/* Filter */}
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <Filter className="w-4 sm:w-5 h-4 sm:h-5 text-slate-400 flex-shrink-0" />
                  <select
                    value={selectedRating}
                    onChange={(e) => setSelectedRating(e.target.value)}
                    className="text-slate-800 border border-slate-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm focus:ring-2 focus:ring-[#2D9AA5]/20 focus:border-[#2D9AA5] transition-all duration-200 bg-white/50 backdrop-blur-sm flex-1 sm:flex-none min-w-0"
                  >
                    <option value="all">All Ratings</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Reviews List */}
            {filteredReviews.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/20 p-8 sm:p-12 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <User className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">
                  {reviews.length === 0 ? "No reviews yet" : "No reviews found"}
                </h3>
                <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto">
                  {reviews.length === 0
                    ? "Your patients haven't left any reviews yet."
                    : "Try adjusting your search or filter criteria."}
                </p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {filteredReviews.map((review) => (
                  <div key={review._id} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/20 p-4 sm:p-6 hover:shadow-lg hover:bg-white/90 transition-all duration-300">
                    <div className="flex flex-col">
                      {/* Review Header */}
                      <div className="flex items-start space-x-3 sm:space-x-4 mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#2D9AA5] to-[#238B94] rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                            <h4 className="text-base sm:text-lg font-semibold text-slate-800 truncate mb-1 sm:mb-0">
                              {review.userId?.name || "Anonymous Patient"}
                            </h4>
                            <div className="flex items-center">
                              <div className="flex mr-2">
                                {renderStars(review.rating)}
                              </div>
                              <span className="text-sm text-slate-600 font-medium">
                                {review.rating}/5
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center text-xs sm:text-sm text-slate-500">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                            <span className="truncate">{formatDate(review.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Review Content */}
                      {review.comment && (
                        <div className="pl-13 sm:pl-16">
                          <div className="bg-slate-50/80 rounded-lg p-3 sm:p-4 border-l-4 border-[#2D9AA5]">
                            <p className="text-slate-700 leading-relaxed text-sm sm:text-base">
                              {review.comment}
                            </p>
                          </div>
                        </div>
                      )}
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



DoctorReviews.getLayout = function PageLayout(page: React.ReactNode) {
  return <DoctorLayout>{page}</DoctorLayout>;
};

const ProtectedDashboard: NextPageWithLayout = withDoctorAuth(DoctorReviews);

// Reassign layout (TS-safe now)
ProtectedDashboard.getLayout = DoctorReviews.getLayout;

export default ProtectedDashboard;