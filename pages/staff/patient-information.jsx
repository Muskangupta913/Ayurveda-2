import React, { useState, useEffect } from "react";
import axios from "axios";
import { Filter, Edit3, Search, ChevronLeft, ChevronRight, CheckCircle, X, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { useRouter } from "next/router";
import ClinicLayout from '../../components/staffLayout';
import withClinicAuth from '../../components/withStaffAuth';

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: "bg-emerald-500",
    error: "bg-rose-500",
    info: "bg-blue-500"
  };

  return (
    <div className={`${styles[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slideIn`}>
      {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : type === 'error' ? <AlertCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button onClick={onClose} className="hover:bg-white/20 rounded p-1"><X className="w-4 h-4" /></button>
    </div>
  );
};

const ToastContainer = ({ toasts, removeToast }) => (
  <div className="fixed top-4 right-4 z-50 space-y-2 w-full max-w-sm px-4">
    {toasts.map(toast => <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />)}
  </div>
);

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-scaleIn">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6 text-sm">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium">Confirm</button>
        </div>
      </div>
    </div>
  );
};

const PatientCard = ({ patient, onUpdate, onComplete }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold text-gray-800 truncate">{patient.firstName} {patient.lastName}</h3>
        <p className="text-sm text-gray-600">{patient.mobileNumber}</p>
        <p className="text-xs text-gray-500">{patient.email}</p>
      </div>
      <div className="flex flex-col gap-1 ml-2">
        <span className={`px-2 py-1 text-xs font-medium rounded text-center ${
          patient.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
          patient.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
        }`}>{patient.status}</span>
      </div>
    </div>
    
    <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
      <div>
        <p className="text-gray-500">EMR Number</p>
        <p className="font-medium text-gray-800">{patient.emrNumber}</p>
      </div>
      <div>
        <p className="text-gray-500">Invoice No</p>
        <p className="font-medium text-gray-800">{patient.invoiceNumber}</p>
      </div>
      <div>
        <p className="text-gray-500">Total Amount</p>
        <p className="font-semibold text-gray-800">₹{patient.amount?.toLocaleString() || 0}</p>
      </div>
      <div>
        <p className="text-gray-500">Paid Amount</p>
        <p className="font-semibold text-emerald-600">₹{patient.paid?.toLocaleString() || 0}</p>
      </div>
      <div>
        <p className="text-gray-500">Advance Payment</p>
        <p className="font-semibold text-blue-600">₹{patient.advanceGivenAmount?.toLocaleString() || 0}</p>
      </div>
      <div>
        <p className="text-gray-500">Amount Pending</p>
        <p className="font-semibold text-rose-600">₹{patient.pending?.toLocaleString() || 0}</p>
      </div>
      <div>
        <p className="text-gray-500">Insurance</p>
        <p className="font-medium text-gray-800">{patient.insurance || 'No'}</p>
      </div>
      <div>
        <p className="text-gray-500">Payment Type</p>
        <p className="font-medium text-gray-800">{patient.paymentMethod || 'N/A'}</p>
      </div>
    </div>

    <div className="mb-3 flex gap-2 flex-wrap">
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
        patient.advanceClaimStatus === 'Released' ? 'bg-emerald-100 text-emerald-700' :
        patient.advanceClaimStatus === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
      }`}>
        Claim: {patient.advanceClaimStatus}
      </span>
      {patient.patientType && (
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-700">
          {patient.patientType}
        </span>
      )}
    </div>

    <div className="flex gap-2">
      <button onClick={() => onUpdate(patient._id)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
        <Edit3 className="w-4 h-4" /> Update
      </button>
      <button onClick={() => onComplete(patient._id)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors">
        <CheckCircle className="w-4 h-4" /> Complete
      </button>
    </div>
  </div>
);

function PatientFilterUI() {
  const router = useRouter();
  const [filters, setFilters] = useState({ emrNumber: "", invoiceNumber: "", name: "", phone: "", claimStatus: "", applicationStatus: "", dateFrom: "", dateTo: "" });
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, id: null });
  const pageSize = 12;

  const addToast = (message, type = "info") => setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));
  const token = typeof window !== "undefined" ? localStorage.getItem("userToken") : null;

  const filteredPatients = patients.filter(item =>
    search.trim() === "" ||
    `${item.firstName} ${item.lastName} ${item.emrNumber} ${item.invoiceNumber} ${item.mobileNumber}`
      .toLowerCase().includes(search.trim().toLowerCase())
  );
  const totalPages = Math.ceil(filteredPatients.length / pageSize);
  const displayedPatients = filteredPatients.slice((page - 1) * pageSize, page * pageSize);

  const fetchPatients = async () => {
    if (!token) return addToast("Session expired. Please login again.", "error");
    setLoading(true);
    try {
      const { data } = await axios.get("/api/staff/get-patient-registrations", {
        params: filters,
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatients(data.success ? data.data : []);
      setPage(1);
      addToast("Data loaded successfully", "success");
    } catch (err) {
      console.error(err);
      setPatients([]);
      addToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPatients(); }, []);

  const handleUpdate = (id) => router.push(`/staff/update-patient-info/${id}`);

  const handleComplete = async (id) => {
    if (!token) return addToast("Session expired. Please login again.", "error");
    try {
      await axios.put("/api/staff/get-patient-registrations", { id, status: "Completed" }, { headers: { Authorization: `Bearer ${token}` } });
      addToast("Status updated successfully", "success");
      fetchPatients();
    } catch (err) {
      console.error(err);
      addToast("Failed to update status", "error");
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-slideIn { animation: slideIn 0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
      `}</style>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, id: null })}
        onConfirm={() => { handleComplete(confirmDialog.id); setConfirmDialog({ isOpen: false, id: null }); }}
        title="Mark as Completed"
        message="Are you sure you want to mark this patient's status as completed?"
      />

      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Filter className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-800">Patient Filter</h1>
                <p className="text-xs sm:text-sm text-gray-600">Search and manage records</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-gray-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <input type="text" name="emrNumber" placeholder="EMR Number" value={filters.emrNumber} onChange={e => setFilters({ ...filters, emrNumber: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-800" />
              <input type="text" name="invoiceNumber" placeholder="Invoice Number" value={filters.invoiceNumber} onChange={e => setFilters({ ...filters, invoiceNumber: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-800" />
              <input type="text" name="name" placeholder="Patient Name" value={filters.name} onChange={e => setFilters({ ...filters, name: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-800" />
              <input type="text" name="phone" placeholder="Phone" value={filters.phone} onChange={e => setFilters({ ...filters, phone: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-800" />
              <select name="claimStatus" value={filters.claimStatus} onChange={e => setFilters({ ...filters, claimStatus: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-800 bg-white">
                <option value="">All Claim Status</option>
                <option value="Pending">Pending</option>
                <option value="Released">Released</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <select name="applicationStatus" value={filters.applicationStatus} onChange={e => setFilters({ ...filters, applicationStatus: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-800 bg-white">
                <option value="">All App Status</option>
                <option value="Active">Active</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Completed">Completed</option>
              </select>
              <input type="date" name="dateFrom" value={filters.dateFrom} onChange={e => setFilters({ ...filters, dateFrom: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-800" />
              <input type="date" name="dateTo" value={filters.dateTo} onChange={e => setFilters({ ...filters, dateTo: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-800" />
            </div>

            <button onClick={fetchPatients} className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2">
              <Filter className="w-4 h-4" /> Apply Filters
            </button>
          </div>

          {/* Results */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-3">
              <span className="font-medium text-gray-800">{filteredPatients.length}</span> results found
            </p>

            {loading ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-sm text-gray-600">Loading...</p>
              </div>
            ) : displayedPatients.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedPatients.map(patient => (
                  <PatientCard key={patient._id} patient={patient} onUpdate={handleUpdate} onComplete={(id) => setConfirmDialog({ isOpen: true, id })} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-12 flex flex-col items-center gap-2">
                <Search className="w-12 h-12 text-gray-300" />
                <p className="text-sm text-gray-600">No records found</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600">Page <span className="font-medium text-gray-800">{page}</span> of <span className="font-medium text-gray-800">{totalPages}</span></p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {[...Array(Math.min(totalPages, 5))].map((_, idx) => {
                  const pageNum = totalPages <= 5 ? idx + 1 : page <= 3 ? idx + 1 : page >= totalPages - 2 ? totalPages - 4 + idx : page - 2 + idx;
                  return (
                    <button key={idx} onClick={() => setPage(pageNum)} className={`w-9 h-9 rounded-lg text-sm font-medium ${page === pageNum ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                      {pageNum}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

PatientFilterUI.getLayout = function PageLayout(page) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

const ProtectedDashboard = withClinicAuth(PatientFilterUI);
ProtectedDashboard.getLayout = PatientFilterUI.getLayout;

export default ProtectedDashboard;