import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AdminStaffTreatments() {
  const [formData, setFormData] = useState({ package: "", treatment: "" });
  const [treatments, setTreatments] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // -------------------------------
  // FETCH TREATMENTS
  // -------------------------------
  const fetchTreatments = async () => {
    try {
      setFetching(true);
      const res = await axios.get("/api/admin/staff-treatments");
      if (res.data.success) setTreatments(res.data.data);
      else setTreatments([]);
    } catch (err) {
      console.error("Error fetching treatments:", err);
      alert("Failed to load treatments");
      setTreatments([]);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchTreatments();
  }, []);

  // -------------------------------
  // HANDLE INPUT CHANGE
  // -------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // -------------------------------
  // ADD RECORD (PACKAGE, TREATMENT, or BOTH)
  // -------------------------------
  const handleAdd = async () => {
    if (!formData.package.trim() && !formData.treatment.trim()) {
      alert("Please enter at least a package or a treatment");
      return;
    }

    try {
      setLoading(true);

      const payload = {};
      if (formData.package.trim()) payload.package = formData.package.trim();
      if (formData.treatment.trim()) payload.treatment = formData.treatment.trim();

      const res = await axios.post("/api/admin/staff-treatments", payload);

      if (res.data.success) {
        alert("Record added successfully");
        setFormData({ package: "", treatment: "" });
        fetchTreatments();
      }
    } catch (err) {
      console.error("Error adding record:", err);
      alert("Failed to add record");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------
  // EDIT RECORD
  // -------------------------------
  const handleEdit = (item) => {
    setFormData({ package: item.package || "", treatment: item.treatment || "" });
    setEditingId(item._id);
  };

  // -------------------------------
  // UPDATE RECORD
  // -------------------------------
  const handleUpdate = async () => {
    if (!editingId) return;

    try {
      setLoading(true);

      const payload = { id: editingId };
      if (formData.package.trim()) payload.package = formData.package.trim();
      else payload.package = ""; // clear package if empty
      if (formData.treatment.trim()) payload.treatment = formData.treatment.trim();
      else payload.treatment = ""; // clear treatment if empty

      const res = await axios.put("/api/admin/staff-treatments", payload);

      if (res.data.success) {
        alert("Record updated successfully");
        setEditingId(null);
        setFormData({ package: "", treatment: "" });
        fetchTreatments();
      }
    } catch (err) {
      console.error("Error updating record:", err);
      alert("Failed to update record");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------
  // DELETE RECORD
  // -------------------------------
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      setLoading(true);
      const res = await axios.delete(`/api/admin/staff-treatments?id=${id}`);
      if (res.data.success) fetchTreatments();
    } catch (err) {
      console.error("Error deleting:", err);
      alert("Failed to delete record");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------
  // CANCEL EDIT
  // -------------------------------
  const handleCancel = () => {
    setFormData({ package: "", treatment: "" });
    setEditingId(null);
  };

  // -------------------------------
  // UI
  // -------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            {editingId ? "Edit Record" : "Add Package / Treatment"}
          </h1>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Package</label>
              <input
                type="text"
                name="package"
                value={formData.package}
                onChange={handleChange}
                placeholder="Enter package name (optional)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Treatment</label>
              <input
                type="text"
                name="treatment"
                value={formData.treatment}
                onChange={handleChange}
                placeholder="Enter treatment name (optional)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              {!editingId ? (
                <button
                  onClick={handleAdd}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200"
                >
                  {loading ? "Saving..." : "Add Record"}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleUpdate}
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
                  >
                    {loading ? "Updating..." : "Update"}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-6 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Treatments List */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">All Packages & Treatments</h2>

          {fetching ? (
            <p className="text-gray-500">Loading treatments...</p>
          ) : treatments.length === 0 ? (
            <p className="text-gray-500">No records found.</p>
          ) : (
            <div className="space-y-4">
              {treatments.map((item) => (
                <div
                  key={item._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {item.package && (
                        <div className="mb-2">
                          <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                            {item.package}
                          </span>
                        </div>
                      )}
                      {item.treatment && (
                        <p className="text-gray-700 whitespace-pre-wrap">{item.treatment}</p>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(item)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium"
                      >
                        Delete
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
