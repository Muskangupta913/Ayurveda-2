import React from "react";

import { useEffect, useState } from "react";
import { Search, Star, Filter, Calendar, User, TrendingUp, MessageSquare } from "lucide-react";
import ClinicLayout from '../../components/ClinicLayout';
import withClinicAuth from '../../components/withClinicAuth';
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
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 30;
  const [showModal, setShowModal] = useState(false);
  const [modalComment, setModalComment] = useState("");

  // Pagination logic
  const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * reviewsPerPage,
    currentPage * reviewsPerPage
  );
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

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

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
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
      <div className="w-full p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-gray-200 rounded-full animate-spin mx-auto" style={{ borderTopColor: '#2D9AA5' }}></div>
          <p className="text-gray-500 mt-3 animate-pulse">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-auto bg-gradient-to-br from-slate-50 to-white min-h-screen">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-teal-100 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-[#2D9AA5] to-[#238892] rounded-lg flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-[#2D9AA5] to-[#238892] bg-clip-text text-transparent">
            Health Center Reviews
          </h1>
        </div>
        <p className="text-gray-600 ml-13">
          Monitor and manage your patient feedback
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Stats */}
      {reviews.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Reviews */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm p-5 border border-teal-100 hover:shadow-md transition-all duration-300 hover:border-[#2D9AA5]/30 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <MessageSquare className="w-6 h-6 text-[#2D9AA5]" />
              <div className="w-8 h-8 bg-gradient-to-br from-[#2D9AA5]/10 to-[#2D9AA5]/20 rounded-lg"></div>
            </div>
            <p className="text-sm text-gray-500 font-medium">Total Reviews</p>
            <p className="text-2xl font-bold text-gray-900">{reviews.length}</p>
          </div>
          {/* Average */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm p-5 border border-teal-100 hover:shadow-md transition-all duration-300 hover:border-[#2D9AA5]/30 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <Star className="w-6 h-6 text-yellow-500" />
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400/10 to-yellow-500/20 rounded-lg"></div>
            </div>
            <p className="text-sm text-gray-500 font-medium">Average Rating</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-gray-900">{getAverageRating()}</p>
              <div className="flex">
                {renderStars(Math.round(parseFloat(getAverageRating())))}
              </div>
            </div>
          </div>
          {/* 5 Star */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm p-5 border border-teal-100 hover:shadow-md transition-all duration-300 hover:border-[#2D9AA5]/30 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <div className="w-8 h-8 bg-gradient-to-br from-green-500/10 to-green-600/20 rounded-lg"></div>
            </div>
            <p className="text-sm text-gray-500 font-medium">5 Star Reviews</p>
            <p className="text-2xl font-bold text-gray-900">{stats[5] || 0}</p>
          </div>
          {/* This Month */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm p-5 border border-teal-100 hover:shadow-md transition-all duration-300 hover:border-[#2D9AA5]/30 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <Calendar className="w-6 h-6 text-purple-600" />
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500/10 to-purple-600/20 rounded-lg"></div>
            </div>
            <p className="text-sm text-gray-500 font-medium">This Month</p>
            <p className="text-2xl font-bold text-gray-900">
              {
                reviews.filter((r) => {
                  const d = new Date(r.createdAt);
                  const now = new Date();
                  return (
                    d.getMonth() === now.getMonth() &&
                    d.getFullYear() === now.getFullYear()
                  );
                }).length
              }
            </p>
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-teal-100 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-full">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-[#2D9AA5]" />
          <input
            type="text"
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-gray-900 w-full pl-10 pr-4 py-2.5 border border-teal-200 rounded-lg text-sm focus:ring-2 focus:ring-[#2D9AA5]/20 focus:border-[#2D9AA5] transition-all duration-200 bg-white/70"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-5 h-5 text-[#2D9AA5]" />
          <select
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            className="text-gray-900 border border-teal-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2D9AA5]/20 focus:border-[#2D9AA5] w-full sm:w-auto bg-white/70 transition-all duration-200"
          >
            <option value="all">All Ratings</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {r} Stars
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reviews */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-sm border border-teal-100 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#2D9AA5]/10 to-[#2D9AA5]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-[#2D9AA5]" />
          </div>
          <p className="text-gray-600 font-medium">No reviews found</p>
          <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full max-w-full overflow-x-hidden">
          {paginatedReviews.map((r) => (
            <div
              key={r._id}
              className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-teal-100 p-4 hover:shadow-lg transition-all duration-300 hover:border-[#2D9AA5]/30 hover:-translate-y-1 w-full h-36 flex flex-col justify-between group"
            >
              {/* User name and rating */}
              <div className="flex items-center justify-between w-full mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#2D9AA5] to-[#238892] rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <p className="font-semibold text-gray-800 truncate text-sm">
                    {r.userId?.name || "Anonymous"}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <div className="flex">
                    {renderStars(r.rating)}
                  </div>
                  <span className="ml-1 text-xs font-bold text-[#2D9AA5]">
                    {r.rating}/5
                  </span>
                </div>
              </div>
              
              {/* Date */}
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-3 h-3 text-gray-400" />
                <p className="text-xs text-gray-500 font-medium">
                  {formatDate(r.createdAt)}
                </p>
              </div>

              {/* Read Comment button */}
              <div className="mt-auto">
                {r.comment ? (
                  <button
                    className="w-full bg-gradient-to-r from-[#2D9AA5] to-[#238892] text-white text-xs font-medium py-2 px-3 rounded-lg hover:shadow-md transition-all duration-200 hover:from-[#238892] hover:to-[#1e7680] group-hover:shadow-lg"
                    onClick={() => {
                      setModalComment(r.comment || "");
                      setShowModal(true);
                    }}
                  >
                    Read Comment
                  </button>
                ) : (
                  <div className="w-full bg-gray-100 text-gray-400 text-xs font-medium py-2 px-3 rounded-lg text-center">
                    No comment
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              className="px-4 py-2 rounded-lg border border-teal-200 bg-white/90 text-gray-700 disabled:opacity-50 hover:bg-[#2D9AA5] hover:text-white hover:border-[#2D9AA5] transition-all duration-200 font-medium"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={`px-4 py-2 rounded-lg border font-medium transition-all duration-200 ${
                  currentPage === i + 1 
                    ? 'bg-gradient-to-r from-[#2D9AA5] to-[#238892] text-white border-[#2D9AA5] shadow-md' 
                    : 'bg-white/90 text-gray-700 border-teal-200 hover:bg-[#2D9AA5] hover:text-white hover:border-[#2D9AA5]'
                }`}
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="px-4 py-2 rounded-lg border border-teal-200 bg-white/90 text-gray-700 disabled:opacity-50 hover:bg-[#2D9AA5] hover:text-white hover:border-[#2D9AA5] transition-all duration-200 font-medium"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
        
        {/* Enhanced Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/20">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-2xl w-full mx-4 border border-teal-200">
              <div className="p-6 border-b border-teal-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#2D9AA5] to-[#238892] rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Full Comment</h3>
                  </div>
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                    onClick={() => setShowModal(false)}
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="text-gray-700 break-words whitespace-pre-line max-h-96 overflow-y-auto leading-relaxed bg-gray-50/50 rounded-lg p-4 border border-gray-200">
                  {modalComment}
                </div>
              </div>
            </div>
          </div>
        )}
        </>
      )}
    </div>
  );
}

ClinicReviews.getLayout = function PageLayout(page: React.ReactNode) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

// ✅ Apply HOC and assign correct type
const ProtectedDashboard: NextPageWithLayout = withClinicAuth(ClinicReviews);

// ✅ Reassign layout (TS-safe now)
ProtectedDashboard.getLayout = ClinicReviews.getLayout;

export default ProtectedDashboard;