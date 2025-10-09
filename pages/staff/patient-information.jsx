import React, { useState, useEffect } from "react";
import axios from "axios";
import { Filter, Edit3, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/router";
import ClinicLayout from '../../components/staffLayout';
import withClinicAuth from '../../components/withStaffAuth';

function PatientFilterUI() {
  const router = useRouter();
  const [filters, setFilters] = useState({
    emrNumber: "",
    invoiceNumber: "",
    name: "",
    phone: "",
    claimStatus: "",
    applicationStatus: "",
    dateFrom: "",
    dateTo: "",
  });
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const token = typeof window !== "undefined" ? localStorage.getItem("userToken") : null;

  const handleChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const paginatedPatients = patients.filter(item =>
    search.trim() === "" ||
    (item.firstName + " " + item.lastName + " " + item.emrNumber + " " + item.invoiceNumber + " " + item.mobileNumber)
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );
  const totalPages = Math.ceil(paginatedPatients.length / pageSize);
  const displayedPatients = paginatedPatients.slice((page - 1) * pageSize, page * pageSize);

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
      setPage(1);
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

  const handlePageChange = (next) => {
    if (next && page < totalPages) setPage(page + 1);
    else if (!next && page > 1) setPage(page - 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-2 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
      <div className="w-full max-w-full lg:max-w-7xl xl:max-w-[1400px] mx-auto bg-white rounded-lg sm:rounded-xl shadow-md sm:shadow-lg px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5 md:py-6 lg:py-8">
        
        {/* Header */}
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 md:mb-5 flex items-center gap-2 text-gray-800">
          <Filter className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-indigo-600 flex-shrink-0" /> 
          <span>Patient Filter</span>
        </h2>

        {/* Global Search Bar */}
        <div className="relative mb-4 sm:mb-5 md:mb-6">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
          </div>
          <input
            type="text"
            placeholder="Search patients, EMR, invoice..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-md sm:rounded-lg pl-10 pr-3 py-2 sm:py-2.5 md:py-3 w-full text-gray-800 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 text-sm sm:text-base transition-all"
          />
        </div>

        {/* Filters – Fully Responsive Grid */}
        <form
          onSubmit={handleFilterSubmit}
          className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-5 sm:mb-6"
        >
          <input 
            type="text" 
            name="emrNumber" 
            placeholder="EMR Number" 
            value={filters.emrNumber} 
            onChange={handleChange}
            className="border border-gray-300 rounded-md sm:rounded-lg px-3 py-2 sm:py-2.5 w-full text-gray-800 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 text-sm sm:text-base transition-all" 
          />
          <input 
            type="text" 
            name="invoiceNumber" 
            placeholder="Invoice Number" 
            value={filters.invoiceNumber} 
            onChange={handleChange}
            className="border border-gray-300 rounded-md sm:rounded-lg px-3 py-2 sm:py-2.5 w-full text-gray-800 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 text-sm sm:text-base transition-all" 
          />
          <input 
            type="text" 
            name="name" 
            placeholder="Name" 
            value={filters.name} 
            onChange={handleChange}
            className="border border-gray-300 rounded-md sm:rounded-lg px-3 py-2 sm:py-2.5 w-full text-gray-800 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 text-sm sm:text-base transition-all" 
          />
          <input 
            type="text" 
            name="phone" 
            placeholder="Phone Number" 
            value={filters.phone} 
            onChange={handleChange}
            className="border border-gray-300 rounded-md sm:rounded-lg px-3 py-2 sm:py-2.5 w-full text-gray-800 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 text-sm sm:text-base transition-all" 
          />
          <select 
            name="claimStatus" 
            value={filters.claimStatus} 
            onChange={handleChange}
            className="border border-gray-300 rounded-md sm:rounded-lg px-3 py-2 sm:py-2.5 w-full text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 text-sm sm:text-base transition-all bg-white"
          >
            <option value="">Claim Status</option>
            <option value="Pending">Pending</option>
            <option value="Released">Released</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select 
            name="applicationStatus" 
            value={filters.applicationStatus} 
            onChange={handleChange}
            className="border border-gray-300 rounded-md sm:rounded-lg px-3 py-2 sm:py-2.5 w-full text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 text-sm sm:text-base transition-all bg-white"
          >
            <option value="">Application Status</option>
            <option value="Active">Active</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Completed">Completed</option>
          </select>
          <input 
            type="date" 
            name="dateFrom" 
            placeholder="Date From" 
            value={filters.dateFrom} 
            onChange={handleChange}
            className="border border-gray-300 rounded-md sm:rounded-lg px-3 py-2 sm:py-2.5 w-full text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 text-sm sm:text-base transition-all" 
          />
          <input 
            type="date" 
            name="dateTo" 
            placeholder="Date To" 
            value={filters.dateTo} 
            onChange={handleChange}
            className="border border-gray-300 rounded-md sm:rounded-lg px-3 py-2 sm:py-2.5 w-full text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 text-sm sm:text-base transition-all" 
          />

          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-2 sm:py-2.5 md:py-3 px-4 rounded-md sm:rounded-lg col-span-1 xs:col-span-2 md:col-span-3 lg:col-span-4 text-sm sm:text-base transition-all shadow-sm hover:shadow-md"
          >
            Apply Filters
          </button>
        </form>

        {/* Responsive Table/Card view */}
        <div className="overflow-hidden">
          {/* Table: Large screens */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full border-collapse text-gray-800 min-w-full">
              <thead className="bg-indigo-100 text-indigo-700">
                <tr>
                  <th className="border border-gray-300 p-2 lg:p-3 text-left text-sm lg:text-base font-semibold">EMR No</th>
                  <th className="border border-gray-300 p-2 lg:p-3 text-left text-sm lg:text-base font-semibold">Invoice No</th>
                  <th className="border border-gray-300 p-2 lg:p-3 text-left text-sm lg:text-base font-semibold">Name</th>
                  <th className="border border-gray-300 p-2 lg:p-3 text-left text-sm lg:text-base font-semibold">Phone</th>
                  <th className="border border-gray-300 p-2 lg:p-3 text-left text-sm lg:text-base font-semibold">Doctor Release Status</th>
                  <th className="border border-gray-300 p-2 lg:p-3 text-left text-sm lg:text-base font-semibold">Application Status</th>
                  <th className="border border-gray-300 p-2 lg:p-3 text-center text-sm lg:text-base font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="text-center p-6 text-gray-500 text-sm sm:text-base">Loading data...</td></tr>
                ) : displayedPatients.length > 0 ? (
                  displayedPatients.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                      <td className="border border-gray-300 p-2 lg:p-3 text-sm lg:text-base">{item.emrNumber}</td>
                      <td className="border border-gray-300 p-2 lg:p-3 text-sm lg:text-base">{item.invoiceNumber}</td>
                      <td className="border border-gray-300 p-2 lg:p-3 text-sm lg:text-base">{item.firstName} {item.lastName}</td>
                      <td className="border border-gray-300 p-2 lg:p-3 text-sm lg:text-base">{item.mobileNumber}</td>
                      <td className="border border-gray-300 p-2 lg:p-3 text-sm lg:text-base">{item.advanceClaimStatus}</td>
                      <td className="border border-gray-300 p-2 lg:p-3 text-sm lg:text-base">{item.status}</td>
                      <td className="border border-gray-300 p-2 lg:p-3 text-center">
                        <button
                          onClick={() => handleUpdate(item._id)}
                          className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 text-sm transition-all shadow-sm hover:shadow"
                        >
                          <Edit3 className="w-3.5 h-3.5"/> Update
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="7" className="text-center text-gray-500 p-6 text-sm sm:text-base">No matching records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Card View: Small to Medium screens */}
          <div className="block lg:hidden space-y-3 sm:space-y-4">
            {loading ? (
              <div className="text-center p-6 text-gray-500 text-sm sm:text-base">Loading data...</div>
            ) : displayedPatients.length > 0 ? (
              displayedPatients.map((item) => (
                <div key={item._id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 text-gray-800 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm text-gray-500 mb-1">EMR Number</div>
                      <div className="font-semibold text-sm sm:text-base text-gray-900 truncate">{item.emrNumber || "-"}</div>
                    </div>
                    <button
                      onClick={() => handleUpdate(item._id)}
                      className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md inline-flex items-center gap-1 text-xs sm:text-sm font-medium transition-all shadow-sm hover:shadow flex-shrink-0"
                    >
                      <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5"/> 
                      <span className="hidden xs:inline">Update</span>
                      <span className="xs:hidden">Edit</span>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                    <div>
                      <span className="text-gray-500">Invoice No:</span>
                      <div className="font-medium text-gray-900 mt-0.5">{item.invoiceNumber || "-"}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <div className="font-medium text-gray-900 mt-0.5">{item.firstName} {item.lastName}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <div className="font-medium text-gray-900 mt-0.5">{item.mobileNumber}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Doctor Release:</span>
                      <div className="font-medium text-gray-900 mt-0.5">{item.advanceClaimStatus}</div>
                    </div>
                    <div className="xs:col-span-2">
                      <span className="text-gray-500">Application Status:</span>
                      <div className="font-medium text-gray-900 mt-0.5">{item.status}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 p-6 text-sm sm:text-base">No matching records found.</div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col xs:flex-row justify-between items-center gap-3 sm:gap-4 mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-gray-200">
              <div className="text-xs sm:text-sm text-gray-600 order-2 xs:order-1">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, paginatedPatients.length)} of {paginatedPatients.length} results
              </div>
              <div className="flex items-center gap-2 sm:gap-3 order-1 xs:order-2">
                <button
                  onClick={() => handlePageChange(false)}
                  disabled={page === 1}
                  className={`flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-all text-xs sm:text-sm font-medium shadow-sm ${page === 1 && "opacity-50 cursor-not-allowed hover:bg-white"}`}
                >
                  <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
                  <span className="hidden xs:inline">Previous</span>
                  <span className="xs:hidden">Prev</span>
                </button>
                <div className="px-2 sm:px-3 py-1.5 sm:py-2 text-gray-800 text-xs sm:text-sm font-medium bg-gray-100 rounded-md min-w-[60px] sm:min-w-[80px] text-center">
                  {page} / {totalPages}
                </div>
                <button
                  onClick={() => handlePageChange(true)}
                  disabled={page === totalPages}
                  className={`flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-all text-xs sm:text-sm font-medium shadow-sm ${page === totalPages && "opacity-50 cursor-not-allowed hover:bg-white"}`}
                >
                  Next <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

PatientFilterUI.getLayout = function PageLayout(page) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

const ProtectedDashboard = withClinicAuth(PatientFilterUI);
ProtectedDashboard.getLayout = PatientFilterUI.getLayout;

export default ProtectedDashboard;