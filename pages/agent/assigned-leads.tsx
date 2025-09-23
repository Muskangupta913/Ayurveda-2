// import { useEffect, useState } from "react";
// import axios from "axios";
// import ClinicLayout from "../../components/AgentLayout";
// import withClinicAuth from "../../components/withAgentAuth";
// import FilterAssignedLead from "../../components/Filter-assigned-lead";
// import type { NextPageWithLayout } from "../_app";

// const AssignedLeadsPage: NextPageWithLayout = () => {
//   const [loading, setLoading] = useState(true);
//   const [leads, setLeads] = useState<any[]>([]);
//   const [totalAssigned, setTotalAssigned] = useState(0);
//   const [error, setError] = useState("");
//   const [followUpsdate, setFollowUpsdate] = useState<{ [key: string]: string }>(
//     {}
//   );
//   const [token, setToken] = useState<string | null>(null);

//   // Track selected note for each lead
//   const [notes, setNotes] = useState<{ [key: string]: string }>({});
//   const [customNotes, setCustomNotes] = useState<{ [key: string]: string }>({});
//   const [saving, setSaving] = useState<{ [key: string]: boolean }>({});

//   // Get token from localStorage once
//   useEffect(() => {
//     const t = localStorage.getItem("agentToken");
//     if (t) setToken(t);
//     else {
//       setError("Unauthorized: No token found");
//       setLoading(false);
//     }
//   }, []);

//   // Fetch assigned leads when token exists
//   useEffect(() => {
//     if (!token) return;

//     const fetchLeads = async () => {
//       try {
//         const res = await axios.get("/api/agent/get-assignedLead", {
//           headers: { Authorization: `Bearer ${token}` },
//         });

//         if (res.data.success) {
//           setLeads(res.data.leads);
//           setTotalAssigned(res.data.totalAssigned);

//           // Preload latest notes for each lead
//           const initialNotes: any = {};
//           res.data.leads.forEach((lead: any) => {
//             lead.notes = Array.isArray(lead.notes) ? lead.notes : [];
//             const latestNote = lead.notes.length
//               ? lead.notes[lead.notes.length - 1].text
//               : "";
//             initialNotes[lead._id] = latestNote;
//           });
//           setNotes(initialNotes);
//         } else {
//           setError(res.data.message || "Failed to fetch leads");
//         }
//       } catch (err) {
//         console.error("Error fetching leads:", err);
//         setError("Something went wrong while fetching leads");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchLeads();
//   }, [token]);

//   // Handle note selection
//   const handleFollowUpdateChange = (leadId: string, value: string) => {
//     setFollowUpsdate((prev) => ({ ...prev, [leadId]: value }));
//   };

//   const handleNoteChange = (leadId: string, value: string) => {
//     setNotes((prev) => ({ ...prev, [leadId]: value }));
//     if (value !== "Custom")
//       setCustomNotes((prev) => ({ ...prev, [leadId]: "" }));
//   };

//   // Save new note + follow-up
//   const saveNote = async (leadId: string) => {
//     if (!token) {
//       alert("Unauthorized");
//       return;
//     }

//     const finalNote =
//       notes[leadId] === "Custom" ? customNotes[leadId] : notes[leadId];

//     if (!finalNote && !followUpsdate[leadId]) {
//       alert("Please select or enter a note or follow-up before saving.");
//       return;
//     }

//     try {
//       setSaving((prev) => ({ ...prev, [leadId]: true }));

//       const payload: any = { leadId };
//       if (finalNote) payload.text = finalNote;
//       if (followUpsdate[leadId]) payload.nextFollowUp = followUpsdate[leadId];

//       const res = await axios.put("/api/agent/update-note", payload, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (res.data.success) {
//         alert("Note & Follow-up updated ✅");

//         setLeads((prevLeads) =>
//           prevLeads.map((lead) => {
//             if (lead._id === leadId) {
//               // Update notes
//               const updatedNotes = finalNote
//                 ? [
//                     ...(lead.notes || []),
//                     {
//                       text: finalNote,
//                       addedBy: { name: "You" },
//                       createdAt: new Date(),
//                     },
//                   ]
//                 : lead.notes;

//               // Update nextFollowUps
//               const updatedFollowUps = followUpsdate[leadId]
//                 ? [
//                     ...(lead.nextFollowUps || []),
//                     { date: new Date(followUpsdate[leadId]) },
//                   ]
//                 : lead.nextFollowUps;

//               return {
//                 ...lead,
//                 notes: updatedNotes,
//                 nextFollowUps: updatedFollowUps,
//               };
//             }
//             return lead;
//           })
//         );

//         if (finalNote) setNotes((prev) => ({ ...prev, [leadId]: finalNote }));
//       } else {
//         alert(res.data.message || "Failed to update note/follow-up");
//       }
//     } catch (err) {
//       console.error(err);
//       alert("Server error while saving note/follow-up");
//     } finally {
//       setSaving((prev) => ({ ...prev, [leadId]: false }));
//     }
//   };

//   if (loading) return <p className="p-4">Loading leads...</p>;
//   if (error) return <p className="p-4 text-red-500">{error}</p>;

