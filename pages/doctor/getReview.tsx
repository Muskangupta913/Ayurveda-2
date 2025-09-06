"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Star,
  Filter,
  Calendar,
  User,
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import DoctorLayout from "../../components/DoctorLayout";
import withDoctorAuth from "../../components/withDoctorAuth";
import type { NextPageWithLayout } from "../_app";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRating, setSelectedRating] = useState("all");

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const token =
          localStorage.getItem("doctorToken") ||
          sessionStorage.getItem("doctorToken");

        if (!token) {
          setError("No authentication token found");
          return;
        }

        const response = await fetch("/api/doctor/getReviews", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data: ApiResponse = await response.json();

        if (data.success) {
          setReviews(data.reviews || []);
          setFilteredReviews(data.reviews || []);
        } else {
          setError("Failed to fetch reviews");
        }
      } catch (err) {
        console.error(err);
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  useEffect(() => {
    let filtered = reviews;

    if (selectedRating !== "all") {
      filtered = filtered.filter(
        (review) => review.rating === parseInt(selectedRating)
      );
    }

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

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300"
        }`}
      />
    ));

  const formatDate = (dateString: string) => {
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
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <p className="text-gray-500">Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          Patient Reviews
        </h1>
        <p className="text-gray-600">
          Monitor and manage your patient feedback
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Stats */}
      {reviews.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Reviews */}
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <MessageSquare className="w-6 h-6 text-blue-600 mb-2" />
            <p className="text-sm text-gray-500">Total Reviews</p>
            <p className="text-xl font-semibold">{reviews.length}</p>
          </div>

          {/* Average */}
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <Star className="w-6 h-6 text-yellow-600 mb-2" />
            <p className="text-sm text-gray-500">Average Rating</p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-semibold">{getAverageRating()}</p>
              <div className="flex">
                {renderStars(Math.round(parseFloat(getAverageRating())))}
              </div>
            </div>
          </div>

          {/* 5 Star */}
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <TrendingUp className="w-6 h-6 text-green-600 mb-2" />
            <p className="text-sm text-gray-500">5 Star Reviews</p>
            <p className="text-xl font-semibold">{stats[5] || 0}</p>
          </div>

          {/* This Month */}
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <Calendar className="w-6 h-6 text-purple-600 mb-2" />
            <p className="text-sm text-gray-500">This Month</p>
            <p className="text-xl font-semibold">
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
      <div className="bg-white rounded-lg shadow-sm border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
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
        <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
          <User className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No reviews found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((r) => (
            <div
              key={r._id}
              className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {r.userId?.name || "Anonymous"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(r.createdAt)}
                  </p>
                  {r.comment && (
                    <p className="mt-2 text-gray-700">{r.comment}</p>
                  )}
                </div>
                <div className="flex items-center">
                  <div className="flex text-yellow-500">
                    {renderStars(r.rating)}
                  </div>
                  <span className="ml-2 text-sm font-semibold">
                    {r.rating}/5
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

DoctorReviews.getLayout = function PageLayout(page: React.ReactNode) {
  return <DoctorLayout>{page}</DoctorLayout>;
};

const Protected: NextPageWithLayout = withDoctorAuth(DoctorReviews);
Protected.getLayout = DoctorReviews.getLayout;
export default Protected;
