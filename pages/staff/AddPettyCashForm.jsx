// components/PettyCashAndExpense.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import ClinicLayout from '../../components/staffLayout';
import withClinicAuth from '../../components/withStaffAuth';

function PettyCashAndExpense() {
  // ---------- STATE ----------
  const [form, setForm] = useState({
    patientName: "",
    patientEmail: "",
    patientPhone: "",
    note: "",
    allocatedAmounts: [""],
    receipts: [], // ensure defined
  });
  const [expenseForm, setExpenseForm] = useState({
    description: "",
    spentAmount: "",
    receipts: [], // ensure defined
  });

  const [message, setMessage] = useState("");
  const [expenseMsg, setExpenseMsg] = useState("");
  const [pettyCashList, setPettyCashList] = useState([]);
  const [search, setSearch] = useState("");

  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editType, setEditType] = useState(""); // "allocated" or "expense"
  const [receiptUrls, setReceiptUrls] = useState([]);
  const [expenseReceiptUrls, setExpenseReceiptUrls] = useState([]);
  // UI state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showPettyModal, setShowPettyModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", tone: "success" });
  const [expenseSearch, setExpenseSearch] = useState("");
  // Local previews before submit
  const [pettyPreviews, setPettyPreviews] = useState([]); // array of { url, file }
  const [expensePreviews, setExpensePreviews] = useState([]); // array of { url, file }

  // ---------- GLOBAL DATE HANDLING ----------
  const toInputDate = (d) => {
    const dt = new Date(d);
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const [selectedDate, setSelectedDate] = useState(toInputDate(new Date()));
  const [globalData, setGlobalData] = useState({
    globalAllocated: 0,
    globalSpent: 0,
    globalRemaining: 0,
    patients: [],
  });

  const isTodaySelected =
    selectedDate === new Date().toISOString().split("T")[0];

  const [filteredExpenses, setFilteredExpenses] = useState([]);

  const staffToken =
    typeof window !== "undefined" ? localStorage.getItem("userToken") : null;

  // ---------- FETCH FUNCTIONS ----------
  const fetchPettyCash = async (query = "") => {
    try {
      const res = await axios.get(
        `/api/pettycash/getpettyCash${query ? `?search=${query}` : ""}`,
        { headers: { Authorization: `Bearer ${staffToken}` } }
      );
      setPettyCashList(res.data.pettyCashList);
      filterExpensesByDate(res.data.pettyCashList, selectedDate);
    } catch (error) {
      console.error("Error fetching petty cash:", error);
    }
  };

  const filterExpensesByDate = (cashList, dateStr) => {
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);

    const allExpenses = [];
    cashList.forEach((record) => {
      record.expenses.forEach((expense) => {
        const expDate = new Date(expense.date);
        if (expDate >= targetDate && expDate < nextDay) {
          allExpenses.push({
            ...expense,
            patientName: record.patientName,
            patientEmail: record.patientEmail,
          });
        }
      });
    });
    setFilteredExpenses(allExpenses);
  };

  const fetchGlobalTotals = async (dateStr) => {
    try {
      const res = await axios.get(
        `/api/pettycash/getTotalAmount${dateStr ? `?date=${dateStr}` : ""}`,
        { headers: { Authorization: `Bearer ${staffToken}` } }
      );
      if (res.data.success) {
        setGlobalData({
          globalAllocated: res.data.globalAllocated || 0,
          globalSpent: res.data.globalSpent || 0,
          globalRemaining: res.data.globalRemaining || 0,
          patients: res.data.patients || [],
        });
      }
    } catch (err) {
      console.error("Error fetching global totals:", err);
    }
  };

  useEffect(() => {
    fetchPettyCash();
    fetchGlobalTotals(selectedDate);
  }, []);

  useEffect(() => {
    fetchGlobalTotals(selectedDate);
    filterExpensesByDate(pettyCashList, selectedDate);
  }, [selectedDate]);

  // ---------- INPUT HANDLERS ----------
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleExpenseChange = (e) =>
    setExpenseForm({ ...expenseForm, [e.target.name]: e.target.value });

  const handleAmountChange = (index, value) => {
    const updated = [...form.allocatedAmounts];
    updated[index] = value;
    setForm({ ...form, allocatedAmounts: updated });
  };

  const addAmountField = () =>
    setForm({ ...form, allocatedAmounts: [...form.allocatedAmounts, ""] });

  // ---------- FILE INPUT HANDLERS WITH PREVIEWS ----------
  const handlePettyFilesChange = (e) => {
    const filesArray = Array.from(e.target.files || []);
    const previews = filesArray.map((file) => ({ url: URL.createObjectURL(file), file }));
    setForm({ ...form, receipts: filesArray });
    setPettyPreviews(previews);
  };

  const removePettyPreviewAt = (index) => {
    const newPreviews = pettyPreviews.filter((_, i) => i !== index);
    const newFiles = (form.receipts || []).filter((_, i) => i !== index);
    setPettyPreviews(newPreviews);
    setForm({ ...form, receipts: newFiles });
  };

  const handleExpenseFilesChange = (e) => {
    const filesArray = Array.from(e.target.files || []);
    const previews = filesArray.map((file) => ({ url: URL.createObjectURL(file), file }));
    setExpenseForm({ ...expenseForm, receipts: filesArray });
    setExpensePreviews(previews);
  };

  const removeExpensePreviewAt = (index) => {
    const newPreviews = expensePreviews.filter((_, i) => i !== index);
    const newFiles = (expenseForm.receipts || []).filter((_, i) => i !== index);
    setExpensePreviews(newPreviews);
    setExpenseForm({ ...expenseForm, receipts: newFiles });
  };

  // ---------- CLOUDINARY UPLOAD ----------
  const uploadToCloudinary = async (files) => {
    if (!files?.length) return [];
    const uploadedUrls = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
      );

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`,
        { method: "POST", body: formData }
      );

      const data = await res.json();
      if (data.secure_url) uploadedUrls.push(data.secure_url);
    }

    return uploadedUrls;
  };

  // ---------- SUBMIT ALLOCATED (PETTY CASH) ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Build multipart FormData to match API (multer with bodyParser disabled)
      const formData = new FormData();
      formData.append("patientName", form.patientName);
      formData.append("patientEmail", form.patientEmail);
      formData.append("patientPhone", form.patientPhone);
      formData.append("note", form.note || "");
      formData.append(
        "allocatedAmounts",
        JSON.stringify(form.allocatedAmounts.filter((a) => a !== ""))
      );

      if (Array.isArray(form.receipts) && form.receipts.length > 0) {
        form.receipts.forEach((file) => formData.append("receipts", file));
      }

      if (editMode && editType === "allocated") {
        // Update existing allocated amount. If new files selected, upload and include receipts
        let receiptsForUpdate = [];
        const hasNewFiles = Array.isArray(form.receipts) && form.receipts.length > 0 && form.receipts[0] instanceof File;
        if (hasNewFiles) {
          receiptsForUpdate = await uploadToCloudinary(form.receipts);
        } else if (Array.isArray(form.receipts)) {
          receiptsForUpdate = form.receipts; // assume they are urls
        }

        await axios.put(
          "/api/pettycash/update",
          {
            id: editingId,
            type: "allocated",
            data: {
              newAmount: Number(form.allocatedAmounts[0]),
              receipts: receiptsForUpdate,
              note: form.note,
            },
          },
          { headers: { Authorization: `Bearer ${staffToken}` } }
        );
      } else {
        // Add new via multipart
        await axios.post("/api/pettycash/add", formData, {
          headers: {
            Authorization: `Bearer ${staffToken}`,
            "Content-Type": "multipart/form-data",
          },
        });
      }

      setEditMode(false);
      setEditingId(null);
      setForm({
        patientName: "",
        patientEmail: "",
        patientPhone: "",
        note: "",
        allocatedAmounts: [""],
        receipts: [],
      });
      setPettyPreviews([]);
      fetchPettyCash();
      fetchGlobalTotals(selectedDate);
      // Close modal on success
      setShowPettyModal(false);
      alert(editMode ? "Record updated successfully!" : "Petty Cash added!");
    } catch (err) {
      console.error("Error submitting petty cash:", err);
      alert(err.response?.data?.message || "Something went wrong!");
    }
  };

  // ---------- SUBMIT EXPENSE ----------
  // ---------- SUBMIT EXPENSE ----------
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      // For edit mode, continue using JSON update API
      if (editMode && editType === "expense") {
        const hasNewFiles =
          expenseForm.receipts &&
          expenseForm.receipts instanceof FileList &&
          expenseForm.receipts.length > 0;

        let receiptsForUpdate = [];
        if (hasNewFiles) {
          receiptsForUpdate = await uploadToCloudinary(expenseForm.receipts);
        } else if (Array.isArray(expenseForm.receipts)) {
          receiptsForUpdate = expenseForm.receipts;
        }

        await axios.put(
          "/api/pettycash/update",
          {
            id: editingId, // pettyCash id
            type: "expense",
            data: {
              expenseId: expenseForm.expenseId,
              description: expenseForm.description,
              spentAmount: Number(expenseForm.spentAmount),
              receipts: receiptsForUpdate,
            },
          },
          { headers: { Authorization: `Bearer ${staffToken}` } }
        );
      } else {
        // Build multipart form-data for API (no pettyCashId; backend will use general record)
        const formData = new FormData();
        formData.append("description", expenseForm.description);
        formData.append("spentAmount", String(expenseForm.spentAmount));

        if (expenseForm.receipts) {
          if (Array.isArray(expenseForm.receipts)) {
            expenseForm.receipts.forEach((file) => formData.append("receipts", file));
          } else if (expenseForm.receipts instanceof FileList) {
            Array.from(expenseForm.receipts).forEach((file) => formData.append("receipts", file));
          }
        }

        await axios.post("/api/pettycash/add-expense", formData, {
          headers: {
            Authorization: `Bearer ${staffToken}`,
            "Content-Type": "multipart/form-data",
          },
        });
      }

      // ✅ Reset form properly
      setExpenseForm({ description: "", spentAmount: "", receipts: [] });
      setEditMode(false);
      setEditingId(null);
      fetchPettyCash();
      fetchGlobalTotals(selectedDate);
      // Close modal on success
      setShowExpenseModal(false);
      alert(editMode ? "Expense updated successfully!" : "Expense added!");
    } catch (err) {
      console.error("Error updating expense:", err);
      alert("Error: " + (err.response?.data?.message || "Something went wrong"));
    }
  };

  // ---------- SEARCH ----------
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    fetchPettyCash(value);
  };

  // ---------- FILTER RECORDS ----------
  const getFilteredPettyCashRecords = () => {
    const targetDate = new Date(selectedDate);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);

    return pettyCashList.filter((record) => {
      const hasAllocations = record.allocatedAmounts.some((alloc) => {
        const allocDate = new Date(alloc.date);
        return allocDate >= targetDate && allocDate < nextDay;
      });
      const hasExpenses = record.expenses.some((exp) => {
        const expDate = new Date(exp.date);
        return expDate >= targetDate && expDate < nextDay;
      });
      return hasAllocations || hasExpenses;
    });
  };

  const filteredRecords = getFilteredPettyCashRecords();

  // ---------- DELETE ----------
  const handleDeletePatient = async (pettyCashId) => {
    if (!confirm("Are you sure you want to delete this patient record?")) return;
    try {
      await axios.delete("/api/pettycash/delete-pattycash", {
        headers: { Authorization: `Bearer ${staffToken}` },
        data: { type: "patient", pettyCashId },
      });
      fetchPettyCash();
      fetchGlobalTotals(selectedDate);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error deleting patient");
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (pettyCashList.length === 0) return;
    const pettyCashId = pettyCashList[0]._id;
    if (!confirm("Delete this expense?")) return;

    try {
      await axios.delete("/api/pettycash/delete-pattycash", {
        headers: { Authorization: `Bearer ${staffToken}` },
        data: { type: "expense", pettyCashId, expenseId },
      });
      fetchPettyCash();
      fetchGlobalTotals(selectedDate);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error deleting expense");
    }
  };

  // ---------- EDIT ----------
  const handleEdit = (item, type, pettyCashId = null) => {
    setEditMode(true);
    setEditType(type);

    if (type === "allocated") {
      setEditingId(item._id);
      setForm({
        patientName: item.patientName,
        patientEmail: item.patientEmail,
        patientPhone: item.patientPhone,
        note: item.note,
        allocatedAmounts: [item.allocatedAmounts?.[0]?.amount || ""],
        receipts: item.allocatedAmounts?.[0]?.receipts || [],
      });
      // Open petty cash modal for editing allocated amount
      setShowPettyModal(true);
    } else if (type === "expense") {
      // ✅ Validation: Find parent if not provided
      if (!pettyCashId) {
        const parent = pettyCashList.find(record =>
          record.expenses.some(e => e._id === item._id)
        );
        pettyCashId = parent?._id;
      }

      if (!pettyCashId) {
        alert("Error: Could not find parent record for this expense");
        return;
      }

      setEditingId(pettyCashId); // 👈 set parent pettyCash _id
      setExpenseForm({
        expenseId: item._id, // 👈 store expense id separately
        description: item.description || "",
        spentAmount: item.spentAmount || "",
        receipts: item.receipts || [],
      });
      setExpenseReceiptUrls(item.receipts || []);
      // Open expense modal for editing
      setShowExpenseModal(true);
    }
  };


  return (
    <div className="max-w-6xl mx-auto bg-white shadow-md rounded-lg p-6">
      {/* Header + Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h2 className="text-2xl font-semibold text-gray-700">Petty Cash</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowExpenseModal(true)} className="px-3 py-2 border rounded text-gray-700 hover:bg-gray-50">＋ Add Expense</button>
          <button onClick={() => setShowPettyModal(true)} className="px-3 py-2 border rounded text-gray-700 hover:bg-gray-50">＋ Add Petty Cash</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="flex items-center gap-3">
          <label className="text-gray-700">Select Date:</label>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="border p-2 rounded text-gray-700" />
        </div>
        <input
          type="text"
          value={expenseSearch}
          onChange={(e) => {
            setExpenseSearch(e.target.value);
            const v = e.target.value.toLowerCase();
            const filtered = [];
            pettyCashList.forEach((r) => (r.expenses || []).forEach((ex) => {
              if ((ex.description || "").toLowerCase().includes(v)) filtered.push({ ...ex });
            }));
            setFilteredExpenses(filtered);
          }}
          placeholder="Search expenses..."
          className="border p-2 rounded w-full md:w-72 text-gray-700"
        />
      </div>

      {/* Date filter */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <label className="font-medium">Select Date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border p-2 rounded"
        />
      </div>

      {/* Modals */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-40 p-4">
          <div className="max-w-xl mx-auto bg-white border rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-3 text-blue-700">
              Add Expense
            </h3>
            {/* Expense Form */}
            <form onSubmit={handleExpenseSubmit} className="space-y-3">
              <input
                type="text"
                name="description"
                placeholder="Expense Description"
                value={expenseForm.description}
                onChange={handleExpenseChange}
                className="w-full border p-2 rounded"
                required
              />

              <input
                type="number"
                name="spentAmount"
                placeholder="Spent Amount"
                value={expenseForm.spentAmount}
                onChange={handleExpenseChange}
                className="w-full border p-2 rounded"
                required
              />

              <input
                type="file"
                name="receipts"
                multiple
                onChange={handleExpenseFilesChange}
                className="w-full border p-2 rounded"
              />

              {/* Previews for newly selected expense receipts (before submit) */}
              {expensePreviews.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {expensePreviews.map((p, idx) => (
                    <div key={idx} className="relative">
                      <img src={p.url} alt={`New Receipt ${idx + 1}`} className="w-full h-20 object-cover rounded border" />
                      <button
                        type="button"
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 text-xs"
                        onClick={() => removeExpensePreviewAt(idx)}
                        aria-label="Remove receipt"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {editMode && editType === "expense" && expenseReceiptUrls?.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {expenseReceiptUrls.map((url, idx) => (
                    <a
                      key={idx}
                      href={url.url || url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={url.url || url}
                        alt={`Receipt ${idx + 1}`}
                        className="w-full h-20 object-cover rounded border"
                      />
                    </a>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700">Save</button>
                <button type="button" onClick={() => setShowExpenseModal(false)} className="px-4 py-2 border rounded text-gray-700">Close</button>
              </div>
            </form>

            {expenseMsg && (
              <p className="text-center text-green-600 mt-3">{expenseMsg}</p>
            )}

            {/* Show expenses for selected date */}
            <div className="mt-6">
              <h4 className="text-md font-semibold mb-2">
                Expenses on {selectedDate}
              </h4>
              {filteredExpenses.length > 0 ? (
                <ul className="space-y-2">
                  {filteredExpenses.map((ex) => (
                    <li
                      key={ex._id}
                      className="border rounded p-2 text-sm"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{ex.description}</span>
                        <span className="font-semibold text-blue-600">
                          ₹{ex.spentAmount}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No expenses for this date.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showPettyModal && (
        <div className="fixed inset-0 z-40 p-4">
          <div className="max-w-xl mx-auto bg-white border rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-3 text-blue-700">
              Add Petty Cash
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                name="patientName"
                placeholder="Patient Name"
                value={form.patientName}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
              <input
                type="email"
                name="patientEmail"
                placeholder="Patient Email"
                value={form.patientEmail}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
              <input
                type="text"
                name="patientPhone"
                placeholder="Patient Phone"
                value={form.patientPhone}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
              <textarea
                name="note"
                placeholder="Note (optional)"
                value={form.note}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              ></textarea>

              <input
                type="file"
                name="receipts"
                multiple
                onChange={handlePettyFilesChange}
                className="w-full border p-2 rounded"
              />

              {/* Previews for newly selected petty cash receipts (before submit) */}
              {pettyPreviews.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {pettyPreviews.map((p, idx) => (
                    <div key={idx} className="relative">
                      <img src={p.url} alt={`New Receipt ${idx + 1}`} className="w-full h-20 object-cover rounded border" />
                      <button
                        type="button"
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 text-xs"
                        onClick={() => removePettyPreviewAt(idx)}
                        aria-label="Remove receipt"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}


              {form.allocatedAmounts.map((amt, idx) => (
                <input
                  key={idx}
                  type="number"
                  placeholder={`Allocated Amount ${idx + 1}`}
                  value={amt}
                  onChange={(e) => handleAmountChange(idx, e.target.value)}
                  className="w-full border p-2 rounded"

                />
              ))}

              <button
                type="button"
                onClick={addAmountField}
                className="w-full border text-blue-600 border-blue-600 py-2 rounded hover:bg-blue-50"
              >
                + Add More Allocations
              </button>

              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Save</button>
                <button type="button" onClick={() => setShowPettyModal(false)} className="px-4 py-2 border rounded text-gray-700">Close</button>
              </div>
            </form>
            {message && (
              <p className="text-center text-green-600 mt-3">{message}</p>
            )}
          </div>
        </div>
      )}

      {/* Search and Table */}
      {/* Petty Cash Records for selected date */}
      <div className="mt-8">
        <input
          type="text"
          placeholder="Search by Name or Email..."
          value={search}
          onChange={handleSearch}
          className="w-full border p-2 rounded mb-4"
        />

        <h3 className="text-lg font-semibold mb-2">
          Petty Cash Records for {selectedDate}
        </h3>
        {filteredRecords.length === 0 ? (
          <p className="text-gray-500">No records found for this date.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">Patient Name</th>
                  <th className="border p-2">Email</th>
                  <th className="border p-2">Phone</th>
                  <th className="border p-2">Allocated (This Date)</th>
                  <th className="border p-2">Receipts</th> {/* ✅ new */}
                  <th className="border p-2">Note</th>
                  <th className="border p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((item) => {
                  const targetDate = new Date(selectedDate);
                  targetDate.setHours(0, 0, 0, 0);
                  const nextDay = new Date(targetDate);
                  nextDay.setDate(targetDate.getDate() + 1);

                  const allocForDate = item.allocatedAmounts.filter((alloc) => {
                    const allocDate = new Date(alloc.date);
                    return allocDate >= targetDate && allocDate < nextDay;
                  });

                  return (
                    <tr key={item._id} className="text-center">
                      <td className="border p-2">{item.patientName}</td>
                      <td className="border p-2">{item.patientEmail}</td>
                      <td className="border p-2">{item.patientPhone}</td>

                      {/* Allocated Amounts */}
                      <td className="border p-2">
                        {allocForDate.length > 0 ? (
                          allocForDate.map((a, idx) => (
                            <div key={idx}>₹{a.amount}</div>
                          ))
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      {/* ✅ RECEIPT VIEW ADDED for Allocated */}
                      <td className="border p-2">
                        {allocForDate.length > 0 &&
                          allocForDate.some((a) => a.receipts?.length > 0) ? (
                          allocForDate.map(
                            (a, idx) =>
                              a.receipts &&
                              a.receipts.map((r, ridx) => (
                                <a
                                  key={ridx}
                                  href={r.url || r}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block text-blue-600 underline text-xs my-1"
                                >
                                  View Receipt {ridx + 1}
                                </a>
                              ))
                          )
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      <td className="border p-2">{item.note || "-"}</td>

                      {/* Delete Button */}
                      <td className="border p-2">
                        {isTodaySelected && (
                          <>
                            {/* Edit Petty Cash / Allocated */}
                            <button
                              onClick={() => handleEdit(item, "allocated")}
                              className="text-blue-600 hover:text-blue-800 mr-2 text-xs"
                            >
                              ✏️
                            </button>

                            {/* Delete Patient */}
                            <button
                              onClick={() => handleDeletePatient(item._id)}
                              className="text-red-600 hover:text-red-800 ml-2"
                            >
                              🗑️
                            </button>
                          </>
                        )}


                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* All Expenses for selected date */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">
          All Expenses for {selectedDate}
        </h3>
        {filteredExpenses.length === 0 ? (
          <p className="text-gray-500">No expenses for this date.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">Description</th>
                  <th className="border p-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((ex) => (
                  <tr key={ex._id} className="text-center">
                    <td className="border p-2">
                      <div className="font-medium">{ex.description}</div>

                      {/* ✅ RECEIPT VIEW ADDED for Expenses */}
                      {ex.receipts && ex.receipts.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-2 mt-1">
                          {ex.receipts.map((r, idx) => (
                            <a
                              key={idx}
                              href={r.url || r}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline text-xs"
                            >
                              View Receipt {idx + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="border p-2">
                      <div className="flex justify-center items-center gap-2">
                        <span className="font-semibold text-blue-600">₹{ex.spentAmount}</span>
                        {isTodaySelected && (
                          <>
                            <button
                              onClick={() => handleEdit(ex, "expense")}
                              className="text-blue-600 hover:text-blue-800 mr-2 text-xs"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(ex._id)}
                              className="text-red-600 hover:text-red-800 ml-2 text-xs"
                            >
                              🗑️
                            </button>
                          </>
                        )}

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}
      </div>

      {/* Global totals for selected date */}
      <div className="mt-8 border rounded-lg p-4 bg-blue-50">
        <h3 className="text-lg font-semibold mb-3">
          Global Totals for {selectedDate}
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm text-gray-600">Total Allocated</div>
            <div className="text-2xl font-bold text-blue-700">
              ₹{globalData.globalAllocated}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Total Spent</div>
            <div className="text-2xl font-bold text-red-600">
              ₹{globalData.globalSpent}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Total Remaining</div>
            <div className="text-2xl font-bold text-green-600">
              ₹{globalData.globalRemaining}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Define layout function
PettyCashAndExpense.getLayout = function PageLayout(page) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

// Apply HOC
const ProtectedDashboard = withClinicAuth(PettyCashAndExpense);

// Reassign layout
ProtectedDashboard.getLayout = PettyCashAndExpense.getLayout;

export default ProtectedDashboard;