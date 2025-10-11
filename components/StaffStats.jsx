import { useEffect, useState } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

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
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-700 text-xs sm:text-sm font-medium">Loading claims...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 max-w-sm w-full text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-gray-800 text-sm sm:text-base font-medium">{error}</p>
        </div>
      </div>
    );

  const claimStatusData = [
    { name: "Released", value: stats.releasedClaims || 0, color: "#10b981" },
    { name: "Pending", value: stats.pendingClaims || 0, color: "#f59e0b" },
    { name: "Cancelled", value: stats.cancelledClaims || 0, color: "#ef4444" },
  ];

  const total = claimStatusData.reduce((sum, item) => sum + item.value, 0);

  const barChartData = [
    { name: "Total", value: stats.totalPatients || 0, color: "#3b82f6" },
    { name: "Released", value: stats.releasedClaims || 0, color: "#10b981" },
    { name: "Pending", value: stats.pendingClaims || 0, color: "#f59e0b" },
    { name: "Cancelled", value: stats.cancelledClaims || 0, color: "#ef4444" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
      <div className="w-full max-w-[1400px] mx-auto px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8 py-4 xs:py-5 sm:py-6 md:py-8">
        
        {/* Header */}
        <div className="mb-4 xs:mb-5 sm:mb-6 md:mb-8">
          <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1">
            Claims Dashboard
          </h1>
          <p className="text-xs xs:text-sm md:text-base text-gray-600">Monitor your claims and performance metrics</p>
        </div>

        {/* Stats Grid - Fully Responsive */}
        <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 xs:gap-2.5 sm:gap-3 md:gap-4 mb-4 xs:mb-5 sm:mb-6 md:mb-8">
          <StatCard
            icon="👥"
            label="Total Patients"
            value={stats.totalPatients || 0}
            color="blue"
          />
          <StatCard
            icon="✓"
            label="Released"
            value={stats.releasedClaims || 0}
            color="green"
          />
          <StatCard
            icon="⏱"
            label="Pending"
            value={stats.pendingClaims || 0}
            color="amber"
          />
          <StatCard
            icon="✕"
            label="Cancelled"
            value={stats.cancelledClaims || 0}
            color="red"
          />
          <div className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-3 xs:p-3.5 sm:p-4 h-full">
              <div className="flex items-center gap-1.5 xs:gap-2 mb-1.5 xs:mb-2">
                <span className="text-base xs:text-lg">₹</span>
                <span className="text-xs xs:text-sm md:text-base text-gray-700 font-medium">Total CoPayment</span>
              </div>
              <div className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 break-all">
                {formatCurrency(stats.totalCoPayment)}
              </div>
              <div className="mt-1.5 xs:mt-2 pt-1.5 xs:pt-2 border-t border-gray-100">
                <span className="text-xs sm:text-sm text-gray-600">{stats.totalCoPaymentCount || 0} payments</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts - Stack on small, side-by-side on large */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 xs:gap-4 sm:gap-5 md:gap-6 mb-4 xs:mb-5 sm:mb-6 md:mb-8">
          
          {/* Bar Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-3 xs:p-4 sm:p-5 md:p-6">
            <h2 className="text-sm xs:text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-3 xs:mb-4">
              Claims Overview
            </h2>
            <div className="w-full h-[200px] xs:h-[220px] sm:h-[260px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={barChartData} 
                  margin={{ 
                    top: 10, 
                    right: 5, 
                    left: -25, 
                    bottom: 5 
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#6b7280', fontSize: 10 }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                  />
                  <YAxis
                    tick={{ fill: '#6b7280', fontSize: 10 }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '11px',
                      padding: '6px 10px'
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
                    {barChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-3 xs:p-4 sm:p-5 md:p-6">
            <h2 className="text-sm xs:text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-3 xs:mb-4">
              Status Distribution
            </h2>
            <div className="flex flex-col sm:flex-row items-center gap-3 xs:gap-4">
              <div className="w-full sm:w-[45%] md:w-1/2 h-[160px] xs:h-[180px] sm:h-[200px] md:h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={claimStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius="40%"
                      outerRadius="70%"
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {claimStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '11px',
                        padding: '6px 10px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full sm:w-[55%] md:w-1/2 space-y-1.5 xs:space-y-2">
                {claimStatusData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 xs:p-2.5 sm:p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-1.5 xs:gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 xs:w-3 xs:h-3 rounded flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                      <span className="text-xs xs:text-sm md:text-base font-medium text-gray-700 truncate">{item.name}</span>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="text-xs xs:text-sm md:text-base font-semibold text-gray-900">{item.value}</div>
                      <div className="text-[10px] xs:text-xs text-gray-500">
                        {total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-2.5 xs:p-3 sm:p-3.5 md:p-4 h-full min-h-[90px] xs:min-h-[100px] sm:min-h-[110px]">
      <div className={`inline-flex items-center justify-center w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-lg ${colorMap[color]} mb-1.5 xs:mb-2`}>
        <span className="text-sm xs:text-base">{icon}</span>
      </div>
      <div className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-0.5 break-all leading-tight">
        {value}
      </div>
      <div className="text-[10px] xs:text-xs sm:text-sm text-gray-600 font-medium leading-tight">
        {label}
      </div>
    </div>
  );
}