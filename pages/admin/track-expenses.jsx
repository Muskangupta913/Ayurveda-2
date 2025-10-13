import React, { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, Eye, X, User, Wallet } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import withAdminAuth from "../../components/withAdminAuth";

function AllPettyCashAdmin() {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [globalAmounts, setGlobalAmounts] = useState({ globalTotalAmount: 0, globalSpentAmount: 0, globalRemainingAmount: 0 });
  const [filters, setFilters] = useState({ staff: "", start: "", end: "", search: "" });
  const [loading, setLoading] = useState(false);
  const [receipts, setReceipts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState(null);
  const perPage = 20;

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getToday = () => new Date().toISOString().split('T')[0];

  const fetchData = async () => {
    try {
      setLoading(true);
      const { staff, start, end } = filters;
      let s = start, e = end;

      if (!s && !e) {
        s = e = getToday();
        setFilters(prev => ({ ...prev, start: s, end: e }));
      } else if (s && !e) {
        e = s;
        setFilters(prev => ({ ...prev, end: s }));
      } else if (!s && e) {
        s = e;
        setFilters(prev => ({ ...prev, start: e }));
      }

      const params = new URLSearchParams({ startDate: s, endDate: e });
      if (staff) params.append("staffName", staff);

      const token = localStorage.getItem("adminToken");
      const res = await fetch(`/api/admin/getAllPettyCash?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();

      setData(json.data || []);
      setFiltered(json.data || []);
      if (json.staffList && !staffList.length) setStaffList(json.staffList);
      if (json.globalAmounts) setGlobalAmounts(json.globalAmounts);
      showToast("Data loaded", "success");
    } catch (err) {
      showToast(err.message || "Error loading data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const today = getToday();
    setFilters({ staff: "", start: today, end: today, search: "" });
    fetchData();
  }, []);

  useEffect(() => {
    const result = data.filter(item =>
      filters.search === "" ||
      item.staff.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.staff.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.patients.some(p =>
        p.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        p.phone.includes(filters.search)
      )
    );
    setFiltered(result);
    setPage(1);
  }, [filters.search, data]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const currentData = filtered.slice((page - 1) * perPage, page * perPage);

  const isImage = (url) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  const isPDF = (url) => /\.pdf$/i.test(url);
  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded shadow-lg text-white ${
          toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Petty Cash Records</h1>

      {/* Global Totals */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Global Petty Cash Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">₹{globalAmounts.globalTotalAmount}</div>
            <div className="text-sm text-green-800">Total Amount</div>
            <div className="text-xs text-green-600 mt-1">All staff combined</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">₹{globalAmounts.globalSpentAmount}</div>
            <div className="text-sm text-red-800">Total Spent</div>
            <div className="text-xs text-red-600 mt-1">All expenses combined</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">₹{globalAmounts.globalRemainingAmount}</div>
            <div className="text-sm text-blue-800">Remaining Balance</div>
            <div className="text-xs text-blue-600 mt-1">Available for use</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-3 text-gray-900 w-4 h-4" />
            <input
              type="text"
              placeholder="Search staff or patient..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-9 pr-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>
          
          <select
            value={filters.staff}
            onChange={(e) => setFilters(prev => ({ ...prev, staff: e.target.value }))}
            className="px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="">All Staff</option>
            {staffList.map(name => <option key={name} value={name}>{name}</option>)}
          </select>

          <input
            type="date"
            value={filters.start}
            onChange={(e) => setFilters(prev => ({ ...prev, start: e.target.value }))}
            className="px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 text-gray-900"
          />

          <input
            type="date"
            value={filters.end}
            onChange={(e) => setFilters(prev => ({ ...prev, end: e.target.value }))}
            className="px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>

        <button
          onClick={fetchData}
          className="mt-3 bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700"
        >
          Apply
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : currentData.length > 0 ? (
        <>
          {/* Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            {currentData.map(item => (
              <div key={item.staff._id} className="bg-white rounded shadow">
                {/* Header */}
                <div className="bg-blue-600 text-white p-4 flex items-center gap-3">
                  <User className="w-8 h-8" />
                  <div>
                    <h3 className="font-bold">{item.staff.name}</h3>
                    <p className="text-sm opacity-90">{item.staff.email}</p>
                  </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-3 gap-2 p-4 bg-gray-50 text-center">
                  {item.totalAllocated > 0 && (
                    <div>
                      <p className="text-xs text-gray-800">Allocated</p>
                      <p className="font-bold text-gray-900">₹{item.totalAllocated}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-800">Spent</p>
                    <p className="font-bold text-gray-900">₹{item.totalSpent}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-800">Balance</p>
                    <p className="font-bold text-gray-900">₹{item.totalAmount}</p>
                  </div>
                </div>

                {/* Patients (only show those with allocated amounts) */}
                <div className="p-4 border-t">
                  {(() => {
                    const patientsWithAlloc = item.patients.filter(p => Array.isArray(p.allocatedAmounts) && p.allocatedAmounts.length > 0);
                    return (
                      <>
                        <h4 className="font-semibold text-gray-900 mb-2">Allocated ({patientsWithAlloc.length})</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {patientsWithAlloc.map((p, i) => (
                            <div key={i} className="bg-gray-50 rounded p-2 text-sm">
                              <p className="font-semibold text-gray-900">{p.name}</p>
                              <p className="text-gray-800">{p.phone} • {p.email}</p>
                              {p.allocatedAmounts.map((a, j) => (
                                <div key={j} className="flex justify-between items-center mt-1 pt-1 border-t">
                                  <span className="text-gray-900">₹{a.amount} • {formatDate(a.date)}</span>
                                  {a.receipts?.length > 0 && (
                                    <button
                                      onClick={() => { setReceipts(a.receipts); setShowModal(true); }}
                                      className="text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                      <Eye className="w-3 h-3" /> View
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}  
                </div>

                {/* Expenses */}
                {item.expenses.length > 0 && (
                  <div className="p-4 border-t">
                    <h4 className="font-semibold text-gray-900 mb-2">Expenses ({item.expenses.length})</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {item.expenses.map((e, i) => (
                        <div key={i} className="bg-gray-50 rounded p-2 text-sm flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-900">{e.description}</p>
                            <p className="text-gray-800">₹{e.spentAmount} • {formatDate(e.date)}</p>
                          </div>
                          {e.receipts?.length > 0 && (
                            <button
                              onClick={() => { setReceipts(e.receipts); setShowModal(true); }}
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> View
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white rounded shadow p-4 flex justify-between items-center">
              <p className="text-sm text-gray-900">
                {(page - 1) * perPage + 1}-{Math.min(page * perPage, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border rounded disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`px-3 py-1 rounded ${page === i + 1 ? 'bg-blue-600 text-white' : 'border text-gray-900'}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border rounded disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded shadow p-12 text-center">
          <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-900 text-lg">No records found</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">Receipts</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-900 hover:text-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-3">
              {receipts.map((file, i) => (
                <div key={i} className="border rounded p-3">
                  {isImage(file) ? (
                    <img src={file} alt={`Receipt ${i + 1}`} className="w-full max-h-80 object-contain" />
                  ) : isPDF(file) ? (
                    <iframe src={file} title={`Receipt ${i + 1}`} className="w-full h-80" />
                  ) : (
                    <a href={file} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Open File {i + 1}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
AllPettyCashAdmin.getLayout = function PageLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedDashboard = withAdminAuth(AllPettyCashAdmin);
ProtectedDashboard.getLayout = AllPettyCashAdmin.getLayout;

export default ProtectedDashboard;
