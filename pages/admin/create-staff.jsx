// components/admin/CreateUser.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

export default function CreateUser() {
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.post("/api/admin/create-staff", form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage(res.data.message);
      setForm({ name: "", email: "", password: "", role: "staff" });
      fetchStaff(); // refresh list after creating
    } catch (err) {
      setMessage(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Error creating user"
      );
    } finally {
      setLoading(false);
    }
  };

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
