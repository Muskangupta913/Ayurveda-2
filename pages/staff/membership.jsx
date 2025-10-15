import React, { useEffect, useState, useCallback } from "react";
import { Users, Search } from "lucide-react";
import ClinicLayout from "../../components/staffLayout";
import withClinicAuth from "../../components/withStaffAuth";

const MemberCard = ({ member }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-900 truncate">
          {member.firstName} {member.lastName}
        </h3>
        <p className="text-xs text-gray-600">EMR: {member.emrNumber}</p>
      </div>
    </div>

    <div className="space-y-2 text-xs">
      <div className="flex justify-between">
        <span className="text-gray-600">Package:</span>
        <span className="font-medium text-gray-900">{member.package || member.treatment || 'N/A'}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Amount:</span>
        <span className="font-semibold text-gray-900">₹{Number(member.amount || 0).toLocaleString()}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Balance:</span>
        <span className="font-semibold text-rose-600">₹{Number(member.pending || 0).toLocaleString()}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Used Treatment:</span>
        <span className="font-medium text-gray-900">{member.treatment || 'N/A'}</span>
      </div>
    </div>
  </div>
);

const MembershipPage = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem("userToken") : null;
      const res = await fetch("/api/staff/members", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setMembers(data.data || []);
    } catch (e) {
      console.error(e);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const filtered = members.filter(m => {
    const s = query.trim().toLowerCase();
    if (!s) return true;
    return `${m.firstName} ${m.lastName} ${m.emrNumber} ${m.package} ${m.treatment}`.toLowerCase().includes(s);
  });

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center"><Users className="w-5 h-5 text-white" /></div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Memberships</h1>
                <p className="text-xs sm:text-sm text-gray-700">All patients with Membership = Yes</p>
              </div>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, EMR, package, treatment"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
          </div>

          {loading ? (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-12 flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-600">Loading...</p>
            </div>
          ) : filtered.length > 0 ? (
            <div>
              <p className="text-sm text-gray-600 mb-3">{filtered.length} members found</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((m) => <MemberCard key={m._id} member={m} />)}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-600">No members found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

MembershipPage.getLayout = function PageLayout(page) { return <ClinicLayout>{page}</ClinicLayout>; };
const ProtectedPage = withClinicAuth(MembershipPage);
ProtectedPage.getLayout = MembershipPage.getLayout;
export default ProtectedPage;


