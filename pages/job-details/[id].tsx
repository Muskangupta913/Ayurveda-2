// pages/job-listings/[id].js

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

  const shouldApplyAfterLogin = useRef(false); // Track if apply was attempted

  // Load job details
  useEffect(() => {
    if (id) {
      axios.get(`/api/job-postings/all?jobId=${id}`)
        .then(res => setJob(res.data.jobs[0]))
        .catch(console.error);
    }
  }, [id]);

  // Retry apply if user logged in after showing modal
  useEffect(() => {
    if (isAuthenticated && shouldApplyAfterLogin.current) {
      shouldApplyAfterLogin.current = false;
      handleApply(); // Retry apply
    }
  }, [isAuthenticated]);

  const handleApply = async () => {
    if (!isAuthenticated) {
      setAuthModalMode("login");
      setShowAuthModal(true);
      shouldApplyAfterLogin.current = true;
      return;
    }

    try {
      await axios.post('/api/job-postings/apply', {
        jobId: job._id,
        applicantId: user._id,
        applicantInfo: {
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        }
      });

      alert("Successfully applied!");
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Try again.");
    }
  };

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
        <p><strong>Qualification Required:</strong> {job.qualification}</p>
        <p><strong>Timing:</strong> {job.jobTiming}</p>
        <p><strong>Skills:</strong> {job.skills.join(", ")}</p>
        <p><strong>Perks:</strong> {job.perks.join(", ")}</p>
        <p><strong>Languages:</strong> {job.languagesPreferred.join(", ")}</p>
        <p><strong>Description:</strong> {job.description}</p>
      </div>

      <button
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        onClick={handleApply}
      >
        Apply Job
      </button>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="ml-4 inline-block bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
      >
        Share via WhatsApp
      </a>

      {/* Auth Modal Render */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            // handleApply will retry via useEffect
          }}
          initialMode={authModalMode}
        />
      )}
    </div>
  );
};

export default JobDetail;
