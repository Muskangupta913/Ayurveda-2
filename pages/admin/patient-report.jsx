"use client";
import React, { useEffect, useState } from "react";
import { Search, FileText, FileSpreadsheet, X, ChevronLeft, ChevronRight } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import withAdminAuth from "../../components/withAdminAuth";

const AdminPatientClaims = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [summary, setSummary] = useState({});
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const patientsPerPage = 20;

  const token = typeof window !== 'undefined' ? localStorage.getItem("adminToken") : null;

  const fetchPatients = async (status = "") => {
    try {
      setLoading(true);
      const url = `/api/admin/getPatientClaims${status ? `?statusFilter=${status}` : ""}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to fetch patient claims');
      }

      const data = await res.json();
      const patientsData = data.patients || [];
      setPatients(patientsData);
      setFilteredPatients(patientsData);
      setSummary(data.summary || {});
    } catch (err) {
      console.error(err);
      alert(err.message || "Error fetching patients");
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
    setSearchQuery("");
    setCurrentPage(1);
    fetchPatients(status);
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setCurrentPage(1);

    if (query === "") {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter((p) =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query) ||
        p.mobileNumber?.toLowerCase().includes(query) ||
        p.invoiceNumber?.toLowerCase().includes(query) ||
        p.emrNumber?.toLowerCase().includes(query) ||
        p.service?.toLowerCase().includes(query) ||
        p.treatment?.toLowerCase().includes(query) ||
        p.package?.toLowerCase().includes(query)
      );
      setFilteredPatients(filtered);
    }
  };

  // Pagination
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

  const downloadCSV = () => {
    if (filteredPatients.length === 0) {
      alert("No data to download");
      return;
    }

    const headers = [
      "Invoice Number", "EMR Number", "First Name", "Last Name", "Gender", "Email", "Mobile",
      "Referred By", "Patient Type", "Doctor", "Service", "Treatment", "Package",
      "Amount", "Paid", "Advance", "Pending", "Payment Method",
      "Insurance", "Advance Given Amount", "Co-pay %", "Need To Pay",
      "Advance Claim Status", "Status", "Invoiced Date", "Created At"
    ];

    const csvContent = [
      headers.join(","),
      ...filteredPatients.map(p => [
        `"${p.invoiceNumber || ''}"`,
        `"${p.emrNumber || ''}"`,
        `"${p.firstName || ''}"`,
        `"${p.lastName || ''}"`,
        `"${p.gender || ''}"`,
        `"${p.email || ''}"`,
        `"${p.mobileNumber || ''}"`,
        `"${p.referredBy || ''}"`,
        `"${p.patientType || ''}"`,
        `"${p.doctor?.name || p.doctor || ''}"`,
        `"${p.service || ''}"`,
        `"${p.treatment || ''}"`,
        `"${p.package || ''}"`,
        `"${p.amount || ''}"`,
        `"${p.paid || ''}"`,
        `"${p.advance || ''}"`,
        `"${p.pending || ''}"`,
        `"${p.paymentMethod || ''}"`,
        `"${p.insurance || ''}"`,
        `"${p.advanceGivenAmount || ''}"`,
        `"${p.coPayPercent || ''}"`,
        `"${p.needToPay || ''}"`,
        `"${p.advanceClaimStatus || ''}"`,
        `"${p.status || ''}"`,
        `"${p.invoicedDate || ''}"`,
        `"${p.createdAt || ''}"`
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
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px; }
          th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
          th { background-color: #3b82f6; color: white; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9fafb; }
          @media print {
            body { padding: 10px; }
            table { font-size: 8px; }
            th, td { padding: 4px; }
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
              <th>Invoice</th>
              <th>EMR</th>
              <th>Patient Name</th>
              <th>Email</th>
              <th>Mobile</th>
              <th>Treatment</th>
              <th>Amount</th>
              <th>Paid</th>
              <th>Pending</th>
              <th>Advance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredPatients.map(p => `
              <tr>
                <td>${p.invoiceNumber || ''}</td>
                <td>${p.emrNumber || ''}</td>
                <td>${p.firstName || ''} ${p.lastName || ''}</td>
                <td>${p.email || ''}</td>
                <td>${p.mobileNumber || ''}</td>
                <td>${p.treatment || p.package || ''}</td>
                <td>₹${p.amount || ''}</td>
                <td>₹${p.paid || ''}</td>
                <td>₹${p.pending || ''}</td>
                <td>₹${p.advance || ''}</td>
                <td>${p.advanceClaimStatus || ''}</td>
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
                  <option value="co-pay">Co-pay</option>
                  <option value="advance">Advance</option>
                </select>
              </div>
            </div>

            {/* Search Bar and Export Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="Search by name, email, mobile, invoice, EMR, service..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="text-gray-800 w-full pl-10 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

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
            { label: "Pending", value: summary.pending || 0, color: "from-yellow-400 to-yellow-500", icon: "⏳" },
            { label: "Released", value: summary.released || 0, color: "from-green-400 to-green-500", icon: "✅" },
            { label: "Cancelled", value: summary.cancelled || 0, color: "from-red-400 to-red-500", icon: "❌" },
            { label: "Co-pay", value: summary.copay || 0, color: "from-blue-400 to-blue-500", icon: "💳" },
            { label: "Advance", value: summary.advance || 0, color: "from-purple-400 to-purple-500", icon: "💰" },
            { label: "Total", value: summary.total || 0, color: "from-gray-600 to-gray-700", icon: "📊" },
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
              {/* Patient Cards Grid - 3 cards per row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {currentPatients.map((patient, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-5 border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">
                          {patient.firstName} {patient.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">{patient.emrNumber}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(patient.advanceClaimStatus)}`}>
                        {patient.advanceClaimStatus}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Treatment:</span>
                        <span className="font-medium text-gray-900 truncate ml-2" title={patient.treatment || patient.package}>
                          {patient.treatment || patient.package || '-'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Amount:</span>
                        <span className="font-medium text-gray-900">₹{patient.amount?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Paid:</span>
                        <span className="font-medium text-green-600">₹{patient.paid?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Pending:</span>
                        <span className="font-medium text-red-600">₹{patient.pending?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Advance:</span>
                        <span className="font-medium text-blue-600">₹{patient.advance?.toLocaleString() || 0}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedPatient(patient)}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      See Full Details
                    </button>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 p-6 border-t border-gray-200">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  
                  <div className="flex gap-1">
                    {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                      let pageNum;
                      if (totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (currentPage <= 4) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 3) {
                        pageNum = totalPages - 6 + i;
                      } else {
                        pageNum = currentPage - 3 + i;
                      }
                      
                      return (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 rounded-lg ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Patient Detail Modal with Blurred Background */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold text-gray-900">Patient Details</h2>
              <button
                onClick={() => setSelectedPatient(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-900"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-300 pb-2">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><span className="text-gray-700">Invoice Number:</span> <span className="font-medium text-gray-900">{selectedPatient.invoiceNumber || '-'}</span></div>
                  <div><span className="text-gray-700">EMR Number:</span> <span className="font-medium text-gray-900">{selectedPatient.emrNumber || '-'}</span></div>
                  <div><span className="text-gray-700">First Name:</span> <span className="font-medium text-gray-900">{selectedPatient.firstName || '-'}</span></div>
                  <div><span className="text-gray-700">Last Name:</span> <span className="font-medium text-gray-900">{selectedPatient.lastName || '-'}</span></div>
                  <div><span className="text-gray-700">Gender:</span> <span className="font-medium text-gray-900">{selectedPatient.gender || '-'}</span></div>
                  <div><span className="text-gray-700">Email:</span> <span className="font-medium text-gray-900">{selectedPatient.email || '-'}</span></div>
                  <div><span className="text-gray-700">Mobile:</span> <span className="font-medium text-gray-900">{selectedPatient.mobileNumber || '-'}</span></div>
                  <div><span className="text-gray-700">Patient Type:</span> <span className="font-medium text-gray-900">{selectedPatient.patientType || '-'}</span></div>
                </div>
              </div>

              {/* Medical Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-300 pb-2">Medical Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><span className="text-gray-700">Doctor:</span> <span className="font-medium text-gray-900">{selectedPatient.doctor?.name || selectedPatient.doctor || '-'}</span></div>
                  <div><span className="text-gray-700">Service:</span> <span className="font-medium text-gray-900">{selectedPatient.service || '-'}</span></div>
                  <div><span className="text-gray-700">Treatment:</span> <span className="font-medium text-gray-900">{selectedPatient.treatment || '-'}</span></div>
                  <div><span className="text-gray-700">Package:</span> <span className="font-medium text-gray-900">{selectedPatient.package || '-'}</span></div>
                  <div><span className="text-gray-700">Referred By:</span> <span className="font-medium text-gray-900">{selectedPatient.referredBy || '-'}</span></div>
                  <div><span className="text-gray-700">Insurance:</span> <span className="font-medium text-gray-900">{selectedPatient.insurance || '-'}</span></div>
                </div>
              </div>

              {/* Financial Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-300 pb-2">Financial Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><span className="text-gray-700">Total Amount:</span> <span className="font-medium text-gray-900">₹{selectedPatient.amount?.toLocaleString() || 0}</span></div>
                  <div><span className="text-gray-700">Paid Amount:</span> <span className="font-medium text-green-600">₹{selectedPatient.paid?.toLocaleString() || 0}</span></div>
                  <div><span className="text-gray-700">Pending Amount:</span> <span className="font-medium text-red-600">₹{selectedPatient.pending?.toLocaleString() || 0}</span></div>
                  <div><span className="text-gray-700">Advance:</span> <span className="font-medium text-blue-600">₹{selectedPatient.advance?.toLocaleString() || 0}</span></div>
                  <div><span className="text-gray-700">Advance Given:</span> <span className="font-medium text-gray-900">₹{selectedPatient.advanceGivenAmount?.toLocaleString() || 0}</span></div>
                  <div><span className="text-gray-700">Co-pay %:</span> <span className="font-medium text-gray-900">{selectedPatient.coPayPercent || 0}%</span></div>
                  <div><span className="text-gray-700">Need to Pay:</span> <span className="font-medium text-gray-900">₹{selectedPatient.needToPay?.toLocaleString() || 0}</span></div>
                  <div><span className="text-gray-700">Payment Method:</span> <span className="font-medium text-gray-900">{selectedPatient.paymentMethod || '-'}</span></div>
                </div>
              </div>

              {/* Claim Status */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-300 pb-2">Claim Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><span className="text-gray-700">Claim Status:</span> <span className={`font-medium ${
                    selectedPatient.advanceClaimStatus === 'Pending' ? 'text-yellow-600' :
                    selectedPatient.advanceClaimStatus === 'Released' ? 'text-green-600' :
                    'text-red-600'
                  }`}>{selectedPatient.advanceClaimStatus || '-'}</span></div>
                  <div><span className="text-gray-700">Patient Status:</span> <span className="font-medium text-gray-900">{selectedPatient.status || '-'}</span></div>
                  <div><span className="text-gray-700">Invoiced By:</span> <span className="font-medium text-gray-900">{selectedPatient.invoicedBy || '-'}</span></div>
                  <div><span className="text-gray-700">Released By:</span> <span className="font-medium text-gray-900">{selectedPatient.advanceClaimReleasedBy || '-'}</span></div>
                  <div><span className="text-gray-700">Invoice Date:</span> <span className="font-medium text-gray-900">{selectedPatient.invoicedDate ? new Date(selectedPatient.invoicedDate).toLocaleDateString() : '-'}</span></div>
                  <div><span className="text-gray-700">Created At:</span> <span className="font-medium text-gray-900">{selectedPatient.createdAt ? new Date(selectedPatient.createdAt).toLocaleString() : '-'}</span></div>
                </div>
              </div>

              {/* Payment History */}
              {selectedPatient.paymentHistory && selectedPatient.paymentHistory.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-300 pb-2">Payment History</h3>
                  <div className="space-y-2">
                    {selectedPatient.paymentHistory.map((payment, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                        <div>
                          <span className="text-sm text-gray-800 font-medium">Payment #{idx + 1}</span>
                          <p className="text-xs text-gray-600">{payment.date ? new Date(payment.date).toLocaleString() : '-'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">₹{payment.amount?.toLocaleString() || 0}</p>
                          <p className="text-xs text-gray-700">{payment.method || '-'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

AdminPatientClaims.getLayout = function PageLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedDashboard = withAdminAuth(AdminPatientClaims);
ProtectedDashboard.getLayout = AdminPatientClaims.getLayout;

export default ProtectedDashboard;