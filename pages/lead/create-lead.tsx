// /pages/lead-form.js
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
  });

  const [treatments, setTreatments] = useState([]);
  const [customTreatment, setCustomTreatment] = useState("");
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

  // Handle generic input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle treatment selection
  const handleTreatmentChange = (e) => {
    const value = e.target.value;

    if (value === "other") {
      // Add custom treatment (after API call)
      return;
    }

    setFormData((prev) => ({
      ...prev,
      treatments: prev.treatments.includes(value)
        ? prev.treatments.filter((t) => t !== value)
        : [...prev.treatments, value],
    }));
  };

  // Handle custom treatment add
  const handleAddCustomTreatment = async () => {
    if (!customTreatment.trim()) return alert("Enter a treatment name");
    setLoading(true);
    try {
      const res = await axios.post(
        "/api/doctor/add-custom-treatment",
        {
          mainTreatment: customTreatment,
          subTreatments: [], // you can allow adding subs later
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Add the new treatment in dropdown
      setTreatments((prev) => [...prev, res.data.treatment]);
      setFormData((prev) => ({
        ...prev,
        treatments: [...prev.treatments, res.data.treatment._id],
      }));
      setCustomTreatment("");
      alert("Custom treatment added!");
    } catch (err) {
      console.error("Error adding treatment:", err);
      alert("Failed to add treatment");
    } finally {
      setLoading(false);
    }
  };

  // Submit Lead
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/lead-ms/create-lead", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Lead added!");
    } catch (err) {
      console.error(err);
      alert("Error adding lead");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded space-y-3">
      <input
        name="name"
        placeholder="Name"
        value={formData.name}
        onChange={handleChange}
        className="block mb-2 border p-2"
      />
      <input
        name="phone"
        placeholder="Phone"
        value={formData.phone}
        onChange={handleChange}
        className="block mb-2 border p-2"
      />
      <select
        name="gender"
        value={formData.gender}
        onChange={handleChange}
        className="border p-2"
      >
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
        className="block mb-2 border p-2"
      />

      <label>Treatments:</label>
      <div className="space-y-1">
        {treatments.map((t) => (
          <div key={t._id} className="flex items-center space-x-2">
            <input
              type="checkbox"
              value={t._id}
              checked={formData.treatments.includes(t._id)}
              onChange={handleTreatmentChange}
            />
            <span>
              {t.name}
              {t.subcategories?.length > 0 &&
                ` (${t.subcategories.map((s) => s.name).join(", ")} - ${
                  t.category || "General"
                })`}
            </span>
          </div>
        ))}

        {/* Other Treatment Option */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            value="other"
            checked={!!customTreatment}
            onChange={() =>
              setCustomTreatment(customTreatment ? "" : " ")
            }
          />
          <span>Other</span>
        </div>

        {customTreatment !== "" && (
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

      {/* Other fields remain same */}
      <select
        name="source"
        value={formData.source}
        onChange={handleChange}
        className="border p-2"
      >
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
          value={formData.customSource || ""}
          onChange={handleChange}
          className="border p-2"
        />
      )}

      <select
        name="status"
        value={formData.status}
        onChange={handleChange}
        className="border p-2"
      >
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
          value={formData.customStatus || ""}
          onChange={handleChange}
          className="border p-2"
        />
      )}

      <input
        name="offerTag"
        placeholder="Offer Tag"
        value={formData.offerTag}
        onChange={handleChange}
        className="block mb-2 border p-2"
      />

      <textarea
        name="notes"
        placeholder="Notes"
        value={formData.notes}
        onChange={handleChange}
        className="block mb-2 border p-2"
      />

      <button type="submit" className="bg-blue-500 text-white px-4 py-2">
        Add Lead
      </button>
    </form>
  );
}
