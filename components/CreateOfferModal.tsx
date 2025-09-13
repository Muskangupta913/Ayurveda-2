import { useState, useEffect } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (offer: any) => void;
  token: string;
}

export default function CreateOfferModal({ isOpen, onClose, onCreated, token }: Props) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "percentage",
    value: 0,
    currency: "INR",
    code: "",
    slug: "",
    startsAt: "",
    endsAt: "",
    timezone: "Asia/Kolkata",
    maxUses: null as number | null,
    usesCount: 0,
    perUserLimit: 1,
    channels: [] as string[],
    utm: { source: "clinic", medium: "email", campaign: "" },
    conditions: {} as Record<string, any>,
    status: "draft",
    treatments: [] as string[], // selected treatment slugs
  });

  const [clinicId, setClinicId] = useState<string | null>(null);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch clinic + treatments
  useEffect(() => {
    if (!isOpen) return;

    const fetchClinicData = async () => {
      try {
        const token = localStorage.getItem("clinicToken");
        const res = await fetch("/api/lead-ms/get-clinic-treatment", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setClinicId(data.clinicId);
          setTreatments(data.treatments || []);
        }
      } catch (err) {
        console.error("Error fetching clinic data", err);
      }
    };

    fetchClinicData();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = e.target;

    // Numeric fields
    if (name === "value" || name === "perUserLimit" || name === "maxUses") {
      setForm({ ...form, [name]: value ? Number(value) : null });
      return;
    }

    // Channels (multi-checkbox)
    if (type === "checkbox" && name === "channels") {
      setForm((prev) => ({
        ...prev,
        channels: checked
          ? [...prev.channels, value]
          : prev.channels.filter((c) => c !== value),
      }));
      return;
    }

    // UTMs
    if (name.startsWith("utm.")) {
      const key = name.split(".")[1];
      setForm({ ...form, utm: { ...form.utm, [key]: value } });
      return;
    }

    // Conditions (optional JSON object)
    if (name.startsWith("conditions.")) {
      const key = name.split(".")[1];
      setForm({ ...form, conditions: { ...form.conditions, [key]: value } });
      return;
    }

    setForm({ ...form, [name]: value });
  };

  const toggleTreatment = (slug: string, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      treatments: checked
        ? [...prev.treatments, slug]
        : prev.treatments.filter((s) => s !== slug),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicId) return alert("Clinic ID not loaded yet.");

    setLoading(true);
    try {
      const token = localStorage.getItem("clinicToken");
      const res = await fetch("/api/lead-ms/create-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          clinicId,
          startsAt: form.startsAt ? new Date(form.startsAt) : null,
          endsAt: form.endsAt ? new Date(form.endsAt) : null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onCreated(data.offer);
        onClose();
      } else alert(data.message || "Failed to create offer");
    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]">
        <h2 className="text-xl font-bold mb-4">Create Offer</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium">Title</label>
            <input type="text" name="title" value={form.title} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" required />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>

          {/* Type + Value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Type</label>
              <select name="type" value={form.type} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" required>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed</option>
                <option value="free Consult">Free Consult</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Value</label>
              <input type="number" name="value" value={form.value} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Starts At</label>
              <input type="datetime-local" name="startsAt" value={form.startsAt} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Ends At</label>
              <input type="datetime-local" name="endsAt" value={form.endsAt} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
            </div>
          </div>

          {/* Max Uses + Per User Limit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Max Uses</label>
              <input type="number" name="maxUses" value={form.maxUses || ""} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Per User Limit</label>
              <input type="number" name="perUserLimit" value={form.perUserLimit} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
            </div>
          </div>

          {/* Channels */}
          <div>
            <label className="block text-sm font-medium mb-2">Channels</label>
            <div className="flex gap-3 flex-wrap">
              {["email", "sms", "web", "affiliate"].map((c) => (
                <label key={c} className="flex items-center space-x-1">
                  <input type="checkbox" name="channels" value={c} checked={form.channels.includes(c)} onChange={handleChange} />
                  <span>{c}</span>
                </label>
              ))}
            </div>
          </div>

          {/* UTMs */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium">UTM Source</label>
              <input type="text" name="utm.source" value={form.utm.source} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">UTM Medium</label>
              <input type="text" name="utm.medium" value={form.utm.medium} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">UTM Campaign</label>
              <input type="text" name="utm.campaign" value={form.utm.campaign} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium">Status</label>
            <select name="status" value={form.status} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2">
              {["draft", "active", "paused", "expired", "archived"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Treatments */}
          <div>
            <label className="block text-sm font-medium mb-2">Select Treatments</label>
            <div className="space-y-3 max-h-60 overflow-y-auto border rounded p-3">
              {treatments.map((t: any, i: number) => (
                <div key={i}>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={form.treatments.includes(t.mainTreatmentSlug)} onChange={(e) => toggleTreatment(t.mainTreatmentSlug, e.target.checked)} />
                    <span>{t.mainTreatment}</span>
                  </label>
                  {t.subTreatments?.length > 0 && (
                    <div className="ml-6 space-y-1">
                      {t.subTreatments.map((sub: any, j: number) => (
                        <label key={j} className="flex items-center space-x-2">
                          <input type="checkbox" checked={form.treatments.includes(sub.slug)} onChange={(e) => toggleTreatment(sub.slug, e.target.checked)} />
                          <span>{sub.name} - ₹{sub.price}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700">{loading ? "Saving..." : "Create"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
