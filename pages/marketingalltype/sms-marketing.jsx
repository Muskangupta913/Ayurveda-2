// pages/marketingalltype/sms-marketing.jsx
import { useMemo, useState } from "react";
import axios from "axios";
import DOMPurify from "dompurify";
import ClinicLayout from "../../components/ClinicLayout";
import withClinicAuth from "../../components/withClinicAuth";

const ADD_METHODS = [
  { id: "manual", label: "Enter Manually" },
  { id: "segments", label: "Segments", disabled: true },
  { id: "csv", label: "CSV File", disabled: true },
  { id: "sheet", label: "Connect Google Spreadsheet", disabled: true },
];

const MESSAGE_MODES = [
  { id: "manual", label: "Enter Message Manually" },
  { id: "template", label: "Use SMS Template", disabled: false },
];

const SmsSender = () => {
  const [addMethod, setAddMethod] = useState("manual");
  const [messageMode, setMessageMode] = useState("manual");
  const [numbersInput, setNumbersInput] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [language, setLanguage] = useState("english");
  const [senderId, setSenderId] = useState("776500");
  const [shortUrlEnabled, setShortUrlEnabled] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleTime, setScheduleTime] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const charCount = useMemo(() => messageBody.length, [messageBody]);

  const extractRecipients = () => {
    return numbersInput
      .split(/[\s,\n]+/)
      .map((num) => num.trim())
      .filter((num) => /^\+?\d{10,15}$/.test(num));
  };

  const handleSubmit = async () => {
    setStatus("");
    setResults([]);
    const recipients = extractRecipients();

    if (addMethod !== "manual") {
      setStatus("❌ This import method is not supported yet. Please enter numbers manually.");
      return;
    }

    if (recipients.length === 0) {
      setStatus("❌ Please enter at least one valid mobile number.");
      return;
    }

    if (!messageBody.trim()) {
      setStatus("❌ Message content cannot be empty.");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("clinicToken");

      if (!token) {
        setStatus("❌ No authentication token found.");
        return;
      }

      const cleanBody = DOMPurify.sanitize(messageBody.trim());
      const payload = {
        body: cleanBody,
        title: templateId || "SMS Campaign",
        to: recipients,
        meta: {
          language,
          senderId,
          shortUrlEnabled,
          schedule: scheduleEnabled ? scheduleTime : null,
        },
      };

      const res = await axios.post("/api/marketing/sms-send", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setStatus("✅ Messages queued successfully.");
        setResults(res.data.data || []);
      } else {
        setStatus("❌ Failed: " + (res.data.error || "Unknown error"));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setStatus(`❌ Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-[#f5f7fb] py-8 px-4">
      <div className="mx-auto max-w-4xl bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-8 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Send SMS</p>
              <h1 className="text-2xl font-bold text-slate-900 mt-2">Assigned Leads Broadcast</h1>
              <p className="text-sm text-slate-500 mt-1">Share updates, offers or alerts with your customers directly from one dashboard.</p>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">SMS</div>
=======
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">SMS Marketing</h1>
              <p className="text-gray-600 text-sm">Engage your customers with targeted SMS campaigns</p>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium text-gray-700">SMS Ready</span>
              </div>
>>>>>>> 991b719d0271251d15917545f24af9e4521299fb
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 rounded-full"></div>
        </div>

<<<<<<< HEAD
        <div className="px-8 py-6 space-y-8">
          {/* Add numbers */}
          <section>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.25em] mb-3">Add numbers via</p>
            <div className="flex flex-wrap gap-2">
              {ADD_METHODS.map((method) => (
                <button
                  key={method.id}
                  disabled={method.disabled}
                  onClick={() => setAddMethod(method.id)}
                  className={`px-4 py-2 rounded-full text-sm border ${
                    addMethod === method.id ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200"
                  } ${method.disabled ? "opacity-50 cursor-not-allowed" : "hover:border-blue-300"}`}
                >
                  {method.label}
                </button>
              ))}
=======
        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Mode Toggle */}
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200 p-7">
            <label className="block text-sm font-semibold text-gray-800 mb-3.5">Campaign Type</label>
            <div className="inline-flex rounded-xl bg-white shadow-sm border border-gray-300 p-1">
              <button
                className={`px-7 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                  mode === "single"
                    ? "bg-gradient-to-r from-indigo-600 to-blue-700 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => setMode("single")}
              >
                Single Recipient
              </button>
              <button
                className={`px-7 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                  mode === "bulk"
                    ? "bg-gradient-to-r from-indigo-600 to-blue-700 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => setMode("bulk")}
              >
                Bulk Campaign
              </button>
>>>>>>> 991b719d0271251d15917545f24af9e4521299fb
            </div>
            <div className="mt-4">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Enter Mobile Numbers</label>
              <textarea
                rows={3}
                placeholder="Enter mobile numbers here 91123XXXXXX, 90182XXXXXX, 98102XXXXXX"
                value={numbersInput}
                onChange={(e) => setNumbersInput(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition"
              />
              <p className="text-xs text-rose-500 mt-1">Mobile numbers are required.</p>
            </div>
          </section>

<<<<<<< HEAD
          {/* Message and template */}
          <section className="grid gap-6 lg:grid-cols-[220px,1fr]">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.25em] mb-3">Message (0/0 approx)</p>
              <div className="space-y-2">
                {MESSAGE_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    disabled={mode.disabled}
                    onClick={() => setMessageMode(mode.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg border text-sm ${
                      messageMode === mode.id ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600"
                    } ${mode.disabled ? "opacity-50 cursor-not-allowed" : "hover:border-blue-300"}`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wide mb-1">DLT Template ID</label>
                <input
                  type="text"
                  placeholder="Enter template ID approved on DLT platform"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wide mb-1">Message Content</label>
                <textarea
                  rows={5}
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Enter message here..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition resize-none"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>{charCount} characters</span>
                  <span>{Math.ceil(charCount / 160)} SMS credits</span>
                </div>
              </div>
            </div>
          </section>

          {/* Meta fields */}
          <section className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wide mb-1">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="english">English</option>
                  <option value="hindi">Hindi</option>
                  <option value="marathi">Marathi</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wide mb-1">From</label>
                <input
                  type="text"
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shortUrlEnabled}
                  onChange={(e) => setShortUrlEnabled(e.target.checked)}
                  className="h-4 w-4"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-700">Enable URL Shortener</p>
                  <p className="text-xs text-slate-500">Shorten URLs automatically to save characters.</p>
                </div>
              </label>

              <div className="rounded-xl border border-slate-200 px-4 py-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleEnabled}
                    onChange={(e) => setScheduleEnabled(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Schedule</p>
                    <p className="text-xs text-slate-500">Plan delivery of this message for the future.</p>
=======
          {/* Form Content */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {mode === "single" ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2.5">Recipient Number</label>
                    <input
                      type="text"
                      placeholder="+919876543210"
                      value={singleNumber}
                      onChange={(e) => setSingleNumber(e.target.value)}
                      className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 placeholder:text-gray-500 font-medium"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2.5">
                      Recipient Numbers <span className="text-gray-600 font-normal ml-2">(comma separated)</span>
                    </label>
                    <textarea
                      placeholder="+919876543210, +919812345678"
                      value={bulkNumbers}
                      onChange={(e) => setBulkNumbers(e.target.value)}
                      className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none text-gray-900 placeholder:text-gray-500 font-medium"
                      rows={4}
                    />
>>>>>>> 991b719d0271251d15917545f24af9e4521299fb
                  </div>
                </label>
                {scheduleEnabled && (
                  <input
                    type="datetime-local"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                )}
<<<<<<< HEAD
=======

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2.5">Campaign Title</label>
                  <input
                    type="text"
                    placeholder="e.g., Summer Special Discount"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 placeholder:text-gray-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2.5">Valid Until</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 placeholder:text-gray-500 font-medium"
                  />
                </div>
>>>>>>> 991b719d0271251d15917545f24af9e4521299fb
              </div>
            </div>
          </section>

<<<<<<< HEAD
          {/* Footer actions */}
          <section className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="w-full sm:w-auto px-6 py-3 rounded-full border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
              onClick={() => {
                setNumbersInput("");
                setMessageBody("");
                setTemplateId("");
                setStatus("");
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 rounded-full bg-blue-600 text-white font-semibold shadow-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Review & Send"}
            </button>
          </section>

          {/* Status and results */}
          {status && (
            <div className={`border rounded-xl px-4 py-3 text-sm ${status.includes("✅") ? "border-green-200 bg-green-50 text-green-800" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
              {status}
            </div>
          )}

          {results.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700 mb-3">Delivery Report</p>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {results.map((item, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between text-sm">
                    <span className="font-mono text-xs">{item.to}</span>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        item.status === "success" || item.status === "queued" ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {item.status}
                    </span>
                    {item.error && <span className="text-[11px] text-rose-500 ml-2">({item.error})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
=======
              {/* Right Column */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2.5">Message Content</label>
                  <div className="border border-gray-300 rounded-xl overflow-hidden shadow-sm">
                    <ReactQuill
                      value={description}
                      onChange={setDescription}
                      modules={{ toolbar: [["bold", "italic"], ["link"]] }}
                      theme="snow"
                      placeholder="Write your promotional message here..."
                      className="h-40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2.5">Campaign Image</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer text-gray-700"
                    />
                  </div>
                  {imageUrl && (
                    <div className="mt-4 relative">
                      <img src={imageUrl} alt="Uploaded" className="w-full h-48 object-cover rounded-xl border border-gray-200 shadow-sm" />
                      <button
                        onClick={() => setImageUrl("")}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-10">
              <button
                onClick={handleSubmit}
                disabled={loading || uploading}
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-700 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending Messages...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send SMS Campaign
                  </span>
                )}
              </button>
            </div>

            {/* Status */}
            {status && (
              <div className={`mt-6 p-5 rounded-xl border-2 ${status.includes("✅") ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"} transition-all duration-300`}>
                <p className={`font-semibold ${status.includes("✅") ? "text-emerald-800" : "text-red-800"}`}>{status}</p>
              </div>
            )}

            {/* Results */}
            {results.length > 0 && (
              <div className="mt-8 bg-gray-50 rounded-xl border border-gray-200 p-7 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-5 text-lg flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Delivery Report
                </h3>
                <div className="space-y-3">
                  {results.map((r, idx) => (
                    <div key={idx} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-semibold text-gray-800">{r.to}</span>
                        <span className={`text-xs font-bold px-4 py-1.5 rounded-full ${r.status === "success" || r.status === "queued" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                          {r.status.toUpperCase()}
                        </span>
                      </div>
                      {r.error && <span className="text-xs text-red-600 mt-2 block font-medium">Error: {r.error}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
>>>>>>> 991b719d0271251d15917545f24af9e4521299fb
        </div>
      </div>
    </div>
  );
};

// Layout
SmsSender.getLayout = (page) => <ClinicLayout>{page}</ClinicLayout>;

// Protect and preserve layout
const ProtectedSmsSender = withClinicAuth(SmsSender);
ProtectedSmsSender.getLayout = SmsSender.getLayout;

export default ProtectedSmsSender;