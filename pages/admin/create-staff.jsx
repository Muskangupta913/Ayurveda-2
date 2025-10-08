// components/admin/CreateUser.jsx
import React, { useState, useEffect } from "react";
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
  const [staffList, setStaffList] = useState([]);

  // Fetch staff/doctors
  const fetchStaff = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.get("/api/admin/get-staff", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStaffList(res.data.staff);
    } catch (err) {
      setMessage(err.response?.data?.message || "Error fetching staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Approve / Decline action
  const handleAction = async (userId, action) => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.post(
        "/api/admin/update-staff-approval",
        { userId, action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      fetchStaff(); // refresh list
    } catch (err) {
      setMessage(err.response?.data?.message || "Error updating user");
    }
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
      const res = await axios.post("/api/admin/create-staff", form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Success toasts
      setMessage(res.data.message);
      setMessageType("success");
      addToast("success", `User ${form.name} has been created successfully!`, "Account Created");
      addToast("info", "Login credentials have been sent to the user's email", "Email Sent");
      
      // Reset form
      setForm({ name: "", email: "", password: "", role: "staff" });
      fetchStaff(); // refresh list after creating
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
    <div className="space-y-6">
      {/* Create User Form */}
      <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold mb-4">Create Staff / Doctor</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="staff">Staff</option>
            <option value="doctorStaff">Doctor</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            {loading ? "Creating..." : "Create User"}
          </button>
        </form>
        {message && (
          <p className="mt-3 text-center text-sm text-gray-700">{message}</p>
        )}
      </div>

      {/* Staff & Doctor List */}
      <div className="max-w-4xl mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Staff & Doctors</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {staffList.map((staff) => (
              <div key={staff._id} className="border p-4 rounded shadow-sm">
                <p><strong>Name:</strong> {staff.name}</p>
                <p><strong>Email:</strong> {staff.email}</p>
                <p><strong>Phone:</strong> {staff.phone || "-"}</p>
                <p>
                  <strong>Role:</strong>{" "}
                  {staff.role === "doctorStaff" ? "Doctor" : "Staff"}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {staff.isApproved
                    ? "Approved"
                    : staff.declined
                    ? "Declined"
                    : "Pending"}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => handleAction(staff._id, "approve")}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    disabled={staff.isApproved}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(staff._id, "decline")}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    disabled={staff.declined}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
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