// pages/admin/create-user.jsx
import React, { useState } from "react";
import axios from "axios";
import AdminLayout from "../../components/AdminLayout";
import withAdminAuth from "../../components/withAdminAuth";
import { UserPlus, Mail, Lock, Users, CheckCircle, AlertCircle, X, Info, AlertTriangle } from "lucide-react";

// Toast Component
function Toast({ toast, onClose }) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
  };

  const styles = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    info: "bg-blue-50 border-blue-200 text-blue-800"
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg ${styles[toast.type]} animate-slideIn`}>
      {icons[toast.type]}
      <div className="flex-1">
        {toast.title && <p className="font-semibold text-sm mb-1">{toast.title}</p>}
        <p className="text-sm">{toast.message}</p>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Toast Container
function ToastContainer({ toasts, onClose }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md w-full px-4">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}

function CreateUser() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [toasts, setToasts] = useState([]);

  // Toast helper function
const addToast = (type, message, title = null) => {
  const id = Date.now();
  const newToast = { id, type, message, title };
  setToasts(prev => [...prev, newToast]);

  // Auto-remove toast after 5 seconds
  const timer = setTimeout(() => {
    removeToast(id);
  }, 5000);

  // Optional: store timer ID in the toast object (for cleanup if removed early)
  newToast.timer = timer;
};


const removeToast = (id) => {
  setToasts(prev => {
    const toastToRemove = prev.find(t => t.id === id);
    if (toastToRemove?.timer) {
      clearTimeout(toastToRemove.timer); // Prevent multiple triggers
    }
    return prev.filter(toast => toast.id !== id);
  });
};

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    
    // Clear any validation messages when user starts typing
    if (message) {
      setMessage("");
      setMessageType("");
    }
  };

  const validateForm = () => {
    // Name validation
    if (form.name.trim().length < 2) {
      addToast("warning", "Please enter a valid full name (at least 2 characters)", "Validation Error");
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      addToast("warning", "Please enter a valid email address", "Invalid Email");
      return false;
    }

    // Password validation
    if (form.password.length < 6) {
      addToast("warning", "Password must be at least 6 characters long", "Weak Password");
      return false;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])/.test(form.password)) {
      addToast("info", "Consider using uppercase and lowercase letters for a stronger password", "Password Tip");
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage("");
    setMessageType("");
    
    // Show loading toast
    addToast("info", "Creating user account...", "Please Wait");

    try {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        addToast("error", "Authentication token not found. Please log in again.", "Authentication Error");
        setLoading(false);
        return;
      }

      const res = await axios.post("/api/admin/create-staff", form, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Success toasts
      setMessage(res.data.message);
      setMessageType("success");
      addToast("success", `User ${form.name} has been created successfully!`, "Account Created");
      addToast("info", "Login credentials have been sent to the user's email", "Email Sent");
      
      // Reset form
      setForm({ name: "", email: "", password: "", role: "staff" });
      
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || "Error creating user";
      
      setMessage(errorMessage);
      setMessageType("error");

      // Specific error handling with different toast types
      if (err.response?.status === 401) {
        addToast("error", "Your session has expired. Please log in again.", "Session Expired");
      } else if (err.response?.status === 409) {
        addToast("error", "A user with this email already exists in the system.", "Duplicate Email");
      } else if (err.response?.status === 403) {
        addToast("error", "You don't have permission to perform this action.", "Access Denied");
      } else if (err.response?.status === 400) {
        addToast("warning", errorMessage, "Invalid Input");
      } else if (err.response?.status >= 500) {
        addToast("error", "Server error occurred. Please try again later.", "Server Error");
      } else if (!err.response) {
        addToast("error", "Network error. Please check your connection.", "Connection Failed");
      } else {
        addToast("error", errorMessage, "Error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Show info toast on page load (optional)
  React.useEffect(() => {
    addToast("info", "Fill in all required fields to create a new user account", "Welcome");
  }, []);

  return (
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      <div className="h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full">
          {/* Header Section */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-full mb-3 shadow-lg">
              <UserPlus className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Create New User</h1>
            <p className="text-sm text-gray-600">Add a new staff member or doctor to the system</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-5">
              <h2 className="text-lg font-semibold text-white">User Information</h2>
              <p className="text-blue-100 text-xs mt-1">Fill in the details below to create an account</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter full name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-700 placeholder-gray-400"
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="name@example.com"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-700 placeholder-gray-400"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    placeholder="Create a secure password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-700 placeholder-gray-400"
                    required
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Role
                </label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-700 bg-white cursor-pointer"
                  required
                >
                  <option value="staff">Staff Member</option>
                  <option value="doctorStaff">Doctor</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating User...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Create User Account
                  </>
                )}
              </button>
            </form>

            {/* Message Display */}
            {message && (
              <div className="px-8 pb-6">
                <div
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    messageType === "success"
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  {messageType === "success" ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <p
                    className={`text-sm font-medium ${
                      messageType === "success" ? "text-green-800" : "text-red-800"
                    }`}
                  >
                    {message}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Info Footer */}
          <div className="mt-4 text-center text-xs text-gray-600">
            <p>Users will receive their credentials via email after account creation</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

// -------------------------------
// PAGE LAYOUT
// -------------------------------
CreateUser.getLayout = function PageLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

// -------------------------------
// PROTECTED PAGE
// -------------------------------
const ProtectedCreateUser = withAdminAuth(CreateUser);
ProtectedCreateUser.getLayout = CreateUser.getLayout;

export default ProtectedCreateUser;