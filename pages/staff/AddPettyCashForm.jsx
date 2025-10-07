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

  const staffToken =
    typeof window !== "undefined" ? localStorage.getItem("userToken") : null;

  // ✅ Fetch petty cash + expenses
  const fetchPettyCash = async (query = "") => {
    try {
      const res = await axios.get(
        `/api/pettycash/getpettyCash${query ? `?search=${query}` : ""}`,
        { headers: { Authorization: `Bearer ${staffToken}` } }
      );
      setPettyCashList(res.data.pettyCashList);
    } catch (error) {
      console.error("Error fetching petty cash:", error);
    }
  };

  useEffect(() => {
    fetchPettyCash();
  }, []);

  // =============================
  // 💰 Add Petty Cash Form
  // =============================
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
      const res = await axios.post(
        "/api/pettycash/add",
        {
          patientName: form.patientName,
          patientEmail: form.patientEmail,
          patientPhone: form.patientPhone,
          note: form.note,
          allocatedAmounts: form.allocatedAmounts.filter((a) => a !== ""),
        },
        { headers: { Authorization: `Bearer ${staffToken}` } }
      );

      setMessage(res.data.message);
      setForm({
        patientName: "",
        patientEmail: "",
        patientPhone: "",
        note: "",
        allocatedAmounts: [""],
      });
      fetchPettyCash();
    } catch (error) {
      setMessage(error.response?.data?.message || "Error adding petty cash");
    }
  };

  // =============================
  // 🧾 Add Expense Form
  // =============================
  const handleExpenseChange = (e) =>
    setExpenseForm({ ...expenseForm, [e.target.name]: e.target.value });

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setExpenseMsg("");

    try {
      // Always add expense to the most recent petty cash record
      if (pettyCashList.length === 0) {
        setExpenseMsg("No petty cash record found. Please add one first.");
        return;
      }

      const pettyCashId = pettyCashList[0]._id; // latest petty cash

      const res = await axios.post(
        "/api/pettycash/add-expense",
        {
          pettyCashId,
          description: expenseForm.description,
          spentAmount: expenseForm.spentAmount,
        },
        { headers: { Authorization: `Bearer ${staffToken}` } }
      );

      setExpenseMsg(res.data.message);
      setExpenseForm({ description: "", spentAmount: "" });
      fetchPettyCash();
    } catch (error) {
      setExpenseMsg(
        error.response?.data?.message || "Error adding expense record"
      );
    }
  };

  // =============================
  // 🔍 Search handler
  // =============================
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    fetchPettyCash(value);
  };

  return (
    <div className="max-w-6xl mx-auto bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-bold mb-6 text-center">
        Petty Cash Management
      </h2>

      {/* ✅ Two forms side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT: Add Expense Form */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 text-blue-700">
            Add Expense
          </h3>
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

          {/* ✅ Show added expenses just below form */}
          <div className="mt-6">
            <h4 className="text-md font-semibold mb-2">Added Expenses</h4>
            {pettyCashList.length > 0 && pettyCashList[0].expenses.length > 0 ? (
              <ul className="space-y-2">
                {pettyCashList[0].expenses.map((ex) => (
                  <li
                    key={ex._id}
                    className="border rounded p-2 flex justify-between text-sm"
                  >
                    <span>{ex.description}</span>
                    <span className="font-semibold text-blue-600">
                      ₹{ex.spentAmount}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No expenses added yet.</p>
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

      {/* 🔍 Search and Table */}
      <div className="mt-8">
        <input
          type="text"
          placeholder="Search by Name or Email..."
          value={search}
          onChange={handleSearch}
          className="w-full border p-2 rounded mb-4"
        />

        <h3 className="text-lg font-semibold mb-2">Petty Cash Records</h3>
        {pettyCashList.length === 0 ? (
          <p className="text-gray-500">No petty cash records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">Patient Name</th>
                  <th className="border p-2">Email</th>
                  <th className="border p-2">Phone</th>
                  <th className="border p-2">Allocated Amounts</th>
                  {/* <th className="border p-2">Expenses</th> */}
                  <th className="border p-2">Note</th>
                </tr>
              </thead>
              <tbody>
                {pettyCashList.map((item) => (
                  <tr key={item._id} className="text-center">
                    <td className="border p-2">{item.patientName}</td>
                    <td className="border p-2">{item.patientEmail}</td>
                    <td className="border p-2">{item.patientPhone}</td>
                    <td className="border p-2">
                      {item.allocatedAmounts.map((a, idx) => (
                        <div key={idx}>
                          ₹{a.amount}{" "}
                          <span className="text-gray-400 text-xs">
                            ({new Date(a.date).toLocaleDateString()})
                          </span>
                        </div>
                      ))}
                    </td>

                    <td className="border p-2">{item.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
