// /pages/api/lead-ms/leadFilter.js
import dbConnect from "../../../lib/database";
import Lead from "../../../models/Lead";
import Clinic from "../../../models/Clinic";
import { getUserFromReq, requireRole } from "./auth";

export default async function handler(req, res) {
  await dbConnect();

  const me = await getUserFromReq(req);
  if (!requireRole(me, ["clinic", "agent"])) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  // ✅ Resolve clinicId based on role
  let clinic;
  if (me.role === "clinic") {
    clinic = await Clinic.findOne({ owner: me._id });
  } else if (me.role === "agent") {
    if (!me.clinicId) {
      return res.status(403).json({ success: false, message: "Agent not linked to any clinic" });
    }
    clinic = await Clinic.findById(me.clinicId);
  }

  if (!clinic) {
    return res.status(404).json({ success: false, message: "Clinic not found for this user" });
  }

  if (req.method === "GET") {
    try {
      const { treatment, offer, source, status, name, startDate, endDate } = req.query;

      const filter = { clinicId: clinic._id };

      if (treatment) filter["treatments.treatment"] = treatment;
      if (offer) filter.offerTag = offer;
      if (source) filter.source = source;
      if (status) filter.status = status;
      if (name) filter.name = { $regex: name, $options: "i" };
      if (startDate && endDate) {
        filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }

      const leads = await Lead.find(filter)
        .populate({ path: "treatments.treatment", model: "Treatment", select: "name" })
        .populate({ path: "assignedTo.user", model: "User", select: "name role email" })
        .populate({ path: "notes.addedBy", model: "User", select: "name" })
        .lean();

      return res.status(200).json({ success: true, leads });
    } catch (err) {
      console.error("Error fetching leads:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch leads" });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
