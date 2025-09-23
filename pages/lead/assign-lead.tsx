// import { useEffect, useState } from "react";
// import axios from "axios";

// export default function LeadsPage() {
//   const [leads, setLeads] = useState([]);
//   const [agents, setAgents] = useState([]);
//   const [filters, setFilters] = useState({
//     treatment: "",
//     offer: "",
//     source: "",
//     status: "",
//     name: "",
//     startDate: "",
//     endDate: "",
//   });
//   const [selectedLead, setSelectedLead] = useState(null);
//   const [selectedAgents, setSelectedAgents] = useState([]); // allow multiple
//   const [followUpDate, setFollowUpDate] = useState(""); // ✅ new state for datetime

//   const token =
//     typeof window !== "undefined" ? localStorage.getItem("clinicToken") : null;

//   const fetchLeads = async () => {
//     try {
//       const res = await axios.get("/api/lead-ms/leadFilter", {
//         params: filters,
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setLeads(res.data.leads || []);
//     } catch (err) {
//       console.error("Error fetching leads", err);
//     }
//   };

//   const fetchAgents = async () => {
//     try {
//       const res = await axios.get("/api/lead-ms/getA", {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setAgents(res.data.agents || []);
//     } catch (err) {
//       console.error("Error fetching agents", err);
//     }
//   };

//   useEffect(() => {
//     fetchLeads();
//     fetchAgents();
//   }, []);

//   const assignLead = async () => {
//     if (!selectedLead || selectedAgents.length === 0) return;

//     try {
//       await axios.post(
//         "/api/lead-ms/reassign-lead",
//         {
//           leadId: selectedLead,
//           agentIds: selectedAgents,
//           followUpDate: followUpDate ? new Date(followUpDate).toISOString() : null,
//         },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       alert("Lead assigned!");
//       setSelectedLead(null);
//       setSelectedAgents([]);
//       setFollowUpDate("");
//       fetchLeads();
//     } catch (err) {
//       console.error("Error assigning lead", err);
//     }
//   };

//   const deleteLead = async (leadId) => {
//     if (!window.confirm("Are you sure you want to delete this lead?")) return;

//     try {
//       await axios.delete("/api/lead-ms/lead-delete", {
//         headers: { Authorization: `Bearer ${token}` },
//         data: { leadId },
//       });
//       alert("Lead deleted");
//       fetchLeads();
//     } catch (err) {
//       console.error("Error deleting lead", err);
//       alert(err.response?.data?.message || "Error deleting lead");
//     }
//   };

//   return (
//     <div className="p-6">
//       <h1 className="text-xl font-bold mb-4">Leads Management</h1>

//       {/* Filters */}
//       <div className="grid grid-cols-2 gap-4 mb-4">
//         <input
//           placeholder="Name"
//           value={filters.name}
//           onChange={(e) => setFilters({ ...filters, name: e.target.value })}
//           className="border p-2"
//         />
//         <input
//           placeholder="Offer Tag"
//           value={filters.offer}
//           onChange={(e) => setFilters({ ...filters, offer: e.target.value })}
//           className="border p-2"
//         />
//         <select
//           value={filters.source}
//           onChange={(e) => setFilters({ ...filters, source: e.target.value })}
//           className="border p-2"
//         >
//           <option value="">All Sources</option>
//           <option>Instagram</option>
//           <option>Facebook</option>
//           <option>Google</option>
//           <option>WhatsApp</option>
//           <option>Walk-in</option>
//           <option>Other</option>
//         </select>
//         <select
//           value={filters.status}
//           onChange={(e) => setFilters({ ...filters, status: e.target.value })}
//           className="border p-2"
//         >
//           <option value="">All Status</option>
//           <option>New</option>
//           <option>Contacted</option>
//           <option>Booked</option>
//           <option>Visited</option>
//           <option>Follow-up</option>
//           <option>Not Interested</option>
//           <option>Other</option>
//         </select>
//         <input
//           type="date"
//           value={filters.startDate}
//           onChange={(e) =>
//             setFilters({ ...filters, startDate: e.target.value })
//           }
//           className="border p-2"
//         />
//         <input
//           type="date"
//           value={filters.endDate}
//           onChange={(e) =>
//             setFilters({ ...filters, endDate: e.target.value })
//           }
//           className="border p-2"
//         />
//         <button
//           onClick={fetchLeads}
//           className="bg-blue-500 text-white px-4 py-2 rounded"
//         >
//           Apply Filters
//         </button>
//       </div>

