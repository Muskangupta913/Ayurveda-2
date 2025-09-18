// /pages/api/lead-ms/leadFilter.js
import dbConnect from "../../../lib/database";
import Lead from "../../../models/Lead";
import Clinic from "../../../models/Clinic";   // ✅ import Clinic
import { getUserFromReq, requireRole } from "./auth";

export default async function handler(req, res) {
  await dbConnect();

  const me = await getUserFromReq(req);
  if (!requireRole(me, ["clinic"])) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  // ✅ resolve clinicId from Clinic collection
  const clinic = await Clinic.findOne({ owner: me._id });
  if (!clinic) {
    return res.status(400).json({ success: false, message: "Clinic not found for this user" });
  }

  if (req.method === "GET") {
    try {
      const {
        treatment,
        offer,
        source,
        status,
        name,
        startDate,
        endDate,
      } = req.query;

      const filter = { clinicId: clinic._id }; // ✅ correct clinicId

      if (treatment) filter["treatments.treatment"] = treatment;
      if (offer) filter.offerTag = offer;
      if (source) filter.source = source;
      if (status) filter.status = status;
      if (name) filter.name = { $regex: name, $options: "i" };
      if (startDate && endDate) {
        filter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      const leads = await Lead.find(filter)
        .populate({
          path: "treatments.treatment",
          model: "Treatment",
          select: "name",
        })
        .populate({
          path: "assignedTo.user",
          model: "User",
          select: "name role email",
        })
        .populate({
          path: "notes.addedBy",
          model: "User",
          select: "name",
        })
        .lean();

      return res.status(200).json({ success: true, leads });
    } catch (err) {
      console.error("Error fetching leads:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch leads" });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
