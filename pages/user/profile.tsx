import { useEffect, useState } from "react";
import axios from "axios";

const AppliedJobs = () => {
  const [appliedJobs, setAppliedJobs] = useState([]);

  useEffect(() => {
    const fetchAppliedJobs = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await axios.get("/api/users/applied-jobs", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setAppliedJobs(response.data);
      } catch (error) {
        console.error("Failed to fetch applied jobs", error);
      }
    };

    fetchAppliedJobs();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Jobs You've Applied To</h2>

      {appliedJobs.length === 0 ? (
        <p>No applications yet.</p>
      ) : (
        appliedJobs.map((application) => {
          const job = application.jobId;
          const applicant = application.applicantInfo;

          return (
            <div
              key={application._id}
              className="border p-4 mb-6 rounded shadow-md bg-white"
            >
              {/* Job Information */}
              <h3 className="text-2xl font-semibold mb-1">
  {job.jobTitle}{" "}
  {!job.isActive && (
    <span className="text-sm text-red-600 font-normal">(Job Expired)</span>
  )}
</h3>

              <p className="text-gray-700 mb-2">
                {job.companyName} • {job.location}
              </p>

              <p className="text-sm mb-2"><strong>Salary:</strong> {job.salary}</p>
              <p className="text-sm mb-2"><strong>Job Type:</strong> {job.jobType}</p>
              <p className="text-sm mb-2"><strong>Qualification:</strong> {job.qualification}</p>
              <p className="text-sm mb-2"><strong>Department:</strong> {job.department}</p>
              <p className="text-sm mb-2"><strong>Working Days:</strong> {job.workingDays}</p>
              <p className="text-sm mb-2"><strong>Timing:</strong> {job.jobTiming}</p>
              <p className="text-sm mb-2"><strong>Establishment:</strong> {job.establishment}</p>
              <p className="text-sm mb-2"><strong>Languages Preferred:</strong> {job.languagesPreferred.join(", ")}</p>
              <p className="text-sm mb-2"><strong>Perks:</strong> {job.perks.join(", ")}</p>
              <p className="text-sm mb-2"><strong>Skills:</strong> {job.skills.join(", ")}</p>

              <p className="text-sm text-gray-600 mt-2"><strong>Description:</strong> {job.description}</p>

              {/* Application Info */}
              <div className="mt-4 bg-gray-50 p-3 rounded">
                <p className="text-sm"><strong>Status:</strong> {application.status}</p>
                <p className="text-sm"><strong>Applied On:</strong> {new Date(application.createdAt).toLocaleDateString()}</p>
              </div>

              {/* Applicant Info */}
              <div className="mt-4 border-t pt-3 text-sm text-gray-700">
                <p><strong>Applicant:</strong> {applicant.name}</p>
                <p><strong>Email:</strong> {applicant.email}</p>
                <p><strong>Phone:</strong> {applicant.phone}</p>
                <p><strong>Role:</strong> {applicant.role}</p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default AppliedJobs;
