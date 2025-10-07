// pages/patients.js
"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import ClinicLayout from '../../components/staffLayout';
import withClinicAuth from '../../components/withStaffAuth';



const CHECKLIST_FIELDS = [
  { key: "appointment", label: "Appointment" },
  { key: "personalDetails", label: "Personal details" },
  { key: "treatment", label: "Treatment" },
  { key: "amount", label: "Amount" },
  { key: "complains", label: "Complains" },
  { key: "vitalSign", label: "Vital sign" },
  { key: "consentForm", label: "Consent form" },
  { key: "allergy", label: "Allergy" },
  { key: "invoiceDate", label: "Invoice date" },
  { key: "familyDetails", label: "Family details" },
  { key: "diagnosis", label: "Diagnosis" },
  { key: "startDate", label: "Start date" },
];

 function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [checklist, setChecklist] = useState({});
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchPatients();
  }, []);

  const getAuthHeader = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("userToken") : null;
    return { Authorization: `Bearer ${token}` };
  };

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/staff/pending-claims", { headers: getAuthHeader() });
      setPatients(res.data.data || []);
    } catch (err) {
      console.error("Fetch patients error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const openModalFor = (patient) => {
    // initialize checklist all false
    const init = {};
    CHECKLIST_FIELDS.forEach((f) => (init[f.key] = false));
    setChecklist(init);
    setSelectedPatient(patient);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPatient(null);
  };

  const toggleChecklist = (key) => {
    setChecklist((s) => ({ ...s, [key]: !s[key] }));
  };

  const submitRelease = async () => {
    setSaving(true);
    setErrorMsg("");
    try {
      // check all required are true
      const missed = CHECKLIST_FIELDS.filter((f) => !checklist[f.key]).map((f) => f.label);
      if (missed.length > 0) {
        setErrorMsg("Please tick all required fields before releasing.");
        setSaving(false);
        return;
      }

      const body = {
        id: selectedPatient._id,
        action: "release",
        checklist, // server validates completeness
      };

      const res = await axios.patch("/api/staff/pending-claims", body, { headers: getAuthHeader() });
      // update local state
      const updated = res.data.data;
      setPatients((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      closeModal();
    } catch (err) {
      console.error("Release error:", err.response?.data || err.message);
      setErrorMsg(err.response?.data?.message || "Release failed");
    } finally {
      setSaving(false);
    }
  };

  const doCancel = async (patient) => {
    if (!confirm("Are you sure you want to cancel this claim?")) return;
    try {
      const body = { id: patient._id, action: "cancel" };
      const res = await axios.patch("/api/staff/pending-claims", body, { headers: getAuthHeader() });
      const updated = res.data.data;
      setPatients((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
    } catch (err) {
      console.error("Cancel error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Cancel failed");
    }
  }

  const openModalFromCancelled = (patient) => {
    // When user clicks "Release" in cancelled section -> open modal same as pending
    openModalFor(patient);
  };

  // helpers to group patients
  const pendingPatients = patients.filter((p) => p.advanceClaimStatus === "Pending");
  const releasedPatients = patients.filter((p) => p.advanceClaimStatus === "Released");
  const cancelledPatients = patients.filter((p) => p.advanceClaimStatus === "Cancelled");

  if (loading) return <p className="text-center p-6">Loading...</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Patient Claims</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Pending */}
        <section>
          <h2 className="font-semibold mb-3">Pending</h2>
          <div className="space-y-4">
            {pendingPatients.length === 0 && <div className="italic text-sm">No pending claims</div>}
            {pendingPatients.map((p) => (
              <div key={p._id} className="bg-white p-4 rounded shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{p.firstName} {p.lastName} ({p.gender})</div>
                    <div className="text-sm">EMR: {p.emrNumber || "-"}</div>
                    <div className="text-sm">Doctor: {p.doctor}</div>
                    <div className="text-sm">Pending: ₹{p.pending}</div>
                    <div className="text-sm">Invoice: {new Date(p.invoicedDate).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => openModalFor(p)}
                    className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                  >
                    Pending Claim
                  </button>
                  <button
                    onClick={() => doCancel(p)}
                    className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Released */}
        <section>
          <h2 className="font-semibold mb-3">Released</h2>
          <div className="space-y-4">
            {releasedPatients.length === 0 && <div className="italic text-sm">No released claims</div>}
            {releasedPatients.map((p) => (
              <div key={p._id} className="bg-white p-4 rounded shadow">
                <div className="font-medium">{p.firstName} {p.lastName}</div>
                <div className="text-sm">Released on: {p.advanceClaimReleaseDate ? new Date(p.advanceClaimReleaseDate).toLocaleString() : "-"}</div>
                <div className="text-sm">Released by: {p.advanceClaimReleasedBy || "-"}</div>

                <div className="mt-3">
                  <button
                    onClick={() => doCancel(p)}
                    className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cancelled */}
        <section>
          <h2 className="font-semibold mb-3">Cancelled</h2>
          <div className="space-y-4">
            {cancelledPatients.length === 0 && <div className="italic text-sm">No cancelled claims</div>}
            {cancelledPatients.map((p) => (
              <div key={p._1d} className="bg-white p-4 rounded shadow">
                <div className="font-medium">{p.firstName} {p.lastName}</div>
                <div className="text-sm">Status updated: {new Date(p.updatedAt).toLocaleString()}</div>

                <div className="mt-3">
                  <button
                    onClick={() => openModalFromCancelled(p)}
                    className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                  >
                    Release
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Modal */}
      {isModalOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-2xl rounded-lg p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Release Claim - {selectedPatient.firstName} {selectedPatient.lastName}</h3>
              <button onClick={closeModal} className="text-sm text-gray-600">Close</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-auto pb-4">
              {CHECKLIST_FIELDS.map((f) => (
                <label key={f.key} className="flex items-center gap-2 border p-2 rounded">
                  <input
                    type="checkbox"
                    checked={!!checklist[f.key]}
                    onChange={() => toggleChecklist(f.key)}
                  />
                  <span>{f.label}</span>
                </label>
              ))}
            </div>

            {errorMsg && <div className="text-red-600 mt-3">{errorMsg}</div>}

            <div className="mt-4 flex gap-2">
              <button
                onClick={submitRelease}
                disabled={saving}
                className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
              >
                {saving ? "Releasing..." : "Release"}
              </button>
              <button onClick={closeModal} className="bg-gray-200 py-2 px-4 rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
 PatientsPage.getLayout = function PageLayout(page) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

// Apply HOC
const ProtectedDashboard = withClinicAuth( PatientsPage);

// Reassign layout
ProtectedDashboard.getLayout =  PatientsPage.getLayout;

export default ProtectedDashboard;

