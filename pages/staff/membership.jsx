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
  const [packageDurationMonths, setPackageDurationMonths] = useState("");
  const [packageStartDate, setPackageStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [packageEndDate, setPackageEndDate] = useState("");
  // EMR autocomplete state
  const [emrSuggestions, setEmrSuggestions] = useState([]);
  const [emrSuggesting, setEmrSuggesting] = useState(false);
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

  // Calculate package end date when duration changes
  useEffect(() => {
    if (packageDurationMonths && packageStartDate) {
      const startDate = new Date(packageStartDate);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + parseInt(packageDurationMonths));
      setPackageEndDate(endDate.toISOString().split('T')[0]);
    }
  }, [packageDurationMonths, packageStartDate]);

  // EMR autocomplete (debounced)
  useEffect(() => {
    let handle;
    const q = emrNumber.trim();
    if (!isOpen) { setEmrSuggestions([]); return; }
    if (q.length < 2) { setEmrSuggestions([]); return; }
    setEmrSuggesting(true);
    handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/staff/emr-search?q=${encodeURIComponent(q)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (res.ok && json.success) {
          setEmrSuggestions(json.data || []);
        } else {
          setEmrSuggestions([]);
        }
      } catch {
        setEmrSuggestions([]);
      } finally {
        setEmrSuggesting(false);
      }
    }, 250);
    return () => { if (handle) clearTimeout(handle); };
  }, [emrNumber, isOpen, token]);

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
    if (!patient || !selectedPackage || !packageDurationMonths) {
      alert("Select package, enter duration and fetch a patient first");
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
          packageStartDate,
          packageEndDate,
          packageDurationMonths: parseInt(packageDurationMonths),
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
      setPackageDurationMonths("");
      setPackageStartDate(new Date().toISOString().split('T')[0]);
      setPackageEndDate("");
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
            <div className="flex-1 relative">
              <label className="block text-sm font-medium text-gray-800 mb-1">EMR Number</label>
              <input value={emrNumber} onChange={e => setEmrNumber(e.target.value)} placeholder="Enter EMR Number" className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900" />
              {(emrSuggesting || (emrSuggestions && emrSuggestions.length > 0)) && emrNumber.trim().length >= 2 && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 max-h-64 overflow-auto">
                  {emrSuggesting && <div className="px-3 py-2 text-sm text-gray-600">Searching...</div>}
                  {!emrSuggesting && emrSuggestions.length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-600">No matches</div>
                  )}
                  {!emrSuggesting && emrSuggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => { setEmrNumber(s.emrNumber || ""); setEmrSuggestions([]); setTimeout(() => fetchByEmr(), 0); }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm text-gray-900"
                    >
                      <div className="font-medium">{s.emrNumber}</div>
                      <div className="text-xs text-gray-600">{[s.firstName, s.lastName].filter(Boolean).join(" ")}{s.mobileNumber ? ` · ${s.mobileNumber}` : ''}</div>
                    </button>
                  ))}
                </div>
              )}
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
                    <label className="block text-sm font-medium text-gray-800 mb-1">Package Duration (Months) <span className="text-red-500">*</span></label>
                    <input 
                      type="number" 
                      value={packageDurationMonths} 
                      onChange={e => setPackageDurationMonths(e.target.value)} 
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900" 
                      placeholder="e.g., 6" 
                      min="1" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Package Start Date</label>
                    <input 
                      type="date" 
                      value={packageStartDate} 
                      onChange={e => setPackageStartDate(e.target.value)} 
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Package End Date</label>
                    <input 
                      type="date" 
                      value={packageEndDate} 
                      readOnly 
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-gray-50" 
                    />
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

