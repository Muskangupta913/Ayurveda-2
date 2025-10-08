import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import { Calendar, User, DollarSign, FileText, AlertCircle } from "lucide-react";
const paymentMethods = ["Cash", "Card", "BT", "Tabby", "Tamara"];

const InvoiceUpdateSystem = () => {
  const [currentUser] = useState({ name: "Admin User", role: "Staff" });
  const [invoiceInfo, setInvoiceInfo] = useState(null);
  const [formData, setFormData] = useState({});
  const [calculatedFields, setCalculatedFields] = useState({ pending: 0, needToPay: 0 });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const router = useRouter();
  const { id } = router.query;

  // ----------------------------
  // Fetch invoice + patient info
  // ----------------------------
  useEffect(() => {
    if (!id) return;

    const fetchInvoice = async () => {
      setLoading(true);
      setFetchError("");

      try {
        const res = await fetch(`/api/staff/get-patient-data/${id}`);
        if (!res.ok) throw new Error("Invoice not found");

        const data = await res.json();
        setInvoiceInfo(data);
        setFormData(data);
      } catch (err) {
        console.error(err);
        setFetchError(err.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  // ----------------------------
  // Calculations
  // ----------------------------
  const calculatePending = useCallback(() => {
    const amount = parseFloat(formData.amount) || 0;
    const paid = parseFloat(formData.paid) || 0;
    const advance = parseFloat(formData.advance) || 0;

    setCalculatedFields((prev) => ({
      ...prev,
      pending: Math.max(0, amount - (paid + advance)),
    }));
  }, [formData.amount, formData.paid, formData.advance]);

  const calculateNeedToPay = useCallback(() => {
    if (formData.insurance === "Yes" && formData.coPayPercent) {
      const amount = parseFloat(formData.amount) || 0;
      const coPayPercent = parseFloat(formData.coPayPercent) || 0;
      setCalculatedFields((prev) => ({
        ...prev,
        needToPay: Math.max(0, (amount * (100 - coPayPercent)) / 100),
      }));
    } else {
      setCalculatedFields((prev) => ({ ...prev, needToPay: 0 }));
    }
  }, [formData.amount, formData.coPayPercent, formData.insurance]);

  useEffect(() => {
    calculatePending();
    calculateNeedToPay();
  }, [calculatePending, calculateNeedToPay]);

  // ----------------------------
  // Handle input change
  // ----------------------------
  const handlePaymentChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  // ----------------------------
  // Update payment
  // ----------------------------
  const handleUpdatePayment = useCallback(async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert("Amount should be valid");
      return;
    }
    if (!formData.paymentMethod) {
      alert("Please select payment method");
      return;
    }

    try {
      const invoiceId = invoiceInfo?._id?.$oid || invoiceInfo?._id;
      const res = await fetch(`/api/staff/get-patient-data/${invoiceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: formData.amount,
          paid: formData.paid,
          advance: formData.advance,
          paymentMethod: formData.paymentMethod,
        }),
      });

      const result = await res.json();
      if (res.ok) {
        alert("Payment updated successfully!");
        setInvoiceInfo(result.updatedInvoice);
        setFormData(result.updatedInvoice);
      } else {
        alert(`Error: ${result.message || "Failed to update payment"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Try again later.");
    }
  }, [formData, invoiceInfo]);

  const canViewMobileNumber = useMemo(
    () => ["Admin", "Super Admin"].includes(currentUser.role),
    [currentUser.role]
  );

  // ----------------------------
  // Render
  // ----------------------------
  if (loading) return <div className="p-8 text-gray-600">Loading invoice details...</div>;
  if (fetchError) return <div className="p-8 text-red-600">{fetchError}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <FileText className="text-indigo-600" />
                Invoice Details
              </h1>
              <p className="text-gray-600 mt-2">View and update payment details only</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Logged in as:</div>
              <div className="font-semibold text-indigo-600">{currentUser.name}</div>
              <div className="text-xs text-gray-500">{currentUser.role}</div>
            </div>
          </div>

          {/* Patient Info */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-6 border-l-4 border-indigo-500">
  <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
    <Calendar className="w-5 h-5 text-indigo-600" />
    Invoice Information
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {/* Invoice Number */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Invoice Number
      </label>
      <p className="font-mono font-semibold text-gray-800">
        {formData.invoiceNumber || "-"}
      </p>
    </div>

    {/* Invoiced Date */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Invoiced Date
      </label>
      <p className="text-gray-800">
        {formData.invoicedDate
          ? new Date(formData.invoicedDate).toLocaleString()
          : "-"}
      </p>
    </div>

    {/* Invoiced By */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Invoiced By
      </label>
      <p className="text-gray-800">{formData.invoicedBy || "-"}</p>
    </div>
  </div>
</div>


<div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
  <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
    <User className="w-5 h-5 text-blue-600" />
    Patient Information
  </h2>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        EMR Number <span className="text-red-500">*</span>
      </label>
      <p>{formData.emrNumber || "-"}</p>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        First Name <span className="text-red-500">*</span>
      </label>
      <p>{formData.firstName || "-"}</p>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Last Name <span className="text-red-500">*</span>
      </label>
      <p>{formData.lastName || "-"}</p>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Email <span className="text-red-500">*</span>
      </label>
      <p>{formData.email || "-"}</p>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Mobile Number {!canViewMobileNumber && "(Restricted)"}
      </label>
      <p>
        {canViewMobileNumber ? formData.mobileNumber || "-" : "Admin access required"}
      </p>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Gender <span className="text-red-500">*</span>
      </label>
      <p>{formData.gender || "-"}</p>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Patient Type <span className="text-red-500">*</span>
      </label>
      <p>{formData.patientType || "-"}</p>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Referred By
      </label>
      <p>{formData.referredBy || "-"}</p>
    </div>

  </div>
</div>

<div className="bg-green-50 rounded-lg p-6 border border-green-200">
  <h2 className="text-lg font-semibold text-gray-700 mb-4">Medical Details</h2>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* Doctor */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Doctor <span className="text-red-500">*</span>
      </label>
      <p>{formData.doctor || "-"}</p>
    </div>

    {/* Service */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Service <span className="text-red-500">*</span>
      </label>
      <p>{formData.service || "-"}</p>
    </div>

    {/* Conditional Package */}
    {formData.service === "Package" && (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Package <span className="text-red-500">*</span>
        </label>
        <p>{formData.package || "-"}</p>
      </div>
    )}

    {/* Conditional Treatment */}
    {formData.service === "Treatment" && (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Treatment <span className="text-red-500">*</span>
        </label>
        <p>{formData.treatment || "-"}</p>
      </div>
    )}

  </div>
  
</div>


          {/* Payment Section */}
   
 <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200 mt-6">
  <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
    <DollarSign className="w-5 h-5 text-yellow-600" />
    Payment Details
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* Amount */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Amount <span className="text-red-500">*</span>
      </label>
      <input
        type="number"
        name="amount"
        value={formData.amount || ""}
        onChange={handlePaymentChange}
        placeholder="0.00"
        step="0.01"
        min="0"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </div>

    {/* Paid */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Paid</label>
      <input
        type="number"
        name="paid"
        value={formData.paid || ""}
        onChange={handlePaymentChange}
        placeholder="0.00"
        step="0.01"
        min="0"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </div>

    {/* Advance */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Advance</label>
      <input
        type="number"
        name="advance"
        value={formData.advance || ""}
        onChange={handlePaymentChange}
        placeholder="0.00"
        step="0.01"
        min="0"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </div>

    {/* Pending (Auto) */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Pending (Auto)</label>
      <input
        type="text"
        value={`₹ ${calculatedFields.pending.toFixed(2)}`}
        disabled
        className="w-full px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-400 rounded-lg text-gray-900 font-bold cursor-not-allowed"
      />
    </div>

    {/* Need to Pay (Auto) */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Need to Pay (Auto)</label>
      <input
        type="text"
        value={`₹ ${calculatedFields.needToPay.toFixed(2)}`}
        disabled
        className="w-full px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-400 rounded-lg text-gray-900 font-bold cursor-not-allowed"
      />
    </div>

    {/* Payment Method */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Payment Method <span className="text-red-500">*</span>
      </label>
      <select
        name="paymentMethod"
        value={formData.paymentMethod || ""}
        onChange={handlePaymentChange}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      >
        <option value="">Select payment method</option>
        {paymentMethods.map((method, idx) => (
          <option key={idx} value={method}>
            {method}
          </option>
        ))}
      </select>
    </div>
  </div>

  {/* Update Button */}
  <div className="flex justify-end pt-4">
    <button
      type="button"
      onClick={handleUpdatePayment}
      className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold shadow-lg"
    >
      Update Payment
    </button>
  </div>
</div>




  <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
  <h2 className="text-lg font-semibold text-gray-700 mb-4">Insurance Details</h2>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* Insurance */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Insurance</label>
      <p>{formData.insurance || "-"}</p>
    </div>

    {formData.insurance === "Yes" && (
      <>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Advance Given Amount
          </label>
          <p>{formData.advanceGivenAmount != null ? `₹ ${formData.advanceGivenAmount.toFixed(2)}` : "-"}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Co-Pay %</label>
          <p>{formData.coPayPercent != null ? `${formData.coPayPercent}%` : "-"}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Need to Pay Amount (Auto)</label>
          <p>{calculatedFields.needToPay != null ? `₹ ${calculatedFields.needToPay.toFixed(2)}` : "-"}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Advance Claim Status</label>
          <p
            className={`px-4 py-2 rounded-lg font-semibold inline-block ${
              formData.advanceClaimStatus === "Released"
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {formData.advanceClaimStatus || "-"}
          </p>
        </div>

        {(formData.advanceClaimReleaseDate || formData.advanceClaimReleasedBy) && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Advance Claim Release Date (Auto)
              </label>
              <p>
                {formData.advanceClaimReleaseDate
                  ? new Date(formData.advanceClaimReleaseDate).toLocaleString()
                  : "-"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Advance Claim Released By (Auto)
              </label>
              <p>{formData.advanceClaimReleasedBy || "-"}</p>
            </div>
          </>
        )}
      </>
    )}
  </div>
</div>


        </div>
      </div>
    </div>
  );
};

export default InvoiceUpdateSystem;
