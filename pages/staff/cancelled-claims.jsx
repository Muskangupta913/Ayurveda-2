import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { 
  AlertCircle, 
  User, 
  Calendar, 
  DollarSign, 
  FileText, 
  Phone, 
  Mail, 
  MapPin,
  Clock,
  X,
  RefreshCw,
  Filter,
  Search
} from "lucide-react";
import ClinicLayout from '../../components/staffLayout';
import withClinicAuth from '../../components/withStaffAuth';
import { jwtDecode } from "jwt-decode";

// Loading Component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-lg text-gray-800 font-medium">Loading rejected claims...</p>
    </div>
  </div>
);

// Error Component
const ErrorMessage = ({ message, onRetry }) => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
    <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
      <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
      <p className="text-lg text-red-600 font-semibold mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          Try Again
        </button>
      )}
    </div>
  </div>
);

// Patient Detail Card Component
const PatientDetailCard = ({ claim, index, onEdit }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{claim.patientName}</h3>
              <p className="text-red-100">Invoice: {claim.invoiceNumber}</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
              claim.status === 'Cancelled' || claim.status === 'Rejected' 
                ? 'bg-red-100 text-red-800' 
                : 'bg-orange-100 text-orange-800'
            }`}>
              {claim.cancellationType}
            </span>
            <p className="text-red-100 text-sm mt-1">
              {new Date(claim.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Patient Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              Patient Information
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600">Full Name</label>
                <p className="text-gray-900 font-medium">{claim.patientName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">EMR Number</label>
                <p className="text-gray-900 font-medium">{claim.emrNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Email</label>
                <p className="text-gray-900 font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  {claim.email || 'Not provided'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Mobile Number</label>
                <p className="text-gray-900 font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  {claim.mobileNumber || 'Not provided'}
                </p>
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Medical Details
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600">Doctor</label>
                <p className="text-gray-900 font-medium">{claim.doctor}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Service Type</label>
                <p className="text-gray-900 font-medium">{claim.service}</p>
              </div>
              {claim.package && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">Package</label>
                  <p className="text-gray-900 font-medium">{claim.package}</p>
                </div>
              )}
              {claim.treatment && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">Treatment</label>
                  <p className="text-gray-900 font-medium">{claim.treatment}</p>
                </div>
              )}
            </div>
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-indigo-600" />
              Financial Details
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600">Total Amount</label>
                <p className="text-gray-900 font-bold text-lg">₹{claim.amount?.toFixed(2) || '0.00'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Amount Paid</label>
                <p className="text-green-600 font-medium">₹{claim.paid?.toFixed(2) || '0.00'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Advance Amount</label>
                <p className="text-blue-600 font-medium">₹{claim.advance?.toFixed(2) || '0.00'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Pending Amount</label>
                <p className="text-red-600 font-medium">₹{claim.pending?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cancellation Details */}
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-lg font-semibold text-red-900 flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5" />
            Cancellation Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-red-700">Cancellation Type</label>
              <p className="text-red-900 font-medium">{claim.cancellationType}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-red-700">Cancellation Date</label>
              <p className="text-red-900 font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(claim.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
          {claim.cancellationReason && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-red-700 mb-2">Cancellation Reason</label>
              <div className="bg-white border border-red-200 rounded-lg p-3">
                <p className="text-red-900">{claim.cancellationReason}</p>
              </div>
            </div>
          )}
        </div>

        {/* Expandable Additional Details */}
        <div className="mt-6">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
          >
            <span>{isExpanded ? 'Hide' : 'Show'} Additional Details</span>
            <svg 
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isExpanded && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-semibold text-gray-900 mb-3">Timeline Information</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Invoice Date:</span>
                      <span className="text-gray-900">
                        {claim.invoicedDate ? new Date(claim.invoicedDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="text-gray-900">
                        {new Date(claim.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="text-gray-900">
                        {new Date(claim.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900 mb-3">Status Information</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Status:</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        claim.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                        claim.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {claim.status || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Advance Claim Status:</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        claim.advanceClaimStatus === 'Cancelled' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {claim.advanceClaimStatus || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => onEdit(claim)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Edit & Approve
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Component
const CancelledClaimsPage = () => {
  const router = useRouter();
  const [cancelledClaims, setCancelledClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [userRole, setUserRole] = useState(null);
  const [doctorName, setDoctorName] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editClaim, setEditClaim] = useState(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", email: "", mobileNumber: "", referredBy: "", service: "", treatment: "", package: "", notes: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  // Get user role and name from token
  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded.role);
        setDoctorName(decoded.name); // Get doctor name from token
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);

  // Fetch cancelled advance claims
  const fetchCancelledClaims = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch('/api/staff/cancelled-claims', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Access denied. Only doctorStaff can view cancelled claims.");
        } else if (response.status === 401) {
          throw new Error("Authentication failed. Please login again.");
        } else {
          throw new Error("Failed to fetch cancelled claims");
        }
      }

      const data = await response.json();
      setCancelledClaims(data.data || []);
      // Update doctor name from API response if available
      if (data.doctorName) {
        setDoctorName(data.doctorName);
      }
    } catch (err) {
      console.error("Error fetching cancelled claims:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === "doctorStaff") {
      fetchCancelledClaims();
    } else if (userRole && userRole !== "doctorStaff") {
      setError("Access denied. Only doctorStaff can view rejected claims.");
      setLoading(false);
    }
  }, [userRole]);

  const openEditModal = (claim) => {
    setEditClaim(claim);
    setEditForm({
      firstName: claim.firstName || "",
      lastName: claim.lastName || "",
      email: claim.email || "",
      mobileNumber: claim.mobileNumber || "",
      referredBy: claim.referredBy || "",
      service: claim.service || "",
      treatment: claim.treatment || "",
      package: claim.package || "",
      notes: claim.notes || "",
    });
    setEditOpen(true);
  };

  const closeEditModal = () => {
    setEditOpen(false);
    setEditClaim(null);
  };

  const submitEdit = async () => {
    if (!editClaim) return;
    setSavingEdit(true);
    try {
      const token = localStorage.getItem("userToken");
      const res = await fetch(`/api/doctor/update-patient/${editClaim._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Update failed");
      }

      // Remove from rejected list after approval
      setCancelledClaims((prev) => prev.filter((c) => c._id !== editClaim._id));
      closeEditModal();
    } catch (err) {
      alert(err.message || "Update failed");
    } finally {
      setSavingEdit(false);
    }
  };

  // Filter and search claims
  const filteredClaims = cancelledClaims.filter(claim => {
    const matchesSearch = claim.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.doctor.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === "all" || 
                         (filterType === "payment" && (claim.status === "Cancelled" || claim.status === "Rejected")) ||
                         (filterType === "advance" && claim.advanceClaimStatus === "Cancelled");
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchCancelledClaims} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-6 lg:p-8">
      <style jsx global>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-red-500" />
                Cancelled Claims
              </h1>
              <p className="text-gray-600 mt-1">
                {doctorName 
                  ? `View cancelled patient claims for Dr. ${doctorName}`
                  : 'View cancelled patient claims'
                }
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchCancelledClaims}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{filteredClaims.length}</div>
                <div className="text-sm text-gray-600">Total Claims</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by patient name, invoice number, or doctor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            
            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Types</option>
                <option value="payment">Payment Cancelled</option>
                <option value="advance">Advance Claim Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Claims List */}
        {filteredClaims.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Cancelled Claims Found</h3>
            <p className="text-gray-600">
              {searchTerm || filterType !== "all" 
                ? "No claims match your current search or filter criteria."
                : doctorName 
                  ? `There are currently no cancelled claims for Dr. ${doctorName}.`
                  : "There are currently no cancelled claims."
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredClaims.map((claim, index) => (
              <PatientDetailCard key={claim._id} claim={claim} index={index} onEdit={openEditModal} />
            ))}
          </div>
        )}
      </div>
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/20">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Edit Patient & Approve</h3>
                <p className="text-xs text-gray-500 mt-1">Editing: {editClaim?.patientName} (Invoice {editClaim?.invoiceNumber})</p>
              </div>
              <button onClick={closeEditModal} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">First Name</label>
                <input value={editForm.firstName} onChange={(e)=>setEditForm({...editForm, firstName:e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label>
                <input value={editForm.lastName} onChange={(e)=>setEditForm({...editForm, lastName:e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                <input value={editForm.email} onChange={(e)=>setEditForm({...editForm, email:e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Number</label>
                <input value={editForm.mobileNumber} onChange={(e)=>setEditForm({...editForm, mobileNumber:e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Referred By</label>
                <input value={editForm.referredBy} onChange={(e)=>setEditForm({...editForm, referredBy:e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Service</label>
                <input value={editForm.service} onChange={(e)=>setEditForm({...editForm, service:e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Treatment</label>
                <input value={editForm.treatment} onChange={(e)=>setEditForm({...editForm, treatment:e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Package</label>
                <input value={editForm.package} onChange={(e)=>setEditForm({...editForm, package:e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notes</label>
                <textarea rows={3} value={editForm.notes} onChange={(e)=>setEditForm({...editForm, notes:e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>

            <div className="p-5 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={closeEditModal} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button onClick={submitEdit} disabled={savingEdit} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">{savingEdit? 'Saving...' : 'Save & Approve'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

CancelledClaimsPage.getLayout = function PageLayout(page) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

const ProtectedCancelledClaimsPage = withClinicAuth(CancelledClaimsPage);
ProtectedCancelledClaimsPage.getLayout = CancelledClaimsPage.getLayout;

export default ProtectedCancelledClaimsPage;

// Edit Modal
// Note: inline modal rendering below for editing
// Rendered at the bottom of the page component

