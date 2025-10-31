import { useState, useEffect } from "react";
import axios from "axios";
import ClinicLayout from '../../components/ClinicLayout';
import withClinicAuth from '../../components/withClinicAuth';

function LeadForm() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    gender: "Male",
    age: "",
    treatments: [],
    source: "Instagram",
    offerTag: "",
    status: "New",
    notes: [],
    customSource: "",
    customStatus: "",
    followUps: [],
    assignedTo: [],
  });

  const [treatments, setTreatments] = useState([]);
  const [file, setFile] = useState(null);
  const [agents, setAgents] = useState([]);
  const [activeOffers, setActiveOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noteType, setNoteType] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  // removed custom dropdown open state; using native select for Assign To

  const token = typeof window !== "undefined" ? localStorage.getItem("clinicToken") : null;

  // Fetch clinic-specific treatments using clinicToken
  useEffect(() => {
    async function fetchTreatments() {
      try {
        if (!token) return;
        const res = await axios.get("/api/lead-ms/get-clinic-treatment", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data || {};
        setTreatments(Array.isArray(data.treatments) ? data.treatments : []);
      } catch (err) {
        console.error(err);
        setTreatments([]);
      }
    }
    fetchTreatments();
  }, [token]);

  // Fetch agents
  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await axios.get("/api/lead-ms/assign-lead", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAgents(res.data.users || []);
      } catch (err) {
        console.error(err);
      }
    }
    fetchAgents();
  }, [token]);

  // Fetch active offers for Offer Tag selection
  useEffect(() => {
    async function fetchActiveOffers() {
      try {
        if (!token) return;
        const res = await axios.get("/api/lead-ms/get-create-offer", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const list = Array.isArray(res.data?.offers) ? res.data.offers : [];
        const onlyActive = list.filter((o) => o.status === "active");
        setActiveOffers(onlyActive);
      } catch (err) {
        console.error(err);
        setActiveOffers([]);
      }
    }
    fetchActiveOffers();
  }, [token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTreatmentChange = (e) => {
    const value = e.target.value;
    // value format: MAIN::SUB or MAIN
    if (value.includes("::")) {
      const [mainName, subName] = value.split("::");
      setFormData((prev) => {
        const exists = prev.treatments.some(
          (t) => t.treatment === mainName && t.subTreatment === subName
        );
        return {
          ...prev,
          treatments: exists
            ? prev.treatments.filter((t) => !(t.treatment === mainName && t.subTreatment === subName))
            : [...prev.treatments, { treatment: mainName, subTreatment: subName }],
        };
      });
      return;
    }
    const mainName = value;
    setFormData((prev) => {
      const exists = prev.treatments.some((t) => t.treatment === mainName && !t.subTreatment);
      return {
        ...prev,
        treatments: exists
          ? prev.treatments.filter((t) => !(t.treatment === mainName && !t.subTreatment))
          : [...prev.treatments, { treatment: mainName, subTreatment: null }],
      };
    });
  };

  // Removed custom treatment flow per request

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const selectedNote = noteType === "Custom" ? customNote.trim() : noteType;
      const notesToSend = selectedNote ? [{ text: selectedNote }] : [];
      const followUpsToSend = followUpDate
        ? [...formData.followUps, { date: followUpDate, addedBy: null }]
        : formData.followUps;

      await axios.post(
        "/api/lead-ms/create-lead",
        { ...formData, notes: notesToSend, followUps: followUpsToSend, mode: "manual" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Lead added!");
      setFormData({
        name: "",
        phone: "",
        gender: "Male",
        age: "",
        treatments: [],
        source: "Instagram",
        offerTag: "",
        status: "New",
        notes: [],
        customSource: "",
        customStatus: "",
        followUps: [],
        assignedTo: [],
      });
      setNoteType("");
      setCustomNote("");
      setFollowUpDate("");
    } catch (err) {
      console.error(err);
      alert("Error adding lead");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return alert("Select a CSV or Excel file");
    setLoading(true);
    const formDataObj = new FormData();
    formDataObj.append("file", file);
    formDataObj.append("mode", "bulk");
    try {
      const res = await axios.post("/api/lead-ms/create-lead", formDataObj, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      alert(`Uploaded ${res.data.count} leads successfully!`);
      setFile(null);
    } catch (err) {
      console.error(err);
      alert("Failed to upload leads");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-5">
      <form onSubmit={handleSubmit} className="mx-auto max-w-5xl bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-gray-200">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Lead</h2>
          <p className="text-xs text-gray-500">Capture lead details and assign to your team</p>
        </div>

        <div className="px-6 py-5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-gray-600 mb-1">Name</label>
              <input id="name" name="name" placeholder="Enter full name" value={formData.name} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
            </div>
            <div>
              <label htmlFor="phone" className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input id="phone" name="phone" placeholder="Enter phone number" value={formData.phone} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="gender" className="block text-xs font-medium text-gray-600 mb-1">Gender</label>
              <select id="gender" name="gender" value={formData.gender} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
            </select>
          </div>
            <div>
              <label htmlFor="age" className="block text-xs font-medium text-gray-600 mb-1">Age</label>
              <input id="age" name="age" type="number" placeholder="e.g. 32" value={formData.age} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Treatments</p>
            <div className="space-y-2 max-h-56 overflow-y-auto rounded-lg border border-gray-200 p-3 bg-white">
          {treatments.map((t, idx) => (
            <div key={idx}>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      value={t.mainTreatment}
                      checked={formData.treatments.some((tr) => tr.treatment === t.mainTreatment && !tr.subTreatment)}
                      onChange={handleTreatmentChange}
                      className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm font-medium text-gray-800">{t.mainTreatment}</span>
                  </div>
              {t.subTreatments?.length > 0 && (
                    <div className="ml-6 mt-1 space-y-1">
                  {t.subTreatments.map((sub, sidx) => {
                    const val = `${t.mainTreatment}::${sub.name}`;
                    return (
                          <div key={`${idx}-${sidx}`} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              value={val}
                              checked={formData.treatments.some(tr => tr.treatment === t.mainTreatment && tr.subTreatment === sub.name)}
                              onChange={handleTreatmentChange}
                              className="h-3.5 w-3.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                            />
                            <span className="text-xs text-gray-700">{sub.name}</span>
                          </div>
                    );
                  })}
                    </div>
              )}
            </div>
          ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="source" className="block text-xs font-medium text-gray-600 mb-1">Source</label>
              <select id="source" name="source" value={formData.source} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
            <option value="Instagram">Instagram</option>
            <option value="Facebook">Facebook</option>
            <option value="Google">Google</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Walk-in">Walk-in</option>
            <option value="Other">Other</option>
            </select>
            </div>
          {formData.source === "Other" && (
              <div>
                <label htmlFor="customSource" className="block text-xs font-medium text-gray-600 mb-1">Custom Source</label>
                <input id="customSource" name="customSource" placeholder="Enter source" value={formData.customSource} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
              </div>
          )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select id="status" name="status" value={formData.status} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Booked">Booked</option>
            <option value="Visited">Visited</option>
            <option value="Follow-up">Follow-up</option>
            <option value="Not Interested">Not Interested</option>
            <option value="Other">Other</option>
            </select>
            </div>
          {formData.status === "Other" && (
              <div>
                <label htmlFor="customStatus" className="block text-xs font-medium text-gray-600 mb-1">Custom Status</label>
                <input id="customStatus" name="customStatus" placeholder="Enter status" value={formData.customStatus} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
              </div>
          )}
          </div>

          <div>
            <label htmlFor="offerTag" className="block text-xs font-medium text-gray-600 mb-1">Offer Tag</label>
            <select
              id="offerTag"
              name="offerTag"
              value={formData.offerTag}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
            <option value="">No offer</option>
            {activeOffers.map((o) => (
              <option key={o._id} value={o.title}>
                {o.title} — {o.type === "percentage" ? `${o.value}%` : `₹${o.value}`}
              </option>
            ))}
            </select>
            {formData.offerTag && (
              <p className="text-xs text-gray-500 mt-1">
                {(() => {
                  const sel = activeOffers.find((o) => o.title === formData.offerTag);
                  if (!sel) return null;
                  return sel.type === "percentage" ? `Selected: ${sel.value}% off` : `Selected: ₹${sel.value} off`;
                })()}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="noteType" className="block text-xs font-medium text-gray-600 mb-1">Note</label>
              <select id="noteType" value={noteType} onChange={(e) => setNoteType(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                <option value="">Select Note</option>
                <option value="Interested">Interested</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
            {noteType === "Custom" && (
              <div>
                <label htmlFor="customNote" className="block text-xs font-medium text-gray-600 mb-1">Custom Note</label>
                <input id="customNote" type="text" placeholder="Type a note" value={customNote} onChange={(e) => setCustomNote(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
              </div>
            )}
          </div>

          <div>
            <label htmlFor="followUpDate" className="block text-xs font-medium text-gray-600 mb-1">Follow-up Date</label>
            <input id="followUpDate" type="datetime-local" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
          </div>

          {/* Assign To - simple select that closes on selection */}
          <div className="w-full">
            <label htmlFor="assignTo" className="block text-xs font-medium text-gray-600 mb-1">Assign To</label>
            <select
              id="assignTo"
              value={formData.assignedTo[0] || ""}
              onChange={(e) => {
                const selectedId = e.target.value;
                setFormData(prev => ({ ...prev, assignedTo: selectedId ? [selectedId] : [] }));
              }}
              className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">Select agent</option>
              {agents.map(agent => (
                <option key={agent._id} value={agent._id}>{agent.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end pt-4">
            <button type="submit" disabled={loading} className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-gradient-to-r from-teal-600 to-teal-700 text-white text-sm font-medium shadow hover:from-teal-700 hover:to-teal-800 disabled:opacity-60">
              {loading ? "Saving..." : "Save Lead"}
            </button>
          </div>
        </div>
      </form>

      {/* CSV Upload */}
      <div className="mx-auto max-w-5xl mt-5 bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Upload Leads</h3>
            <p className="text-xs text-gray-500">Supports CSV or Excel files</p>
          </div>
          <button onClick={handleUpload} disabled={loading || !file} className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-medium shadow hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-60">{loading ? "Uploading..." : "Upload"}</button>
        </div>
        <input className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-gray-700 hover:file:bg-gray-200" type="file" accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      </div>
    </div>
  );
}

// Wrap page in ClinicLayout
LeadForm.getLayout = (page) => <ClinicLayout>{page}</ClinicLayout>;

// Preserve layout on wrapped component
const ProtectedLeadForm = withClinicAuth(LeadForm);
ProtectedLeadForm.getLayout = LeadForm.getLayout;

export default ProtectedLeadForm;
