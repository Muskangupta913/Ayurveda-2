"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminLayout from "../../components/AdminLayout";
import withAdminAuth from "../../components/withAdminAuth";
import { Search, Download, FileText, FileSpreadsheet } from "lucide-react";

const AdminPatientClaims = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [summary, setSummary] = useState({});
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem("adminToken") : null;

  const fetchPatients = async (status = "") => {
    try {
      setLoading(true);
      const url = `/api/admin/getPatientClaims${status ? `?statusFilter=${status}` : ""}`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const patientsData = res.data.patients || [];
      setPatients(patientsData);
      setFilteredPatients(patientsData);
      setSummary(res.data.summary || {});
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error fetching patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleFilterChange = (e) => {
    const status = e.target.value;
    setStatusFilter(status);
    setSearchQuery(""); // Reset search when changing filter
    fetchPatients(status);
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    if (query === "") {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter((p) =>
        p.patientName?.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query) ||
        p.mobileNumber?.toLowerCase().includes(query) ||
        p.invoiceNumber?.toLowerCase().includes(query) ||
        p.allocatedBy?.toLowerCase().includes(query) ||
        p.service?.toLowerCase().includes(query) ||
        p.treatment?.toLowerCase().includes(query) ||
        p.package?.toLowerCase().includes(query)
      );
      setFilteredPatients(filtered);
    }
  };

  const downloadCSV = () => {
    if (filteredPatients.length === 0) {
      alert("No data to download");
      return;
    }

    const headers = [
      "Patient Name",
      "Email",
      "Mobile",
      "Invoice #",
      "Status",
      "Allocated By",
      "Amount",
      "Paid",
      "Advance",
      "Pending",
      "Co-pay %",
      "Advance Given",
      "Need To Pay",
      "Service",
      "Treatment/Package",
      "Payment Method"
    ];

    const csvContent = [
      headers.join(","),
      ...filteredPatients.map(p => [
        `"${p.patientName || ''}"`,
        `"${p.email || ''}"`,
        `"${p.mobileNumber || ''}"`,
        `"${p.invoiceNumber || ''}"`,
        `"${p.advanceClaimStatus || ''}"`,
        `"${p.allocatedBy || ''}"`,
        `"${p.amount || ''}"`,
        `"${p.paid || ''}"`,
        `"${p.advance || ''}"`,
        `"${p.pending || ''}"`,
        `"${p.coPayPercent || ''}"`,
        `"${p.advanceGivenAmount || ''}"`,
        `"${p.needToPay || ''}"`,
        `"${p.service || ''}"`,
        `"${p.treatment || p.package || ''}"`,
        `"${p.paymentMethod || ''}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `patient_claims_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = () => {
    if (filteredPatients.length === 0) {
      alert("No data to download");
      return;
    }

    const printWindow = window.open("", "_blank");
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Patient Claims Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #1e40af; text-align: center; margin-bottom: 10px; }
          .report-date { text-align: center; color: #6b7280; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #3b82f6; color: white; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .status-badge { 
            display: inline-block; 
            padding: 2px 8px; 
            border-radius: 12px; 
            font-size: 10px; 
            font-weight: bold; 
          }
          .status-pending { background-color: #fef3c7; color: #92400e; }
          .status-released { background-color: #d1fae5; color: #065f46; }
          .status-cancelled { background-color: #fee2e2; color: #991b1b; }
          .status-copay { background-color: #dbeafe; color: #1e40af; }
          .status-advance { background-color: #e9d5ff; color: #6b21a8; }
          @media print {
            body { padding: 10px; }
            table { font-size: 9px; }
            th, td { padding: 5px; }
          }
        </style>
      </head>
      <body>
        <h1>📋 Patient Claims Report</h1>
        <div class="report-date">Generated on ${new Date().toLocaleString()}</div>
        <p><strong>Total Records:</strong> ${filteredPatients.length}</p>
        <table>
          <thead>
            <tr>
              <th>Patient Name</th>
              <th>Email</th>
              <th>Mobile</th>
              <th>Invoice #</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Paid</th>
              <th>Pending</th>
              <th>Need To Pay</th>
              <th>Service</th>
            </tr>
          </thead>
          <tbody>
            ${filteredPatients.map(p => `
              <tr>
                <td>${p.patientName || ''}</td>
                <td>${p.email || ''}</td>
                <td>${p.mobileNumber || ''}</td>
                <td>${p.invoiceNumber || ''}</td>
                <td><span class="status-badge status-${p.advanceClaimStatus?.toLowerCase() || ''}">${p.advanceClaimStatus || ''}</span></td>
                <td>${p.amount || ''}</td>
                <td>${p.paid || ''}</td>
                <td>${p.pending || ''}</td>
                <td>${p.needToPay || ''}</td>
                <td>${p.service || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      Released: "bg-green-100 text-green-800 border-green-200",
      Cancelled: "bg-red-100 text-red-800 border-red-200",
      "Co-pay": "bg-blue-100 text-blue-800 border-blue-200",
      Advance: "bg-purple-100 text-purple-800 border-purple-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="w-full max-w-[1600px] mx-auto">

        {/* Header Section */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2 flex-wrap">
                  <span className="text-2xl sm:text-3xl">🧾</span>
                  <span className="break-words">Patient Claims Dashboard</span>
                </h2>
                <p className="text-gray-500 mt-1 text-xs sm:text-sm md:text-base">
                  Manage and monitor patient claims
                </p>
              </div>

              {/* Filter Dropdown */}
              <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <label className="font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  Filter by Status:
                </label>
                <select
                  value={statusFilter}
                  onChange={handleFilterChange}
                  className="text-gray-800 w-full xs:w-auto min-w-[140px] border-2 border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white shadow-sm hover:border-gray-300"
                >
                  <option value="">All Claims</option>
                  <option value="Pending">Pending</option>
                  <option value="Released">Released</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Co-pay">Co-pay</option>
                  <option value="Advance">Advance</option>
                </select>
              </div>
            </div>

            {/* Search Bar and Export Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="Search by name, email, mobile, invoice, service..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="text-gray-800 w-full pl-10 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Export Buttons */}
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={downloadCSV}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow-md flex-1 sm:flex-none"
                  title="Download CSV"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="hidden xs:inline">CSV</span>
                </button>
                <button
                  onClick={downloadPDF}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow-md flex-1 sm:flex-none"
                  title="Download PDF"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden xs:inline">PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
          {[
            { label: "Pending", value: summary.pending || 0, color: "from-yellow-400 to-yellow-500", icon: "⏳", ring: "ring-yellow-200" },
            { label: "Released", value: summary.released || 0, color: "from-green-400 to-green-500", icon: "✅", ring: "ring-green-200" },
            { label: "Cancelled", value: summary.cancelled || 0, color: "from-red-400 to-red-500", icon: "❌", ring: "ring-red-200" },
            { label: "Co-pay", value: summary.copay || 0, color: "from-blue-400 to-blue-500", icon: "💳", ring: "ring-blue-200" },
            { label: "Advance", value: summary.advance || 0, color: "from-purple-400 to-purple-500", icon: "💰", ring: "ring-purple-200" },
            { label: "Total", value: summary.total || 0, color: "from-gray-600 to-gray-700", icon: "📊", ring: "ring-gray-200" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg sm:rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-3 sm:p-4 md:p-5 transform hover:-translate-y-1 cursor-pointer ring-1 ring-gray-100 hover:ring-2"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl sm:text-2xl md:text-3xl">{item.icon}</span>
                <div className={`bg-gradient-to-br ${item.color} w-2 h-2 rounded-full shadow-sm`}></div>
              </div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 truncate">
                {item.value}
              </div>
              <div className="text-[10px] xs:text-xs sm:text-sm text-gray-500 font-medium mt-1 truncate">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Patient List */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">
              Patient Records
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {filteredPatients.length} {filteredPatients.length === 1 ? "record" : "records"} found
              {searchQuery && ` (filtered from ${patients.length} total)`}
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-500"></div>
              <p className="text-gray-500 mt-4 text-sm">Loading patients...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-12 sm:py-16 px-4">
              <div className="text-5xl sm:text-6xl mb-4">📭</div>
              <p className="text-gray-500 text-base sm:text-lg font-medium">
                {searchQuery ? "No matching patients found" : "No patients found"}
              </p>
              <p className="text-gray-400 text-xs sm:text-sm mt-2">
                {searchQuery ? "Try a different search term" : "Try adjusting your filters"}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop & Large Tablet Card View (1024px and above) */}
              <div className="hidden lg:grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4 p-4">
                {filteredPatients.map((p, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
                  >
                    {/* Header Section */}
                    <div className="flex items-center justify-between border-b px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-2xl">
                      <h3 className="text-sm xl:text-base font-bold text-gray-900">
                        {p.patientName}
                      </h3>
                      <span
                        className={`inline-flex px-2 py-1 text-[10px] xl:text-xs font-bold rounded-full border ${getStatusColor(
                          p.advanceClaimStatus
                        )}`}
                      >
                        {p.advanceClaimStatus}
                      </span>
                    </div>

                    {/* Content Section */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 p-4 text-xs xl:text-sm">
                      <div>
                        <span className="font-semibold text-gray-700">Email:</span>
                        <div className="text-gray-600 truncate" title={p.email}>{p.email}</div>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Mobile:</span>
                        <div className="text-gray-600">{p.mobileNumber}</div>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Invoice #:</span>
                        <div className="font-mono text-blue-600">{p.invoiceNumber}</div>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Allocated By:</span>
                        <div className="text-gray-600">{p.allocatedBy}</div>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Amount:</span>
                        <div className="font-bold text-gray-900">{p.amount}</div>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Paid:</span>
                        <div className="text-green-600 font-semibold">{p.paid}</div>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Advance:</span>
                        <div className="text-purple-600 font-semibold">{p.advance}</div>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Pending:</span>
                        <div className="text-orange-600 font-semibold">{p.pending}</div>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Co-pay %:</span>
                        <div className="text-gray-600">{p.coPayPercent}</div>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Advance Given:</span>
                        <div className="text-gray-600">{p.advanceGivenAmount}</div>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Need To Pay:</span>
                        <div className="font-bold text-red-600">{p.needToPay}</div>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Service:</span>
                        <div className="text-gray-600">{p.service}</div>
                      </div>

                      <div className="col-span-2 sm:col-span-3">
                        <span className="font-semibold text-gray-700">Treatment / Package:</span>
                        <div className="text-gray-600 truncate" title={p.treatment || p.package}>
                          {p.treatment || p.package}
                        </div>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Payment Method:</span>
                        <div className="text-gray-600">{p.paymentMethod}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile & Tablet Card View (below 1024px) */}
              <div className="lg:hidden divide-y divide-gray-200">
                {filteredPatients.map((p, i) => (
                  <div
                    key={i}
                    className="p-3 sm:p-4 md:p-6 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                          {p.patientName}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate" title={p.email}>
                          {p.email}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                          {p.mobileNumber}
                        </p>
                      </div>
                      <span
                        className={`inline-flex px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold rounded-full border ${getStatusColor(
                          p.advanceClaimStatus
                        )} whitespace-nowrap flex-shrink-0`}
                      >
                        {p.advanceClaimStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                      <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-1 font-medium">Invoice #</p>
                        <p className="text-xs sm:text-sm font-mono font-bold text-blue-600 truncate" title={p.invoiceNumber}>
                          {p.invoiceNumber}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-1 font-medium">Allocated By</p>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate" title={p.allocatedBy}>
                          {p.allocatedBy}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-2 sm:p-3">
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-1 font-medium">Amount</p>
                        <p className="text-sm sm:text-base font-bold text-gray-900">
                          {p.amount}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-2 sm:p-3">
                        <p className="text-[10px] sm:text-xs text-green-700 mb-1 font-medium">Paid</p>
                        <p className="text-sm sm:text-base font-bold text-green-700">
                          {p.paid}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-2 sm:p-3">
                        <p className="text-[10px] sm:text-xs text-purple-700 mb-1 font-medium">Advance</p>
                        <p className="text-sm sm:text-base font-bold text-purple-700">
                          {p.advance}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-2 sm:p-3">
                        <p className="text-[10px] sm:text-xs text-orange-700 mb-1 font-medium">Pending</p>
                        <p className="text-sm sm:text-base font-bold text-orange-700">
                          {p.pending}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-1 font-medium">Co-pay %</p>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900">
                          {p.coPayPercent}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-1 font-medium">Advance Given</p>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900">
                          {p.advanceGivenAmount}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-2 sm:p-3">
                        <p className="text-[10px] sm:text-xs text-red-700 mb-1 font-medium">Need To Pay</p>
                        <p className="text-sm sm:text-base font-bold text-red-700">
                          {p.needToPay}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-1 font-medium">Service</p>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate" title={p.service}>
                          {p.service}
                        </p>
                      </div>
                      <div className="col-span-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-2 sm:p-3">
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-1 font-medium">Treatment/Package</p>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 break-words">
                          {p.treatment || p.package}
                        </p>
                      </div>
                      <div className="col-span-2 bg-gray-50 rounded-lg p-2 sm:p-3">
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-1 font-medium">Payment Method</p>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900">
                          {p.paymentMethod}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

AdminPatientClaims.getLayout = function PageLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedDashboard = withAdminAuth(AdminPatientClaims);
ProtectedDashboard.getLayout = AdminPatientClaims.getLayout;

export default ProtectedDashboard;