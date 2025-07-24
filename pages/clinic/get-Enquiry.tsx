"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Search,
  User,
  Calendar,
  Mail,
  Phone,
  MessageSquare,
  X,
} from "lucide-react";
import ClinicLayout from "../../components/ClinicLayout";
import withAdminAuth from "../../components/withClinicAuth";
import type { NextPageWithLayout } from "../_app";

interface Enquiry {
  _id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
}

function ClinicEnquiries() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchEnquiries = async () => {
      try {
        const token = localStorage.getItem("clinicToken");
        if (!token) return;

        const res = await axios.get("/api/clinics/getEnquiries", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setEnquiries(res.data.enquiries || []);
        setFilteredEnquiries(res.data.enquiries || []);
      } catch (err) {
        console.error("Error fetching enquiries:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEnquiries();
  }, []);

  useEffect(() => {
    let filtered = enquiries;

    if (searchTerm) {
      filtered = filtered.filter(
        (enquiry) =>
          enquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          enquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          enquiry.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
          enquiry.phone.includes(searchTerm)
      );
    }

    setFilteredEnquiries(filtered);
  }, [searchTerm, enquiries]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-black font-medium">Loading enquiries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Clean Header */}
      <div className="bg-white border-b border-gray-100 shadow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          {/* Left: Title and subtitle */}
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-indigo-800 tracking-tight">Patient Enquiries</h1>
            <p className="text-gray-500 mt-1 text-base">{enquiries.length} total enquiries</p>
          </div>

          {/* Right: Icon & count */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-100 via-indigo-100 to-white p-3 rounded-xl flex items-center shadow-sm">
              <MessageSquare className="w-7 h-7 text-blue-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl md:text-3xl font-bold text-gray-800">{enquiries.length}</div>
              <div className="text-sm text-gray-400">Total</div>
            </div>
          </div>
        </div>
      </div>


      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8 mx-1 sm:mx-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="bg-gray-100 p-2 sm:p-3 rounded-lg flex-shrink-0 self-start sm:self-center">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </div>
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by name, email, or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-black w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                </button>
              )}
            </div>
          </div>

          {searchTerm && (
            <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600">
              <span>Results for:</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium break-all">
                &quot;{searchTerm}&quot;
              </span>
              <span>({filteredEnquiries.length} found)</span>
            </div>
          )}
        </div>

        {/* Enquiries List */}
        <div className="space-y-3 sm:space-y-4">
          {filteredEnquiries.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-12 text-center mx-1 sm:mx-0">
              <div className="bg-gray-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? "No results found" : "No enquiries yet"}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 px-2">
                {searchTerm
                  ? "Try adjusting your search terms."
                  : "Patient enquiries will appear here when they contact your clinic."}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="bg-blue-600 text-white px-4 py-2 text-sm sm:text-base rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            filteredEnquiries.map((enquiry) => (
              <div
                key={enquiry._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow mx-1 sm:mx-0"
              >
                {/* Card Header */}
                <div className="p-4 sm:p-6 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="bg-blue-100 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 break-words">
                          {enquiry.name}
                        </h3>
                        <div className="space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                            <div className="flex items-center space-x-2">
                              <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                              <a
                                href={`mailto:${enquiry.email}`}
                                className="text-blue-600 hover:text-blue-800 transition-colors text-sm sm:text-base break-all"
                              >
                                {enquiry.email}
                              </a>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                              <a
                                href={`tel:${enquiry.phone}`}
                                className="text-green-600 hover:text-green-800 transition-colors text-sm sm:text-base"
                              >
                                {enquiry.phone}
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-50 border-t sm:border-t-0 sm:border border-gray-100 rounded-b-lg sm:rounded-lg -mx-4 sm:mx-0 mt-3 sm:mt-0">
                      <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="break-words">
                            {new Date(enquiry.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Message */}
                  <div className="pt-4 sm:pt-6">
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4">
                      <div className="flex items-start space-x-2 mb-2">
                        <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 mt-1 flex-shrink-0" />
                        <span className="font-medium text-gray-900 text-sm sm:text-base">
                          Message:
                        </span>
                      </div>
                      <p className="text-gray-700 leading-relaxed pl-5 sm:pl-6 text-sm sm:text-base break-words">
                        &quot;{enquiry.message}&quot;
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

ClinicEnquiries.getLayout = function PageLayout(page: React.ReactNode) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

// ✅ Apply HOC and assign correct type
const ProtectedDashboard: NextPageWithLayout = withAdminAuth(ClinicEnquiries);

// ✅ Reassign layout (TS-safe now)
ProtectedDashboard.getLayout = ClinicEnquiries.getLayout;

export default ProtectedDashboard;
