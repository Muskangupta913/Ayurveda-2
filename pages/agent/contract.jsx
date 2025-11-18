"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { Search, Filter, Calendar, DollarSign, FileText, Eye, X } from "lucide-react";
import AgentLayout from "../../components/AgentLayout";
import withAgentAuth from "../../components/withAgentAuth";

function StaffContracts() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [permissions, setPermissions] = useState({
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canRead: false,
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  useEffect(() => {
    fetchPermissions();
  }, []);

  useEffect(() => {
    if (permissionsLoaded && permissions.canRead) {
      fetchStaffContracts();
    }
  }, [permissionsLoaded, permissions.canRead]);

  // Get token dynamically on each call to ensure it's fresh
  const getToken = () => {
    return typeof window !== "undefined" ? localStorage.getItem("agentToken") : "";
  };

  const fetchPermissions = async () => {
    const token = getToken();
    
    if (!token) {
      console.log("No token found, setting permissions to false");
      setPermissions({
        canCreate: false,
        canUpdate: false,
        canDelete: false,
        canRead: false,
      });
      setPermissionsLoaded(true);
      return;
    }
    
    console.log("Fetching contract permissions with token:", token.substring(0, 20) + "...");
    
    try {
      const res = await fetch("/api/agent/my-permissions", {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });
      
      if (!res.ok) {
        console.error("Permission API error:", res.status, res.statusText);
        if (res.status === 401) {
          console.error("Unauthorized - token may be invalid or expired");
          const freshToken = typeof window !== "undefined" ? localStorage.getItem("agentToken") : "";
          if (freshToken && freshToken !== token) {
            console.log("Retrying with fresh token");
            return;
          }
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      if (data.success && data.data) {
        console.log("All permissions received:", data.data.permissions);
        
        // Find staff_management module (All Contracts is a submodule under it, like Membership)
        const modulePermission = data.data.permissions?.find((p) => {
          if (!p) return false;
          if (p.module === "staff_management") return true;
          if (p.module === "clinic_staff_management") return true;
          if (p.module.startsWith("clinic_") && p.module.slice(7) === "staff_management") {
            return true;
          }
          return false;
        });
        
        if (modulePermission) {
          const actions = modulePermission.actions || {};
          
          console.log("Staff Management Permission Actions:", actions);
          
          // Check for "All Contracts" submodule (like Membership)
          const contractsSubModule = modulePermission.subModules?.find(
            (sm) => sm.name === "All Contracts" || sm.name?.toLowerCase() === "all contracts"
          );
          
          console.log("All Contracts SubModule found:", contractsSubModule);
          
          // If submodule exists, use its actions, otherwise use module-level actions
          const effectiveActions = contractsSubModule?.actions || actions;
          
          console.log("Effective Actions (All Contracts):", effectiveActions);
          
          // If actions.all is true, grant all permissions
          const hasAll = effectiveActions.all === true;
          
          setPermissions({
            canCreate: hasAll || effectiveActions.create === true,
            canUpdate: hasAll || effectiveActions.update === true,
            canDelete: hasAll || effectiveActions.delete === true,
            canRead: hasAll || effectiveActions.read === true,
          });
          
          console.log("Contract Final Permissions:", {
            canCreate: hasAll || effectiveActions.create === true,
            canUpdate: hasAll || effectiveActions.update === true,
            canDelete: hasAll || effectiveActions.delete === true,
            canRead: hasAll || effectiveActions.read === true,
            hasSubModule: !!contractsSubModule,
          });
        } else {
          console.log("No module permission found for staff_management");
          setPermissions({
            canCreate: false,
            canUpdate: false,
            canDelete: false,
            canRead: false,
          });
        }
      } else {
        console.log("Contract API failed or no data:", data);
        setPermissions({
          canCreate: false,
          canUpdate: false,
          canDelete: false,
          canRead: false,
        });
      }
      setPermissionsLoaded(true);
    } catch (err) {
      console.error("Error fetching permissions:", err);
      setPermissions({
        canCreate: false,
        canUpdate: false,
        canDelete: false,
        canRead: false,
      });
      setPermissionsLoaded(true);
    }
  };

  const fetchStaffContracts = async () => {
    try {
      const agentToken = typeof window !== "undefined" ? localStorage.getItem("agentToken") : null;
      if (!agentToken) {
        alert("Please log in as agent to view contracts.");
        return;
      }

      console.log("Fetching agent contracts...");
      const res = await axios.get("/api/contracts/getByStaff", {
        headers: { Authorization: `Bearer ${agentToken}` },
      });

      console.log("Staff contracts response:", res.data);
      setContracts(res.data.data || []);
    } catch (err) {
      console.error("Error fetching staff contracts:", err);
      alert("Error loading contracts.");
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort contracts
  const filteredContracts = contracts
    .filter((contract) => {
      const matchesSearch =
        contract.contractTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.contractId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || contract.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.startDate) - new Date(a.startDate);
        case "oldest":
          return new Date(a.startDate) - new Date(b.startDate);
        case "value-high":
          return b.contractValue - a.contractValue;
        case "value-low":
          return a.contractValue - b.contractValue;
        default:
          return 0;
      }
    });

  const statusOptions = ["all", "Active", "Expired", "Expiring Soon", "Pending"];
  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "value-high", label: "Highest Value" },
    { value: "value-low", label: "Lowest Value" },
  ];

  if (!permissionsLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading contracts...</p>
        </div>
      </div>
    );
  }

  if (!permissions.canRead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view contracts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                My Contracts
              </h1>
              <p className="mt-2 text-gray-600">
                Manage and track all your assigned contracts
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-gray-500 font-medium">Total:</span>
                <span className="ml-2 text-gray-900 font-bold">{contracts.length}</span>
              </div>
              <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-gray-500 font-medium">Active:</span>
                <span className="ml-2 text-green-600 font-bold">
                  {contracts.filter((c) => c.status === "Active").length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by contract title or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Filter Toggle Button (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-5 h-5" />
              <span className="font-medium">Filters</span>
            </button>

            {/* Desktop Filters */}
            <div className="hidden lg:flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all cursor-pointer"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status === "all" ? "All Status" : status}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all cursor-pointer"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile Filters Dropdown */}
          {showFilters && (
            <div className="lg:hidden mt-4 pt-4 border-t border-gray-200 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status === "all" ? "All Status" : status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Active Filters */}
          {(searchTerm || statusFilter !== "all") && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">Active filters:</span>
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  Search: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm("")}
                    className="hover:bg-gray-200 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {statusFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  Status: {statusFilter}
                  <button
                    onClick={() => setStatusFilter("all")}
                    className="hover:bg-gray-200 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contracts Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {filteredContracts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              {contracts.length === 0 ? "No Contracts Found" : "No Results"}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {contracts.length === 0
                ? "No contracts have been assigned to you yet."
                : "Try adjusting your search or filters to find what you're looking for."}
            </p>
            {(searchTerm || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredContracts.map((contract) => (
              <div
                key={contract._id}
                className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
                      {contract.contractTitle}
                    </h3>
                    <span
                      className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${
                        contract.status === "Active"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : contract.status === "Expired"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : contract.status === "Expiring Soon"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-gray-50 text-gray-700 border border-gray-200"
                      }`}
                    >
                      {contract.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 font-mono">{contract.contractId}</p>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-4">
                  {/* Contract Value - Highlighted */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-gray-600" />
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                        Contract Value
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      د.إ{contract.contractValue?.toLocaleString()}
                    </p>
                  </div>

                  {/* Date Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-xs font-medium text-gray-600">Start Date</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(contract.startDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-xs font-medium text-gray-600">End Date</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(contract.endDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Renewal Date if exists */}
                  {contract.renewalDate && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-xs font-medium text-blue-700">Renewal Date</span>
                      </div>
                      <p className="text-sm font-semibold text-blue-900">
                        {new Date(contract.renewalDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  )}

                  {/* Payment Terms */}
                  <div className="flex items-center justify-between py-2 border-t border-gray-100">
                    <span className="text-sm text-gray-600">Payment Terms</span>
                    <span className="text-sm font-semibold text-gray-900 capitalize">
                      {contract.paymentTerms}
                    </span>
                  </div>
                </div>

                {/* Card Footer */}
                {contract.contractFile && (
                  <div className="px-6 pb-6">
                    <a
                      href={contract.contractFile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm group-hover:shadow-md"
                    >
                      <Eye className="w-4 h-4" />
                      View Contract Document
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ✅ Add layout and authentication wrapper */
StaffContracts.getLayout = function PageLayout(page) {
  return <AgentLayout>{page}</AgentLayout>;
};

const ProtectedContracts = withAgentAuth(StaffContracts);
ProtectedContracts.getLayout = StaffContracts.getLayout;

export default ProtectedContracts;