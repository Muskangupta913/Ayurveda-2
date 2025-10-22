import { useState, useEffect } from "react";
import axios from "axios";
import AdminLayout from "../../components/AdminLayout";
import withAdminAuth from "../../components/withAdminAuth";
import { X, Plus, Search, Filter, Download, Calendar, DollarSign, User, FileText, Clock } from "lucide-react";

function Contractor() {
  const [form, setForm] = useState({
    contractId: "",
    contractTitle: "",
    startDate: "",
    endDate: "",
    renewalDate: "",
    contractValue: "",
    paymentTerms: "monthly",
    responsiblePerson: "",
    status: "Active",
  });

  const [file, setFile] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchStaff();
    fetchContracts();
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await axios.get("/api/contracts/getStaff");
      setStaffList(res.data.data || []);
    } catch (err) {
      console.error("Error fetching staff:", err);
    }
  };

  const fetchContracts = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        console.log("No admin token found");
        return;
      }
      const res = await axios.get("/api/contracts/getAll", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setContracts(res.data.data || []);
    } catch (err) {
      console.error("Error fetching contracts:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const adminToken = localStorage.getItem("adminToken");
      if (!adminToken) {
        alert("Admin token not found. Please log in again.");
        return;
      }

      const formData = new FormData();
      Object.keys(form).forEach((key) => formData.append(key, form[key]));
      if (file) formData.append("contractFile", file);

      await axios.post("/api/contracts/create", formData, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("✅ Contract added successfully!");
      setForm({
        contractId: "",
        contractTitle: "",
        startDate: "",
        endDate: "",
        renewalDate: "",
        contractValue: "",
        paymentTerms: "monthly",
        responsiblePerson: "",
        status: "Active",
      });
      setFile(null);
      setIsModalOpen(false);
      fetchContracts();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Error adding contract");
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort contracts
  const filteredContracts = contracts
    .filter((contract) => {
      const matchesSearch =
        contract.contractTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.contractId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.responsiblePerson?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || contract.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.startDate) - new Date(a.startDate);
      if (sortBy === "oldest") return new Date(a.startDate) - new Date(b.startDate);
      if (sortBy === "value-high") return b.contractValue - a.contractValue;
      if (sortBy === "value-low") return a.contractValue - b.contractValue;
      return 0;
    });

  const getStatusColor = (status) => {
    const colors = {
      Active: "bg-emerald-100 text-emerald-700 border-emerald-200",
      "Expiring Soon": "bg-amber-100 text-amber-700 border-amber-200",
      Expired: "bg-red-100 text-red-700 border-red-200",
      Terminated: "bg-gray-100 text-gray-700 border-gray-200",
      Renewed: "bg-blue-100 text-blue-700 border-blue-200",
    };
    return colors[status] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const calculateDaysUntilExpiry = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Contract Management</h1>
              <p className="mt-1 text-sm text-gray-500">Manage and track all your contracts in one place</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm font-medium"
            >
              <Plus size={20} />
              Add Contract
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">Total Contracts</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{contracts.length}</p>
                </div>
                <div className="p-2 bg-gray-100 rounded-lg">
                  <FileText size={20} className="text-gray-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">Active</p>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1">
                    {contracts.filter((c) => c.status === "Active").length}
                  </p>
                </div>
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Clock size={20} className="text-emerald-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">Expiring Soon</p>
                  <p className="text-xl sm:text-2xl font-bold text-amber-600 mt-1">
                    {contracts.filter((c) => c.status === "Expiring Soon").length}
                  </p>
                </div>
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Calendar size={20} className="text-amber-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">Total Value</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                    د.إ{contracts.reduce((sum, c) => sum + Number(c.contractValue || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-2 bg-gray-100 rounded-lg">
                  <DollarSign size={20} className="text-gray-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by title, ID, or responsible person..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none appearance-none bg-white text-sm min-w-[140px]"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Expiring Soon">Expiring Soon</option>
                  <option value="Expired">Expired</option>
                  <option value="Terminated">Terminated</option>
                  <option value="Renewed">Renewed</option>
                </select>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none appearance-none bg-white text-sm min-w-[140px]"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="value-high">Value: High to Low</option>
                <option value="value-low">Value: Low to High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contracts Grid */}
        {filteredContracts.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium">No contracts found</p>
            <p className="text-gray-400 text-sm mt-1">
              {searchQuery || statusFilter !== "All" ? "Try adjusting your filters" : "Add your first contract to get started"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {filteredContracts.map((contract) => {
              const daysUntilExpiry = calculateDaysUntilExpiry(contract.endDate);
              return (
                <div
                  key={contract._id}
                  className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200 overflow-hidden group"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-gray-700 transition-colors">
                          {contract.contractTitle}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">ID: {contract.contractId}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(contract.status)} whitespace-nowrap ml-2`}>
                        {contract.status}
                      </span>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <User size={16} className="text-gray-400 flex-shrink-0" />
                        <span className="text-gray-600 truncate">{contract.responsiblePerson?.name || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign size={16} className="text-gray-400 flex-shrink-0" />
                        <span className="text-gray-900 font-semibold">د.إ{Number(contract.contractValue).toLocaleString()}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500 capitalize">{contract.paymentTerms}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                        <span className="text-gray-600">
                          {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {daysUntilExpiry > 0 && daysUntilExpiry <= 30 && (
                      <div className="mb-4 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-700 font-medium">
                          ⚠️ Expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? "s" : ""}
                        </p>
                      </div>
                    )}

                    {contract.renewalDate && (
                      <div className="mb-4 p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-700">
                          <span className="font-medium">Renewal:</span> {new Date(contract.renewalDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    {contract.contractFile && (
                      <a
                        href={contract.contractFile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 font-medium border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors w-full justify-center"
                      >
                        <Download size={16} />
                        View Contract File
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full my-8 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add New Contract</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Contract ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="contractId"
                    placeholder="e.g., CNT-2025-001"
                    onChange={handleChange}
                    value={form.contractId}
                    required
                    className="w-full border border-gray-300 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Contract Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="contractTitle"
                    placeholder="Enter contract title"
                    onChange={handleChange}
                    value={form.contractTitle}
                    required
                    className="w-full border border-gray-300 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    onChange={handleChange}
                    value={form.startDate}
                    required
                    className="w-full border border-gray-300 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    onChange={handleChange}
                    value={form.endDate}
                    required
                    className="w-full border border-gray-300 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Renewal Date</label>
                  <input
                    type="date"
                    name="renewalDate"
                    onChange={handleChange}
                    value={form.renewalDate}
                    className="w-full border border-gray-300 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Contract Value (د.إ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="contractValue"
                    placeholder="Enter amount"
                    onChange={handleChange}
                    value={form.contractValue}
                    required
                    className="w-full border border-gray-300 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Payment Terms <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="paymentTerms"
                    onChange={handleChange}
                    value={form.paymentTerms}
                    className="w-full border border-gray-300 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm appearance-none bg-white"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                    <option value="one-time">One-time</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Responsible Person <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="responsiblePerson"
                    onChange={handleChange}
                    value={form.responsiblePerson}
                    required
                    className="w-full border border-gray-300 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm appearance-none bg-white"
                  >
                    <option value="">Select Staff</option>
                    {staffList.map((staff) => (
                      <option key={staff._id} value={staff._id}>
                        {staff.name} ({staff.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="status"
                    onChange={handleChange}
                    value={form.status}
                    className="w-full border border-gray-300 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm appearance-none bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Expiring Soon">Expiring Soon</option>
                    <option value="Expired">Expired</option>
                    <option value="Terminated">Terminated</option>
                    <option value="Renewed">Renewed</option>
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Contract File</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="w-full border border-gray-300 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
                <p className="text-xs text-gray-500 mt-1.5">Accepted formats: PDF, DOC, DOCX, PNG, JPG, JPEG</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? "Adding Contract..." : "Add Contract"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

Contractor.getLayout = function PageLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedContractor = withAdminAuth(Contractor);
ProtectedContractor.getLayout = Contractor.getLayout;

export default ProtectedContractor;