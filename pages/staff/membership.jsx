import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
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
  const emrInputRef = useRef(null);
  const [emrDropdownRect, setEmrDropdownRect] = useState(null);
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

  // Reset modal state each time it opens so EMR field shows again
  useEffect(() => {
    if (isOpen) {
      setPatient(null);
      setEmrNumber("");
      setEmrSuggestions([]);
      setSelectedPackage("");
      setSelectedTreatment("");
      setSelectedPrice("");
      setLines([]);
      setPackageDurationMonths("");
      setPackageStartDate(new Date().toISOString().split('T')[0]);
      setPackageEndDate("");
      setPaymentMethod("");
      setPaidAmount("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/admin/get-all-doctor-staff")
      .then(res => res.json())
      .then(json => json.success && setDoctorList(json.data))
      .catch(() => { });

    fetch("/api/admin/staff-treatments")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTreatments(data.data.filter(i => i.treatment).map(i => ({ name: i.treatment, price: i.treatmentPrice })));
          setPackages(data.data.filter(i => i.package).map(i => ({ name: i.package, price: i.packagePrice })));
        }
      })
      .catch(() => { });
  }, [isOpen]);

  const fetchByEmr = useCallback(async (overrideEmr) => {
    const emrToFetch = (overrideEmr ?? emrNumber).trim();
    if (!emrToFetch) return;
    try {
      setFetching(true);
      const res = await fetch(`/api/staff/patient-registration/${emrToFetch}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPatient(data.data);
        // Clear EMR field and suggestions once we have a patient, and hide the search UI
        setEmrSuggestions([]);
        setEmrNumber("");
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
          // measure input position for dropdown placement
          if (emrInputRef.current) {
            const rect = emrInputRef.current.getBoundingClientRect();
            setEmrDropdownRect({
              top: rect.bottom + window.scrollY,
              left: rect.left + window.scrollX,
              width: rect.width
            });
          }
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

  // Keep dropdown aligned on resize/scroll
  useEffect(() => {
    const updateRect = () => {
      if (emrInputRef.current) {
        const rect = emrInputRef.current.getBoundingClientRect();
        setEmrDropdownRect({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
    };
    if (emrSuggestions && emrSuggestions.length > 0) {
      updateRect();
      window.addEventListener('resize', updateRect);
      window.addEventListener('scroll', updateRect, true);
      return () => {
        window.removeEventListener('resize', updateRect);
        window.removeEventListener('scroll', updateRect, true);
      };
    }
  }, [emrSuggestions]);

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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Add Membership</h3>
          <button onClick={onClose} className="px-3 py-1.5 bg-gray-100 rounded-md text-gray-800 hover:bg-gray-200">Close</button>
        </div>

        <div className="p-4 space-y-6">
          {!patient && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
              <div className="flex-1 relative">
                <label className="block text-sm font-medium text-gray-800 mb-1">EMR Number</label>
                <input ref={emrInputRef} value={emrNumber} onChange={e => setEmrNumber(e.target.value)} placeholder="Enter EMR Number" className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900" />
                {(emrSuggesting || (emrSuggestions && emrSuggestions.length > 0)) && emrNumber.trim().length >= 2 && emrDropdownRect && (
                  <div
                    className="fixed bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-64 overflow-auto"
                    style={{
                      top: emrDropdownRect.top + 4,
                      left: emrDropdownRect.left,
                      width: Math.min(Math.max(emrDropdownRect.width, 360), window.innerWidth - emrDropdownRect.left - 16)
                    }}
                  >
                    {emrSuggesting && <div className="px-3 py-2 text-sm text-gray-600">Searching...</div>}
                    {!emrSuggesting && emrSuggestions.length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-600">No matches</div>
                    )}
                    {!emrSuggesting && emrSuggestions.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => { setEmrSuggestions([]); fetchByEmr(s.emrNumber || ""); }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm text-gray-900"
                      >
                        <div className="font-medium truncate">{s.emrNumber}</div>
                        <div className="text-xs text-gray-600 truncate">{[s.firstName, s.lastName].filter(Boolean).join(" ")}{s.mobileNumber ? ` · ${s.mobileNumber}` : ''}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => fetchByEmr()} disabled={fetching || !emrNumber.trim()} className={`px-5 py-2 rounded-md text-white ${fetching || !emrNumber.trim() ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>{fetching ? 'Fetching...' : 'Fetch'}</button>
            </div>
          )}

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
  const [searchQuery, setSearchQuery] = useState('');

  const token = typeof window !== "undefined" ? localStorage.getItem("userToken") : null;

  const fetchMemberships = useCallback(async () => {
    try {
      const res = await fetch('/api/staff/members', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok && json.success) setList(json.data || []);
    } catch { }
  }, [token]);

  useEffect(() => { fetchMemberships(); }, [fetchMemberships]);

  const filteredList = list.filter(item =>
    item.emrNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.packageName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Memberships</h1>
              <p className="text-gray-600 text-sm mt-1">Manage member packages and benefits</p>
            </div>
            <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
              + Add Membership
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by EMR or package name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-black w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Memberships Grid */}
        {filteredList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredList.map(item => {
              const validityStatus = item.packageEndDate ? getValidityStatus(item.packageEndDate) : null;
              const utilization = (item.totalConsumedAmount / item.packageAmount) * 100;

              return (
                <div key={item._id} className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{item.packageName}</h3>
                      <p className="text-sm text-gray-500 mt-1">{item.emrNumber}</p>
                    </div>
                    {validityStatus && (
                      <div className={`text-xs px-2.5 py-1 rounded-full font-medium ${validityStatus.bg} ${validityStatus.color}`}>
                        {validityStatus.text}
                      </div>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b border-gray-200">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 font-medium mb-1">PACKAGE</p>
                      <p className="text-sm font-semibold text-gray-900">₹{Number(item.packageAmount || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 font-medium mb-1">CONSUMED</p>
                      <p className="text-sm font-semibold text-gray-900">₹{Number(item.totalConsumedAmount || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 font-medium mb-1">REMAINING</p>
                      <p className={`text-sm font-semibold ${item.remainingBalance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{Number(Math.abs(item.remainingBalance || 0)).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Utilization Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">Utilization</span>
                      <span className="text-xs font-medium text-gray-900">{Math.min(utilization, 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${Math.min(utilization, 100)}%` }} />
                    </div>
                  </div>

                  {/* Validity Period */}
                  {item.packageStartDate && item.packageEndDate && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Valid Until</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(item.packageEndDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {/* Transfer History */}
                  {item.transferHistory && item.transferHistory.length > 0 && (
                    <div className="mb-4 p-2.5 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs text-blue-700 font-medium">📤 {item.transferHistory.length} Transfer(s)</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button onClick={() => { setViewItem(item); setViewOpen(true); }} className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium text-sm hover:bg-blue-100 transition-colors">
                      View
                    </button>
                    <button onClick={() => { setUpdateItem(item); setUpdateOpen(true); }} className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg font-medium text-sm hover:bg-green-100 transition-colors">
                      Edit
                    </button>
                    <button onClick={() => { setTransferItem(item); setTransferOpen(true); }} className="flex-1 px-3 py-2 bg-amber-50 text-amber-700 rounded-lg font-medium text-sm hover:bg-amber-100 transition-colors">
                      Transfer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-12 text-center">
            <p className="text-gray-600 text-lg font-medium">No memberships found</p>
            <p className="text-gray-500 text-sm mt-2">Try adjusting your search</p>
          </div>
        )}

        {/* Modals */}
        <MembershipModal isOpen={open} onClose={() => { setOpen(false); fetchMemberships(); }} />

        {/* View Modal */}
        {viewOpen && viewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
                <h3 className="text-lg font-bold">Membership Details</h3>
                <button onClick={() => { setViewOpen(false); setViewItem(null); }} className="p-1 hover:bg-blue-500 rounded transition-colors">✕</button>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'EMR Number', value: viewItem.emrNumber },
                    { label: 'Package', value: viewItem.packageName },
                    { label: 'Amount', value: `₹${Number(viewItem.packageAmount || 0).toLocaleString()}` },
                    { label: 'Paid', value: `₹${Number(viewItem.paidAmount || 0).toLocaleString()}` },
                    { label: 'Consumed', value: `₹${Number(viewItem.totalConsumedAmount || 0).toLocaleString()}` },
                    { label: 'Remaining', value: `₹${Number(viewItem.remainingBalance || 0).toLocaleString()}` },
                  ].map((info, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-600 mb-1">{info.label}</p>
                      <p className="text-sm font-semibold text-gray-900">{info.value}</p>
                    </div>
                  ))}
                </div>

                {viewItem.treatments && viewItem.treatments.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Treatments Included</h4>
                    <div className="space-y-2">
                      {viewItem.treatments.map((t, i) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{t.treatmentName}</p>
                            <p className="text-xs text-gray-600">{t.unitCount} units × ₹{Number(t.unitPrice).toLocaleString()}</p>
                          </div>
                          <p className="font-semibold text-gray-900">₹{Number(t.lineTotal).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {viewItem.transferHistory && viewItem.transferHistory.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Transfer History</h4>
                    <div className="space-y-2">
                      {viewItem.transferHistory.map((t, i) => (
                        <div key={i} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-gray-900">{t.fromEmr} → {t.toEmr}{t.toName ? ` (${t.toName})` : ''}</p>
                            <p className="text-sm font-semibold text-blue-600">₹{t.transferredAmount.toLocaleString()}</p>
                          </div>
                          <p className="text-xs text-gray-600">{new Date(t.transferredAt).toLocaleDateString()}</p>
                          {t.note && <p className="text-xs text-gray-700 mt-1">Note: {t.note}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Update Modal */}
        {updateOpen && updateItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white p-4 flex items-center justify-between">
                <h3 className="text-lg font-bold">Update Membership</h3>
                <button onClick={() => { setUpdateOpen(false); setUpdateItem(null); }} className="p-1 hover:bg-green-500 rounded transition-colors">✕</button>
              </div>
              <UpdateMembershipBody item={updateItem} onClose={() => { setUpdateOpen(false); setUpdateItem(null); fetchMemberships(); }} />
            </div>
          </div>
        )}

        {/* Transfer Modal */}
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
  const [updatePaymentMethod, setUpdatePaymentMethod] = useState("");
  const [updatePaidAmount, setUpdatePaidAmount] = useState("");

  useEffect(() => {
    fetch("/api/admin/staff-treatments")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTreatmentsList(data.data.filter(i => i.treatment).map(i => ({ name: i.treatment, price: i.treatmentPrice })));
        }
      })
      .catch(() => { });
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
  const addedAmount = useMemo(() => rows.reduce((s, r) => s + (r.lineTotal || 0), 0), [rows]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;

  const saveUpdate = async () => {
    if (rows.length === 0) { onClose(); return; }
    try {
      const res = await fetch('/api/staff/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          membershipId: item._id,
          treatments: rows.map(r => ({ treatmentName: r.treatmentName, unitCount: r.unitCount, unitPrice: r.unitPrice })),
          paymentMethod: updatePaymentMethod || undefined,
          paidAmount: updatePaidAmount ? Number(updatePaidAmount) : undefined
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
    <div className="p-6 space-y-6">
      {/* Key Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-xs font-medium text-blue-600 mb-1">EMR NUMBER</p>
          <p className="text-lg font-semibold text-gray-900">{item.emrNumber}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-xs font-medium text-purple-600 mb-1">PACKAGE</p>
          <p className="text-lg font-semibold text-gray-900">{item.packageName}</p>
          <p className="text-xs text-gray-600 mt-1">₹{Number(item.packageAmount || 0).toLocaleString()}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-xs font-medium text-green-600 mb-1">REMAINING</p>
          <p className={`text-lg font-semibold ${item.remainingBalance > 0 ? 'text-green-600' : 'text-red-600'}`}>
            ₹{Number(item.remainingBalance || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <p className="text-xs font-medium text-orange-600 mb-1">CONSUMED</p>
          <p className="text-lg font-semibold text-gray-900">₹{Number(item.totalConsumedAmount || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Past Treatments Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h4 className="font-semibold text-gray-900">Past Treatments</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-3 text-left font-semibold text-gray-700">Treatment</th>
                <th className="p-3 text-right font-semibold text-gray-700">Unit Price</th>
                <th className="p-3 text-right font-semibold text-gray-700">Units</th>
                <th className="p-3 text-right font-semibold text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {(item.treatments || []).length > 0 ? (
                (item.treatments || []).map((t, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50 transition-colors">
                    <td className="p-3 text-gray-900">{t.treatmentName}</td>
                    <td className="p-3 text-right text-gray-600">₹{Number(t.unitPrice || 0).toLocaleString()}</td>
                    <td className="p-3 text-right text-gray-600">{Number(t.unitCount || 0)}</td>
                    <td className="p-3 text-right font-medium text-gray-900">₹{Number(t.lineTotal || 0).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">No past treatments</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Treatments Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h4 className="font-semibold text-gray-900">Add New Treatments</h4>
        </div>
        <div className="p-4">
          {/* Input Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Treatment</label>
              <select
                value={selectedTreatment}
                onChange={e => setSelectedTreatment(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a treatment...</option>
                {treatmentsList.map(t => (
                  <option key={t.name} value={t.name}>
                    {t.name} {typeof t.price === 'number' ? `• ₹${Number(t.price).toLocaleString()}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unit Price</label>
              <input
                value={price ? `₹${Number(price).toLocaleString()}` : ""}
                readOnly
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 bg-gray-50 cursor-not-allowed"
              />
            </div>
            <button
              onClick={addRow}
              disabled={!selectedTreatment || !price}
              className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${!selectedTreatment || !price
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
            >
              Add Treatment
            </button>
          </div>

          {/* New Treatments Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="p-3 text-left font-semibold text-gray-700">Treatment</th>
                      <th className="p-3 text-right font-semibold text-gray-700">Unit Price</th>
                      <th className="p-3 text-right font-semibold text-gray-700">Units</th>
                      <th className="p-3 text-right font-semibold text-gray-700">Total</th>
                      <th className="p-3 text-center font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length > 0 ? (
                      rows.map((r, idx) => (
                        <tr key={idx} className="border-t hover:bg-gray-50 transition-colors">
                          <td className="p-3 text-gray-900 font-medium">{r.treatmentName}</td>
                          <td className="p-3 text-right text-gray-600">₹{Number(r.unitPrice).toLocaleString()}</td>
                          <td className="p-3 text-right">
                            <input
                              type="number"
                              min={1}
                              value={r.unitCount}
                              onChange={e => updateRow(idx, 'unitCount', e.target.value)}
                              className="w-16 border border-gray-300 rounded px-2 py-1.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="p-3 text-right font-semibold text-gray-900">₹{Number(r.lineTotal).toLocaleString()}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => removeRow(idx)}
                              className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded font-medium transition-colors"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-gray-500">No new treatments added yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Card */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 p-4 h-max sticky top-0">
              <h5 className="font-semibold text-gray-900 mb-4">Summary</h5>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Package Total</span>
                  <span className="font-semibold text-gray-900">₹{Number(item.packageAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Already Consumed</span>
                  <span className="font-semibold text-gray-900">₹{Number(item.totalConsumedAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Added Amount</span>
                  <span className="font-semibold text-gray-900">₹{Number(addedAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">New Consumed</span>
                  <span className="font-semibold text-gray-900">₹{Number((Number(item.totalConsumedAmount || 0) + Number(addedAmount || 0))).toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-300 pt-3 mt-3">
                  {Number(remainingAfterNew) > 0 ? (
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-green-700">Remaining (after add)</span>
                      <span className="font-semibold text-green-700">₹{Number(remainingAfterNew).toLocaleString()}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-red-700">Pending (after add)</span>
                      <span className="font-semibold text-red-700">₹{Number(pendingAfterNew).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Payment Method</label>
                  <select value={updatePaymentMethod} onChange={e => setUpdatePaymentMethod(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900">
                    <option value="">Select Method</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="BT">BT</option>
                    <option value="Tabby">Tabby</option>
                    <option value="Tamara">Tamara</option>
                  </select>
                  {updatePaymentMethod === "Cash" && rows.length > 0 && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-xs text-blue-700">
                        💰 Treatment amounts will be automatically added to Petty Cash system
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Paid Amount</label>
                  <input type="number" value={updatePaidAmount} onChange={e => setUpdatePaidAmount(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900" placeholder="0.00" step="0.01" />
                </div>
                <button
                  onClick={saveUpdate}
                  className="w-full py-2.5 rounded-lg text-white font-medium bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                  Collect Payment & Update
                </button>
              </div>
            </div>
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
          <Info label="Package" value={`${item.packageName} (₹ ${Number(item.packageAmount || 0).toFixed(2)})`} />
          <Info label="Remaining" value={`₹ ${Number(item.remainingBalance || 0).toFixed(2)}`} />
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
            • Leave empty or 0 for full transfer (₹{remaining.toFixed(2)})<br />
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