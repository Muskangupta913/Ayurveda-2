import React, { useEffect, useMemo, useState, useCallback } from "react";
import ClinicLayout from "../../components/staffLayout";
import withClinicAuth from "../../components/withStaffAuth";

const MembershipModal = ({ isOpen, onClose }) => {
  const [emrNumber, setEmrNumber] = useState("");
  const [fetching, setFetching] = useState(false);
  const [patient, setPatient] = useState(null);
  const [doctorList, setDoctorList] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState("");
  const [selectedTreatment, setSelectedTreatment] = useState("");
  const [selectedPrice, setSelectedPrice] = useState("");
  const [lines, setLines] = useState([]); // { treatmentName, unitCount, unitPrice, lineTotal }
  const totalConsumed = useMemo(() => lines.reduce((s, l) => s + (Number(l.lineTotal) || 0), 0), [lines]);
  const packageAmount = useMemo(() => {
    if (!selectedPackage) return 0;
    const p = packages.find(p => p.name === selectedPackage);
    return p && typeof p.price === 'number' ? p.price : 0;
  }, [selectedPackage, packages]);
  const remaining = useMemo(() => Math.max(0, Number(packageAmount || 0) - Number(totalConsumed || 0)), [packageAmount, totalConsumed]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paidAmount, setPaidAmount] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("userToken") : null;

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/admin/get-all-doctor-staff")
      .then(res => res.json())
      .then(json => json.success && setDoctorList(json.data))
      .catch(() => {});

    fetch("/api/admin/staff-treatments")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTreatments(data.data.filter(i => i.treatment).map(i => ({ name: i.treatment, price: i.treatmentPrice })));
          setPackages(data.data.filter(i => i.package).map(i => ({ name: i.package, price: i.packagePrice })));
        }
      })
      .catch(() => {});
  }, [isOpen]);

  const fetchByEmr = useCallback(async () => {
    if (!emrNumber.trim()) return;
    try {
      setFetching(true);
      const res = await fetch(`/api/staff/patient-registration/${emrNumber}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPatient(data.data);
      } else {
        setPatient(null);
        alert(data.message || "Patient not found");
      }
    } catch {
      setPatient(null);
      alert("Failed to fetch patient");
    } finally {
      setFetching(false);
    }
  }, [emrNumber, token]);

  useEffect(() => {
    if (selectedTreatment) {
      const t = treatments.find(t => t.name === selectedTreatment);
      if (t && typeof t.price === "number") {
        setSelectedPrice(t.price.toFixed(2));
        return;
      }
    }
    setSelectedPrice("");
  }, [selectedTreatment, treatments]);

  const addLine = () => {
    const name = selectedTreatment || "";
    const unitPrice = (() => {
      if (selectedTreatment) {
        const t = treatments.find(t => t.name === selectedTreatment);
        if (t && typeof t.price === "number") return t.price;
      }
      return 0;
    })();
    if (!name || unitPrice <= 0) return;
    const unitCount = 1;
    const lineTotal = unitCount * unitPrice;
    setLines(prev => [...prev, { treatmentName: name, unitCount, unitPrice, lineTotal }]);
  };

  const updateLine = (idx, key, value) => {
    setLines(prev => prev.map((l, i) => {
      if (i !== idx) return l;
      const next = { ...l, [key]: key === 'unitCount' || key === 'unitPrice' ? Number(value) : value };
      next.lineTotal = Number(next.unitCount || 0) * Number(next.unitPrice || 0);
      return next;
    }));
  };

  const removeLine = (idx) => setLines(prev => prev.filter((_, i) => i !== idx));

  const saveMembership = async () => {
    if (!patient || !selectedPackage) {
      alert("Select package and fetch a patient first");
      return;
    }
    try {
      const res = await fetch('/api/staff/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          emrNumber: patient.emrNumber,
          patientId: patient._id,
          packageName: selectedPackage,
          packageAmount,
          paymentMethod,
          paidAmount: Number(paidAmount) || 0,
          treatments: lines.map(l => ({ treatmentName: l.treatmentName, unitCount: l.unitCount, unitPrice: l.unitPrice })),
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed');
      alert('Membership saved');
      setLines([]);
      setPaymentMethod("");
      setPaidAmount("");
    } catch (e) {
      alert(e.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Add Membership</h3>
          <button onClick={onClose} className="px-3 py-1.5 bg-gray-100 rounded-md text-gray-800 hover:bg-gray-200">Close</button>
        </div>

        <div className="p-4 space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-800 mb-1">EMR Number</label>
              <input value={emrNumber} onChange={e => setEmrNumber(e.target.value)} placeholder="Enter EMR Number" className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900" />
            </div>
            <button onClick={fetchByEmr} disabled={fetching || !emrNumber.trim()} className={`px-5 py-2 rounded-md text-white ${fetching || !emrNumber.trim() ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>{fetching ? 'Fetching...' : 'Fetch'}</button>
          </div>

          {patient && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Patient Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <Info label="EMR Number" value={patient.emrNumber} />
                  <Info label="First Name" value={patient.firstName} />
                  <Info label="Last Name" value={patient.lastName} />
                  <Info label="Email" value={patient.email} />
                  <Info label="Mobile (Restricted)" value={patient.mobileNumber} />
                  <Info label="Gender" value={patient.gender} />
                  <Info label="Patient Type" value={patient.patientType} />
                  <Info label="Referred By" value={patient.referredBy} />
                </div>
              </div>

              <div className="bg-white rounded-lg border p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Medical Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Doctor</label>
                    <select value={patient.doctor || ""} disabled className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900">
                      <option value="">Select Doctor</option>
                      {doctorList.map(d => (
                        <option key={d._id} value={d._id}>{d.name} ({d.role})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Service</label>
                    <select value={patient.service || ""} disabled className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900">
                      <option value="">Select Service</option>
                      <option value="Package">Package</option>
                      <option value="Treatment">Treatment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Referred By</label>
                    <input value={patient.referredBy || ""} disabled className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Add Membership</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Package</label>
                    <select value={selectedPackage} onChange={e => { setSelectedPackage(e.target.value); setSelectedTreatment(""); }} className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900">
                      <option value="">Select Package</option>
                      {packages.map(p => (
                        <option key={p.name} value={p.name}>{p.name}{typeof p.price === 'number' ? ` - ₹${p.price.toFixed(2)}` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Treatment</label>
                    <select value={selectedTreatment} onChange={e => { setSelectedTreatment(e.target.value); }} className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900">
                      <option value="">Select Treatment</option>
                      {treatments.map(t => (
                        <option key={t.name} value={t.name}>{t.name}{typeof t.price === 'number' ? ` - ₹${t.price.toFixed(2)}` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Price</label>
                    <div className="flex gap-2">
                      <input value={selectedPrice ? `₹ ${selectedPrice}` : ""} readOnly className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-gray-50" />
                      <button onClick={addLine} disabled={!selectedTreatment || !selectedPrice} className={`px-4 py-2 rounded-md text-white ${(!selectedTreatment || !selectedPrice) ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}>Add</button>
                    </div>
                  </div>
                </div>
                

                {selectedPackage && (
                  <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                      <table className="w-full text-sm border rounded-md overflow-hidden">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="p-2 text-left">Treatment</th>
                            <th className="p-2 text-right">Unit Price</th>
                            <th className="p-2 text-right">Units</th>
                            <th className="p-2 text-right">Line Total</th>
                            <th className="p-2"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {lines.map((l, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="p-2">{l.treatmentName}</td>
                              <td className="p-2 text-right">₹ {Number(l.unitPrice).toFixed(2)}</td>
                              <td className="p-2 text-right">
                                <input type="number" min={1} value={l.unitCount} onChange={e => updateLine(idx, 'unitCount', e.target.value)} className="w-20 border border-gray-300 rounded px-2 py-1 text-right" />
                              </td>
                              <td className="p-2 text-right">₹ {Number(l.lineTotal).toFixed(2)}</td>
                              <td className="p-2 text-right">
                                <button onClick={() => removeLine(idx)} className="text-red-600 hover:underline">Remove</button>
                              </td>
                            </tr>
                          ))}
                          {lines.length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-3 text-center text-gray-700">No treatments added yet</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-gray-50 border rounded-md p-3 h-max">
                      <div className="flex justify-between text-sm mb-2"><span>Package Total</span><span className="font-semibold">₹ {Number(packageAmount).toFixed(2)}</span></div>
                      <div className="flex justify-between text-sm mb-2"><span>Consumed</span><span className="font-semibold">₹ {Number(totalConsumed).toFixed(2)}</span></div>
                      <div className="flex justify-between text-sm mb-2"><span>Remaining</span><span className="font-semibold">₹ {Number(remaining).toFixed(2)}</span></div>

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-800 mb-1">Payment Method</label>
                        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900">
                          <option value="">Select Method</option>
                          <option value="Cash">Cash</option>
                          <option value="Card">Card</option>
                          <option value="BT">BT</option>
                          <option value="Tabby">Tabby</option>
                          <option value="Tamara">Tamara</option>
                        </select>
                      </div>
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-800 mb-1">Paid Amount</label>
                        <input type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900" placeholder="0.00" step="0.01" />
                      </div>

                      <button onClick={saveMembership} disabled={!selectedPackage} className={`mt-3 w-full py-2 rounded-md text-white ${!selectedPackage ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}>Save Membership</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Info = ({ label, value }) => (
  <div>
    <div className="text-xs text-gray-600 mb-1">{label}</div>
    <div className="text-sm font-medium text-gray-900">{value || "-"}</div>
  </div>
);

function MembershipPage() {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState([]);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("userToken") : null;

  const fetchMemberships = useCallback(async () => {
    try {
      const res = await fetch('/api/staff/members', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok && json.success) setList(json.data || []);
    } catch {}
  }, [token]);

  useEffect(() => { fetchMemberships(); }, [fetchMemberships]);
  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Membership</h1>
            <button onClick={() => setOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">+ Add Membership</button>
          </div>
        </div>

        {/* List existing memberships */}
        {list.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map(item => (
              <div key={item._id} className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-900">{item.packageName}</div>
                  <div className="text-xs text-gray-600">{new Date(item.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="mt-2 text-sm text-gray-800">EMR: <span className="font-medium">{item.emrNumber}</span></div>
                <div className="mt-1 text-sm flex justify-between">
                  <span className="text-gray-700">Package</span>
                  <span className="font-semibold text-gray-900">₹ {Number(item.packageAmount || 0).toFixed(2)}</span>
                </div>
                <div className="text-sm flex justify-between">
                  <span className="text-gray-700">Consumed</span>
                  <span className="font-semibold text-gray-900">₹ {Number(item.totalConsumedAmount || 0).toFixed(2)}</span>
                </div>
                <div className="text-sm flex justify-between">
                  <span className="text-gray-700">Remaining</span>
                  <span className="font-semibold text-gray-900">₹ {Number(item.remainingBalance || 0).toFixed(2)}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => { setViewItem(item); setViewOpen(true); }} className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700">View</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-6 text-center text-gray-700">No memberships found</div>
        )}

        <MembershipModal isOpen={open} onClose={() => { setOpen(false); fetchMemberships(); }} />

        {/* View details modal */}
        {viewOpen && viewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Membership Details</h3>
                <button onClick={() => { setViewOpen(false); setViewItem(null); }} className="px-3 py-1.5 bg-gray-100 rounded-md text-gray-800 hover:bg-gray-200">Close</button>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <Info label="EMR Number" value={viewItem.emrNumber} />
                  <Info label="Package" value={`${viewItem.packageName} (₹ ${Number(viewItem.packageAmount||0).toFixed(2)})`} />
                  <Info label="Paid" value={`₹ ${Number(viewItem.paidAmount||0).toFixed(2)}`} />
                  <Info label="Payment Method" value={viewItem.paymentMethod || '-'} />
                  <Info label="Consumed" value={`₹ ${Number(viewItem.totalConsumedAmount||0).toFixed(2)}`} />
                  <Info label="Remaining" value={`₹ ${Number(viewItem.remainingBalance||0).toFixed(2)}`} />
                </div>
                <div className="bg-white rounded border">
                  <div className="px-4 py-2 font-semibold text-gray-900 border-b">Treatments</div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 text-left">Treatment</th>
                        <th className="p-2 text-right">Unit Price</th>
                        <th className="p-2 text-right">Units</th>
                        <th className="p-2 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(viewItem.treatments||[]).map((t, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">{t.treatmentName}</td>
                          <td className="p-2 text-right">₹ {Number(t.unitPrice||0).toFixed(2)}</td>
                          <td className="p-2 text-right">{Number(t.unitCount||0)}</td>
                          <td className="p-2 text-right">₹ {Number(t.lineTotal||0).toFixed(2)}</td>
                        </tr>
                      ))}
                      {(viewItem.treatments||[]).length === 0 && (
                        <tr><td className="p-3 text-center text-gray-700" colSpan={4}>No treatments</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

MembershipPage.getLayout = function PageLayout(page) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

const Protected = withClinicAuth(MembershipPage);
Protected.getLayout = MembershipPage.getLayout;

export default Protected;


