// components/PettyCashAndExpense.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

export default function PettyCashAndExpense() {
  const [form, setForm] = useState({
    patientName: "",
    patientEmail: "",
    patientPhone: "",
    note: "",
    // allocatedAmounts will be array of { amount: "", date?: "", receipts: [dataURL,...] }
    allocatedAmounts: [{ amount: "", receipts: [] }],
  });

  const [expenseForm, setExpenseForm] = useState({
    description: "",
    spentAmount: "",
    receipts: [], // dataURLs
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

  const staffToken = typeof window !== "undefined" ? localStorage.getItem("userToken") : null;

  // ---------- Helpers for file -> dataURL ----------
  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

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

  // ---------- Add Petty Cash form handlers ----------
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleAllocAmountChange = (index, value) => {
    const updated = [...form.allocatedAmounts];
    updated[index].amount = value;
    setForm({ ...form, allocatedAmounts: updated });
  };

  const addAmountField = () =>
    setForm({ ...form, allocatedAmounts: [...form.allocatedAmounts, { amount: "", receipts: [] }] });

  const handleAllocReceiptsChange = async (index, files) => {
    if (!files || files.length === 0) return;
    const updated = [...form.allocatedAmounts];
    const dataUrls = [];
    for (const f of files) {
      const dataUrl = await fileToDataUrl(f);
      dataUrls.push(dataUrl);
    }
    // Append to any existing receipts for that allocation
    updated[index].receipts = [...(updated[index].receipts || []), ...dataUrls];
    setForm({ ...form, allocatedAmounts: updated });
  };

  const removeAllocReceipt = (allocIndex, receiptIndex) => {
    const updated = [...form.allocatedAmounts];
    updated[allocIndex].receipts.splice(receiptIndex, 1);
    setForm({ ...form, allocatedAmounts: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      // Filter empty allocations
      const toSendAllocs = form.allocatedAmounts
        .filter((a) => a.amount !== "" && !isNaN(Number(a.amount)))
        .map((a) => ({
          amount: Number(a.amount),
          date: a.date || new Date(),
          receipts: a.receipts || [], // dataURLs
        }));

      if (toSendAllocs.length === 0) {
        setMessage("Please add at least one allocation with amount.");
        return;
      }

      const res = await axios.post(
        "/api/pettycash/add",
        {
          patientName: form.patientName,
          patientEmail: form.patientEmail,
          patientPhone: form.patientPhone,
          note: form.note,
          allocatedAmounts: toSendAllocs,
        },
        { headers: { Authorization: `Bearer ${staffToken}` }, timeout: 120000 }
      );

      setMessage(res.data.message || "Petty cash added");
      setForm({
        patientName: "",
        patientEmail: "",
        patientPhone: "",
        note: "",
        allocatedAmounts: [{ amount: "", receipts: [] }],
      });
      fetchPettyCash();
      fetchGlobalTotals(selectedDate);
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.message || "Error adding petty cash");
    }
  };

  // ---------- Expense form handlers ----------
  const handleExpenseChange = (e) =>
    setExpenseForm({ ...expenseForm, [e.target.name]: e.target.value });

  const handleExpenseReceiptsChange = async (files) => {
    if (!files || files.length === 0) return;
    const dataUrls = [];
    for (const f of files) {
      const dataUrl = await fileToDataUrl(f);
      dataUrls.push(dataUrl);
    }
    setExpenseForm((prev) => ({ ...prev, receipts: [...(prev.receipts || []), ...dataUrls] }));
  };

  const removeExpenseReceipt = (idx) => {
    const updated = [...expenseForm.receipts];
    updated.splice(idx, 1);
    setExpenseForm((prev) => ({ ...prev, receipts: updated }));
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setExpenseMsg("");

    try {
      if (pettyCashList.length === 0) {
        setExpenseMsg("No petty cash record found. Please add one first.");
        return;
      }

      const pettyCashId = pettyCashList[0]._id;

      const res = await axios.post(
        "/api/pettycash/add-expense",
        {
          pettyCashId,
          description: expenseForm.description,
          spentAmount: expenseForm.spentAmount,
          receipts: expenseForm.receipts || [],
        },
        { headers: { Authorization: `Bearer ${staffToken}` }, timeout: 120000 }
      );

      setExpenseMsg(res.data.message || "Expense added");
      setExpenseForm({ description: "", spentAmount: "", receipts: [] });
      fetchPettyCash();
      fetchGlobalTotals(selectedDate);
    } catch (error) {
      console.error(error);
      setExpenseMsg(error.response?.data?.message || "Error adding expense record");
    }
  };

  // ---------- Search & Date helpers ----------
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

  // Delete handlers (same as you had)
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
      <h2 className="text-xl font-bold mb-6 text-center">Petty Cash Management</h2>

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
          <h3 className="text-lg font-semibold mb-3 text-blue-700">Add Expense</h3>
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
              accept="image/*,application/pdf"
              multiple
              onChange={(e) => handleExpenseReceiptsChange(e.target.files)}
              className="w-full border p-2 rounded"
            />

            {/* Preview receipts */}
            {expenseForm.receipts && expenseForm.receipts.length > 0 && (
              <div className="mt-2 grid grid-cols-4 gap-2">
                {expenseForm.receipts.map((r, idx) => (
                  <div key={idx} className="border p-1">
                    {/* PDFs will just show link text */}
                    {r.startsWith("data:application/pdf") ? (
                      <a href={r} target="_blank" rel="noopener noreferrer" className="text-xs underline">
                        PDF {idx + 1}
                      </a>
                    ) : (
                      <img src={r} alt={`receipt-${idx}`} className="w-full h-20 object-cover" />
                    )}
                    <button type="button" onClick={() => removeExpenseReceipt(idx)} className="text-red-600 text-xs mt-1">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
              Add Expense
            </button>
          </form>
          {expenseMsg && <p className="text-center text-green-600 mt-3">{expenseMsg}</p>}

          {/* Show expenses for selected date */}
          <div className="mt-6">
            <h4 className="text-md font-semibold mb-2">Expenses on {selectedDate}</h4>
            {filteredExpenses.length > 0 ? (
              <ul className="space-y-2">
                {filteredExpenses.map((ex) => (
                  <li key={ex._id} className="border rounded p-2 text-sm">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{ex.description}</div>
                        <div className="text-xs text-gray-500">{new Date(ex.date).toLocaleString()}</div>
                        {/* show receipts links if any */}
                        {ex.receipts && ex.receipts.length > 0 && (
                          <div className="mt-1 flex gap-2">
                            {ex.receipts.map((r, i) => (
                              <a key={i} href={r} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs">
                                Receipt {i + 1}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-blue-600">₹{ex.spentAmount}</span>
                        {isTodaySelected && (
                          <button onClick={() => handleDeleteExpense(ex._id)} className="text-red-600 hover:text-red-800 ml-2 text-xs">
                            Delete
                          </button>
                        )}
                      </div>
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
          <h3 className="text-lg font-semibold mb-3 text-blue-700">Add Petty Cash</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="text" name="patientName" placeholder="Patient Name" value={form.patientName} onChange={handleChange} className="w-full border p-2 rounded" required />
            <input type="email" name="patientEmail" placeholder="Patient Email" value={form.patientEmail} onChange={handleChange} className="w-full border p-2 rounded" required />
            <input type="text" name="patientPhone" placeholder="Patient Phone" value={form.patientPhone} onChange={handleChange} className="w-full border p-2 rounded" required />
            <textarea name="note" placeholder="Note (optional)" value={form.note} onChange={handleChange} className="w-full border p-2 rounded"></textarea>

            {form.allocatedAmounts.map((alloc, idx) => (
              <div key={idx} className="border rounded p-3 mb-2">
                <input
                  type="number"
                  placeholder={`Allocated Amount ${idx + 1}`}
                  value={alloc.amount}
                  onChange={(e) => handleAllocAmountChange(idx, e.target.value)}
                  className="w-full border p-2 rounded mb-2"
                  required
                />

                <input
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  onChange={(e) => handleAllocReceiptsChange(idx, e.target.files)}
                  className="w-full border p-2 rounded"
                />

                {/* preview receipts */}
                {alloc.receipts && alloc.receipts.length > 0 && (
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {alloc.receipts.map((r, ridx) => (
                      <div key={ridx} className="border p-1">
                        {r.startsWith("data:application/pdf") ? (
                          <a href={r} target="_blank" rel="noopener noreferrer" className="text-xs underline">
                            PDF {ridx + 1}
                          </a>
                        ) : (
                          <img src={r} alt={`alloc-${idx}-rec-${ridx}`} className="w-full h-20 object-cover" />
                        )}
                        <button type="button" onClick={() => removeAllocReceipt(idx, ridx)} className="text-red-600 text-xs mt-1">
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <button type="button" onClick={addAmountField} className="w-full border text-blue-600 border-blue-600 py-2 rounded hover:bg-blue-50">
              + Add More Allocations
            </button>

            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
              Add Petty Cash
            </button>
          </form>
          {message && <p className="text-center text-green-600 mt-3">{message}</p>}
        </div>
      </div>

      {/* Search and Table */}
      <div className="mt-8">
        <input type="text" placeholder="Search by Name or Email..." value={search} onChange={handleSearch} className="w-full border p-2 rounded mb-4" />

        <h3 className="text-lg font-semibold mb-2">Petty Cash Records for {selectedDate}</h3>
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
                      <td className="border p-2">
                        {allocForDate.length > 0 ? (
                          allocForDate.map((a, idx) => (
                            <div key={idx}>
                              <div>₹{a.amount}</div>
                              {a.receipts && a.receipts.length > 0 && (
                                <div className="text-xs">
                                  {a.receipts.map((r, i) => (
                                    <a key={i} href={r} target="_blank" rel="noreferrer" className="text-blue-600 underline mr-2">
                                      Alloc Receipt {i + 1}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="border p-2">{item.note || "-"}</td>
                      <td className="border p-2">
                        {isTodaySelected && (
                          <button onClick={() => handleDeletePatient(item._id)} className="text-red-600 hover:text-red-800 ml-2">
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
        <h3 className="text-lg font-semibold mb-2">All Expenses for {selectedDate}</h3>
        {filteredExpenses.length === 0 ? (
          <p className="text-gray-500">No expenses for this date.</p>
        ) : (
          <div className="overflow-x-auto">
            <ul className="space-y-2">
              {filteredExpenses.map((ex) => (
                <li key={ex._id} className="border rounded p-2 text-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{ex.description}</div>
                      {ex.receipts && ex.receipts.length > 0 && (
                        <div className="text-xs">
                          {ex.receipts.map((r, i) => (
                            <a key={i} href={r} target="_blank" rel="noreferrer" className="text-blue-600 underline mr-2">
                              Receipt {i + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-blue-600">₹{ex.spentAmount}</span>
                      {isTodaySelected && (
                        <button onClick={() => handleDeleteExpense(ex._id)} className="text-red-600 hover:text-red-800 ml-2 text-xs">
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Global totals for selected date */}
      <div className="mt-8 border rounded-lg p-4 bg-blue-50">
        <h3 className="text-lg font-semibold mb-3">Global Totals for {selectedDate}</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm text-gray-600">Total Allocated</div>
            <div className="text-2xl font-bold text-blue-700">₹{globalData.globalAllocated}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Total Spent</div>
            <div className="text-2xl font-bold text-red-600">₹{globalData.globalSpent}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Total Remaining</div>
            <div className="text-2xl font-bold text-green-600">₹{globalData.globalRemaining}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
