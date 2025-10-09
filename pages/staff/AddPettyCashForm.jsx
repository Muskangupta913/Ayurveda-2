// components/PettyCashAndExpense.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

export default function PettyCashAndExpense() {
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
    // 1️⃣ Upload receipts to Cloudinary first
    const uploadedReceiptUrls = await uploadToCloudinary(form.receipts);

    // 2️⃣ Prepare payload
    const payload = {
      patientName: form.patientName,
      patientEmail: form.patientEmail,
      patientPhone: form.patientPhone,
      note: form.note,
      allocatedAmounts: form.allocatedAmounts,
      receipts: uploadedReceiptUrls,
    };

    if (editMode && editType === "allocated") {
      // Update existing
      await axios.put(
        "/api/pettycash/update",
        {
          id: editingId,
          type: "allocated",
          data: {
            newAmount: Number(form.allocatedAmounts[0]),
            receipts: uploadedReceiptUrls,
            note: form.note,
          },
        },
        { headers: { Authorization: `Bearer ${staffToken}` } }
      );
    } else {
      // Add new
      await axios.post("/api/pettycash/add", payload, {
        headers: { Authorization: `Bearer ${staffToken}` },
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
    fetchPettyCash();
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
    // ✅ Check if new files were uploaded
    const hasNewFiles = expenseForm.receipts && 
                        expenseForm.receipts instanceof FileList && 
                        expenseForm.receipts.length > 0;

    let uploadedExpenseUrls = [];
    
    if (hasNewFiles) {
      // Upload new files
      uploadedExpenseUrls = await uploadToCloudinary(expenseForm.receipts);
    } else if (Array.isArray(expenseForm.receipts)) {
      // Keep existing URLs if no new files uploaded
      uploadedExpenseUrls = expenseForm.receipts;
    }

    if (editMode && editType === "expense") {
      await axios.put(
        "/api/pettycash/update",
        {
          id: editingId, // pettyCash id
          type: "expense",
          data: {
            expenseId: expenseForm.expenseId,
            description: expenseForm.description,
            spentAmount: Number(expenseForm.spentAmount),
            receipts: uploadedExpenseUrls, // ✅ Will preserve old URLs if no new upload
          },
        },
        { headers: { Authorization: `Bearer ${staffToken}` } }
      );
    } else {
      await axios.post(
        "/api/pettycash/add-expense",
        { ...expenseForm, receipts: uploadedExpenseUrls },
        { headers: { Authorization: `Bearer ${staffToken}` } }
      );
    }

    // ✅ Reset form properly
    setExpenseForm({
      description: "",
      spentAmount: "",
      receipts: [],
    });
    setEditMode(false);
    setEditingId(null);
    fetchPettyCash();
    fetchGlobalTotals(selectedDate);
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
  }
};


  return (
    <div className="max-w-6xl mx-auto bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-bold mb-6 text-center">
        Petty Cash Management
      </h2>

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

      {/* Two forms side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT: Add Expense Form */}
        <div className="border rounded-lg p-4">
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
    onChange={(e) => setExpenseForm({ ...expenseForm, receipts: e.target.files })}
    className="w-full border p-2 rounded"
  />

  <button
    type="submit"
    className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
  >
    Add Expense
  </button>
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

        {/* RIGHT: Add Petty Cash Form */}
        <div className="border rounded-lg p-4">
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
  onChange={(e) => setForm({ ...form, receipts: e.target.files })}
  className="w-full border p-2 rounded"
/>


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

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Add Petty Cash
            </button>
          </form>
          {message && (
            <p className="text-center text-green-600 mt-3">{message}</p>
          )}
        </div>
      </div>

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