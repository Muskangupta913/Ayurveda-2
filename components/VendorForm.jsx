"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { CheckCircle, AlertCircle, Trash2, Edit3, Plus, X, Search, Mail, Phone, MapPin, Percent } from "lucide-react";

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
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    const filtered = vendors.filter((v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.phone.includes(searchQuery)
    );
    setFilteredVendors(filtered);
  }, [searchQuery, vendors]);

  const fetchVendors = async () => {
    try {
      const res = await axios.get("/api/admin/get-vendors");
      if (res.data.success) {
        setVendors(res.data.data);
        setFilteredVendors(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching vendors:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("userToken");
      const config = {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      };

      if (editId) {
        const res = await axios.put(
          `/api/admin/update-vendor?id=${editId}`,
          formData,
          config
        );
        if (res.data.success) {
          setMessage({ type: "success", text: "Vendor updated successfully!" });
        }
      } else {
        const res = await axios.post(
          "/api/admin/create-vendor",
          formData,
          config
        );
        if (res.data.success) {
          setMessage({ type: "success", text: "Vendor created successfully!" });
        }
      }

      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        commissionPercentage: "",
        note: "",
      });
      setEditId(null);
      setIsModalOpen(false);
      fetchVendors();
      
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      console.error("Error submitting vendor form:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Error saving vendor!",
      });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
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
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to delete vendor!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
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
    setIsModalOpen(true);
  };

  const openModal = () => {
    setEditId(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      commissionPercentage: "",
      note: "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      commissionPercentage: "",
      note: "",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Vendor Management</h1>
            <p className="text-gray-800 mt-1">Manage your vendors efficiently</p>
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add Vendor</span>
          </button>
        </div>

        {/* Success/Error Message */}
        {message.text && (
          <div
            className={`mb-6 flex items-center gap-2 p-4 rounded-lg shadow-md ${
              message.type === "success"
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-red-100 text-red-700 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="text-sm sm:text-base">{message.text}</span>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-800 w-5 h-5" />
            <input
              type="text"
              placeholder="Search vendors by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-gray-800 w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
            />
          </div>
        </div>

        {/* Vendor Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredVendors.map((vendor) => (
            <div
              key={vendor._id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
            >
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2"></div>
              <div className="p-5 sm:p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 truncate pr-2">
                    {vendor.name}
                  </h3>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(vendor)}
                      className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-all"
                      title="Edit Vendor"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(vendor._id)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                      title="Delete Vendor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-800">
                    <Mail className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <span className="text-sm truncate">{vendor.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-800">
                    <Phone className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <span className="text-sm">{vendor.phone}</span>
                  </div>
                  {vendor.address && (
                    <div className="flex items-start gap-3 text-gray-800">
                      <MapPin className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm line-clamp-2">{vendor.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-gray-800">
                    <Percent className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <span className="text-sm font-medium">
                      Commission: {vendor.commissionPercentage}%
                    </span>
                  </div>
                  {vendor.note && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-800 italic line-clamp-2">
                        {vendor.note}
                      </p>
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-800">
                      Created by: <span className="font-medium text-gray-800">{vendor.createdBy}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredVendors.length === 0 && (
          <div className="text-center py-12 sm:py-16">
            <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
              <Search className="w-12 h-12 text-gray-800" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
              No vendors found
            </h3>
            <p className="text-gray-800 text-sm sm:text-base">
              {searchQuery ? "Try adjusting your search criteria" : "Get started by adding your first vendor"}
            </p>
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop with blur */}
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={closeModal}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                  {editId ? "Update Vendor" : "Add New Vendor"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vendor Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter vendor name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="text-gray-800 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="vendor@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="text-gray-800 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone *
                    </label>
                    <input
                      type="text"
                      name="phone"
                      placeholder="+1 234 567 8900"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="text-gray-800 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Commission % *
                    </label>
                    <input
                      type="number"
                      name="commissionPercentage"
                      placeholder="10"
                      value={formData.commissionPercentage}
                      onChange={handleChange}
                      required
                      min="0"
                      max="100"
                      step="0.01"
                      className="text-gray-800 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    placeholder="Enter vendor address"
                    value={formData.address}
                    onChange={handleChange}
                    className="text-gray-800 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note
                  </label>
                  <textarea
                    name="note"
                    placeholder="Add any additional notes..."
                    value={formData.note}
                    onChange={handleChange}
                    rows="3"
                    className="text-gray-800 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium shadow-md hover:shadow-lg"
                  >
                    {editId ? "Update Vendor" : "Create Vendor"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}