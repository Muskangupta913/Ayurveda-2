import { useEffect, useState } from "react";
import axios from "axios";

export default function LeadsPage() {
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
  const [selectedAgent, setSelectedAgent] = useState("");

  const token =
    typeof window !== "undefined" ? localStorage.getItem("leadToken") : null;

  // ✅ Fetch leads with filters
  const fetchLeads = async () => {
    try {
      const res = await axios.get("/api/lead-ms/leadFilter", {
        params: filters,
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeads(res.data.leads || []);
    } catch (err) {
      console.error("Error fetching leads", err);
    }
  };

  // ✅ Fetch agents
  const fetchAgents = async () => {
    try {
      const res = await axios.get("/api/lead-ms/getA", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAgents(res.data.agents || []);
    } catch (err) {
      console.error("Error fetching agents", err);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchAgents();
  }, []);

  // ✅ Handle assign
  const assignLead = async () => {
    if (!selectedLead || !selectedAgent) return;
    try {
      await axios.post(
        "/api/lead-ms/assign-lead",
        { leadId: selectedLead, agentId: selectedAgent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Lead assigned!");
      setSelectedLead(null);
      setSelectedAgent("");
      fetchLeads();
    } catch (err) {
      console.error("Error assigning lead", err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Leads Management</h1>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <input
          placeholder="Name"
          value={filters.name}
          onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          className="border p-2"
        />
        <input
          placeholder="Offer Tag"
          value={filters.offer}
          onChange={(e) => setFilters({ ...filters, offer: e.target.value })}
          className="border p-2"
        />
        <select
          value={filters.source}
          onChange={(e) => setFilters({ ...filters, source: e.target.value })}
          className="border p-2"
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
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="border p-2"
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
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) =>
            setFilters({ ...filters, startDate: e.target.value })
          }
          className="border p-2"
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) =>
            setFilters({ ...filters, endDate: e.target.value })
          }
          className="border p-2"
        />
        <button
          onClick={fetchLeads}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Apply Filters
        </button>
      </div>

      {/* Leads Table */}
      <table className="border w-full">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Name</th>
            <th className="border p-2">Phone</th>
            <th className="border p-2">Treatment</th>
            <th className="border p-2">Source</th>
            <th className="border p-2">Offer</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Assigned To</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(leads) && leads.length > 0 ? (
            leads.map((lead) => (
              <tr key={lead._id}>
                <td className="border p-2">{lead.name}</td>
                <td className="border p-2">{lead.phone}</td>
                <td className="border p-2">
                  {Array.isArray(lead.treatments)
                    ? lead.treatments.map((t) => t?.name).join(", ")
                    : ""}
                </td>
                <td className="border p-2">{lead.source}</td>
                <td className="border p-2">{lead.offerTag}</td>
                <td className="border p-2">{lead.status}</td>
                <td className="border p-2">
                  {lead.assignedTo ? lead.assignedTo.name : "Not Assigned"}
                </td>
                <td className="border p-2">
                  <button
                    onClick={() => setSelectedLead(lead._id)}
                    className="bg-green-500 text-white px-3 py-1 rounded"
                  >
                    Assign
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="text-center p-4">
                No leads found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Assign Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="text-lg mb-4">Assign Lead</h2>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="border p-2 w-full"
            >
              <option value="">Select Agent</option>
              {agents.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </select>
            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={() => setSelectedLead(null)}
                className="bg-gray-400 px-3 py-1 rounded"
              >
                Cancel
              </button>
              <button
                onClick={assignLead}
                className="bg-blue-500 text-white px-3 py-1 rounded"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
