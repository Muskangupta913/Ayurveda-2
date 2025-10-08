"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { CheckCircle, AlertCircle, Trash2, Edit3 } from "lucide-react";

export default function VendorForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    commissionPercentage: "",
    note: "",
  });

  const [vendors, setVendors] = useState([]);
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  // ✅ Fetch vendors
  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await axios.get("/api/admin/get-vendors");
      if (res.data.success) setVendors(res.data.data);
    } catch (err) {
      console.error("Error fetching vendors:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Submit form (Backend will decode `createdBy` from JWT)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("userToken"); // your JWT

      const config = {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      };

      if (editId) {
        // ✅ Update vendor
        const res = await axios.put(
          `/api/admin/update-vendor?id=${editId}`,
          formData,
          config
        );
        if (res.data.success) {
          setMessage({ type: "success", text: "Vendor updated successfully!" });
        }
      } else {
        // ✅ Create vendor
        const res = await axios.post(
          "/api/admin/create-vendor",
          formData,
          config
        );
        if (res.data.success) {
          setMessage({ type: "success", text: "Vendor created successfully!" });
        }
      }

      // ✅ Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        commissionPercentage: "",
        note: "",
      });
      setEditId(null);
      fetchVendors();
    } catch (err) {
      console.error("Error submitting vendor form:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Error saving vendor!",
      });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this vendor?")) return;
    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.delete(`/api/admin/delete-vendor?id=${id}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (res.data.success) {
        setMessage({ type: "success", text: "Vendor deleted successfully!" });
        fetchVendors();
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to delete vendor!" });
    }
  };

  const handleEdit = (vendor) => {
    setEditId(vendor._id);
    setFormData({
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone,
      address: vendor.address,
      commissionPercentage: vendor.commissionPercentage,
      note: vendor.note,
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">
        {editId ? "Update Vendor" : "Create Vendor"}
      </h1>

      {message.text && (
        <div
          className={`mb-4 flex items-center gap-2 p-3 rounded-lg ${
            message.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      {/* ✅ Vendor Form */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <input
          type="text"
          name="name"
          placeholder="Vendor Name"
          value={formData.name}
          onChange={handleChange}
          required
          className="border px-4 py-2 rounded-lg"
        />
        <input
          type="email"
          name="email"
          placeholder="Vendor Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="border px-4 py-2 rounded-lg"
        />
        <input
          type="text"
          name="phone"
          placeholder="Phone"
          value={formData.phone}
          onChange={handleChange}
          required
          className="border px-4 py-2 rounded-lg"
        />
        <input
          type="text"
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleChange}
          className="border px-4 py-2 rounded-lg"
        />
        <input
          type="number"
          name="commissionPercentage"
          placeholder="Commission %"
          value={formData.commissionPercentage}
          onChange={handleChange}
          required
          className="border px-4 py-2 rounded-lg"
        />
        <input
          type="text"
          name="note"
          placeholder="Note"
          value={formData.note}
          onChange={handleChange}
          className="border px-4 py-2 rounded-lg"
        />
        <button
          type="submit"
          className="md:col-span-2 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-all"
        >
          {editId ? "Update Vendor" : "Create Vendor"}
        </button>
      </form>

      {/* ✅ Vendor List */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-700">Vendors List</h2>
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200">
            <thead>
              <tr className="bg-gray-100 text-left text-sm font-semibold text-gray-700">
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Email</th>
                <th className="p-2 border">Phone</th>
                <th className="p-2 border">Commission %</th>
                <th className="p-2 border">Created By</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr key={v._id} className="border-t text-sm">
                  <td className="p-2">{v.name}</td>
                  <td className="p-2">{v.email}</td>
                  <td className="p-2">{v.phone}</td>
                  <td className="p-2">{v.commissionPercentage}%</td>
                  <td className="p-2">{v.createdBy}</td>
                  <td className="p-2 flex gap-2">
                    <button
                      onClick={() => handleEdit(v)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(v._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {vendors.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center p-4 text-gray-500">
                    No vendors found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
