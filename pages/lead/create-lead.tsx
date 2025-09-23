// //pages/lead/create-lead
// import { useState, useEffect } from "react";
// import axios from "axios";

// export default function LeadForm() {
//   const [formData, setFormData] = useState({
//     name: "",
//     phone: "",
//     gender: "Male",
//     age: "",
//     treatments: [],
//     source: "Instagram",
//     offerTag: "",
//     status: "New",
//     notes: [],
//     customSource: "",
//     customStatus: "",
//     followUps: [],       // array of follow-up objects { date: Date }
// assignedTo: [],  
//   });

//   const [treatments, setTreatments] = useState([]);
//   const [customTreatment, setCustomTreatment] = useState("");
//   const [file, setFile] = useState(null);
//    const [agents, setAgents] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [noteType, setNoteType] = useState("");
//   const [customNote, setCustomNote] = useState("");
//   const [followUpDate, setFollowUpDate] = useState(""); // date input
//   const [open, setOpen] = useState(false);
//   const token =
//     typeof window !== "undefined" ? localStorage.getItem("clinicToken") : null;

//   // Fetch all treatments
//   useEffect(() => {
//     async function fetchTreatments() {
//       try {
//         const res = await axios.get("/api/doctor/getTreatment");
//         setTreatments(res.data.treatments || []);
//       } catch (err) {
//         console.error("Error fetching treatments:", err);
//       }
//     }
//     fetchTreatments();
//   }, []);
// // 🔍 search users as admin types
//   useEffect(() => {
//     async function fetchAgents() {
//       try {
//         const res = await axios.get("/api/lead-ms/assign-lead", {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         setAgents(res.data.users || []);
//       } catch (err) {
//         console.error("Error fetching agents:", err);
//       }
//     }
//     fetchAgents();
//   }, [token]);

//   // Handle input change
//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };
//   // Handle multi-select for assignedTo
//   const handleAssignChange = (e) => {
//     const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value);
//     setFormData((prev) => ({ ...prev, assignedTo: selectedOptions }));
//   };   


//   // Handle treatment selection
//   const handleTreatmentChange = (e) => {
//     const value = e.target.value;

//     // Case: subTreatment → format is mainId-idx
//     if (value.includes("-")) {
//       const [mainId, subIdx] = value.split("-");
//       const mainDoc = treatments.find((t) => t._id === mainId);
//       const subName = mainDoc?.subcategories?.[Number(subIdx)]?.name || null;

//       setFormData((prev) => {
//         const exists = prev.treatments.some(
//           (t) => t.treatment === mainId && t.subTreatment === subName
//         );
//         return {
//           ...prev,
//           treatments: exists
//             ? prev.treatments.filter(
//               (t) => !(t.treatment === mainId && t.subTreatment === subName)
//             )
//             : [...prev.treatments, { treatment: mainId, subTreatment: subName }],
//         };
//       });
//       return;
//     }

//     // Case: main treatment
//     setFormData((prev) => {
//       const exists = prev.treatments.some((t) => t.treatment === value && !t.subTreatment);
//       return {
//         ...prev,
//         treatments: exists
//           ? prev.treatments.filter((t) => !(t.treatment === value && !t.subTreatment))
//           : [...prev.treatments, { treatment: value, subTreatment: null }],
//       };
//     });
//   };

//   // Add custom treatment
//   const handleAddCustomTreatment = async () => {
//     if (!customTreatment.trim()) return alert("Enter a treatment name");
//     setLoading(true);
//     try {
//       const res = await axios.post(
//         "/api/doctor/add-custom-treatment",
//         { mainTreatment: customTreatment, subTreatments: [] },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       setTreatments((prev) => [...prev, res.data.treatment]);
//       setFormData((prev) => ({
//         ...prev,
//         treatments: [...prev.treatments, res.data.treatment._id],
//       }));
//       setCustomTreatment("");
//       alert("Custom treatment added!");
//     } catch (err) {
//       console.error(err);
//       alert("Failed to add treatment");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Submit manual lead
// const handleSubmit = async (e) => {
//   e.preventDefault();
//   setLoading(true);

//   try {
//     const selectedNote = noteType === "Custom" ? customNote.trim() : noteType;
//     const notesToSend = selectedNote ? [{ text: selectedNote }] : [];

//     // Prepare followUps array
//    const followUpsToSend = followUpDate
//   ? [...formData.followUps, { date: followUpDate, addedBy: null }]
//   : formData.followUps;


//     await axios.post(
//       "/api/lead-ms/create-lead",
//       { ...formData, notes: notesToSend, followUps: followUpsToSend, mode: "manual" },
//       { headers: { Authorization: `Bearer ${token}` } }
//     );

