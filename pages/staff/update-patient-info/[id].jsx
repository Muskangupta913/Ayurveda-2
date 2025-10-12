import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import { Calendar, User, DollarSign, FileText, X, CheckCircle, AlertCircle } from "lucide-react";
import ClinicLayout from '../../../components/staffLayout';
import withClinicAuth from '../../../components/withStaffAuth';

const paymentMethods = ["Cash", "Card", "BT", "Tabby", "Tamara"];

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {  
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800"
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-600" />,
    error: <AlertCircle className="w-5 h-5 text-red-600" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-600" />
  };

  return (
    <div className={`fixed top-4 right-4 left-4 sm:left-auto sm:right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${styles[type]} animate-slide-in max-w-md`}>
      {icons[type]}
      <span className="font-medium text-sm flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70 flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Confirmation Modal
const ConfirmModal = ({ isOpen, onConfirm, onCancel, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-2xl p-5 sm:p-6 max-w-md w-full animate-scale-in">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">{title}</h3>
        <p className="text-sm sm:text-base text-gray-700 mb-5 sm:mb-6">{message}</p>
        <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
          <button
            onClick={onCancel}
            className="w-full sm:w-auto px-5 py-2 rounded-lg border border-gray-300 text-gray-800 font-medium hover:bg-gray-50 transition-colors text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="w-full sm:w-auto px-5 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors text-sm sm:text-base"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// Claim Status Modal
const ClaimStatusModal = ({ isOpen, onClose, onConfirm, status, remark, onStatusChange, onRemarkChange }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl p-5 sm:p-6 max-w-md w-full animate-scale-in">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Update Claim Status</h3>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Claim Status <span className="text-red-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              <option value="">Select Status</option>
              <option value="Approved by doctor">Approved by doctor</option>
              <option value="Released">Released</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          
          {status === "Cancelled" && (
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Cancellation Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={remark}
                onChange={(e) => onRemarkChange(e.target.value)}
                placeholder="Please provide a reason for cancellation..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
              />
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-lg border border-gray-300 text-gray-800 font-medium hover:bg-gray-50 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="w-full sm:w-auto px-5 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors text-sm"
          >
            Update Status
          </button>
        </div>
      </div>
    </div>
  );
};


const InvoiceUpdateSystem = () => {
  const router = useRouter();
  const { id } = router.query;
  const [currentUser] = useState({ name: "Admin User", role: "Staff" });
  const [invoiceInfo, setInvoiceInfo] = useState(null);
  const [formData, setFormData] = useState({});
  const [calculatedFields, setCalculatedFields] = useState({ pending: 0, needToPay: 0 });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, onConfirm: null });
  const [claimStatusModal, setClaimStatusModal] = useState({ isOpen: false, status: "", remark: "" });

  // Get staff token for API calls
  const staffToken = typeof window !== "undefined" ? localStorage.getItem("userToken") : null;

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const showConfirm = (title, message, onConfirm) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  useEffect(() => {
    if (!id) return;

    const fetchInvoice = async () => {
      setLoading(true);
      setFetchError("");

      try {
        const res = await fetch(`/api/staff/get-patient-data/${id}`, {
          headers: { Authorization: `Bearer ${staffToken}` }
        });
        if (!res.ok) throw new Error("Invoice not found");

        const data = await res.json();
        setInvoiceInfo(data);
        setFormData(data);
        showToast("Invoice loaded successfully", "success");
      } catch (err) {
        console.error(err);
        setFetchError(err.message || "Failed to fetch data");
        showToast(err.message || "Failed to fetch data", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  const calculatePending = useCallback(() => {
    const amount = parseFloat(formData.amount) || 0;
    const paid = parseFloat(formData.paid) || 0;
    const advance = parseFloat(formData.advance) || 0;
    setCalculatedFields((prev) => ({ ...prev, pending: Math.max(0, amount - (paid + advance)) }));
  }, [formData.amount, formData.paid, formData.advance]);

  const calculateNeedToPay = useCallback(() => {
    if (formData.insurance === "Yes" && formData.coPayPercent) {
      const amount = parseFloat(formData.amount) || 0;
      const coPayPercent = parseFloat(formData.coPayPercent) || 0;
      setCalculatedFields((prev) => ({ ...prev, needToPay: Math.max(0, (amount * (100 - coPayPercent)) / 100) }));
    } else {
      setCalculatedFields((prev) => ({ ...prev, needToPay: 0 }));
    }
  }, [formData.amount, formData.coPayPercent, formData.insurance]);

  useEffect(() => {
    calculatePending();
    calculateNeedToPay();
  }, [calculatePending, calculateNeedToPay]);

  // const handlePaymentChange = useCallback((e) => {
  //   const { name, value } = e.target;
  //   setFormData((prev) => ({ ...prev, [name]: value }));
  // }, []);
const handlePaymentChange = useCallback((e) => {
  const { name, value } = e.target;

  setFormData(prev => {
    const updated = { ...prev, [name]: value };

    const amount = parseFloat(updated.amount) || 0;
    const currentPaid = parseFloat(updated.paid) || 0;
    const paying = parseFloat(updated.paying) || 0;

    // Calculate total payment after this new payment
    const totalPaid = currentPaid + paying;
    
    // Calculate pending amount
    const pending = Math.max(0, amount - totalPaid);
    
    // Calculate advance (if paying more than remaining amount)
    const remainingAmount = amount - currentPaid;
    const advance = Math.max(0, paying - remainingAmount);

    // Update calculated fields
    updated.pending = pending;
    updated.advance = advance;

    // Insurance logic
    if (updated.insurance === "Yes") {
      const coPayPercent = parseFloat(updated.coPayPercent) || 0;
      updated.needToPay = Math.max(
        0,
        (amount * (100 - coPayPercent)) / 100 - (updated.advanceGivenAmount || 0)
      );
    } else {
      updated.needToPay = pending;
    }

    return updated;
  });
}, []);





  const handleUpdatePayment = useCallback(async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showToast("Amount should be valid", "error");
      return;
    }
    if (!formData.paymentMethod) {
      showToast("Please select payment method", "error");
      return;
    }
    if (!formData.status) {
      showToast("Please select a status", "error");
      return;
    }
    if (formData.status === "Rejected" && !formData.rejectionNote?.trim()) {
      showToast("Please provide a rejection note for rejected status", "error");
      return;
    }

    showConfirm(
      "Confirm Payment Update",
      "Are you sure you want to update the payment details and status?",
      async () => {
        try {
          const invoiceId = invoiceInfo?._id?.$oid || invoiceInfo?._id;
          const requestBody = {
            updateType: "payment",
            amount: formData.amount,
            paying: formData.paying || 0,
            paymentMethod: formData.paymentMethod,
            status: formData.status,
            rejectionNote: formData.status === "Rejected" ? formData.rejectionNote : null,
            notes: formData.status === "Released" ? formData.notes : null,
          };
          
          const res = await fetch(`/api/staff/get-patient-data/${invoiceId}`, {
            method: "PUT",
            headers: { 
              "Content-Type": "application/json",
              Authorization: `Bearer ${staffToken}`
            },
            body: JSON.stringify(requestBody),
          });

          const result = await res.json();
          if (res.ok) {
            showToast("Payment and status updated successfully!", "success");
            setInvoiceInfo(result.updatedInvoice);
            setFormData(result.updatedInvoice);
          } else {
            showToast(result.message || "Failed to update payment", "error");
          }
        } catch (err) {
          console.error(err);
          showToast("Network error. Try again later.", "error");
        }
        setConfirmModal({ isOpen: false });
      }
    );
  }, [formData, invoiceInfo]);

  const handleClaimStatusUpdate = useCallback(async () => {
    if (!claimStatusModal.status) {
      showToast("Please select a claim status", "error");
      return;
    }
    if (claimStatusModal.status === "Cancelled" && !claimStatusModal.remark.trim()) {
      showToast("Please provide a reason for cancellation", "error");
      return;
    }

    showConfirm(
      "Confirm Claim Status Update",
      `Are you sure you want to update the claim status to ${claimStatusModal.status}?`,
      async () => {
        try {
          const invoiceId = invoiceInfo?._id?.$oid || invoiceInfo?._id;
          const res = await fetch(`/api/staff/get-patient-data/${invoiceId}`, {
            method: "PUT",
            headers: { 
              "Content-Type": "application/json",
              Authorization: `Bearer ${staffToken}`
            },
            body: JSON.stringify({
              advanceClaimStatus: claimStatusModal.status,
              advanceClaimCancellationRemark: claimStatusModal.status === "Cancelled" ? claimStatusModal.remark : null,
              advanceClaimReleaseDate: (claimStatusModal.status === "Released" || claimStatusModal.status === "Approved by doctor") ? new Date().toISOString() : formData.advanceClaimReleaseDate,
              advanceClaimReleasedBy: (claimStatusModal.status === "Released" || claimStatusModal.status === "Approved by doctor") ? currentUser.name : formData.advanceClaimReleasedBy,
            }),
          });

          const result = await res.json();
          if (res.ok) {
            showToast("Claim status updated successfully!", "success");
            setInvoiceInfo(result.updatedInvoice);
            setFormData(result.updatedInvoice);
            setClaimStatusModal({ isOpen: false, status: "", remark: "" });
          } else {
            showToast(result.message || "Failed to update claim status", "error");
          }
        } catch (err) {
          console.error(err);
          showToast("Network error. Try again later.", "error");
        }
        setConfirmModal({ isOpen: false });
      }
    );
  }, [claimStatusModal, invoiceInfo, currentUser.name, formData.advanceClaimReleaseDate, formData.advanceClaimReleasedBy]);


  const canViewMobileNumber = useMemo(
    () => ["Admin", "Super Admin"].includes(currentUser.role),
    [currentUser.role]
  );

  const InfoCard = ({ icon: Icon, title, children, bgColor = "bg-white" }) => (
    <div className={`${bgColor} rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6 hover:shadow-md transition-shadow`}>
      <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 flex-shrink-0" />
        <span className="break-words">{title}</span>
      </h2>
      {children}
    </div>
  );

  const InfoField = ({ label, value, required, restricted }) => (
    <div className="min-w-0">
      <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
        {restricted && <span className="text-gray-500 text-xs ml-1">(Restricted)</span>}
      </label>
      <p className="text-sm sm:text-base text-gray-700 font-medium break-words">{value || "-"}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm sm:text-base text-gray-800 font-medium">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-xl shadow-lg p-6 sm:p-8 max-w-md w-full">
          <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-4" />
          <p className="text-sm sm:text-base text-red-600 font-semibold">{fetchError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-3 sm:p-4 md:p-6 lg:p-8">
      <style jsx global>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ConfirmModal {...confirmModal} onCancel={() => setConfirmModal({ isOpen: false })} />
      <ClaimStatusModal
        isOpen={claimStatusModal.isOpen}
        onClose={() => setClaimStatusModal({ isOpen: false, status: "", remark: "" })}
        onConfirm={handleClaimStatusUpdate}
        status={claimStatusModal.status}
        remark={claimStatusModal.remark}
        onStatusChange={(status) => setClaimStatusModal(prev => ({ ...prev, status }))}
        onRemarkChange={(remark) => setClaimStatusModal(prev => ({ ...prev, remark }))}
      />

      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="w-full sm:w-auto">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 sm:gap-3">
                  <FileText className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                  Invoice Management
                </h1>
                <p className="text-indigo-100 mt-1 text-xs sm:text-sm">View and update payment information</p>
              </div>
              <div className="w-full sm:w-auto text-left sm:text-right bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 sm:px-4">
                <div className="text-xs text-indigo-200">Logged in as</div>
                {/* <div className="font-bold text-sm sm:text-base">{currentUser.name}</div> */}
                <div className="text-xs text-indigo-200">{currentUser.role}</div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 md:space-y-6">
            {/* Invoice Info */}
            <InfoCard icon={Calendar} title="Invoice Information" bgColor="bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                <InfoField label="Invoice Number" value={formData.invoiceNumber} />
                <InfoField label="Invoiced Date" value={formData.invoicedDate ? new Date(formData.invoicedDate).toLocaleString() : null} />
                <InfoField label="Invoiced By" value={formData.invoicedBy} />
              </div>
            </InfoCard>

            {/* Patient Info */}
            <InfoCard icon={User} title="Patient Information" bgColor="bg-gradient-to-br from-green-50 to-emerald-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                <InfoField label="EMR Number" value={formData.emrNumber} required />
                <InfoField label="First Name" value={formData.firstName} required />
                <InfoField label="Last Name" value={formData.lastName} required />
                <InfoField label="Email" value={formData.email} required />
                <InfoField 
                  label="Mobile Number" 
                  value={canViewMobileNumber ? formData.mobileNumber : "Admin access required"} 
                  restricted={!canViewMobileNumber}
                />
                <InfoField label="Gender" value={formData.gender} required />
                <InfoField label="Patient Type" value={formData.patientType} required />
                <InfoField label="Referred By" value={formData.referredBy} />
              </div>
            </InfoCard>

            {/* Medical Details */}
            <InfoCard icon={FileText} title="Medical Details" bgColor="bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                <InfoField label="Doctor" value={formData.doctor} required />
                <InfoField label="Service" value={formData.service} required />
                {formData.service === "Package" && <InfoField label="Package" value={formData.package} required />}
                {formData.service === "Treatment" && <InfoField label="Treatment" value={formData.treatment} required />}
              </div>
            </InfoCard>

            {/* Payment Details */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6">
  <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
    Payment Details
  </h2>

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-4 sm:mb-5 md:mb-6">
    <div>
      <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2">
        Amount <span className="text-red-500">*</span>
      </label>
      <input
        type="number"
        name="amount"
        value={formData.amount || ""}
        onChange={handlePaymentChange}
        placeholder="0.00"
        step="0.01"
        min="0"
        className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-medium"
      />
    </div>

    <div>
      <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2">Current Paid (From DB)</label>
      <input
        type="number"
        name="paid"
        value={formData.paid || ""}
        readOnly
        className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-gray-50 text-gray-700 text-sm sm:text-base border border-gray-300 rounded-lg font-medium cursor-not-allowed"
      />
    </div>

    <div>
      <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2">New Payment</label>
      <input
        type="number"
        name="paying"
        value={formData.paying || ""}
        onChange={handlePaymentChange}
        placeholder="Enter new payment amount"
        step="0.01"
        min="0"
        className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-medium"
      />
    </div>

    <div>
      <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2">New Advance (Preview)</label>
      <input
        type="number"
        value={formData.advance?.toFixed(2) || "0.00"}
        readOnly
        className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-green-50 text-green-700 text-sm sm:text-base border border-green-300 rounded-lg font-medium cursor-not-allowed"
      />
    </div>

    <div>
      <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2">Pending (Auto)</label>
      <input
        type="text"
        value={`₹ ${formData.pending?.toFixed(2) || "0.00"}`}
        disabled
        className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base bg-gray-100 border border-gray-300 rounded-lg text-gray-900 font-bold cursor-not-allowed"
      />
    </div>

    <div>
      <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2">
        Payment Method <span className="text-red-500">*</span>
      </label>
      <select
        name="paymentMethod"
        value={formData.paymentMethod || ""}
        onChange={handlePaymentChange}
        className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-medium"
      >
        <option value="">Select method</option>
        {paymentMethods.map((method) => (
          <option key={method} value={method}>{method}</option>
        ))}
      </select>
    </div>

  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-4 sm:mb-5 md:mb-6">
    <div>
      <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2">
        Status <span className="text-red-500">*</span>
      </label>
      <select
        value={formData.status || ""}
        onChange={(e) => {
          const newStatus = e.target.value;
          setFormData(prev => ({ ...prev, status: newStatus }));
          if (newStatus !== "Rejected") {
            setFormData(prev => ({ ...prev, rejectionNote: "" }));
          }
        }}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
      >
        <option value="">Select Status</option>
        <option value="Active">Active</option>
        <option value="Completed">Completed</option>
        <option value="Cancelled">Cancelled</option>
        <option value="Rejected">Rejected</option>
        <option value="Released">Released</option>
      </select>
    </div>
    
    {formData.status === "Rejected" && (
      <div className="col-span-full">
        <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2">
          Rejection Note <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.rejectionNote || ""}
          onChange={(e) => setFormData(prev => ({ ...prev, rejectionNote: e.target.value }))}
          placeholder="Please provide a reason for rejection..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
        />
      </div>
    )}
    
    {formData.status === "Released" && (
      <div className="col-span-full">
        <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2">Notes</label>
        <textarea
          value={formData.notes || ""}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Optional notes..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
        />
      </div>
    )}
  </div>

  <div className="flex justify-end">
    <button
      onClick={handleUpdatePayment}
      className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
    >
      Update Payment
    </button>
  </div>
</div>


            {/* Insurance Details */}
            {formData.insurance === "Yes" && (
              <InfoCard icon={FileText} title="Insurance Details" bgColor="bg-gradient-to-br from-cyan-50 to-blue-50">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                  <InfoField label="Insurance" value={formData.insurance} />
                  <InfoField label="Advance Given Amount" value={formData.advanceGivenAmount != null ? `₹ ${formData.advanceGivenAmount.toFixed(2)}` : null} />
                  <InfoField label="Co-Pay %" value={formData.coPayPercent != null ? `${formData.coPayPercent}%` : null} />
                  <InfoField label="Need to Pay Amount (Auto)" value={`₹ ${calculatedFields.needToPay.toFixed(2)}`} />
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1">Advance Claim Status</label>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg font-semibold ${
                        formData.advanceClaimStatus === "Released" ? "bg-green-100 text-green-800" : 
                        formData.advanceClaimStatus === "Approved by doctor" ? "bg-blue-100 text-blue-800" :
                        formData.advanceClaimStatus === "Cancelled" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {formData.advanceClaimStatus || "-"}
                      </span>
                      {formData.advanceClaimStatus === "Pending" && (
                        <button
                          onClick={() => setClaimStatusModal({ isOpen: true, status: "", remark: "" })}
                          className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Update
                        </button>
                      )}
                    </div>
                  </div>
                  {formData.advanceClaimReleaseDate && (
                    <InfoField label="Advance Claim Release Date (Auto)" value={new Date(formData.advanceClaimReleaseDate).toLocaleString()} />
                  )}
                  {formData.advanceClaimReleasedBy && (
                    <InfoField label="Advance Claim Released By (Auto)" value={formData.advanceClaimReleasedBy} />
                  )}
                  {formData.advanceClaimCancellationRemark && (
                    <InfoField label="Cancellation Reason" value={formData.advanceClaimCancellationRemark} />
                  )}
                </div>
              </InfoCard>
            )}

            {/* Payment History */}
            {formData.paymentHistory && formData.paymentHistory.length > 0 && (
              <InfoCard icon={FileText} title="Payment History" bgColor="bg-gradient-to-br from-amber-50 to-orange-50">
                <div className="space-y-4">
                  {formData.paymentHistory.map((entry, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-gray-800">Entry #{index + 1}</h4>
                        <span className="text-sm text-gray-500">
                          {new Date(entry.updatedAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Amount:</span>
                          <p className="text-gray-800">₹{entry.amount?.toFixed(2) || "0.00"}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Paid:</span>
                          <p className="text-gray-800">₹{entry.paid?.toFixed(2) || "0.00"}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Advance:</span>
                          <p className="text-gray-800">₹{entry.advance?.toFixed(2) || "0.00"}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Pending:</span>
                          <p className="text-gray-800">₹{entry.pending?.toFixed(2) || "0.00"}</p>
                        </div>
                        {entry.paying > 0 && (
                          <div className="col-span-2 sm:col-span-4">
                            <span className="font-medium text-gray-600">Paying Amount:</span>
                            <p className="text-green-600 font-semibold">₹{entry.paying.toFixed(2)}</p>
                          </div>
                        )}
                        <div className="col-span-2 sm:col-span-4">
                          <span className="font-medium text-gray-600">Payment Method:</span>
                          <p className="text-gray-800">{entry.paymentMethod || "N/A"}</p>
                        </div>
                        {entry.status && (
                          <div className="col-span-2 sm:col-span-4">
                            <span className="font-medium text-gray-600">Status:</span>
                            <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                              entry.status === "Active" ? "bg-green-100 text-green-800" : 
                              entry.status === "Completed" ? "bg-blue-100 text-blue-800" :
                              entry.status === "Cancelled" ? "bg-red-100 text-red-800" :
                              entry.status === "Rejected" ? "bg-red-100 text-red-800" :
                              entry.status === "Released" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"
                            }`}>
                              {entry.status}
                            </span>
                          </div>
                        )}
                        {entry.rejectionNote && (
                          <div className="col-span-2 sm:col-span-4">
                            <span className="font-medium text-gray-600">Rejection Note:</span>
                            <p className="text-red-600 text-sm mt-1">{entry.rejectionNote}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </InfoCard>
            )}

          </div>
        </div>
      </div>

    </div>
  );
};

InvoiceUpdateSystem.getLayout = function PageLayout(page) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

const ProtectedDashboard = withClinicAuth(InvoiceUpdateSystem);
ProtectedDashboard.getLayout = InvoiceUpdateSystem.getLayout;

export default ProtectedDashboard;