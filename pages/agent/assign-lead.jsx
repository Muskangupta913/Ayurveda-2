import { useEffect, useState } from "react";
import axios from "axios";
import AgentLayout from '../../components/AgentLayout';
import withAgentAuth from '../../components/withAgentAuth';

const LeadsPage = () => {
  const [leads, setLeads] = useState([]);
  const [agents, setAgents] = useState([]);
  const [filters, setFilters] = useState({
    treatment: "",
    offer: "",
    source: "",
    status: "",
    name: "",
    startDate: "",
    endDate: "",
  });
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [followUpDate, setFollowUpDate] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("agentToken") : null;

  const fetchLeads = async () => {
    try {
      const res = await axios.get("/api/lead-ms/leadFilter", {
        params: filters,
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeads(res.data.leads || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await axios.get("/api/lead-ms/getA", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAgents(res.data.agents || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchAgents();
  }, []);

  const assignLead = async () => {
    if (!selectedLead || selectedAgents.length === 0) return;
    try {
      await axios.post(
        "/api/lead-ms/reassign-lead",
        {
          leadId: selectedLead,
          agentIds: selectedAgents,
          followUpDate: followUpDate ? new Date(followUpDate).toISOString() : null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Lead assigned!");
      setSelectedLead(null);
      setSelectedAgents([]);
      setFollowUpDate("");
      fetchLeads();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteLead = async (leadId) => {
    if (!window.confirm("Are you sure you want to delete this lead?")) return;
    try {
      await axios.delete("/api/lead-ms/lead-delete", {
        headers: { Authorization: `Bearer ${token}` },
        data: { leadId },
      });
      alert("Lead deleted");
      fetchLeads();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error deleting lead");
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Leads Management</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          placeholder="Name" value={filters.name} onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          className="border p-2 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
        />
        <input
          placeholder="Offer Tag" value={filters.offer} onChange={(e) => setFilters({ ...filters, offer: e.target.value })}
          className="border p-2 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
        />
        <select
          value={filters.source} onChange={(e) => setFilters({ ...filters, source: e.target.value })}
          className="border p-2 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
        >
          <option value="">All Sources</option>
          <option>Instagram</option>
          <option>Facebook</option>
          <option>Google</option>
          <option>WhatsApp</option>
          <option>Walk-in</option>
          <option>Other</option>
        </select>
        <select
          value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="border p-2 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
        >
          <option value="">All Status</option>
          <option>New</option>
          <option>Contacted</option>
          <option>Booked</option>
          <option>Visited</option>
          <option>Follow-up</option>
          <option>Not Interested</option>
          <option>Other</option>
        </select>

        <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} className="border p-2 rounded-lg" />
        <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} className="border p-2 rounded-lg" />
        <button onClick={fetchLeads} className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg font-semibold col-span-1 md:col-span-1">
          Apply Filters
        </button>
      </div>

      {/* Leads Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-teal-100">
            <tr>
              {["Name","Phone","Treatment","Source","Offer","Status","Notes","Assigned To","Follow-ups","Action"].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leads.length > 0 ? leads.map((lead) => (
              <tr key={lead._id} className="hover:bg-gray-50">
                <td className="px-4 py-2">{lead.name}</td>
                <td className="px-4 py-2">{lead.phone}</td>
                <td className="px-4 py-2">
                  {lead.treatments?.map(t => t.subTreatment ? `${t.subTreatment} (${t.treatment?.name || "Unknown"})` : t.treatment?.name).join(", ")}
                </td>
                <td className="px-4 py-2">{lead.source}</td>
                <td className="px-4 py-2">{lead.offerTag}</td>
                <td className="px-4 py-2">{lead.status}</td>
                <td className="px-4 py-2">{lead.notes?.map(n => n.text).join(", ") || "No Notes"}</td>
                <td className="px-4 py-2">{lead.assignedTo?.map(a => a.user?.name).join(", ") || "Not Assigned"}</td>
                <td className="px-4 py-2">{lead.followUps?.map(f => new Date(f.date).toLocaleString()).join(", ") || "None"}</td>
                <td className="px-4 py-2 flex gap-2">
                  <button onClick={() => setSelectedLead(lead._id)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg">ReAssign</button>
                  <button onClick={() => deleteLead(lead._id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg">Delete</button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={10} className="text-center p-4 text-gray-500">No leads found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Assign Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Assign Lead</h2>
            <div className="mb-3">
              <label className="block font-medium mb-1">Select Agent(s)</label>
              <select multiple value={selectedAgents} onChange={(e) => setSelectedAgents(Array.from(e.target.selectedOptions, o => o.value))} className="border p-2 w-full h-32 rounded-lg">
                {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="block font-medium mb-1">Follow-up Date & Time</label>
              <input type="datetime-local" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="border p-2 w-full rounded-lg" />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setSelectedLead(null); setSelectedAgents([]); setFollowUpDate(""); }} className="bg-gray-400 px-3 py-1 rounded-lg">Cancel</button>
              <button onClick={assignLead} className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-1 rounded-lg">ReAssign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Wrap page in AgentLayout
LeadsPage.getLayout = (page) => <AgentLayout>{page}</AgentLayout>;

// Protect page
const ProtectedLeadsPage = withAgentAuth(LeadsPage);
ProtectedLeadsPage.getLayout = LeadsPage.getLayout;

export default ProtectedLeadsPage;