//     alert("Lead added!");
//     setFormData({
//       name: "",
//       phone: "",
//       gender: "Male",
//       age: "",
//       treatments: [],
//       source: "Instagram",
//       offerTag: "",
//       status: "New",
//       notes: [],
//       customSource: "",
//       customStatus: "",
//       followUps: [],
//       assignedTo: [],
//     });
//     setNoteType("");
//     setCustomNote("");
//     setFollowUpDate(""); // reset input
//   } catch (err) {
//     console.error(err);
//     alert("Error adding lead");
//   } finally {
//     setLoading(false);
//   }
// };

//   // Upload CSV / Excel
//   const handleUpload = async () => {
//     if (!file) return alert("Select a CSV or Excel file");
//     setLoading(true);
//     const formDataObj = new FormData();
//     formDataObj.append("file", file);
//     formDataObj.append("mode", "bulk");
//     try {
//       const res = await axios.post("/api/lead-ms/create-lead", formDataObj, {
//         headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
//       });
//       alert(`Uploaded ${res.data.count} leads successfully!`);
//       setFile(null);
//     } catch (err) {
//       console.error(err);
//       alert("Failed to upload leads");
//     } finally {
//       setLoading(false);
//     }
//   };


//   return (
//     <div className="p-4 space-y-6">
//       {/* Manual Lead Form */}
//       <form onSubmit={handleSubmit} className="p-4 border rounded space-y-3">
//         <h2 className="font-bold text-lg">Add Lead Manually</h2>
//         <input
//           name="name"
//           placeholder="Name"
//           value={formData.name}
//           onChange={handleChange}
//           className="block mb-2 border p-2 w-full"
//         />
//         <input
//           name="phone"
//           placeholder="Phone"
//           value={formData.phone}
//           onChange={handleChange}
//           className="block mb-2 border p-2 w-full"
//         />
//         <select name="gender" value={formData.gender} onChange={handleChange} className="border p-2 w-full">
//           <option>Male</option>
//           <option>Female</option>
//           <option>Other</option>
//         </select>
//         <input
//           name="age"
//           type="number"
//           placeholder="Age"
//           value={formData.age}
//           onChange={handleChange}
//           className="block mb-2 border p-2 w-full"
//         />

//         <label>Treatments:</label>
//         <div className="space-y-2">
//           {treatments.map((t) => (
//             <div key={t._id} className="space-y-1">
//               {/* Main Treatment */}
//               <div className="flex items-center space-x-2">
//                 <input
//                   type="checkbox"
//                   value={t._id}
//                   checked={formData.treatments.some((tr) => tr.treatment === t._id && !tr.subTreatment)}
//                   onChange={handleTreatmentChange}
//                 />

//                 <span className="font-medium">{t.name}</span>
//               </div>

//               {/* Sub-treatments */}
//               {t.subcategories?.length > 0 && (
//                 <div className="ml-6 space-y-1">
//                   {t.subcategories.map((sub, idx) => {
//                     // Create a stable synthetic ID for each subTreatment
//                     const subId = `${t._id}-${idx}`;

//                     return (
//                       <div key={subId} className="flex items-center space-x-2">
//                         <input
//                           type="checkbox"
//                           value={subId}
//                           checked={formData.treatments.some(
//                             (tr) => tr.treatment === t._id && tr.subTreatment === sub.name
//                           )}
//                           onChange={handleTreatmentChange}
//                         />

//                         <span className="text-sm text-gray-700">{sub.name}</span>
//                       </div>
//                     );
//                   })}
//                 </div>
//               )}
//             </div>
//           ))}

//           {/* Custom treatment option */}
//           <div className="flex items-center space-x-2">
//             <input
//               type="checkbox"
//               value="other"
//               checked={!!customTreatment}
//               onChange={() => setCustomTreatment(customTreatment ? "" : " ")}
//             />
//             <span>Other</span>
//           </div>

//           {customTreatment && (
//             <div className="flex space-x-2">
//               <input
//                 type="text"
//                 placeholder="Enter treatment name"
//                 value={customTreatment}
//                 onChange={(e) => setCustomTreatment(e.target.value)}
//                 className="border p-2 flex-1"
//               />
//               <button
//                 type="button"
//                 onClick={handleAddCustomTreatment}
//                 disabled={loading}
//                 className="bg-green-500 text-white px-3 py-1 rounded"
//               >
//                 {loading ? "Adding..." : "Add"}
//               </button>
//             </div>
//           )}
//         </div>


