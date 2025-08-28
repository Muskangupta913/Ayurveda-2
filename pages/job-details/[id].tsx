import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "../../components/AuthModal";

const JobDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user, isAuthenticated } = useAuth();
  const [job, setJob] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("login");
  const [resumeFile, setResumeFile] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);

  const shouldApplyAfterLogin = useRef(false);

  // Load job details
  useEffect(() => {
    if (id) {
      axios.get(`/api/job-postings/all?jobId=${id}`)
        .then(res => setJob(res.data.jobs[0]))
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

  const handleApply = async () => {
    if (!isAuthenticated) {
      setAuthModalMode("login");
      setShowAuthModal(true);
      shouldApplyAfterLogin.current = true;
      return;
    }

    if (!resumeFile) {
      alert("Please upload your resume before applying.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("jobId", job._id);
      formData.append("applicantId", user._id);
      formData.append("name", user.name);
      formData.append("email", user.email);
      formData.append("phone", user.phone);
      formData.append("role", user.role);
      formData.append("resume", resumeFile);

      await axios.post('/api/job-postings/apply', formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      alert("Successfully applied with resume!");
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Try again.");
    }
  };


  useEffect(() => {
  if (id && user?._id) {
    axios
      .get(`/api/job-postings/checkApplication?jobId=${id}&applicantId=${user._id}`)
      .then(res => setHasApplied(res.data.applied))
      .catch(console.error);
  }
}, [id, user]);

if (!job) return <p>Loading...</p>;

const shareLink = typeof window !== "undefined" && window.location.href;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `Check out this job: *${job.jobTitle}* at *${job.companyName}*\n${shareLink}`
  )}`;
  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2">{job.jobTitle}</h1>
      <p className="text-gray-700 mb-1">{job.companyName} • {job.location} • {job.salary}</p>
      <p className="text-gray-500 mb-4">Posted on {new Date(job.createdAt).toLocaleDateString()}</p>

      <div className="mb-4 space-y-2">
        <p><strong>Job Type:</strong> {job.jobType}</p>
        <p><strong>Industry Type:</strong> {job.department}</p>
        <p><strong>Working Days:</strong> {job.workingDays}</p>
        <p><strong>No of openings:</strong> {job.noOfOpenings}</p>
        <p><strong>Establishment:</strong> {job.establishment}</p>
        <p><strong>Experience Required:</strong> {job.experience}</p>
        <p><strong>Qualification Required:</strong> {job.qualification}</p>
        <p><strong>Timing:</strong> {job.jobTiming}</p>
        <p><strong>Skills:</strong> {job.skills.join(", ")}</p>
        <p><strong>Perks:</strong> {job.perks.join(", ")}</p>
        <p><strong>Languages:</strong> {job.languagesPreferred.join(", ")}</p>
        <p><strong>Description:</strong> {job.description}</p>
      </div>

      {/* Resume Upload */}
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Upload Resume:</label>
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => setResumeFile(e.target.files[0])}
          className="border p-2 rounded w-full"
        />
      </div>

     <button
  className={`px-4 py-2 rounded text-white ${
    hasApplied
      ? "bg-gray-500 cursor-not-allowed"
      : "bg-green-600 hover:bg-green-700"
  }`}
  onClick={!hasApplied ? handleApply : undefined}
  disabled={hasApplied}
>
  {hasApplied ? "Applied" : "Apply Job"}
</button>


      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="ml-4 inline-block bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
      >
        Share via WhatsApp
      </a>

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
