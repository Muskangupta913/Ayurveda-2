// components/PettyCashAndExpense.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

export default function PettyCashAndExpense() {
  const [form, setForm] = useState({
    patientName: "",
    patientEmail: "",
    patientPhone: "",
    note: "",
    allocatedAmounts: [""],
  });
  const [expenseForm, setExpenseForm] = useState({
    description: "",
    spentAmount: "",
  });

  const [message, setMessage] = useState("");
  const [expenseMsg, setExpenseMsg] = useState("");
  const [pettyCashList, setPettyCashList] = useState([]);
  const [search, setSearch] = useState("");

 


  // Date filter and global data
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

   const isTodaySelected = selectedDate === new Date().toISOString().split("T")[0];
  
  // Filtered expenses based on selected date
  const [filteredExpenses, setFilteredExpenses] = useState([]);

  const staffToken =
    typeof window !== "undefined" ? localStorage.getItem("userToken") : null;

  // Fetch petty cash list
  const fetchPettyCash = async (query = "") => {
    try {
      const res = await axios.get(
        `/api/pettycash/getpettyCash${query ? `?search=${query}` : ""}`,
        { headers: { Authorization: `Bearer ${staffToken}` } }
      );
      setPettyCashList(res.data.pettyCashList);
      // Filter expenses based on selected date after fetching
      filterExpensesByDate(res.data.pettyCashList, selectedDate);
    } catch (error) {
      console.error("Error fetching petty cash:", error);
    }
  };

  // Filter expenses by date
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

  // Fetch global totals for selectedDate
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Whenever selectedDate changes, refetch and filter
  useEffect(() => {
    fetchGlobalTotals(selectedDate);
    filterExpensesByDate(pettyCashList, selectedDate);
  }, [selectedDate]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleAmountChange = (index, value) => {
    const updated = [...form.allocatedAmounts];
    updated[index] = value;
    setForm({ ...form, allocatedAmounts: updated });
  };

  const addAmountField = () =>
    setForm({ ...form, allocatedAmounts: [...form.allocatedAmounts, ""] });

const handleSubmit = async (e) => {
  e.preventDefault();
  setMessage("");

  try {
    // 🧾 Build FormData (because we now support receipts upload)
    const formData = new FormData();
    formData.append("patientName", form.patientName);
    formData.append("patientEmail", form.patientEmail);
    formData.append("patientPhone", form.patientPhone);
    formData.append("note", form.note);
    formData.append(
      "allocatedAmounts",
      JSON.stringify(form.allocatedAmounts.filter((a) => a !== ""))
    );

    // ✅ Append receipt files if any
    if (form.receipts && form.receipts.length > 0) {
      Array.from(form.receipts).forEach((file) =>
        formData.append("receipts", file)
      );
    }

    // 🧠 Send to API
    const res = await axios.post("/api/pettycash/add", formData, {
      headers: {
        Authorization: `Bearer ${staffToken}`,
        "Content-Type": "multipart/form-data",
      },
    });

    setMessage(res.data.message);

    // 🧹 Reset Form
    setForm({
      patientName: "",
      patientEmail: "",
      patientPhone: "",
      note: "",
      allocatedAmounts: [""],
      receipts: [],
    });

    fetchPettyCash();
    fetchGlobalTotals(selectedDate);
  } catch (error) {
    console.error(error);
    setMessage(error.response?.data?.message || "Error adding petty cash");
  }
};


  const handleExpenseChange = (e) =>
    setExpenseForm({ ...expenseForm, [e.target.name]: e.target.value });

const handleExpenseSubmit = async (e) => {
  e.preventDefault();
  setExpenseMsg("");

  try {
    if (pettyCashList.length === 0) {
      setExpenseMsg("No petty cash record found. Please add one first.");
      return;
    }

    const pettyCashId = pettyCashList[0]._id;

    // Build FormData
    const formData = new FormData();
    formData.append("pettyCashId", pettyCashId);
    formData.append("description", expenseForm.description);
    formData.append("spentAmount", expenseForm.spentAmount);

    // Append multiple receipts if any
    if (expenseForm.receipts) {
      Array.from(expenseForm.receipts).forEach((file) => {
        formData.append("receipts", file);
      });
    }

    const res = await axios.post("/api/pettycash/add-expense", formData, {
      headers: {
        Authorization: `Bearer ${staffToken}`,
        "Content-Type": "multipart/form-data",
      },
    });

    setExpenseMsg(res.data.message);
    setExpenseForm({ description: "", spentAmount: "", receipts: [] });
    fetchPettyCash();
    fetchGlobalTotals(selectedDate);
  } catch (error) {
    console.error(error);
    setExpenseMsg(
      error.response?.data?.message || "Error adding expense record"
    );
  }
};


  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    fetchPettyCash(value);
  };

  // Filter petty cash records by selected date
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
                required
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
                  <th className="border p-2">Note</th>
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
        <td className="border p-2">
          {allocForDate.length > 0 ? (
            allocForDate.map((a, idx) => <div key={idx}>₹{a.amount}</div>)
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </td>
        <td className="border p-2">{item.note || "-"}</td>
        {/* ✅ DELETE PATIENT BUTTON */}
        <td className="border p-2">
          {isTodaySelected && (
  <button
    onClick={() => handleDeletePatient(item._id)}
    className="text-red-600 hover:text-red-800 ml-2"
  >
    Delete
  </button>
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
  <li key={ex._id} className="border rounded p-2 text-sm">
    <div className="flex justify-between items-center">
      <div>
        <div className="font-medium">{ex.description}</div>
       
      </div>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-blue-600">
          ₹{ex.spentAmount}
        </span>
        {/* ✅ DELETE EXPENSE BUTTON */}
       {isTodaySelected && (
  <button
    onClick={() => handleDeleteExpense(ex._id)}
    className="text-red-600 hover:text-red-800 ml-2 text-xs"
  >
    Delete
  </button>
)}

      </div>
    </div>
  </li>
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