//         <select name="source" value={formData.source} onChange={handleChange} className="border p-2 w-full">
//           <option value="Instagram">Instagram</option>
//           <option value="Facebook">Facebook</option>
//           <option value="Google">Google</option>
//           <option value="WhatsApp">WhatsApp</option>
//           <option value="Walk-in">Walk-in</option>
//           <option value="Other">Other</option>
//         </select>
//         {formData.source === "Other" && (
//           <input
//             name="customSource"
//             placeholder="Enter custom source"
//             value={formData.customSource}
//             onChange={handleChange}
//             className="border p-2 w-full"
//           />
//         )}

//         <select name="status" value={formData.status} onChange={handleChange} className="border p-2 w-full">
//           <option value="New">New</option>
//           <option value="Contacted">Contacted</option>
//           <option value="Booked">Booked</option>
//           <option value="Visited">Visited</option>
//           <option value="Follow-up">Follow-up</option>
//           <option value="Not Interested">Not Interested</option>
//           <option value="Other">Other</option>
//         </select>
//         {formData.status === "Other" && (
//           <input
//             name="customStatus"
//             placeholder="Enter custom status"
//             value={formData.customStatus}
//             onChange={handleChange}
//             className="border p-2 w-full"
//           />
//         )}

//         <input
//           name="offerTag"
//           placeholder="Offer Tag"
//           value={formData.offerTag}
//           onChange={handleChange}
//           className="block mb-2 border p-2 w-full"
//         />

//         <div className="mb-2">
//           <select
//             value={noteType}
//             onChange={(e) => setNoteType(e.target.value)}
//             className="border rounded px-2 py-1 w-full"
//           >
//             <option value="">Select Note</option>
//             <option value="Interested">Interested</option>
//             <option value="Medium">Medium</option>
//             <option value="High">High</option>
//             <option value="Custom">Custom</option>
//           </select>

//           {noteType === "Custom" && (
//             <input
//               type="text"
//               placeholder="Enter custom note"
//               value={customNote}
//               onChange={(e) => setCustomNote(e.target.value)}
//               className="border rounded px-2 py-1 mt-2 w-full"
//             />
//           )}
//         </div>

//         <ul className="mb-2">
//           {(formData.notes || []).map((n, idx) => (
//             <li key={idx} className="text-sm text-gray-700">
//               {n.text}{" "}
//               <span className="text-gray-400 text-xs">
//                 ({new Date(n.createdAt || Date.now()).toLocaleDateString()})
//               </span>
//             </li>
//           ))}
//         </ul>

// <input
//   type="datetime-local"
//   name="followUpDate"
//   value={followUpDate}
//   onChange={(e) => setFollowUpDate(e.target.value)}
//   className="block mb-2 border p-2 w-full"
// />

// <div className="relative w-64">
//   <label className="block font-medium mb-1">Assign To:</label>

//   {/* Dropdown header */}
//   <div
//     className="border p-2 w-full cursor-pointer flex justify-between items-center"
//     onClick={() => setOpen(!open)}
//   >
//     <span>
//       {formData.assignedTo.length > 0
//         ? agents
//             .filter((a) => formData.assignedTo.includes(a._id))
//             .map((a) => a.name)
//             .join(", ")
//         : "Select agent(s)"}
//     </span>
//     <span className="ml-2">{open ? "▲" : "▼"}</span>
//   </div>

//   {/* Dropdown list */}
//   {open && (
//     <ul className="absolute z-10 border bg-white w-full max-h-48 overflow-y-auto mt-1 shadow-lg">
//       {agents.map((agent) => (
//         <li
//           key={agent._id}
//           onClick={() => {
//             const id = agent._id;
//             setFormData((prev) => ({
//               ...prev,
//               assignedTo: prev.assignedTo.includes(id)
//                 ? prev.assignedTo.filter((i) => i !== id)
//                 : [...prev.assignedTo, id],
//             }));
//             // DO NOT close dropdown here
//           }}
//           className={`p-2 cursor-pointer hover:bg-gray-100 ${
//             formData.assignedTo.includes(agent._id) ? "bg-gray-200" : ""
//           }`}
//         >
//           {agent.name}
//         </li>
//       ))}
//     </ul>
//   )}
// </div>




//         <button type="submit" disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded">
//           {loading ? "Saving..." : "Add Lead"}
//         </button>
//       </form>

//       {/* CSV Upload */}
//       {/* File Upload */}
//       <div className="p-4 border rounded space-y-2">
//         <h2 className="font-bold text-lg">Upload Leads (CSV or Excel)</h2>
//         <input
//           type="file"
//           accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//           onChange={(e) => setFile(e.target.files[0])}
//         />
//         <button
//           onClick={handleUpload}
//           disabled={loading}
//           className="bg-green-500 text-white px-4 py-2 rounded"
//         >
//           {loading ? "Uploading..." : "Upload File"}
//         </button>
//       </div>

//     </div>
//   );
// }
