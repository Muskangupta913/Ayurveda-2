// pages/api/job-postings/my-jobs.js
import dbConnect from '../../../lib/database';
import JobPosting from '../../../models/JobPosting';
import Clinic from '../../../models/Clinic';
import { getUserFromReq, requireRole } from '../lead-ms/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

    // ✅ Check permission for reading jobs (only for clinic, admin bypasses)
    if (me.role !== "admin" && clinicId) {
      const { checkClinicPermission } = await import("../lead-ms/permissions-helper");
      const { hasPermission, error } = await checkClinicPermission(
        clinicId,
        "jobs",
        "read",
        "See All Jobs" // Check "See All Jobs" submodule permission
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: error || "You do not have permission to view jobs"
        });
      }
    }

    const jobs = await JobPosting.find({ postedBy: me._id }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, jobs });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
