"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminEodNotes = () => {
  const [notes, setNotes] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState("");

  const token = localStorage.getItem("adminToken");

  const fetchAllNotes = async (date = "", staff = "") => {
    try {
      const query = [];
      if (date) query.push(`date=${date}`);
      if (staff) query.push(`staffName=${encodeURIComponent(staff)}`);

      const url = `/api/admin/getAllEodNotes${query.length ? `?${query.join("&")}` : ""}`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotes(res.data.eodNotes || []);
      setStaffList(res.data.staffList || []);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error fetching notes");
    }
  };

  useEffect(() => {
    fetchAllNotes();
  }, []);

  const handleFilterChange = () => {
    fetchAllNotes(selectedDate, selectedStaff);
  };

  const handleClear = () => {
    setSelectedDate("");
    setSelectedStaff("");
    fetchAllNotes();
  };

  return (
    <div className="max-w-5xl mx-auto mt-10 bg-white p-6 rounded-xl shadow">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        🧾 All Staff EOD Notes (Admin View)
      </h2>

      {/* 🔍 Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            📅 Date:
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border rounded-md p-2"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">
            👤 Staff Name:
          </label>
          <select
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            className="border rounded-md p-2 w-48"
          >
            <option value="">All Staff</option>
            {staffList.map((name, i) => (
              <option key={i} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleFilterChange}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Apply Filter
        </button>

        <button
          onClick={handleClear}
          className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
        >
          Clear
        </button>
      </div>

      {/* 🗒️ Notes Display */}
     {/* 🗒️ Notes Display */}
{notes.length === 0 ? (
  <p className="text-gray-500 text-center">No EOD notes found.</p>
) : (
  <div className="space-y-3">
    {notes.map((n, i) => (
      <div
        key={i}
        className="border p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition"
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-blue-700">{n.staffName}</h3>
          <span className="text-xs text-gray-400">
            {new Date(n.createdAt).toLocaleString()}
          </span>
        </div>
        <p className="text-gray-800 whitespace-pre-wrap">{n.note}</p>
      </div>
    ))}
  </div>
)}

    </div>
  );
};

export default AdminEodNotes;
