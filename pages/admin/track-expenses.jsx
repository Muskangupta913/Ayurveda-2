import React, { useState, useEffect } from "react";
import axios from "axios";

export default function AllPettyCashAdmin() {
  const [pettyCashList, setPettyCashList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedReceipts, setSelectedReceipts] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const adminToken = localStorage.getItem("adminToken");

  const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const fetchPettyCash = async (
    staff = selectedStaff,
    start = startDate,
    end = endDate
  ) => {
    try {
      setLoading(true);
      const params = {};
      if (staff) params.staffName = staff;

      let startParam = start;
      let endParam = end;

      if (start && !end) {
        endParam = start;
        setEndDate(start);
      } else if (!start && end) {
        startParam = end;
        setStartDate(end);
      } else if (!start && !end) {
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

  useEffect(() => {
    const today = getTodayDate();
    setStartDate(today);
    setEndDate(today);
    fetchPettyCash("", today, today);
  }, []);

  const openViewer = (receipts) => {
    setSelectedReceipts(receipts);
    setShowModal(true);
  };

  const isImage = (url) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  const isPDF = (url) => /\.pdf$/i.test(url);

  return (
    <div className="p-6 text-gray-800">
      <h2 className="text-xl font-bold mb-4">All Petty Cash Records (Admin)</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <select
          value={selectedStaff}
          onChange={(e) => setSelectedStaff(e.target.value)}
          className="border p-2 rounded w-48"
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
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Filter
        </button>
      </div>

      {/* Data Table */}
      {loading ? (
        <p>Loading...</p>
      ) : pettyCashList.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border text-sm md:text-base">
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
                  <td className="p-2 border font-semibold">{item.staff.name}</td>

                  {/* Patients with Allocations */}
                  <td className="p-2 border text-left">
                    {item.patients.map((p) => (
                      <div key={p.name} className="mb-2 border-b border-gray-100 pb-1">
                        <p className="font-semibold">
                          {p.name}{" "}
                          <span className="text-sm text-gray-500">({p.phone})</span>
                        </p>
                        {p.allocatedAmounts.map((a, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center mt-1"
                          >
                            <span>Allocated: ₹{a.amount}</span>
                            {a.receipts?.length > 0 && (
                              <button
                                onClick={() => openViewer(a.receipts)}
                                className="text-blue-600 hover:underline"
                              >
                                View
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </td>

                  {/* Expenses */}
                  <td className="p-2 border text-left">
                    {item.expenses.map((e, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center border-b border-gray-100 py-1"
                      >
                        <span>
                          {e.description}: ₹{e.spentAmount}
                        </span>
                        {e.receipts?.length > 0 && (
                          <button
                            onClick={() => openViewer(e.receipts)}
                            className="text-blue-600 hover:underline"
                          >
                            View
                          </button>
                        )}
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
        </div>
      ) : (
        <p>No records found.</p>
      )}

      {/* Viewer Modal (for Image + PDF) */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 w-full md:w-2/3 lg:w-1/2 shadow-lg relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              Close
            </button>
            <h3 className="text-lg font-bold mb-3">Receipts</h3>
            <div className="flex flex-col gap-4">
              {selectedReceipts.map((file, idx) => (
                <div key={idx} className="border rounded-lg p-2">
                  {isImage(file) ? (
                    <img
                      src={file}
                      alt={`Receipt ${idx + 1}`}
                      className="w-full h-60 object-contain rounded-lg"
                    />
                  ) : isPDF(file) ? (
                    <iframe
                      src={file}
                      title={`PDF Receipt ${idx + 1}`}
                      className="w-full h-80 border rounded-lg"
                    ></iframe>
                  ) : (
                    <a
                      href={file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      Open File {idx + 1}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
