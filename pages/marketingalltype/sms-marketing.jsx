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
            </div>
          </div>
        </div>

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
              </div>
            </div>
          </section>

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