//       {/* Leads Table */}
//       <table className="border w-full">
//         <thead>
//           <tr className="bg-gray-100">
//             <th className="border p-2">Name</th>
//             <th className="border p-2">Phone</th>
//             <th className="border p-2">Treatment</th>
//             <th className="border p-2">Source</th>
//             <th className="border p-2">Offer</th>
//             <th className="border p-2">Status</th>
//             <th className="border p-2">Notes</th>
//             <th className="border p-2">Assigned To</th>
//             <th className="border p-2">Follow-ups</th>
//             <th className="border p-2">Action</th>
//           </tr>
//         </thead>
//         <tbody>
//           {Array.isArray(leads) && leads.length > 0 ? (
//             leads.map((lead) => (
//               <tr key={lead._id}>
//                 <td className="border p-2">{lead.name}</td>
//                 <td className="border p-2">{lead.phone}</td>
//                 <td className="border p-2">
//                   {Array.isArray(lead.treatments)
//                     ? lead.treatments
//                         .map((t) =>
//                           t.subTreatment
//                             ? `${t.subTreatment} (${t.treatment?.name || "Unknown"})`
//                             : t.treatment?.name || "Unknown"
//                         )
//                         .join(", ")
//                     : ""}
//                 </td>
//                 <td className="border p-2">{lead.source}</td>
//                 <td className="border p-2">{lead.offerTag}</td>
//                 <td className="border p-2">{lead.status}</td>
//                 <td className="border p-2">
//                   {Array.isArray(lead.notes) && lead.notes.length > 0
//                     ? lead.notes.map((n) => n.text).join(", ")
//                     : "No Notes"}
//                 </td>
//                 <td className="border p-2">
//                   {Array.isArray(lead.assignedTo) && lead.assignedTo.length > 0
//                     ? lead.assignedTo.map((a) => a.user?.name).join(", ")
//                     : "Not Assigned"}
//                 </td>
//                 <td className="border p-2">
//                   {Array.isArray(lead.followUps) && lead.followUps.length > 0
//                     ? lead.followUps
//                         .map((f) => new Date(f.date).toLocaleString())
//                         .join(", ")
//                     : "None"}
//                 </td>
//                 <td className="border p-2">
//                   <button
//                     onClick={() => setSelectedLead(lead._id)}
//                     className="bg-green-500 text-white px-3 py-1 rounded mr-2"
//                   >
//                     ReAssign
//                   </button>
//                   <button
//                     onClick={() => deleteLead(lead._id)}
//                     className="bg-red-500 text-white px-3 py-1 rounded"
//                   >
//                     Delete
//                   </button>
//                 </td>
//               </tr>
//             ))
//           ) : (
//             <tr>
//               <td colSpan="10" className="text-center p-4">
//                 No leads found
//               </td>
//             </tr>
//           )}
//         </tbody>
//       </table>

//       {/* Assign Modal */}
//       {selectedLead && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
//           <div className="bg-white p-6 rounded shadow-lg w-96">
//             <h2 className="text-lg mb-4">Assign Lead</h2>

//             {/* Select Agents */}
//             <div className="mb-3">
//               <label className="block font-medium mb-1">Select Agent(s)</label>
//               <select
//                 multiple
//                 value={selectedAgents}
//                 onChange={(e) =>
//                   setSelectedAgents(
//                     Array.from(e.target.selectedOptions, (option) => option.value)
//                   )
//                 }
//                 className="border p-2 w-full h-32"
//               >
//                 {agents.map((a) => (
//                   <option key={a._id} value={a._id}>
//                     {a.name}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Follow-up DateTime */}
//             <div className="mb-3">
//               <label className="block font-medium mb-1">
//                 Follow-up Date & Time
//               </label>
//               <input
//                 type="datetime-local"
//                 value={followUpDate}
//                 onChange={(e) => setFollowUpDate(e.target.value)}
//                 className="border p-2 w-full"
//               />
//             </div>

//             <div className="flex justify-end mt-4 space-x-2">
//               <button
//                 onClick={() => {
//                   setSelectedLead(null);
//                   setSelectedAgents([]);
//                   setFollowUpDate("");
//                 }}
//                 className="bg-gray-400 px-3 py-1 rounded"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={assignLead}
//                 className="bg-blue-500 text-white px-3 py-1 rounded"
//               >
//                 ReAssign
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
