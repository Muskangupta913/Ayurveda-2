import { useEffect, useState } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend, Label } from "recharts";

export default function MyClaims() {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const token = localStorage.getItem("userToken");
        if (!token) {
          setError("User not logged in");
          setLoading(false);
          return;
        }

        const res = await fetch("/api/staff/my-claims", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!data.success) {
          setError(data.message || "Failed to fetch claims");
        } else {
          setPatients(data.data || []);
          setStats(data.stats || {});
        }
      } catch (err) {
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, []);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value || 0);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading claims data...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl max-w-md w-full">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-3xl font-bold">✕</span>
          </div>
          <p className="text-center text-red-600 font-semibold text-lg">{error}</p>
        </div>
      </div>
    );

  const claimStatusData = [
    { name: "Released", value: stats.releasedClaims || 0, color: "#10b981", percentage: 0 },
    { name: "Pending", value: stats.pendingClaims || 0, color: "#f59e0b", percentage: 0 },
    { name: "Cancelled", value: stats.cancelledClaims || 0, color: "#ef4444", percentage: 0 },
  ];

  const total = claimStatusData.reduce((sum, item) => sum + item.value, 0);
  claimStatusData.forEach(item => {
    item.percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
  });

  const barChartData = [
    { name: "Total", value: stats.totalPatients || 0, color: "#3b82f6" },
    { name: "Released", value: stats.releasedClaims || 0, color: "#10b981" },
    { name: "Pending", value: stats.pendingClaims || 0, color: "#f59e0b" },
    { name: "Cancelled", value: stats.cancelledClaims || 0, color: "#ef4444" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 mb-1 sm:mb-2">
            Claims Dashboard
          </h1>
          <p className="text-sm sm:text-base text-slate-600">Comprehensive overview of claims and performance metrics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-2 sm:gap-3 mb-6 sm:mb-8">
          {/* Total Patients */}
          <div className="flex flex-col justify-center rounded-lg border border-gray-200 bg-white p-3 sm:p-4 shadow-sm hover:shadow transition-all duration-200">
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <span className="text-lg">👥</span>
              <span>Total Patients</span>
            </div>
            <div className="mt-1 font-semibold text-gray-900 text-base sm:text-lg">
              {stats.totalPatients || 0}
            </div>
          </div>

          {/* Released */}
          <div className="flex flex-col justify-center rounded-lg border border-gray-200 bg-white p-3 sm:p-4 shadow-sm hover:shadow transition-all duration-200">
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <span className="text-lg">✓</span>
              <span>Released</span>
            </div>
            <div className="mt-1 font-semibold text-gray-900 text-base sm:text-lg">
              {stats.releasedClaims || 0}
            </div>
          </div>

          {/* Pending */}
          <div className="flex flex-col justify-center rounded-lg border border-gray-200 bg-white p-3 sm:p-4 shadow-sm hover:shadow transition-all duration-200">
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <span className="text-lg">⏱</span>
              <span>Pending</span>
            </div>
            <div className="mt-1 font-semibold text-gray-900 text-base sm:text-lg">
              {stats.pendingClaims || 0}
            </div>
          </div>

          {/* Cancelled */}
          <div className="flex flex-col justify-center rounded-lg border border-gray-200 bg-white p-3 sm:p-4 shadow-sm hover:shadow transition-all duration-200">
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <span className="text-lg">✕</span>
              <span>Cancelled</span>
            </div>
            <div className="mt-1 font-semibold text-gray-900 text-base sm:text-lg">
              {stats.cancelledClaims || 0}
            </div>
          </div>

          {/* Total CoPayment */}
          <div className="flex flex-col justify-center rounded-lg border border-gray-200 bg-white p-3 sm:p-4 shadow-sm hover:shadow transition-all duration-200">
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <span className="text-lg">₹</span>
              <span>Total CoPayment</span>
            </div>
            <div className="mt-1 font-semibold text-gray-900 text-lg sm:text-xl">
              {formatCurrency(stats.totalCoPayment)}
            </div>
          </div>

          {/* CoPayment Count */}
          <div className="flex flex-col justify-center rounded-lg border border-gray-200 bg-white p-3 sm:p-4 shadow-sm hover:shadow transition-all duration-200">
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <span className="text-lg">📊</span>
              <span>CoPayment Count</span>
            </div>
            <div className="mt-1 font-semibold text-gray-900 text-base sm:text-lg">
              {stats.totalCoPaymentCount || 0}
            </div>
          </div>
        </div>


        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Bar Chart */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-200">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 flex items-center">
              <span className="w-1 h-6 bg-blue-500 rounded mr-3"></span>
              Claims Overview
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barChartData} margin={{ top: 20, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} label={{ position: 'top', fill: '#334155', fontSize: 12, fontWeight: 'bold' }}>
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Pie Chart Display */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-200">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 flex items-center">
              <span className="w-1 h-6 bg-purple-500 rounded mr-3"></span>
              Status Distribution
            </h2>
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={claimStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {claimStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Legend with Data */}
              <div className="w-full mt-4 space-y-3">
                {claimStatusData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }}></div>
                      <span className="font-semibold text-slate-700 text-sm sm:text-base">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-800 text-sm sm:text-base">{item.value}</div>
                      <div className="text-xs text-slate-500">{item.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Claims Table */}
        {/* <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center">
              <span className="w-1 h-6 bg-indigo-500 rounded mr-3"></span>
              All Claims Records
            </h2>
          </div>

          {patients.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-slate-400 text-3xl sm:text-4xl">📋</span>
              </div>
              <p className="text-slate-500 font-medium">No claims found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Release Date
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Released By
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                      CoPayment
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {patients.map((p, idx) => (
                    <tr key={p._id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-700 font-medium">
                        {new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 sm:px-3 py-1 text-xs font-bold rounded-full ${p.advanceClaimStatus === "Released"
                              ? "bg-green-100 text-green-700"
                              : p.advanceClaimStatus === "Cancelled"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                        >
                          {p.advanceClaimStatus || "Pending"}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-700">
                        {p.advanceClaimReleaseDate
                          ? new Date(p.advanceClaimReleaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : "-"}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-700">
                        {p.advanceClaimReleasedBy || "-"}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right font-bold text-slate-900">
                        {formatCurrency(p.advanceGivenAmount || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div> */}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, gradient, isLarge = false }) {
  return (
    <div className={`relative bg-white rounded-xl shadow-md border border-slate-200 p-5 overflow-hidden ${isLarge ? 'col-span-2 lg:col-span-1' : ''}`}>
      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`}></div>

      {/* Icon background decoration */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${gradient} opacity-5 rounded-full`}></div>

      <div className="relative">
        {/* Icon and label row */}
        <div className="flex items-center justify-between mb-3">
          <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center shadow-sm`}>
            <span className="text-2xl">{icon}</span>
          </div>
        </div>

        {/* Value */}
        <div className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1 break-words leading-tight">
          {value}
        </div>

        {/* Title */}
        <div className="text-xs sm:text-sm text-slate-600 font-medium tracking-wide">
          {title}
        </div>
      </div>
    </div>
  );
}