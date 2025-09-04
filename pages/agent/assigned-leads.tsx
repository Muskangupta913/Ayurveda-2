import { useEffect, useState } from "react";
import axios from "axios";

export default function AssignedLeadsPage() {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [totalAssigned, setTotalAssigned] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAssignedLeads = async () => {
      try {
        // 🔑 Assume token is stored in localStorage after login
        const token = localStorage.getItem("agentToken");
        if (!token) {
          setError("Unauthorized: No token found");
          setLoading(false);
          return;
        }

        const res = await axios.get("/api/agent/get-assignedLead", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          setLeads(res.data.leads);
          setTotalAssigned(res.data.totalAssigned);
        } else {
          setError(res.data.message || "Failed to fetch leads");
        }
      } catch (err) {
        console.error("Error fetching leads:", err);
        setError("Something went wrong while fetching leads");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedLeads();
  }, []);

  if (loading) return <p className="p-4">Loading leads...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Assigned Leads</h1>
      <p className="mb-4 font-semibold">Total Assigned: {totalAssigned}</p>

      {leads.length === 0 ? (
        <p>No leads assigned yet.</p>
      ) : (
        <table className="w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">Name</th>
              <th className="border px-4 py-2">Phone</th>
              <th className="border px-4 py-2">Gender</th>
              <th className="border px-4 py-2">Source</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Treatment</th>
              {/* <th className="border px-4 py-2">Assigned By</th> */}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead._id} className="hover:bg-gray-50">
                <td className="border px-4 py-2">{lead.name}</td>
                <td className="border px-4 py-2">{lead.phone}</td>
                <td className="border px-4 py-2">{lead.gender}</td>
                <td className="border px-4 py-2">{lead.source}</td>
                <td className="border px-4 py-2">{lead.status}</td>
                <td className="border px-4 py-2">
                  {lead.treatments?.map((t, idx) => (
                    <div key={idx}>
                      {t.treatment?.name} {t.subTreatment && `- ${t.subTreatment}`}
                    </div>
                  ))}
                </td>
                {/* <td className="border px-4 py-2">
                  {lead.assignedTo?.name || "N/A"}
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
