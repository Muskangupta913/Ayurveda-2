import React, { useState, useEffect } from "react";
import axios from "axios";
import { Filter, Edit3, CheckCircle } from "lucide-react";
import { useRouter } from "next/router";

export default function PatientFilterUI() {
  const router = useRouter();
  const [filters, setFilters] = useState({
    emrNumber: "",
    invoiceNumber: "",
    name: "",
    phone: "",
    claimStatus: "",
    applicationStatus: "",
  });

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("userToken") : null;

  const handleChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const fetchPatients = async () => {
    if (!token) {
      alert("Session expired. Please login again.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.get("/api/staff/get-patient-registrations", {
        params: filters,
        headers: { Authorization: `Bearer ${token}` },
      });
      setPatients(data.success ? data.data : []);
    } catch (err) {
      console.error(err);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPatients(); }, []);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchPatients();
  };

  const handleUpdate = (id) => router.push(`/staff/update-patient-info/${id}`);

  const handleComplete = async (id) => {
    if (!token) return alert("Session expired. Please login again.");
    try {
      await axios.put(
        "/api/staff/get-patient-registrations",
        { id, status: "Completed" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Marked as Completed");
      fetchPatients();
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5 text-indigo-600" /> Patient Filter
        </h2>

        {/* Filter Form */}
        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <input type="text" name="emrNumber" placeholder="EMR Number" value={filters.emrNumber} onChange={handleChange} className="border rounded-lg p-2 w-full" />
          <input type="text" name="invoiceNumber" placeholder="Invoice Number" value={filters.invoiceNumber} onChange={handleChange} className="border rounded-lg p-2 w-full" />
          <input type="text" name="name" placeholder="Name" value={filters.name} onChange={handleChange} className="border rounded-lg p-2 w-full" />
          <input type="text" name="phone" placeholder="Phone Number" value={filters.phone} onChange={handleChange} className="border rounded-lg p-2 w-full" />
          <select name="claimStatus" value={filters.claimStatus} onChange={handleChange} className="border rounded-lg p-2 w-full">
            <option value="">Claim Status</option>
            <option value="Pending">Pending</option>
            <option value="Released">Released</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select name="applicationStatus" value={filters.applicationStatus} onChange={handleChange} className="border rounded-lg p-2 w-full">
            <option value="">Application Status</option>
            <option value="Active">Active</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Completed">Completed</option>
          </select>
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg col-span-1 md:col-span-3">Apply Filters</button>
        </form>

        {/* Results Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-indigo-100 text-indigo-700">
              <tr>
                <th className="border p-2 text-left">EMR No</th>
                <th className="border p-2 text-left">Invoice No</th>
                <th className="border p-2 text-left">Name</th>
                <th className="border p-2 text-left">Phone</th>
                <th className="border p-2 text-left">Doctor Release Status</th>
                <th className="border p-2 text-left">Application Status</th>
                <th className="border p-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center p-4 text-gray-500">Loading data...</td></tr>
              ) : patients.length > 0 ? (
                patients.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="border p-2">{item.emrNumber}</td>
                    <td className="border p-2">{item.invoiceNumber}</td>
                    <td className="border p-2">{item.firstName} {item.lastName}</td>
                    <td className="border p-2">{item.mobileNumber}</td>
                    <td className="border p-2">{item.advanceClaimStatus}</td>
                    <td className="border p-2">{item.status}</td>
                    <td className="border p-2 text-center space-x-2">
                      
                      <button onClick={() => handleUpdate(item._id)} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg inline-flex items-center gap-1"><Edit3 className="w-4 h-4"/> Update</button>
                   <button onClick={() => handleComplete(item._id)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg inline-flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Complete</button>
                
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="7" className="text-center text-gray-500 p-4">No matching records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
