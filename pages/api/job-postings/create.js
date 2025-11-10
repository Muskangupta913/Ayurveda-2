// pages/api/job-postings/create.js
import dbConnect from '../../../lib/database';
import JobPosting from '../../../models/JobPosting';
import Clinic from '../../../models/Clinic';
import { getUserFromReq, requireRole } from '../lead-ms/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader("Allow", ["POST"]);
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

    // ✅ Check permission for creating jobs (only for clinic, admin bypasses)
    if (me.role !== "admin" && clinicId) {
      const { checkClinicPermission } = await import("../lead-ms/permissions-helper");
      const { hasPermission, error } = await checkClinicPermission(
        clinicId,
        "jobs",
        "create",
        "Job Posting" // Check "Job Posting" submodule permission
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: error || "You do not have permission to create jobs"
        });
      }
    }

    const newJob = await JobPosting.create({
      ...req.body,
      postedBy: me._id,
      role: me.role,
      status: 'pending',
    });

    res.status(201).json({ success: true, job: newJob });
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}
