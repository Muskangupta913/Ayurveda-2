// pages/marketingalltype/sms-marketing.jsx
import { useState } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import DOMPurify from "dompurify";
import ClinicLayout from "../../components/ClinicLayout";
import withClinicAuth from "../../components/withClinicAuth";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

// Helper to strip HTML tags
const stripHtml = (html) => {
  return html.replace(/<[^>]*>?/gm, "").trim();
};

const SmsSender = () => {
  const [mode, setMode] = useState("single");
  const [singleNumber, setSingleNumber] = useState("");
  const [bulkNumbers, setBulkNumbers] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [results, setResults] = useState([]);

  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  // Image Upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        setImageUrl(data.secure_url);
        setStatus("✅ Image uploaded successfully!");
      } else {
        setStatus("❌ Failed to upload image");
      }
    } catch (err) {
      console.error(err);
      setStatus("❌ Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  // Submit Handler
  const handleSubmit = async () => {
    setLoading(true);
    setStatus("");
    setResults([]);

    try {
      const cleanDescription = stripHtml(DOMPurify.sanitize(description));

      // Get token if needed
      const token = localStorage.getItem("clinicToken");
      if (!token) {
        setStatus("❌ No authentication token found");
        setLoading(false);
        return;
      }

      const recipients =
        mode === "single"
          ? [singleNumber]
          : bulkNumbers
              .split(",")
              .map((num) => num.trim())
              .filter((num) => /^\+?\d{10,15}$/.test(num));

      if (recipients.length === 0) {
        setStatus("❌ No valid recipient numbers provided");
        setLoading(false);
        return;
      }

      const payload = {
        body: cleanDescription,
        title: title || "Special Offer",
        validUntil: validUntil || undefined,
        mediaUrl: imageUrl || undefined,
        to: recipients,
      };

      const res = await axios.post("/api/marketing/sms-send", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setStatus(`✅ Messages sent successfully!`);
        setResults(res.data.data);
      } else {
        setStatus("❌ Failed: " + (res.data.error || "Unknown error"));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setStatus("❌ Error: " + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
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
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 rounded-full"></div>
        </div>

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
            </div>
          </div>

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
                  </div>
                )}

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
              </div>

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