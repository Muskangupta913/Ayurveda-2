import React, { useState, useEffect } from "react";
import axios from "axios";

export default function AllPettyCashAdmin() {
  const [pettyCashList, setPettyCashList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const adminToken = localStorage.getItem("adminToken");

  // Helper: get today's date in yyyy-mm-dd format
  const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Fetch petty cash + staff list
  const fetchPettyCash = async (
    staff = selectedStaff,
    start = startDate,
    end = endDate
  ) => {
    try {
      setLoading(true);

      const params = {};
      if (staff) params.staffName = staff;

      // 🔧 Handle date logic for single date selection
      let startParam = start;
      let endParam = end;

      if (start && !end) {
        endParam = start; // only start date selected → same day
        setEndDate(start);
      } else if (!start && end) {
        startParam = end; // only end date selected → same day
        setStartDate(end);
      } else if (!start && !end) {
        // default both to today
        startParam = getTodayDate();
        endParam = getTodayDate();
        setStartDate(startParam);
        setEndDate(endParam);
      }

      params.startDate = startParam;
      params.endDate = endParam;

      const res = await axios.get("/api/admin/getAllPettyCash", {
        headers: { Authorization: `Bearer ${adminToken}` },
        params,
      });

      setPettyCashList(res.data.data || []);
      if (res.data.staffList && staffList.length === 0)
        setStaffList(res.data.staffList);
    } catch (error) {
      console.error("Error fetching petty cash:", error);
      alert(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // On first render → show all staff + today's date
  useEffect(() => {
    const today = getTodayDate();
    setStartDate(today);
    setEndDate(today);
    fetchPettyCash("", today, today);
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">All Petty Cash Records (Admin)</h2>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={selectedStaff}
          onChange={(e) => setSelectedStaff(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">All Staff</option>
          {staffList.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border p-2 rounded"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border p-2 rounded"
        />

        <button
          onClick={() => fetchPettyCash(selectedStaff, startDate, endDate)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Filter
        </button>
      </div>

      {/* Data Table */}
      {loading ? (
        <p>Loading...</p>
      ) : pettyCashList.length > 0 ? (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Staff</th>
              <th className="p-2 border">Patients</th>
              <th className="p-2 border">Expenses</th>
              <th className="p-2 border">Total Allocated</th>
              <th className="p-2 border">Total Spent</th>
              <th className="p-2 border">Remaining</th>
            </tr>
          </thead>
          <tbody>
            {pettyCashList.map((item) => (
              <tr key={item.staff._id} className="text-center border-b">
                <td className="p-2 border">{item.staff.name}</td>
                <td className="p-2 border">
                  {item.patients.map((p) => (
                    <div key={p.name}>
                      {p.name} | {p.email} | {p.phone} | Allocated: ₹
                      {p.allocatedAmounts.reduce((s, a) => s + a.amount, 0)}
                    </div>
                  ))}
                </td>
                <td className="p-2 border">
                  {item.expenses.map((e, idx) => (
                    <div key={idx}>
                      {e.description}: ₹{e.spentAmount}
                    </div>
                  ))}
                </td>
                <td className="p-2 border">₹{item.totalAllocated}</td>
                <td className="p-2 border">₹{item.totalSpent}</td>
                <td className="p-2 border">₹{item.totalAmount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No records found.</p>
      )}
    </div>
  );
}