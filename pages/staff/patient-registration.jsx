import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Calendar, User, DollarSign, FileText, AlertCircle, Search, CheckCircle, XCircle, AlertTriangle, X } from "lucide-react";
import ClinicLayout from '../../components/staffLayout';
import withClinicAuth from '../../components/withStaffAuth';
import { useRouter } from "next/router";   
// Toast Component
const Toast = ({ message, type, onClose }) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />
  };
  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500"
  };

  return (
    <div className={`${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] animate-slide-in`}>
      {icons[type]}
      <span className="flex-1 font-medium">{message}</span>
      <button onClick={onClose} className="hover:bg-white/20 rounded p-1">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Toast Container
const ToastContainer = ({ toasts, removeToast }) => (
  <div className="fixed top-4 right-4 z-50 space-y-2">
    {toasts.map(toast => (
      <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
    ))}
  </div>
);

// Confirmation Modal
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, type = "warning" }) => {
  if (!isOpen) return null;

  const colors = {
    warning: "bg-yellow-500",
    danger: "bg-red-500",
    info: "bg-blue-500"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 animate-scale-in">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 ${colors[type]} text-white rounded-lg hover:opacity-90 font-medium transition shadow-lg`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const paymentMethods = ["Cash", "Card", "BT", "Tabby", "Tamara"];

const INITIAL_FORM_DATA = {
  invoiceNumber: "", emrNumber: "", firstName: "", lastName: "", email: "",
  mobileNumber: "", gender: "", doctor: "", service: "", treatment: "",
  package: "", patientType: "", referredBy: "", amount: "", paid: "",
  advance: "", paymentMethod: "", insurance: "No", advanceGivenAmount: "",
  coPayPercent: "", advanceClaimStatus: "Pending"
};

const InvoiceManagementSystem = () => {
  const [currentUser, setCurrentUser] = useState({ name: "", role: "" });
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [autoFields, setAutoFields] = useState({
    invoicedDate: new Date().toISOString(),
    invoicedBy: " ",
    advanceClaimReleaseDate: null,
    advanceClaimReleasedBy: null
  });
  const [doctorList, setDoctorList] = useState([]);
  const [fetchedTreatments, setFetchedTreatments] = useState([]);
  const [fetchedPackages, setFetchedPackages] = useState([]);
  const [calculatedFields, setCalculatedFields] = useState({ pending: 0, needToPay: 0 });
  const [errors, setErrors] = useState({});
  const [usedEMRNumbers] = useState(() => new Set());
  const [fetching, setFetching] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null });

  // Toast functions
  const showToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Fetch data
  useEffect(() => {
    fetch("/api/admin/get-all-doctor-staff")
      .then(res => res.json())
      .then(data => data.success && setDoctorList(data.data))
      .catch(() => showToast("Failed to fetch doctors", "error"));
  }, [showToast]);

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (!token) return;
    fetch("/api/staff/patient-registration", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCurrentUser(data.data);
          setAutoFields(prev => ({ ...prev, invoicedBy: data.data.name }));
        }
      })
      .catch(() => showToast("Failed to fetch user details", "error"));
  }, [showToast]);

  useEffect(() => {
    fetch("/api/admin/staff-treatments")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFetchedTreatments(data.data.filter(i => i.treatment).map(i => ({ _id: i._id, name: i.treatment })));
          setFetchedPackages(data.data.filter(i => i.package).map(i => ({ _id: i._id, name: i.package })));
        }
      })
      .catch(() => showToast("Failed to fetch treatments", "error"));
  }, [showToast]);

  useEffect(() => {
    if (formData.insurance === "Yes") {
      const total = (parseFloat(formData.paid) || 0) + (parseFloat(formData.advance) || 0);
      setFormData(prev => ({ ...prev, advanceGivenAmount: total.toFixed(2) }));
    }
  }, [formData.paid, formData.advance, formData.insurance]);

  useEffect(() => generateInvoiceNumber(), []);

  useEffect(() => {
    const amount = parseFloat(formData.amount) || 0;
    const paid = parseFloat(formData.paid) || 0;
    const advance = parseFloat(formData.advance) || 0;
    setCalculatedFields(prev => ({ ...prev, pending: Math.max(0, amount - (paid + advance)) }));
  }, [formData.amount, formData.paid, formData.advance]);

  useEffect(() => {
    if (formData.insurance === "Yes" && formData.coPayPercent) {
      const needToPay = (parseFloat(formData.amount) || 0) * ((parseFloat(formData.coPayPercent) || 0) / 100);
      setCalculatedFields(prev => ({ ...prev, needToPay: Math.max(0, needToPay) }));
    } else {
      setCalculatedFields(prev => ({ ...prev, needToPay: 0 }));
    }
  }, [formData.amount, formData.coPayPercent, formData.insurance]);

  const generateInvoiceNumber = useCallback(() => {
    const date = new Date();
    const seq = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
    const id = `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}-${seq}`;
    setFormData(prev => ({ ...prev, invoiceNumber: id }));
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    if (name === "insurance" && value === "No") {
      setFormData(prev => ({
        ...prev,
        advanceGivenAmount: "",
        coPayPercent: "",
        advanceClaimStatus: "Pending"
      }));
      setAutoFields(prev => ({
        ...prev,
        advanceClaimReleaseDate: null,
        advanceClaimReleasedBy: null
      }));
    }
  }, [errors]);

  const fetchEMRData = useCallback(async () => {
    if (!formData.emrNumber.trim()) {
      showToast("Please enter an EMR Number", "warning");
      return;
    }

    try {
      setFetching(true);
      const token = localStorage.getItem("userToken");
      const res = await fetch(`/api/staff/patient-registration/${formData.emrNumber}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok && data.success && data.data) {
        const f = data.data;
        setFormData(prev => ({
          ...prev,
          firstName: f.firstName || "",
          lastName: f.lastName || "",
          email: f.email || "",
          mobileNumber: f.mobileNumber || "",
          gender: f.gender || "",
          patientType: f.patientType || "",
          referredBy: f.referredBy || ""
        }));
        showToast("Patient details loaded successfully", "success");
      } else {
        showToast("Patient not found. Fill details manually", "warning");
      }
    } catch {
      showToast("Failed to fetch patient data", "error");
    } finally {
      setFetching(false);
    }
  }, [formData.emrNumber, showToast]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    const { invoiceNumber, emrNumber, firstName, lastName, email, gender, doctor, service, treatment, package: pkg, patientType, amount, paymentMethod, insurance, advanceGivenAmount, coPayPercent } = formData;
    
    if (!invoiceNumber.trim()) newErrors.invoiceNumber = "Required";
    if (!emrNumber.trim()) newErrors.emrNumber = "Required";
    else if (usedEMRNumbers.has(emrNumber)) newErrors.emrNumber = "Already exists";
    if (!firstName.trim()) newErrors.firstName = "Required";
    if (!lastName.trim()) newErrors.lastName = "Required";
    if (!email.trim()) newErrors.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Invalid email";
    if (!gender) newErrors.gender = "Required";
    if (!patientType) newErrors.patientType = "Required";
    if (!doctor) newErrors.doctor = "Required";
    if (!service) newErrors.service = "Required";
    if (service === "Treatment" && !treatment) newErrors.treatment = "Required";
    if (service === "Package" && !pkg) newErrors.package = "Required";
    if (!amount || parseFloat(amount) <= 0) newErrors.amount = "Valid amount required";
    if (!paymentMethod) newErrors.paymentMethod = "Required";
    if (insurance === "Yes") {
      if (!advanceGivenAmount || parseFloat(advanceGivenAmount) <= 0) newErrors.advanceGivenAmount = "Required";
      if (!coPayPercent || parseFloat(coPayPercent) < 0 || parseFloat(coPayPercent) > 100) newErrors.coPayPercent = "0-100 required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, usedEMRNumbers]);

const router = useRouter(); // <-- inside your component

const handleSubmit = useCallback(async () => {
  if (!validateForm()) {
    showToast("Please fix validation errors", "error");
    return;
  }

  setConfirmModal({
    isOpen: true,
    title: "Save Invoice",
    message: "Are you sure you want to save this invoice? Please verify all details are correct.",
    type: "info",
    action: async () => {
      try {
        const token = localStorage.getItem("userToken");
        const res = await fetch("/api/staff/patient-registration", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ ...formData, ...autoFields, userId: currentUser._id, calculatedFields })
        });
        const data = await res.json();
        
        if (res.ok && data.success) {
          showToast("Invoice saved successfully!", "success");
          resetForm();

          // Redirect to patient information page
          router.push("/staff/patient-information"); 
        } else {
          showToast(data.message || "Failed to save invoice", "error");
        }
      } catch {
        showToast("Network error. Please try again", "error");
      }
      setConfirmModal({ isOpen: false, action: null });
    }
  });
}, [formData, autoFields, currentUser, calculatedFields, validateForm, showToast, router]);

  const resetForm = useCallback(() => {
    setConfirmModal({
      isOpen: true,
      title: "Reset Form",
      message: "All entered data will be lost. Are you sure you want to reset?",
      type: "warning",
      action: () => {
        setFormData(INITIAL_FORM_DATA);
        setAutoFields({
          invoicedDate: new Date().toISOString(),
          invoicedBy: currentUser.name,
          advanceClaimReleaseDate: null,
          advanceClaimReleasedBy: null
        });
        setCalculatedFields({ pending: 0, needToPay: 0 });
        setErrors({});
        generateInvoiceNumber();
        showToast("Form reset successfully", "success");
        setConfirmModal({ isOpen: false, action: null });
      }
    });
  }, [currentUser.name, generateInvoiceNumber, showToast]);

  const canViewMobile = useMemo(() => ["Admin", "Super Admin"].includes(currentUser.role), [currentUser.role]);

  return (
    <>
      <style>{`
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

      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <ConfirmModal {...confirmModal} onCancel={() => setConfirmModal({ isOpen: false, action: null })} onConfirm={confirmModal.action} />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                  <FileText className="text-indigo-600" />
                  Medical Invoice Management
                </h1>
                <p className="text-gray-700 mt-1">Complete invoice and patient details</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-700">Logged in as:</div>
                <div className="font-semibold text-indigo-600">{autoFields.invoicedBy || "Loading..."}</div>
                <div className="text-xs text-gray-700">{currentUser.role || "Loading..."}</div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Invoice Info */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-6 border-l-4 border-indigo-500">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  Invoice Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Invoice Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="invoiceNumber"
                      value={formData.invoiceNumber}
                      onChange={handleInputChange}
                      className={`text-gray-800 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono font-semibold ${errors.invoiceNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    />
                    {errors.invoiceNumber && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />{errors.invoiceNumber}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Invoiced Date</label>
                    <input
                      type="text"
                      value={new Date(autoFields.invoicedDate).toLocaleString()}
                      disabled
                      className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Invoiced By</label>
                    <input
                      type="text"
                      value={autoFields.invoicedBy}
                      disabled
                      className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700"
                    />
                  </div>
                </div>
              </div>

              {/* EMR Search */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 border-l-4 border-blue-500">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Search className="w-5 h-5 text-blue-600" />
                  Search Patient by EMR
                </h2>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    name="emrNumber"
                    value={formData.emrNumber}
                    onChange={handleInputChange}
                    placeholder="Enter EMR Number to auto-fill patient details"
                    className="flex-1 px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-500"
                  />
                  <button
                    type="button"
                    onClick={fetchEMRData}
                    disabled={fetching || !formData.emrNumber.trim()}
                    className={`px-6 py-3 rounded-lg text-white font-semibold transition flex items-center gap-2 ${fetching || !formData.emrNumber.trim() ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-md"}`}
                  >
                    <Search className="w-5 h-5" />
                    {fetching ? "Searching..." : "Search"}
                  </button>
                </div>
                <p className="text-sm text-gray-700 mt-2">💡 Search by EMR to auto-fill patient information or enter manually below</p>
              </div>

              {/* Patient Info */}
              <div className="text-gray-800 bg-blue-50 rounded-lg p-6 border border-blue-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Patient Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[{ name: "emrNumber", label: "EMR Number", required: true },
                    { name: "firstName", label: "First Name", required: true },
                    { name: "lastName", label: "Last Name", required: true },
                    { name: "email", label: "Email", type: "email", required: true },
                    { name: "mobileNumber", label: canViewMobile ? "Mobile Number" : "Mobile (Restricted)", type: "number" },
                    { name: "gender", label: "Gender", type: "select", options: ["Male", "Female", "Other"], required: true },
                    { name: "patientType", label: "Patient Type", type: "select", options: ["New", "Old"], required: true },
                    { name: "referredBy", label: "Referred By" }
                  ].map(field => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      {field.type === "select" ? (
                        <select
                          name={field.name}
                          value={formData[field.name]}
                          onChange={handleInputChange}
                          className={`text-gray-800 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors[field.name] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                        >
                          <option value="">Select {field.label}</option>
                          {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <input
                          type={field.type || "text"}
                          name={field.name}
                          value={formData[field.name]}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors[field.name] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                          placeholder={field.label}
                        />
                      )}
                      {errors[field.name] && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />{errors[field.name]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Medical Details */}
              <div className="text-gray-800 bg-green-50 rounded-lg p-6 border border-green-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Medical Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Doctor <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="doctor"
                      value={formData.doctor}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.doctor ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                    >
                      <option value="">Select Doctor</option>
                      {doctorList.map(d => <option key={d._id} value={d._id}>{d.name} ({d.role})</option>)}
                    </select>
                    {errors.doctor && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.doctor}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="service"
                      value={formData.service}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.service ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                    >
                      <option value="">Select Service</option>
                      <option value="Package">Package</option>
                      <option value="Treatment">Treatment</option>
                    </select>
                    {errors.service && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.service}</p>}
                  </div>
                  {formData.service === "Package" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Package <span className="text-red-500">*</span></label>
                      <select name="package" value={formData.package} onChange={handleInputChange} className={`w-full px-4 py-2 border rounded-lg ${errors.package ? "border-red-500 bg-red-50" : "border-gray-300"}`}>
                        <option value="">Select Package</option>
                        {fetchedPackages.map(p => <option key={p._id} value={p.name}>{p.name}</option>)}
                      </select>
                      {errors.package && <p className="text-red-500 text-xs mt-1"><AlertCircle className="w-3 h-3 inline" /> {errors.package}</p>}
                    </div>
                  )}
                  {formData.service === "Treatment" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Treatment <span className="text-red-500">*</span></label>
                      <select name="treatment" value={formData.treatment} onChange={handleInputChange} className={`w-full px-4 py-2 border rounded-lg ${errors.treatment ? "border-red-500 bg-red-50" : "border-gray-300"}`}>
                        <option value="">Select Treatment</option>
                        {fetchedTreatments.map(t => <option key={t._id} value={t.name}>{t.name}</option>)}
                      </select>
                      {errors.treatment && <p className="text-red-500 text-xs mt-1"><AlertCircle className="w-3 h-3 inline" /> {errors.treatment}</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment */}
              <div className="text-gray-800 bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-yellow-600" />
                  Payment Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: "amount", label: "Amount", required: true, type: "number" },
                    { name: "paid", label: "Paid", type: "number" },
                    { name: "advance", label: "Advance", type: "number" }
                  ].map(f => (
                    <div key={f.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {f.label} {f.required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type={f.type}
                        name={f.name}
                        value={formData[f.name]}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-lg ${errors[f.name] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                        placeholder="0.00"
                        step="0.01"
                      />
                      {errors[f.name] && <p className="text-red-500 text-xs mt-1"><AlertCircle className="w-3 h-3 inline" /> {errors[f.name]}</p>}
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pending (Auto)</label>
                    <input type="text" value={`₹ ${calculatedFields.pending.toFixed(2)}`} disabled className="w-full px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-400 rounded-lg text-gray-900 font-bold" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method <span className="text-red-500">*</span></label>
                    <select name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange} className={`w-full px-4 py-2 border rounded-lg ${errors.paymentMethod ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}>
                      <option value="">Select Method</option>
                      {paymentMethods.map((m, i) => <option key={i} value={m}>{m}</option>)}
                    </select>
                    {errors.paymentMethod && <p className="text-red-500 text-xs mt-1"><AlertCircle className="w-3 h-3 inline" /> {errors.paymentMethod}</p>}
                  </div>
                </div>
              </div>

              {/* Insurance */}
              <div className="text-gray-800 bg-purple-50 rounded-lg p-6 border border-purple-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Insurance Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Insurance</label>
                    <select name="insurance" value={formData.insurance} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  {formData.insurance === 'Yes' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Advance Given Amount <span className="text-red-500">*</span></label>
                        <input type="number" name="advanceGivenAmount" value={formData.advanceGivenAmount} disabled className="w-full px-4 py-2 border rounded-lg bg-gray-100" />
                        {errors.advanceGivenAmount && <p className="text-red-500 text-xs mt-1"><AlertCircle className="w-3 h-3 inline" /> {errors.advanceGivenAmount}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Co-Pay % <span className="text-red-500">*</span></label>
                        <input type="number" name="coPayPercent" value={formData.coPayPercent} onChange={handleInputChange} className={`w-full px-4 py-2 border rounded-lg ${errors.coPayPercent ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} placeholder="0-100" min="0" max="100" />
                        {errors.coPayPercent && <p className="text-red-500 text-xs mt-1"><AlertCircle className="w-3 h-3 inline" /> {errors.coPayPercent}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Need to Pay (Auto)</label>
                        <input type="text" value={`₹ ${calculatedFields.needToPay.toFixed(2)}`} disabled className="w-full px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-400 rounded-lg text-gray-900 font-bold" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Advance Claim Status</label>
                        <div className="flex gap-2">
                          <input type="text" value={formData.advanceClaimStatus} disabled className={`flex-1 px-4 py-2 border rounded-lg font-semibold ${formData.advanceClaimStatus === 'Released' ? 'bg-green-100 border-green-400 text-green-800' : 'bg-yellow-100 border-yellow-400 text-yellow-800'}`} />
                          {formData.advanceClaimStatus === "Pending" && (
                            <button type="button" onClick={() => showToast("Doctor approval required", "warning")} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-md font-semibold">
                              Release
                            </button>
                          )}
                        </div>
                      </div>
                      {autoFields.advanceClaimReleaseDate && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Release Date (Auto)</label>
                            <input type="text" value={new Date(autoFields.advanceClaimReleaseDate).toLocaleString()} disabled className="w-full px-4 py-2 bg-gray-100 border border-gray-400 rounded-lg text-gray-700" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Released By (Auto)</label>
                            <input type="text" value={autoFields.advanceClaimReleasedBy || ''} disabled className="w-full px-4 py-2 bg-gray-100 border border-gray-400 rounded-lg text-gray-700" />
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={resetForm} className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-semibold">
                  Reset Form
                </button>
                <button type="button" onClick={handleSubmit} className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold shadow-lg hover:shadow-xl">
                  Save Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

InvoiceManagementSystem.getLayout = function PageLayout(page) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

const ProtectedDashboard = withClinicAuth(InvoiceManagementSystem);
ProtectedDashboard.getLayout = InvoiceManagementSystem.getLayout;

export default ProtectedDashboard;