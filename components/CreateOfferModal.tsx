import { useState, useEffect } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (offer: any) => void; // called on create or update
  token: string;
  mode?: "create" | "update";
  offer?: any;
}

export default function CreateOfferModal({
  isOpen,
  onClose,
  onCreated,
  token,
  mode = "create",
  offer,
}: Props) {
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
    treatments: [] as string[],
  });

  const [clinicId, setClinicId] = useState<string | null>(null);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔹 Fetch clinic data and treatments whenever modal opens
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

  // 🔹 Reset or prefill form on modal open
  useEffect(() => {
    if (!isOpen) return;

    if (mode === "create") {
      setForm({
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
        maxUses: null,
        usesCount: 0,
        perUserLimit: 1,
        channels: [],
        utm: { source: "clinic", medium: "email", campaign: "" },
        conditions: {},
        status: "draft",
        treatments: [],
      });
    } else if (mode === "update" && offer) {
      const selectedSlugs = [
        ...(offer.treatments?.map((t: any) => t.mainTreatmentSlug) || []),
        ...(offer.treatments?.flatMap(
          (t: any) => t.subTreatments?.map((st: any) => st.slug) || []
        ) || []),
      ];

      setForm({
        title: offer.title || "",
        description: offer.description || "",
        type: offer.type || "percentage",
        value: offer.value || 0,
        currency: offer.currency || "INR",
        code: offer.code || "",
        slug: offer.slug || "",
        startsAt: offer.startsAt ? new Date(offer.startsAt).toISOString().slice(0, 16) : "",
        endsAt: offer.endsAt ? new Date(offer.endsAt).toISOString().slice(0, 16) : "",
        timezone: offer.timezone || "Asia/Kolkata",
        maxUses: offer.maxUses || null,
        usesCount: offer.usesCount || 0,
        perUserLimit: offer.perUserLimit || 1,
        channels: offer.channels || [],
        utm: offer.utm || { source: "clinic", medium: "email", campaign: "" },
        conditions: offer.conditions || {},
        status: offer.status || "draft",
        treatments: selectedSlugs,
      });
      setClinicId(offer.clinicId || null);
    }
  }, [isOpen, mode, offer]);

  // 🔹 Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = e.target;

    if (["value", "perUserLimit", "maxUses"].includes(name)) {
      setForm((prev) => ({ ...prev, [name]: value ? Number(value) : null }));
      return;
    }

    if (type === "checkbox" && name === "channels") {
      setForm((prev) => ({
        ...prev,
        channels: checked
          ? [...prev.channels, value]
          : prev.channels.filter((c) => c !== value),
      }));
      return;
    }

    if (name.startsWith("utm.")) {
      const key = name.split(".")[1];
      setForm((prev) => ({ ...prev, utm: { ...prev.utm, [key]: value } }));
      return;
    }

    if (name.startsWith("conditions.")) {
      const key = name.split(".")[1];
      setForm((prev) => ({ ...prev, conditions: { ...prev.conditions, [key]: value } }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 Toggle treatment selection
  const toggleTreatment = (slug: string, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      treatments: checked
        ? [...prev.treatments, slug]
        : prev.treatments.filter((s) => s !== slug),
    }));
  };

  // 🔹 Handle create or update offer
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicId) return alert("Clinic ID not loaded yet.");

    setLoading(true);
    try {
      const url =
        mode === "create"
          ? "/api/lead-ms/create-offer"
          : `/api/lead-ms/update-offer?id=${offer._id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          clinicId,
          startsAt: form.startsAt ? new Date(form.startsAt) : null,
          endsAt: form.endsAt ? new Date(form.endsAt) : null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onCreated(data.offer); // ✅ update parent immediately
        onClose();
      } else {
        alert(data.message || `Failed to ${mode} offer`);
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Handle delete offer
  const handleDelete = async () => {
    if (!offer?._id) return;
    if (!confirm("Are you sure you want to delete this offer?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/lead-ms/delete-offer?id=${offer._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        onClose();
        onCreated(null); // optional: notify parent to remove offer from list
      } else {
        alert(data.message || "Failed to delete offer");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]">
        <h2 className="text-xl font-bold mb-4">
          {mode === "create" ? "Create Offer" : "Update Offer"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium">Title</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="mt-1 w-full border rounded px-3 py-2"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>

          {/* Type + Value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Type</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="mt-1 w-full border rounded px-3 py-2"
                required
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed</option>
                <option value="free Consult">Free Consult</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Value</label>
              <input
                type="number"
                name="value"
                value={form.value}
                onChange={handleChange}
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Starts At</label>
              <input
                type="datetime-local"
                name="startsAt"
                value={form.startsAt}
                onChange={handleChange}
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Ends At</label>
              <input
                type="datetime-local"
                name="endsAt"
                value={form.endsAt}
                onChange={handleChange}
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          {/* Max Uses + Per User Limit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Max Uses</label>
              <input
                type="number"
                name="maxUses"
                value={form.maxUses || ""}
                onChange={handleChange}
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Per User Limit</label>
              <input
                type="number"
                name="perUserLimit"
                value={form.perUserLimit}
                onChange={handleChange}
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          {/* Channels */}
          <div>
            <label className="block text-sm font-medium mb-2">Channels</label>
            <div className="flex gap-3 flex-wrap">
              {["email", "sms", "web", "affiliate"].map((c) => (
                <label key={c} className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    name="channels"
                    value={c}
                    checked={form.channels.includes(c)}
                    onChange={handleChange}
                  />
                  <span>{c}</span>
                </label>
              ))}
            </div>
          </div>
  {/* UTMs */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium">UTM Source</label>
              <input
                type="text"
                name="utm.source"
                value={form.utm.source}
                onChange={handleChange}
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">UTM Medium</label>
              <input
                type="text"
                name="utm.medium"
                value={form.utm.medium}
                onChange={handleChange}
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">UTM Campaign</label>
              <input
                type="text"
                name="utm.campaign"
                value={form.utm.campaign}
                onChange={handleChange}
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="mt-1 w-full border rounded px-3 py-2"
            >
              {["draft", "active", "paused", "expired", "archived"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
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
                    <input
                      type="checkbox"
                      checked={form.treatments.includes(t.mainTreatmentSlug)}
                      onChange={(e) =>
                        toggleTreatment(t.mainTreatmentSlug, e.target.checked)
                      }
                    />
                    <span>{t.mainTreatment}</span>
                  </label>
                  {t.subTreatments?.length > 0 && (
                    <div className="ml-6 space-y-1">
                      {t.subTreatments.map((sub: any, j: number) => (
                        <label key={j} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={form.treatments.includes(sub.slug)}
                            onChange={(e) =>
                              toggleTreatment(sub.slug, e.target.checked)
                            }
                          />
                          <span>
                            {sub.name} - ₹{sub.price ?? 0}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between mt-6">
            {mode === "update" && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700"
              >
                {loading
                  ? "Saving..."
                  : mode === "create"
                  ? "Create"
                  : "Update"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