// Helper function to calculate remaining days
const calculateRemainingDays = (endDate) => {
  const today = new Date();
  const end = new Date(endDate);
  const diffTime = end - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Helper function to get validity status
const getValidityStatus = (endDate) => {
  const remainingDays = calculateRemainingDays(endDate);
  if (remainingDays < 0) {
    return { text: "Expired", color: "text-red-600", bg: "bg-red-50" };
  } else if (remainingDays <= 7) {
    return { text: `${remainingDays} day${remainingDays !== 1 ? 's' : ''} left`, color: "text-orange-600", bg: "bg-orange-50" };
  } else if (remainingDays <= 30) {
    return { text: `${remainingDays} days left`, color: "text-yellow-600", bg: "bg-yellow-50" };
  } else {
    return { text: `${remainingDays} days left`, color: "text-green-600", bg: "bg-green-50" };
  }
};

function MembershipPage() {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState([]);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [updateItem, setUpdateItem] = useState(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferItem, setTransferItem] = useState(null);

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
            {list.map(item => {
              const validityStatus = item.packageEndDate ? getValidityStatus(item.packageEndDate) : null;
              return (
                <div key={item._id} className="bg-white border rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-900">{item.packageName}</div>
                    <div className="text-xs text-gray-600">{new Date(item.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="mt-2 text-sm text-gray-800">EMR: <span className="font-medium">{item.emrNumber}</span></div>
                  
                  {/* Package Validity Period */}
                  {item.packageStartDate && item.packageEndDate && (
                    <div className="mt-2 p-2 bg-gray-50 rounded border">
                      <div className="text-xs text-gray-600 mb-1">Package Validity</div>
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(item.packageStartDate).toLocaleDateString()} - {new Date(item.packageEndDate).toLocaleDateString()}
                      </div>
                      {validityStatus && (
                        <div className={`mt-1 text-xs px-2 py-1 rounded ${validityStatus.bg} ${validityStatus.color} font-medium`}>
                          {validityStatus.text}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-2 text-sm flex justify-between">
                    <span className="text-gray-700">Package</span>
                    <span className="font-semibold text-gray-900">₹ {Number(item.packageAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className="text-sm flex justify-between">
                    <span className="text-gray-700">Consumed</span>
                    <span className="font-semibold text-gray-900">₹ {Number(item.totalConsumedAmount || 0).toFixed(2)}</span>
                  </div>
                {Number(item.remainingBalance || 0) > 0 ? (
                  <div className="text-sm flex justify-between">
                    <span className="text-gray-700">Remaining</span>
                    <span className="font-semibold text-gray-900">₹ {Number(item.remainingBalance || 0).toFixed(2)}</span>
                  </div>
                ) : (
                  <div className="text-sm flex justify-between">
                    <span className="text-gray-700">Pending</span>
                    <span className="font-semibold text-red-600">₹ {Math.max(0, Number(item.totalConsumedAmount||0) - Number(item.packageAmount||0)).toFixed(2)}</span>
                  </div>
                )}
                  {/* Transfer History Display */}
                  {item.transferHistory && item.transferHistory.length > 0 && (
                    <div className="mt-2 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                      <div className="text-xs font-semibold text-blue-800 mb-1">Transfer History:</div>
                      {item.transferHistory.map((transfer, idx) => (
                        <div key={idx} className="text-xs text-blue-700">
                          {transfer.fromEmr} → {transfer.toEmr}
                          {transfer.toName && ` (${transfer.toName})`}
                          {transfer.transferredAmount > 0 && ` - ₹${transfer.transferredAmount.toFixed(2)}`}
                          {transfer.note && ` - ${transfer.note}`}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => { setViewItem(item); setViewOpen(true); }} className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700">View</button>
                    <button onClick={() => { setUpdateItem(item); setUpdateOpen(true); }} className="px-3 py-1.5 rounded-md bg-green-600 text-white text-sm hover:bg-green-700">Update</button>
                    <button onClick={() => { setTransferItem(item); setTransferOpen(true); }} className="px-3 py-1.5 rounded-md bg-yellow-600 text-white text-sm hover:bg-yellow-700">Transfer</button>
                  </div>
                </div>
              );
            })}
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
                  {viewItem.packageStartDate && (
                    <Info label="Start Date" value={new Date(viewItem.packageStartDate).toLocaleDateString()} />
                  )}
                  {viewItem.packageEndDate && (
                    <Info label="End Date" value={new Date(viewItem.packageEndDate).toLocaleDateString()} />
                  )}
                  {viewItem.packageDurationMonths && (
                    <Info label="Duration" value={`${viewItem.packageDurationMonths} month${viewItem.packageDurationMonths !== 1 ? 's' : ''}`} />
                  )}
                </div>
                
                {/* Package Validity Status */}
                {viewItem.packageEndDate && (
                  <div className="mt-4 p-3 bg-gray-50 rounded border">
                    <div className="text-sm font-semibold text-gray-900 mb-2">Package Validity Status</div>
                    {(() => {
                      const validityStatus = getValidityStatus(viewItem.packageEndDate);
                      return (
                        <div className={`inline-block px-3 py-1 rounded text-sm font-medium ${validityStatus.bg} ${validityStatus.color}`}>
                          {validityStatus.text}
                        </div>
                      );
                    })()}
                  </div>
                )}
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

                {/* Transfer History in View Modal */}
                {viewItem.transferHistory && viewItem.transferHistory.length > 0 && (
                  <div className="bg-white rounded border">
                    <div className="px-4 py-2 font-semibold text-gray-900 border-b">Transfer History</div>
                    <div className="p-4">
                      {viewItem.transferHistory.map((transfer, idx) => (
                        <div key={idx} className="mb-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                          <div className="text-sm font-semibold text-blue-800">
                            {transfer.fromEmr} → {transfer.toEmr}
                            {transfer.toName && ` (${transfer.toName})`}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Amount: ₹{transfer.transferredAmount.toFixed(2)} | 
                            Date: {new Date(transfer.transferredAt).toLocaleString()}
                            {transfer.note && ` | Note: ${transfer.note}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Update modal: prefilled patient+package, allow adding new treatments */}
        {updateOpen && updateItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Update Membership</h3>
                <button onClick={() => { setUpdateOpen(false); setUpdateItem(null); }} className="px-3 py-1.5 bg-gray-100 rounded-md text-gray-800 hover:bg-gray-200">Close</button>
              </div>
              <UpdateMembershipBody item={updateItem} onClose={() => { setUpdateOpen(false); setUpdateItem(null); fetchMemberships(); }} />
            </div>
          </div>
        )}

        {/* Transfer modal: transfer by EMR with tracking fields */}
        {transferOpen && transferItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl">
              <TransferMembershipBody item={transferItem} onClose={() => { setTransferOpen(false); setTransferItem(null); fetchMemberships(); }} />
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



// Inline component for update body
function UpdateMembershipBody({ item, onClose }) {
  const [treatmentsList, setTreatmentsList] = useState([]);
  const [selectedTreatment, setSelectedTreatment] = useState("");
  const [price, setPrice] = useState("");
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetch("/api/admin/staff-treatments")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTreatmentsList(data.data.filter(i => i.treatment).map(i => ({ name: i.treatment, price: i.treatmentPrice })));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedTreatment) { setPrice(""); return; }
    const t = treatmentsList.find(t => t.name === selectedTreatment);
    setPrice(t && typeof t.price === 'number' ? t.price.toFixed(2) : "");
  }, [selectedTreatment, treatmentsList]);

  const addRow = () => {
    if (!selectedTreatment || !price) return;
    const unitPrice = Number(price);
    setRows(prev => [...prev, { treatmentName: selectedTreatment, unitCount: 1, unitPrice, lineTotal: unitPrice }]);
  };

  const updateRow = (idx, key, value) => {
    setRows(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      const next = { ...r, [key]: key === 'unitCount' || key === 'unitPrice' ? Number(value) : value };
      next.lineTotal = Number(next.unitCount || 0) * Number(next.unitPrice || 0);
      return next;
    }));
  };

  const removeRow = (idx) => setRows(prev => prev.filter((_, i) => i !== idx));

  const remainingAfterNew = useMemo(() => {
    const added = rows.reduce((s, r) => s + (r.lineTotal || 0), 0);
    return Math.max(0, Number(item.packageAmount || 0) - Number(item.totalConsumedAmount || 0) - added);
  }, [rows, item]);
  const pendingAfterNew = useMemo(() => {
    const added = rows.reduce((s, r) => s + (r.lineTotal || 0), 0);
    return Math.max(0, (Number(item.totalConsumedAmount || 0) + added) - Number(item.packageAmount || 0));
  }, [rows, item]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;

  const saveUpdate = async () => {
    if (rows.length === 0) { onClose(); return; }
    try {
      const res = await fetch('/api/staff/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          membershipId: item._id,
          treatments: rows.map(r => ({ treatmentName: r.treatmentName, unitCount: r.unitCount, unitPrice: r.unitPrice }))
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to update');
      onClose();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Info label="EMR Number" value={item.emrNumber} />
        <Info label="Package" value={`${item.packageName} (₹ ${Number(item.packageAmount||0).toFixed(2)})`} />
        <Info label="Consumed" value={`₹ ${Number(item.totalConsumedAmount||0).toFixed(2)}`} />
        <Info label="Remaining" value={`₹ ${Number(item.remainingBalance||0).toFixed(2)}`} />
      </div>

      {/* Past Treatments */}
      <div className="bg-white rounded-lg border p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Past Treatments</h4>
        <table className="w-full text-sm border rounded-md overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Treatment</th>
              <th className="p-2 text-right">Unit Price</th>
              <th className="p-2 text-right">Units</th>
              <th className="p-2 text-right">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {(item.treatments || []).map((t, i) => (
              <tr key={i} className="border-t">
                <td className="p-2">{t.treatmentName}</td>
                <td className="p-2 text-right">₹ {Number(t.unitPrice||0).toFixed(2)}</td>
                <td className="p-2 text-right">{Number(t.unitCount||0)}</td>
                <td className="p-2 text-right">₹ {Number(t.lineTotal||0).toFixed(2)}</td>
              </tr>
            ))}
            {(item.treatments || []).length === 0 && (
              <tr><td className="p-3 text-center text-gray-700" colSpan={4}>No past treatments</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-lg border p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Add Treatments</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Treatment</label>
            <select value={selectedTreatment} onChange={e => setSelectedTreatment(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900">
              <option value="">Select Treatment</option>
              {treatmentsList.map(t => (
                <option key={t.name} value={t.name}>{t.name}{typeof t.price === 'number' ? ` - ₹${t.price.toFixed(2)}` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Unit Price</label>
            <input value={price ? `₹ ${price}` : ""} readOnly className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-gray-50" />
          </div>
          <div className="flex gap-2">
            <button onClick={addRow} disabled={!selectedTreatment || !price} className={`px-4 py-2 rounded-md text-white ${(!selectedTreatment || !price) ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}>Add</button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                {rows.map((r, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-2">{r.treatmentName}</td>
                    <td className="p-2 text-right">₹ {Number(r.unitPrice).toFixed(2)}</td>
                    <td className="p-2 text-right">
                      <input type="number" min={1} value={r.unitCount} onChange={e => updateRow(idx, 'unitCount', e.target.value)} className="w-20 border border-gray-300 rounded px-2 py-1 text-right" />
                    </td>
                    <td className="p-2 text-right">₹ {Number(r.lineTotal).toFixed(2)}</td>
                    <td className="p-2 text-right">
                      <button onClick={() => removeRow(idx)} className="text-red-600 hover:underline">Remove</button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-3 text-center text-gray-700">No new treatments</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 border rounded-md p-3 h-max">
            <div className="flex justify-between text-sm mb-2"><span>Package Total</span><span className="font-semibold">₹ {Number(item.packageAmount).toFixed(2)}</span></div>
            <div className="flex justify-between text-sm mb-2"><span>Consumed</span><span className="font-semibold">₹ {Number(item.totalConsumedAmount).toFixed(2)}</span></div>
            {Number(remainingAfterNew) > 0 ? (
              <div className="flex justify-between text-sm mb-2"><span>Remaining (after add)</span><span className="font-semibold">₹ {Number(remainingAfterNew).toFixed(2)}</span></div>
            ) : (
              <div className="flex justify-between text-sm mb-2"><span>Pending (after add)</span><span className="font-semibold text-red-600">₹ {Number(pendingAfterNew).toFixed(2)}</span></div>
            )}

            <button onClick={saveUpdate} className="mt-3 w-full py-2 rounded-md text-white bg-green-600 hover:bg-green-700">Update</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TransferMembershipBody({ item, onClose }) {
  const [toEmr, setToEmr] = useState("");
  const [toName, setToName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;

  const remaining = Number(item.remainingBalance || 0);

  const submit = async () => {
    if (!toEmr.trim()) {
      alert('Target EMR is required');
      return;
    }
    try {
      const res = await fetch('/api/staff/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          membershipId: item._id,
          toEmrNumber: toEmr,
          toName,
          amount: Number(amount) || 0,
          note
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to transfer');
      alert('Transfer recorded');
      onClose();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between border-b pb-3">
        <h3 className="text-lg font-bold text-gray-900">Transfer Membership</h3>
        <button onClick={onClose} className="px-3 py-1.5 bg-gray-100 rounded-md text-gray-800 hover:bg-gray-200">Close</button>
      </div>
      <div className="mt-3 space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Info label="From EMR" value={item.emrNumber} />
          <Info label="Package" value={`${item.packageName} (₹ ${Number(item.packageAmount||0).toFixed(2)})`} />
          <Info label="Remaining" value={`₹ ${Number(item.remainingBalance||0).toFixed(2)}`} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">To EMR Number</label>
          <input value={toEmr} onChange={e => setToEmr(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900" placeholder="Enter new EMR" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Recipient Name (optional)</label>
          <input value={toName} onChange={e => setToName(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900" placeholder="Full name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Transferred Amount</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900" placeholder={`0.00 (Max: ₹ ${remaining.toFixed(2)})`} step="0.01" max={remaining} />
          <div className="text-xs text-gray-600 mt-1">
            • Leave empty or 0 for full transfer (₹{remaining.toFixed(2)})<br/>
            • Enter amount for partial transfer (will deduct from balance)
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Note</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900" rows={3} placeholder="Reason or details" />
        </div>
        <button onClick={submit} className="w-full py-2 rounded-md text-white bg-yellow-600 hover:bg-yellow-700">Confirm Transfer</button>
      </div>
    </div>
  );
}