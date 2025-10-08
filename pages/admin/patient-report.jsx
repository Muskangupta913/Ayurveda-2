"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminPatientClaims = () => {
  const [patients, setPatients] = useState([]);
  const [summary, setSummary] = useState({});
  const [statusFilter, setStatusFilter] = useState("");

  const token = localStorage.getItem("adminToken");

  const fetchPatients = async (status = "") => {
    try {
      const url = `/api/admin/getPatientClaims${
        status ? `?statusFilter=${status}` : ""
      }`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPatients(res.data.patients || []);
      setSummary(res.data.summary || {});
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error fetching patients");
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleFilterChange = (e) => {
    const status = e.target.value;
    setStatusFilter(status);
    fetchPatients(status);
  };

  return (
    <div className="max-w-7xl mx-auto mt-10 bg-white p-6 rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-6">🧾 Patient Claims (Admin View)</h2>

      {/* 🔹 Filter */}
      <div className="flex gap-4 items-center mb-6">
        <label className="font-medium text-gray-700">Filter by Status:</label>
        <select
          value={statusFilter}
          onChange={handleFilterChange}
          className="border rounded-md p-2"
        >
          <option value="">All</option>
          <option value="Pending">Pending</option>
          <option value="Released">Released</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Co-pay">Co-pay</option>
          <option value="Advance">Advance</option>
        </select>
      </div>

      {/* 🔹 Summary */}
      <div className="mb-6 flex gap-4 flex-wrap">
        <span>Pending: {summary.pending || 0}</span>
        <span>Released: {summary.released || 0}</span>
        <span>Cancelled: {summary.cancelled || 0}</span>
        <span>Co-pay: {summary.copay || 0}</span>
        <span>Advance: {summary.advance || 0}</span>
        <span>Total: {summary.total || 0}</span>
      </div>

      {/* 🔹 Patient List */}
      {patients.length === 0 ? (
        <p className="text-gray-500 text-center">No patients found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border">Patient Name</th>
                <th className="px-4 py-2 border">Email</th>
                <th className="px-4 py-2 border">Mobile</th>
                <th className="px-4 py-2 border">Invoice #</th>
                <th className="px-4 py-2 border">Allocated By</th>
                <th className="px-4 py-2 border">Amount</th>
                <th className="px-4 py-2 border">Paid</th>
                <th className="px-4 py-2 border">Advance</th>
                <th className="px-4 py-2 border">Pending</th>
                <th className="px-4 py-2 border">Co-pay %</th>
                <th className="px-4 py-2 border">Advance Given</th>
                <th className="px-4 py-2 border">Claim Status</th>
                <th className="px-4 py-2 border">Need To Pay</th>
                <th className="px-4 py-2 border">Service</th>
                <th className="px-4 py-2 border">Treatment/Package</th>
                <th className="px-4 py-2 border">Payment Method</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p, i) => (
                <tr key={i} className="text-sm border-t">
                  <td className="px-2 py-1 border">{p.patientName}</td>
                  <td className="px-2 py-1 border">{p.email}</td>
                  <td className="px-2 py-1 border">{p.mobileNumber}</td>
                  <td className="px-2 py-1 border">{p.invoiceNumber}</td>
                  <td className="px-2 py-1 border">{p.allocatedBy}</td>
                  <td className="px-2 py-1 border">{p.amount}</td>
                  <td className="px-2 py-1 border">{p.paid}</td>
                  <td className="px-2 py-1 border">{p.advance}</td>
                  <td className="px-2 py-1 border">{p.pending}</td>
                  <td className="px-2 py-1 border">{p.coPayPercent}</td>
                  <td className="px-2 py-1 border">{p.advanceGivenAmount}</td>
                  <td className="px-2 py-1 border">{p.advanceClaimStatus}</td>
                  <td className="px-2 py-1 border">{p.needToPay}</td>
                  <td className="px-2 py-1 border">{p.service}</td>
                  <td className="px-2 py-1 border">{p.treatment || p.package}</td>
                  <td className="px-2 py-1 border">{p.paymentMethod}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPatientClaims;
