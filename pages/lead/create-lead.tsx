//pages/lead/create-lead
import { useState, useEffect } from "react";
import axios from "axios";

export default function LeadForm() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    gender: "Male",
    age: "",
    treatments: [],
    source: "Instagram",
    offerTag: "",
    status: "New",
    notes: "",
    customSource: "",
    customStatus: "",
  });

  const [treatments, setTreatments] = useState([]);
  const [customTreatment, setCustomTreatment] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("leadToken") : null;

  // Fetch all treatments
  useEffect(() => {
    async function fetchTreatments() {
      try {
        const res = await axios.get("/api/doctor/getTreatment");
        setTreatments(res.data.treatments || []);
      } catch (err) {
        console.error("Error fetching treatments:", err);
      }
    }
    fetchTreatments();
  }, []);

  // Handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle treatment selection
  // Handle treatment selection
const handleTreatmentChange = (e) => {
  const value = e.target.value;

  // Case: subTreatment → format is mainId-idx
  if (value.includes("-")) {
    const [mainId, subIdx] = value.split("-");
    const mainDoc = treatments.find((t) => t._id === mainId);
    const subName = mainDoc?.subcategories?.[Number(subIdx)]?.name || null;

    setFormData((prev) => {
      const exists = prev.treatments.some(
        (t) => t.treatment === mainId && t.subTreatment === subName
      );
      return {
        ...prev,
        treatments: exists
          ? prev.treatments.filter(
              (t) => !(t.treatment === mainId && t.subTreatment === subName)
            )
          : [...prev.treatments, { treatment: mainId, subTreatment: subName }],
      };
    });
    return;
  }

  // Case: main treatment
  setFormData((prev) => {
    const exists = prev.treatments.some((t) => t.treatment === value && !t.subTreatment);
    return {
      ...prev,
      treatments: exists
        ? prev.treatments.filter((t) => !(t.treatment === value && !t.subTreatment))
        : [...prev.treatments, { treatment: value, subTreatment: null }],
    };
  });
};

  // Add custom treatment
  const handleAddCustomTreatment = async () => {
    if (!customTreatment.trim()) return alert("Enter a treatment name");
    setLoading(true);
    try {
      const res = await axios.post(
        "/api/doctor/add-custom-treatment",
        { mainTreatment: customTreatment, subTreatments: [] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTreatments((prev) => [...prev, res.data.treatment]);
      setFormData((prev) => ({
        ...prev,
        treatments: [...prev.treatments, res.data.treatment._id],
      }));
      setCustomTreatment("");
      alert("Custom treatment added!");
    } catch (err) {
      console.error(err);
      alert("Failed to add treatment");
    } finally {
      setLoading(false);
    }
  };

  // Submit manual lead
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(
        "/api/lead-ms/create-lead",
        { ...formData, mode: "manual" },
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
        notes: "",
        customSource: "",
        customStatus: "",
      });
    } catch (err) {
      console.error(err);
      alert("Error adding lead");
    } finally {
      setLoading(false);
    }
  };

  // Upload CSV / Excel
  const handleUpload = async () => {
    if (!file) return alert("Select a CSV file");
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
    <div className="p-4 space-y-6">
      {/* Manual Lead Form */}
      <form onSubmit={handleSubmit} className="p-4 border rounded space-y-3">
        <h2 className="font-bold text-lg">Add Lead Manually</h2>
        <input
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          className="block mb-2 border p-2 w-full"
        />
        <input
          name="phone"
          placeholder="Phone"
          value={formData.phone}
          onChange={handleChange}
          className="block mb-2 border p-2 w-full"
        />
        <select name="gender" value={formData.gender} onChange={handleChange} className="border p-2 w-full">
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>
        <input
          name="age"
          type="number"
          placeholder="Age"
          value={formData.age}
          onChange={handleChange}
          className="block mb-2 border p-2 w-full"
        />

        <label>Treatments:</label>
<div className="space-y-2">
  {treatments.map((t) => (
    <div key={t._id} className="space-y-1">
      {/* Main Treatment */}
      <div className="flex items-center space-x-2">
       <input
  type="checkbox"
  value={t._id}
  checked={formData.treatments.some((tr) => tr.treatment === t._id && !tr.subTreatment)}
  onChange={handleTreatmentChange}
/>

        <span className="font-medium">{t.name}</span>
      </div>

      {/* Sub-treatments */}
      {t.subcategories?.length > 0 && (
        <div className="ml-6 space-y-1">
          {t.subcategories.map((sub, idx) => {
            // Create a stable synthetic ID for each subTreatment
            const subId = `${t._id}-${idx}`;

            return (
              <div key={subId} className="flex items-center space-x-2">
               <input
  type="checkbox"
  value={subId}
  checked={formData.treatments.some(
    (tr) => tr.treatment === t._id && tr.subTreatment === sub.name
  )}
  onChange={handleTreatmentChange}
/>

                <span className="text-sm text-gray-700">{sub.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  ))}

  {/* Custom treatment option */}
  <div className="flex items-center space-x-2">
    <input
      type="checkbox"
      value="other"
      checked={!!customTreatment}
      onChange={() => setCustomTreatment(customTreatment ? "" : " ")}
    />
    <span>Other</span>
  </div>

  {customTreatment && (
    <div className="flex space-x-2">
      <input
        type="text"
        placeholder="Enter treatment name"
        value={customTreatment}
        onChange={(e) => setCustomTreatment(e.target.value)}
        className="border p-2 flex-1"
      />
      <button
        type="button"
        onClick={handleAddCustomTreatment}
        disabled={loading}
        className="bg-green-500 text-white px-3 py-1 rounded"
      >
        {loading ? "Adding..." : "Add"}
      </button>
    </div>
  )}
</div>


        <select name="source" value={formData.source} onChange={handleChange} className="border p-2 w-full">
          <option value="Instagram">Instagram</option>
          <option value="Facebook">Facebook</option>
          <option value="Google">Google</option>
          <option value="WhatsApp">WhatsApp</option>
          <option value="Walk-in">Walk-in</option>
          <option value="Other">Other</option>
        </select>
        {formData.source === "Other" && (
          <input
            name="customSource"
            placeholder="Enter custom source"
            value={formData.customSource}
            onChange={handleChange}
            className="border p-2 w-full"
          />
        )}

        <select name="status" value={formData.status} onChange={handleChange} className="border p-2 w-full">
          <option value="New">New</option>
          <option value="Contacted">Contacted</option>
          <option value="Booked">Booked</option>
          <option value="Visited">Visited</option>
          <option value="Follow-up">Follow-up</option>
          <option value="Not Interested">Not Interested</option>
          <option value="Other">Other</option>
        </select>
        {formData.status === "Other" && (
          <input
            name="customStatus"
            placeholder="Enter custom status"
            value={formData.customStatus}
            onChange={handleChange}
            className="border p-2 w-full"
          />
        )}

        <input
          name="offerTag"
          placeholder="Offer Tag"
          value={formData.offerTag}
          onChange={handleChange}
          className="block mb-2 border p-2 w-full"
        />

        <textarea
          name="notes"
          placeholder="Notes"
          value={formData.notes}
          onChange={handleChange}
          className="block mb-2 border p-2 w-full"
        />

        <button type="submit" disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded">
          {loading ? "Saving..." : "Add Lead"}
        </button>
      </form>

      {/* CSV Upload */}
      <div className="p-4 border rounded space-y-2">
        <h2 className="font-bold text-lg">Upload Leads via CSV</h2>
        <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} />
        <button
          onClick={handleUpload}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          {loading ? "Uploading..." : "Upload CSV"}
        </button>
      </div>
    </div>
  );
}
