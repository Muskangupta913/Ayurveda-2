// pages/api/job-postings/job-applications.js
import dbConnect from "../../../lib/database";
import JobApplication from "../../../models/JobApplication";
import JobPosting from "../../../models/JobPosting";
import Clinic from "../../../models/Clinic";
import { getUserFromReq, requireRole } from '../lead-ms/auth';

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  await dbConnect();

  try {
    const me = await getUserFromReq(req);
    if (!me || !requireRole(me, ["clinic", "admin"])) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // ✅ Resolve clinicId correctly
    let clinicId;
    if (me.role === "clinic") {
      const clinic = await Clinic.findOne({ owner: me._id }).select("_id");
      if (!clinic) {
        return res.status(404).json({ success: false, message: "Clinic not found for this user" });
      }
      clinicId = clinic._id;
    }

    // ✅ Check permission for reading job applications (only for clinic, admin bypasses)
    if (me.role !== "admin" && clinicId) {
      const { checkClinicPermission } = await import("../lead-ms/permissions-helper");
      const { hasPermission, error } = await checkClinicPermission(
        clinicId,
        "jobs",
        "read",
        "See Job Applicants" // Check "See Job Applicants" submodule permission
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: error || "You do not have permission to view job applicants"
        });
      }
    }

    // Get jobs posted by this user
    const postedJobs = await JobPosting.find({ postedBy: me._id }).select("_id");
    const jobIds = postedJobs.map((job) => job._id);

    // Fetch applications
    const applications = await JobApplication.find({ jobId: { $in: jobIds } })
      .populate("jobId", "jobTitle location jobType")
      .populate("applicantId", "name email phone role")
      .select("jobId applicantId resume status createdAt updatedAt");

    // Correct resume URL handling
    const formattedApps = applications.map((app) => {
      let resumeUrl = null;
      if (app.resume) {
        resumeUrl = app.resume.startsWith("http")
          ? app.resume
          : `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}${app.resume}`;
      }
      return {
        ...app.toObject(),
        resumeUrl,
      };
    });

    res.status(200).json({ success: true, applications: formattedApps });
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}
