import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "../../components/AuthModal";
import { FaWhatsapp, FaShareAlt } from "react-icons/fa";

// Define Job type
interface Job {
  _id: string;
  jobTitle: string;
  companyName: string;
  location: string;
  salary: string;
  salaryType?: string;
  createdAt: string;
  jobType?: string;
  department?: string;
  workingDays?: string;
  noOfOpenings?: number;
  establishment?: string;
  experience?: string;
  qualification?: string;
  jobTiming?: string;
  skills?: string[];
  perks?: string[];
  languagesPreferred?: string[];
  description?: string;
}

// Define User type from AuthContext (adjust if needed)
interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
}

const JobDetail: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user, isAuthenticated } = useAuth() as {
    user: User | null;
    isAuthenticated: boolean;
  };

  const [job, setJob] = useState<Job | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [fileError, setFileError] = useState<string>("");
  const [isApplying, setIsApplying] = useState(false);

  const shouldApplyAfterLogin = useRef(false);

  // Load job details
  useEffect(() => {
    if (id) {
      axios
        .get<{ jobs: Job[] }>(`/api/job-postings/all?jobId=${id}`)
        .then((res) => setJob(res.data.jobs[0]))
        .catch(console.error);
    }
  }, [id]);

  // Retry apply if logged in
  useEffect(() => {
    if (isAuthenticated && shouldApplyAfterLogin.current) {
      shouldApplyAfterLogin.current = false;
      handleApply();
    }
  }, [isAuthenticated]);

  // Check if already applied
  useEffect(() => {
    if (id && user?._id) {
      axios
        .get<{ applied: boolean }>(
          `/api/job-postings/checkApplication?jobId=${id}&applicantId=${user._id}`
        )
        .then((res) => setHasApplied(res.data.applied))
        .catch(console.error);
    }
  }, [id, user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError("");

    if (file) {
      // Validate file size (998 KB = 998 * 1024 bytes)
      const maxSize = 998 * 1024;
      if (file.size > maxSize) {
        setFileError("Upload file Less Than 1 MB");
        setResumeFile(null);
        e.target.value = ""; // Clear the input
        return;
      }

      // Validate file type
      const allowedTypes = ['.pdf', '.doc', '.docx'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedTypes.includes(fileExtension)) {
        setFileError("Please upload PDF, DOC, or DOCX files only");
        setResumeFile(null);
        e.target.value = "";
        return;
      }

      setResumeFile(file);
    }
  };

  const handleApply = async () => {
    if (!isAuthenticated || !user) {
      setAuthModalMode("login");
      setShowAuthModal(true);
      shouldApplyAfterLogin.current = true;
      return;
    }

    if (!resumeFile) {
      setFileError("Please upload your resume before applying.");
      return;
    }

    setIsApplying(true);
    try {
      const formData = new FormData();
      formData.append("jobId", job?._id || "");
      formData.append("applicantId", user._id);
      formData.append("name", user.name);
      formData.append("email", user.email);
      formData.append("phone", user.phone || "");
      formData.append("role", user.role || "");
      formData.append("resume", resumeFile);

      await axios.post("/api/job-postings/apply", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setHasApplied(true);
      alert("Successfully applied with resume!");
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Try again.");
    } finally {
      setIsApplying(false);
    }
  };

  const getDaysAgo = (date: string) => {
    const now = new Date();
    const createdDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day ago";
    if (diffDays < 30) return `${diffDays} days ago`;
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) !== 1 ? 's' : ''} ago`;
  };

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#2D9AA5] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const shareLink = typeof window !== "undefined" ? window.location.href : "";
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `Check out this job: ${job.jobTitle} at ${job.companyName}\n${shareLink}`
  )}`;

 return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border mb-8 p-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-semibold text-gray-900 mb-3">
                {job.jobTitle}
              </h1>
              <div className="flex items-center gap-6 text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium text-[#2D9AA5]">{job.companyName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>{job.location}</span>
                </div>
                <span className="text-gray-500">{getDaysAgo(job.createdAt)}</span>
              </div>
              {job.noOfOpenings && (
                <span className="inline-block bg-[#2D9AA5] text-white px-4 py-1 rounded-full text-sm font-medium">
                  {job.noOfOpenings} openings
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Job Overview */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-1.092a4.535 4.535 0 001.676-.662C13.398 12.766 14 11.991 14 11c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 8.092V6.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-600">Salary</span>
                  </div>
                  <p className="font-semibold text-gray-900">{job.salary} /{job.salaryType}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    <span className="text-sm text-gray-600">Experience</span>
                  </div>
                  <p className="font-semibold text-gray-900">{job.experience}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-600">Working Days</span>
                  </div>
                  <p className="font-semibold text-gray-900">{job.workingDays}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-600">Timing</span>
                  </div>
                  <p className="font-semibold text-gray-900">{job.jobTiming}</p>
                </div>
              </div>
            </div>

            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => (
                    <span key={index} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-md text-sm font-medium border border-blue-100">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {job.description && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{job.description}</p>
              </div>
            )}

            {/* Benefits */}
            {job.perks && job.perks.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Benefits</h2>
                <div className="space-y-2">
                  {job.perks.map((perk, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700 text-sm">{perk}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h2>
              <div className="space-y-4">
                {job.qualification && (
                  <div>
                    <span className="text-gray-600 text-sm font-medium">Education</span>
                    <p className="text-gray-900 mt-1">{job.qualification}</p>
                  </div>
                )}
                {job.languagesPreferred && job.languagesPreferred.length > 0 && (
                  <div>
                    <span className="text-gray-600 text-sm font-medium">Languages</span>
                    <p className="text-gray-900 mt-1">{job.languagesPreferred.join(", ")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">

              {/* Apply Section */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Apply Now</h3>

                {/* Resume Upload */}
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-medium mb-2">Resume/CV *</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#2D9AA5] file:text-white hover:file:bg-[#247a84] cursor-pointer border border-gray-300 rounded-md p-2"
                  />
                  <p className="mt-2 text-xs text-gray-500">PDF, DOC, DOCX (Max 1MB)</p>

                  {fileError && (
                    <div className="mt-2 text-red-600 text-sm flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fileError}
                    </div>
                  )}

                  {resumeFile && !fileError && (
                    <div className="mt-2 text-green-600 text-sm flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {resumeFile.name} ({(resumeFile.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                </div>

                {/* Apply Button */}
                <button
                  className={`w-full py-3 px-4 rounded-md text-sm font-medium transition-colors duration-200 mb-3 ${hasApplied
                    ? "bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-200"
                    : isApplying
                      ? "bg-[#247a84] text-white cursor-wait"
                      : "bg-[#2D9AA5] hover:bg-[#247a84] text-white"
                    }`}
                  onClick={!hasApplied && !isApplying ? handleApply : undefined}
                  disabled={hasApplied || isApplying}
                >
                  {isApplying ? "Applying..." : hasApplied ? "Applied" : "Apply Now"}
                </button>

                {/* Share Button */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  <FaWhatsapp className="w-4 h-4" />
                  Share on WhatsApp
                </a>
              </div>

              {/* Company Info */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Info</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-600 text-sm">Company</span>
                    <p className="text-gray-900 font-medium">{job.companyName}</p>
                  </div>
                  {job.establishment && (
                    <div>
                      <span className="text-gray-600 text-sm">Established</span>
                      <p className="text-gray-900">{job.establishment}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600 text-sm">Location</span>
                    <p className="text-gray-900">{job.location}</p>
                  </div>
                </div>
              </div>

              {/* Job Stats */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Type</span>
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                      {job.jobType || "Not specified"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Department</span>
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                      {job.department || "Not specified"}
                    </span>
                  </div>
                  {job.noOfOpenings && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">Openings</span>
                      <span className="bg-[#2D9AA5] text-white px-2 py-1 rounded text-xs font-medium">
                        {job.noOfOpenings}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Apply Bar */}
      {/* <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="flex gap-3">
          <button
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${hasApplied
              ? "bg-gray-100 text-gray-500 cursor-not-allowed"
              : isApplying
                ? "bg-[#247a84] text-white cursor-wait"
                : "bg-[#2D9AA5] hover:bg-[#247a84] text-white"
              }`}
            onClick={!hasApplied && !isApplying ? handleApply : undefined}
            disabled={hasApplied || isApplying}
          >
            {isApplying ? "Applying..." : hasApplied ? "Applied" : "Apply Now"}
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.109" />
            </svg>
          </a>
        </div>
      </div> */}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
          }}
          initialMode={authModalMode}
        />
      )}
    </div>
  );
};

export default JobDetail;