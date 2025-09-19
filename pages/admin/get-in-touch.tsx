import React from "react";
import { useEffect, useState, useMemo } from "react";
import { Search, Download, Filter,Phone, MapPin, MessageSquare, ChevronLeft, ChevronRight, RotateCcw, SortAsc, SortDesc,TrendingUp, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer} from "recharts";
import AdminLayout from '../../components/AdminLayout';
import withAdminAuth from '../../components/withAdminAuth';
import type { NextPageWithLayout } from '../_app';
// Add Lead interface
interface Lead {
    name: string;
    phone: string;
    location: string;
    query: string;
    createdAt: string;
}

function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [locationFilter, setLocationFilter] = useState("");
    const [sortField, setSortField] = useState("createdAt");
    const [sortDirection, setSortDirection] = useState("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const itemsPerPage = 25;
    const filtersRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch("/api/admin/getintouch")
            .then((res) => res.json())
            .then((data) => {
                setLeads(data.data || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    // Get unique locations for filter dropdown
    const uniqueLocations = useMemo(() => {
        const locations = leads.map(lead => lead.location).filter(Boolean);
        return [...new Set(locations)].sort();
    }, [leads]);

    // Analytics data
    const analyticsData = useMemo(() => {
        // Daily requests for the last 7 days
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toDateString();
            const count = leads.filter(lead =>
                new Date(lead.createdAt).toDateString() === dateString
            ).length;
            last7Days.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                requests: count
            });
        }

        // Month-wise aggregation for the last 12 months
        const monthWiseCounts = {};
        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const key = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            monthWiseCounts[key] = 0;
        }
        leads.forEach(lead => {
            const date = new Date(lead.createdAt);
            const key = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            if (monthWiseCounts[key] !== undefined) {
                monthWiseCounts[key]++;
            }
        });
        const monthWiseData = Object.entries(monthWiseCounts).map(([month, count]) => ({ month, count }));

        // Top locations
        const locationCounts = {};
        leads.forEach(lead => {
            if (lead.location) {
                locationCounts[lead.location] = (locationCounts[lead.location] || 0) + 1;
            }
        });
        const topLocations = Object.entries(locationCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([location, count]) => ({ location, count }));

        // Hourly distribution (for pie chart)
        const hourlyData = {};
        leads.forEach(lead => {
            const hour = new Date(lead.createdAt).getHours();
            const timeSlot = hour < 6 ? 'Night' :
                hour < 12 ? 'Morning' :
                    hour < 17 ? 'Afternoon' : 'Evening';
            hourlyData[timeSlot] = (hourlyData[timeSlot] || 0) + 1;
        });

        const timeDistribution = Object.entries(hourlyData).map(([time, count]) => ({
            time,
            count,
            percentage: ((count / leads.length) * 100).toFixed(1)
        }));

        // Recent activity (last 30 days vs previous 30 days)
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

        const recentRequests = leads.filter(lead =>
            new Date(lead.createdAt) >= thirtyDaysAgo
        ).length;

        const previousRequests = leads.filter(lead => {
            const createdAt = new Date(lead.createdAt);
            return createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
        }).length;

        const growthPercentage = previousRequests === 0 ? 100 :
            (((recentRequests - previousRequests) / previousRequests) * 100);

        return {
            dailyRequests: last7Days,
            monthWiseData,
            topLocations,
            timeDistribution,
            recentRequests,
            growthPercentage: parseFloat(growthPercentage.toFixed(1))
        };
    }, [leads]);

    // Filter and sort leads
    const filteredAndSortedLeads = useMemo(() => {
        const filtered = leads.filter(lead => {
            const matchesSearch = !searchTerm ||
                lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                lead.phone?.includes(searchTerm) ||
                lead.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                lead.query?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesDate = !dateFilter ||
                new Date(lead.createdAt).toDateString() === new Date(dateFilter).toDateString();

            const matchesLocation = !locationFilter || lead.location === locationFilter;

            return matchesSearch && matchesDate && matchesLocation;
        });

        // Sort
        filtered.sort((a, b) => {
            let aVal = a[sortField];
            let bVal = b[sortField];

            if (sortField === "createdAt") {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            }

            if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
            if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [leads, searchTerm, dateFilter, locationFilter, sortField, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedLeads.length / itemsPerPage);
    const paginatedLeads = filteredAndSortedLeads.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const downloadCSV = () => {
        if (!filteredAndSortedLeads.length) return;

        const headers = ["Name", "Phone", "Location", "Query", "Date"];
        const rows = filteredAndSortedLeads.map((lead) => [
            lead.name,
            lead.phone,
            lead.location,
            `"${lead.query?.replace(/"/g, '""') || ''}"`,
            new Date(lead.createdAt).toLocaleString(),
        ]);

        const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `request-callback_${Date.now()}.csv`;
        link.click();
    };

    const clearFilters = () => {
        setSearchTerm("");
        setDateFilter("");
        setLocationFilter("");
        setSortField("createdAt");
        setSortDirection("desc");
        setCurrentPage(1);
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
        setCurrentPage(1);
    };

    const SortIcon = ({ field }) => {
        if (sortField !== field) return <SortAsc className="w-4 h-4 opacity-30" />;
        return sortDirection === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#2D9AA5] border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Loading requests...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#2D9AA5]/10 rounded-lg">
                                <Phone className="w-6 h-6 text-[#2D9AA5]" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Request Call Back</h1>
                                <p className="text-gray-600 text-sm mt-1">Manage and track customer callback requests</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => {
                                    setShowFilters(!showFilters);
                                    setTimeout(() => {
                                        if (!showFilters && filtersRef.current) {
                                            filtersRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }
                                    }, 100);
                                }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${showFilters
                                    ? 'bg-[#2D9AA5] text-white border-[#2D9AA5]'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <Filter className="w-4 h-4" />
                                Filters
                            </button>

                            <button
                                onClick={downloadCSV}
                                disabled={!filteredAndSortedLeads.length}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2D9AA5] text-white font-medium shadow-sm hover:bg-[#2D9AA5]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                <span className="hidden sm:inline">Download CSV</span>
                                <span className="sm:hidden">CSV</span>
                            </button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
                        <div className="bg-gradient-to-r from-[#2D9AA5]/10 to-[#2D9AA5]/5 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Requests</p>
                                    <p className="text-2xl font-bold text-[#2D9AA5]">{leads.length}</p>
                                </div>
                                <Phone className="w-8 h-8 text-[#2D9AA5]/60" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-green-50 to-green-25 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">This Month</p>
                                    <p className="text-2xl font-bold text-green-600">{analyticsData.recentRequests}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <TrendingUp className={`w-3 h-3 ${analyticsData.growthPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                                        <span className={`text-xs font-medium ${analyticsData.growthPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {analyticsData.growthPercentage >= 0 ? '+' : ''}{analyticsData.growthPercentage}% from last month
                                        </span>
                                    </div>
                                </div>
                                <Clock className="w-8 h-8 text-green-400" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-blue-50 to-blue-25 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Active Locations</p>
                                    <p className="text-2xl font-bold text-blue-600">{uniqueLocations.length}</p>
                                </div>
                                <MapPin className="w-8 h-8 text-blue-400" />
                            </div>
                        </div>
                    </div>

                    {/* Month-wise Graphical Representation */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 my-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Month-wise Requests (Last 12 Months)</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={analyticsData.monthWiseData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} angle={-45} textAnchor="end" height={60} interval={0} />
                                    <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#fff",
                                            border: "1px solid #e5e7eb",
                                            borderRadius: "8px",
                                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                        }}
                                        labelStyle={{ color: "black", fontWeight: 600 }}   // x-axis label (month)
                                        itemStyle={{ color: "black" }}                     // values (count)
                                    />
                                    <Line type="monotone" dataKey="count" stroke="#2D9AA5" strokeWidth={3} dot={{ fill: '#2D9AA5', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, stroke: '#2D9AA5', strokeWidth: 2 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div ref={filtersRef} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#2D9AA5] transition-colors"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Clear All
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative w-full max-w-lg mx-auto">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-4 h-4 sm:w-5 sm:h-5" />
                                <input
                                    type="text"
                                    placeholder="Search name, phone, location, or query..."
                                    className="text-black w-full pl-10 pr-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] outline-none transition-colors"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-4 h-4" />
                                <select
                                    className="text-black w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] outline-none transition-colors appearance-none bg-white"
                                    value={locationFilter}
                                    onChange={(e) => {
                                        setLocationFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value="">All Locations</option>
                                    {uniqueLocations.map((location) => (
                                        <option key={location} value={location}>{location}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Data Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {filteredAndSortedLeads.length === 0 ? (
                        <div className="text-center py-12">
                            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No requests found</h3>
                            <p className="text-gray-500">
                                {leads.length === 0
                                    ? "No callback requests have been submitted yet."
                                    : "Try adjusting your filters to see more results."}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden lg:block overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            {[
                                                { key: "name", label: "Name" },
                                                { key: "phone", label: "Phone" },
                                                { key: "location", label: "Location" },
                                                { key: "query", label: "Query" },
                                                { key: "createdAt", label: "Date" }
                                            ].map(({ key, label }) => (
                                                <th
                                                    key={key}
                                                    className="text-left p-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                                                    onClick={() => handleSort(key)}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {label}
                                                        <SortIcon field={key} />
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedLeads.map((lead, index) => (
                                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-medium text-gray-900">{lead.name}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                        <Phone className="w-4 h-4 text-[#2D9AA5]" />
                                                        {lead.phone}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                        <MapPin className="w-4 h-4 text-[#2D9AA5]" />
                                                        {lead.location}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="max-w-xs text-gray-700 line-clamp-2" title={lead.query}>
                                                        {lead.query}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-gray-700">
                                                        {new Date(lead.createdAt).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {new Date(lead.createdAt).toLocaleTimeString()}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="lg:hidden">
                                {paginatedLeads.map((lead, index) => (
                                    <div key={index} className="p-4 border-b border-gray-100 last:border-b-0">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="font-semibold text-gray-900 text-lg">{lead.name}</h3>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                {new Date(lead.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className="space-y-2 mb-3">
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Phone className="w-4 h-4 text-[#2D9AA5]" />
                                                <span className="text-sm">{lead.phone}</span>
                                            </div>

                                            <div className="flex items-center gap-2 text-gray-700">
                                                <MapPin className="w-4 h-4 text-[#2D9AA5]" />
                                                <span className="text-sm">{lead.location}</span>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <div className="flex items-start gap-2">
                                                <MessageSquare className="w-4 h-4 text-[#2D9AA5] mt-0.5 flex-shrink-0" />
                                                <p className="text-sm text-gray-700 leading-relaxed">{lead.query}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-gray-50 border-t border-gray-200">
                                    <div className="text-sm text-gray-700 order-2 sm:order-1">
                                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedLeads.length)} of {filteredAndSortedLeads.length} results
                                    </div>

                                    <div className="flex items-center gap-2 order-1 sm:order-2">
                                        <button
                                            onClick={() => setCurrentPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            Previous
                                        </button>

                                        <div className="flex gap-1">
                                            {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                                const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                                                if (page > totalPages) return null;

                                                return (
                                                    <button
                                                        key={page}
                                                        onClick={() => setCurrentPage(page)}
                                                        className={`w-10 h-10 text-sm font-medium rounded-lg transition-colors ${currentPage === page
                                                            ? 'bg-[#2D9AA5] text-white'
                                                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {page}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <button
                                            onClick={() => setCurrentPage(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Next
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
LeadsPage.getLayout = function PageLayout(page: React.ReactNode) {
    return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedDashboard: NextPageWithLayout = withAdminAuth(LeadsPage);
ProtectedDashboard.getLayout = LeadsPage.getLayout;

export default ProtectedDashboard;