import { useEffect, useState } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, LabelList } from "recharts";

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

  // Format large numbers with K/M/B suffix
  const formatLargeNumber = (value) => {
    if (!value) return 0;
    if (value >= 1e9) return (value / 1e9).toFixed(2) + "B";
    if (value >= 1e6) return (value / 1e6).toFixed(2) + "M";
    if (value >= 1e3) return (value / 1e3).toFixed(2) + "K";
    return value;
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm sm:text-base">Loading claims...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-sm max-w-sm w-full text-center">
          <div className="text-red-500 text-4xl mb-3">⚠</div>
          <p className="text-red-600 font-medium text-sm sm:text-base">{error}</p>
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
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1">
            Claims Dashboard
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600">
            Overview of your claims and metrics
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6 auto-rows-fr">
          <StatCard title="Total Patients" value={stats.totalPatients || 0} />
          <StatCard title="Released" value={stats.releasedClaims || 0} color="text-green-600" />
          <StatCard title="Pending" value={stats.pendingClaims || 0} color="text-amber-600" />
          <StatCard title="Cancelled" value={stats.cancelledClaims || 0} color="text-red-600" />
          <StatCard title="Total CoPayment" value={formatLargeNumber(stats.totalCoPayment)} />
          <StatCard title="CoPayment Count" value={stats.totalCoPaymentCount || 0} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">

          {/* Bar Chart */}
          <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg w-full flex flex-col min-h-[300px] sm:min-h-[350px] md:min-h-[400px]">
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-4">Claims Overview</h2>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <LabelList dataKey="value" position="top" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg w-full flex flex-col min-h-[300px] sm:min-h-[350px] md:min-h-[400px]">
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-4">Status Distribution</h2>
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
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {claimStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="w-full mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {claimStatusData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }}></div>
                    <span className="text-xs sm:text-sm md:text-base font-medium text-gray-700">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm sm:text-base font-semibold text-gray-900">{item.value}</div>
                    <div className="text-xs text-gray-500">{total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%</div>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

// Simple, clean, and responsive StatCard
function StatCard({ title, value, color = "text-gray-900", className = "" }) {
  return (
    <div className={`bg-white p-3 sm:p-4 md:p-5 rounded-lg ${className} flex flex-col justify-between`}>
      <div className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold ${color}`}>
        {value}
      </div>
      <div className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-500 font-medium mt-1">
        {title}
      </div>
    </div>
  );
}