//   return (
//     <div className="p-6">
//       <h1 className="text-2xl font-bold mb-4">My Assigned Leads</h1>
//       <p className="mb-4 font-semibold">Total Assigned: {totalAssigned}</p>
//       <FilterAssignedLead
//         onResults={(filteredLeads) => {
//           setLeads(filteredLeads);
//           setTotalAssigned(filteredLeads.length);
//         }}
//       />

//       {leads.length === 0 ? (
//         <p>No leads assigned yet.</p>
//       ) : (
//         <table className="w-full border border-gray-300">
//           <thead>
//             <tr className="bg-gray-100">
//               <th className="border px-4 py-2">Name</th>
//               <th className="border px-4 py-2">Phone</th>
//               <th className="border px-4 py-2">Gender</th>
//               <th className="border px-4 py-2">Source</th>
//               <th className="border px-4 py-2">Status</th>
//               <th className="border px-4 py-2">Treatment</th>
//               <th className="border px-4 py-2">Notes</th>
//               <th className="border px-4 py-2">Assigned To</th>
//               <th className="border px-4 py-2">Next Follow-up</th>
//               <th className="border px-4 py-2">Action</th>
//             </tr>
//           </thead>
//           <tbody>
//             {leads.map((lead) => {
//               // highlight row based on followUpStatus
//               const rowClass =
//                 lead.followUpStatus === "past"
//                   ? "bg-red-100"
//                   : lead.followUpStatus === "today"
//                   ? "bg-green-100"
//                   : "";

//               // latest next follow-up date (if any)
//               const latestFollowUp =
//                 lead.nextFollowUps?.length > 0
//                   ? new Date(
//                       lead.nextFollowUps[lead.nextFollowUps.length - 1].date
//                     ).toLocaleString()
//                   : "Not Set";

//               return (
//                 <tr key={lead._id} className={`hover:bg-gray-50 ${rowClass}`}>
//                   <td className="border px-4 py-2">{lead.name}</td>
//                   <td className="border px-4 py-2">{lead.phone}</td>
//                   <td className="border px-4 py-2">{lead.gender}</td>
//                   <td className="border px-4 py-2">{lead.source}</td>
//                   <td className="border px-4 py-2">{lead.status}</td>
//                   <td className="border px-4 py-2">
//                     {lead.treatments?.map((t: any, idx: number) => (
//                       <div key={idx}>
//                         {t.treatment?.name}{" "}
//                         {t.subTreatment && `- ${t.subTreatment}`}
//                       </div>
//                     ))}
//                   </td>
//                   <td className="border px-4 py-2">
//                     <ul>
//                       {(Array.isArray(lead.notes) ? lead.notes : []).map(
//                         (n: any, idx: number) => (
//                           <li key={idx} className="text-sm">
//                             {n.text}{" "}
//                             <span className="text-gray-400 text-xs">
//                               ({new Date(n.createdAt).toLocaleDateString()})
//                             </span>
//                           </li>
//                         )
//                       )}
//                     </ul>

//                     <select
//                       value={notes[lead._id] || ""}
//                       onChange={(e) =>
//                         handleNoteChange(lead._id, e.target.value)
//                       }
//                       className="border rounded px-2 py-1 mt-2 w-full"
//                     >
//                       <option value="">Select</option>
//                       <option value="Low">Interested</option>
//                       <option value="Medium">Medium</option>
//                       <option value="High">High</option>
//                       <option value="Custom">Custom</option>
//                     </select>

//                     {notes[lead._id] === "Custom" && (
//                       <input
//                         type="text"
//                         value={customNotes[lead._id] || ""}
//                         onChange={(e) =>
//                           setCustomNotes((prev) => ({
//                             ...prev,
//                             [lead._id]: e.target.value,
//                           }))
//                         }
//                         placeholder="Enter custom note"
//                         className="border rounded px-2 py-1 mt-2 w-full"
//                       />
//                     )}
//                   </td>

//                   <td className="border px-4 py-2">
//                     {lead.assignedTo && lead.assignedTo.length > 0
//                       ? lead.assignedTo[0].user?.name
//                       : "Not Assigned"}
//                   </td>

//                   <td className="border px-4 py-2">
//                     <p className="text-sm text-gray-600 mb-1">
//                       Latest: {latestFollowUp}
//                     </p>
//                     <input
//                       type="datetime-local"
//                       value={followUpsdate[lead._id] || ""}
//                       onChange={(e) =>
//                         handleFollowUpdateChange(lead._id, e.target.value)
//                       }
//                       className="border rounded px-2 py-1 mt-1 w-full"
//                     />
//                   </td>

//                   <td className="border px-4 py-2 text-center">
//                     <button
//                       onClick={() => saveNote(lead._id)}
//                       disabled={saving[lead._id]}
//                       className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
//                     >
//                       {saving[lead._id] ? "Saving..." : "Save"}
//                     </button>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       )}
//     </div>
//   );
// };

// // Attach layout
// AssignedLeadsPage.getLayout = (page) => <ClinicLayout>{page}</ClinicLayout>;

// // Wrap with HOC
// export default withClinicAuth(AssignedLeadsPage);
