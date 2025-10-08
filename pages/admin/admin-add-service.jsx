import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminLayout from "../../components/AdminLayout";
import withAdminAuth from "../../components/withAdminAuth";
import { Plus, Edit2, Trash2, Package, Activity, X, Check, CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";

// Toast Component
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: "bg-green-500 border-green-600",
    error: "bg-red-500 border-red-600",
    info: "bg-blue-500 border-blue-600",
    warning: "bg-yellow-500 border-yellow-600"
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />
  };

  return (
    <div className={`${styles[type]} text-white px-6 py-4 rounded-lg shadow-2xl border-2 flex items-center gap-3 min-w-[300px] max-w-md animate-slide-in`}>
      {icons[type]}
      <span className="flex-1 font-medium">{message}</span>
      <button onClick={onClose} className="hover:bg-white/20 rounded p-1 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Confirmation Modal Component
function ConfirmModal({ isOpen, onConfirm, onCancel, title, message }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminStaffTreatments() {
  const [formData, setFormData] = useState({ package: "", treatment: "" });
  const [treatments, setTreatments] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [toasts, setToasts] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, onConfirm: null, title: "", message: "" });

  const showToast = (message, type = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showConfirm = (title, message) => {
    return new Promise((resolve) => {
      setConfirmModal({
        isOpen: true,
        title,
        message,
        onConfirm: () => {
          setConfirmModal({ isOpen: false, onConfirm: null, title: "", message: "" });
          resolve(true);
        },
        onCancel: () => {
          setConfirmModal({ isOpen: false, onConfirm: null, title: "", message: "" });
          resolve(false);
        }
      });
    });
  };

  const fetchTreatments = async () => {
    try {
      setFetching(true);
      const res = await axios.get("/api/admin/staff-treatments");
      if (res.data.success) {
        setTreatments(res.data.data);
        showToast("Treatments loaded successfully", "success");
      } else {
        setTreatments([]);
        showToast("No treatments found", "info");
      }
    } catch (err) {
      console.error("Error fetching treatments:", err);
      showToast("Failed to load treatments", "error");
      setTreatments([]);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchTreatments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdd = async () => {
    if (!formData.package.trim() && !formData.treatment.trim()) {
      showToast("Please enter at least a package or a treatment", "warning");
      return;
    }

    try {
      setLoading(true);

      const payload = {};
      if (formData.package.trim()) payload.package = formData.package.trim();
      if (formData.treatment.trim()) payload.treatment = formData.treatment.trim();

      const res = await axios.post("/api/admin/staff-treatments", payload);

      if (res.data.success) {
        showToast("Record added successfully", "success");
        setFormData({ package: "", treatment: "" });
        fetchTreatments();
      }
    } catch (err) {
      console.error("Error adding record:", err);
      showToast("Failed to add record", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setFormData({ package: item.package || "", treatment: item.treatment || "" });
    setEditingId(item._id);
    showToast("Editing mode activated", "info");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdate = async () => {
    if (!editingId) return;

    try {
      setLoading(true);

      const payload = { id: editingId };
      payload.package = formData.package.trim() || "";
      payload.treatment = formData.treatment.trim() || "";

      const res = await axios.put("/api/admin/staff-treatments", payload);

      if (res.data.success) {
        showToast("Record updated successfully", "success");
        setEditingId(null);
        setFormData({ package: "", treatment: "" });
        fetchTreatments();
      }
    } catch (err) {
      console.error("Error updating record:", err);
      showToast("Failed to update record", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm(
      "Delete Record",
      "Are you sure you want to delete this item? This action cannot be undone."
    );
    
    if (!confirmed) return;

    try {
      setLoading(true);
      const res = await axios.delete(`/api/admin/staff-treatments?id=${id}`);
      if (res.data.success) {
        showToast("Record deleted successfully", "success");
        fetchTreatments();
      }
    } catch (err) {
      console.error("Error deleting:", err);
      showToast("Failed to delete record", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ package: "", treatment: "" });
    setEditingId(null);
    showToast("Edit cancelled", "info");
  };

  const filteredTreatments = treatments.filter(item => {
    if (activeTab === "packages") return item.package && item.package.trim();
    if (activeTab === "treatments") return item.treatment && item.treatment.trim();
    return true;
  });

  const packagesOnly = treatments.filter(t => t.package && t.package.trim());
  const treatmentsOnly = treatments.filter(t => t.treatment && t.treatment.trim());

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-3 sm:p-4 md:p-6 lg:p-8">
      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onConfirm={confirmModal.onConfirm}
        onCancel={confirmModal.onCancel}
        title={confirmModal.title}
        message={confirmModal.message}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
            Staff Treatments Management
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Manage packages and treatments for your staff</p>
        </div>

        {/* Form Section */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 md:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            {editingId ? (
              <>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <Edit2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Edit Record</h2>
              </>
            ) : (
              <>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Add New Entry</h2>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            {/* Package Input */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700">
                <Package className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-600 flex-shrink-0" />
                <span>Package Name</span>
              </label>
              <input
                type="text"
                name="package"
                value={formData.package}
                onChange={handleChange}
                placeholder="e.g., Premium Wellness Package"
                className="text-gray-700 w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
              <p className="text-xs text-gray-500">Optional - Leave empty if adding only treatment</p>
            </div>

            {/* Treatment Input */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700">
                <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-teal-600 flex-shrink-0" />
                <span>Treatment Name</span>
              </label>
              <textarea
                name="treatment"
                value={formData.treatment}
                onChange={handleChange}
                placeholder="e.g., Full Body Massage&#10;Aromatherapy&#10;Facial Treatment"
                rows="3"
                className="text-gray-700 w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
              />
              <p className="text-xs text-gray-500">Optional - Use new lines for multiple treatments</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
            {!editingId ? (
              <button
                onClick={handleAdd}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg sm:rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                {loading ? "Adding..." : "Add Record"}
              </button>
            ) : (
              <>
                <button
                  onClick={handleUpdate}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg sm:rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-initial"
                >
                  <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                  {loading ? "Updating..." : "Update Record"}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base bg-gray-500 text-white rounded-lg sm:rounded-xl font-semibold hover:bg-gray-600 transition-all flex-1 sm:flex-initial"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs sm:text-sm font-semibold opacity-90">Total Records</h3>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold">{treatments.length}</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs sm:text-sm font-semibold opacity-90">Packages</h3>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold">{packagesOnly.length}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs sm:text-sm font-semibold opacity-90">Treatments</h3>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold">{treatmentsOnly.length}</p>
          </div>
        </div>

        {/* List Section */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 md:p-8">
          {/* Tabs */}
          <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 p-1 bg-gray-100 rounded-lg sm:rounded-xl overflow-x-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 min-w-[90px] py-2 sm:py-2.5 px-2 sm:px-4 text-xs sm:text-sm md:text-base rounded-md sm:rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeTab === "all"
                  ? "bg-white text-indigo-600 shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All ({treatments.length})
            </button>
            <button
              onClick={() => setActiveTab("packages")}
              className={`flex-1 min-w-[90px] py-2 sm:py-2.5 px-2 sm:px-4 text-xs sm:text-sm md:text-base rounded-md sm:rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeTab === "packages"
                  ? "bg-white text-indigo-600 shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Packages ({packagesOnly.length})
            </button>
            <button
              onClick={() => setActiveTab("treatments")}
              className={`flex-1 min-w-[90px] py-2 sm:py-2.5 px-2 sm:px-4 text-xs sm:text-sm md:text-base rounded-md sm:rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeTab === "treatments"
                  ? "bg-white text-indigo-600 shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Treatments ({treatmentsOnly.length})
            </button>
          </div>

          {fetching ? (
            <div className="text-center py-8 sm:py-12">
              <div className="inline-block w-10 h-10 sm:w-12 sm:h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-500">Loading records...</p>
            </div>
          ) : filteredTreatments.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-base sm:text-lg">No records found</p>
              <p className="text-gray-400 text-xs sm:text-sm mt-2">Add your first package or treatment above</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4">
              {filteredTreatments.map((item) => (
                <div
                  key={item._id}
                  className="group border-2 border-gray-100 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:border-indigo-200 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-white to-gray-50"
                >
                  <div className="flex flex-col gap-3 sm:gap-4">
                    <div className="flex-1 space-y-2 sm:space-y-3">
                      {item.package && item.package.trim() && (
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 flex-shrink-0" />
                          <span className="inline-block bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 text-xs sm:text-sm font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg break-words">
                            {item.package}
                          </span>
                        </div>
                      )}
                      {item.treatment && item.treatment.trim() && (
                        <div className="flex items-start gap-2">
                          <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap leading-relaxed break-words">
                              {item.treatment}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handleEdit(item)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 text-xs sm:text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-medium shadow-md hover:shadow-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 text-xs sm:text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-medium shadow-md hover:shadow-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

AdminStaffTreatments.getLayout = function PageLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedDashboard = withAdminAuth(AdminStaffTreatments);
ProtectedDashboard.getLayout = AdminStaffTreatments.getLayout;

export default ProtectedDashboard;