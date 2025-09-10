// api/leadFilter/leads.js
import dbConnect from "../../../lib/database";
import Lead from "../../../models/Lead";
import { getUserFromReq, requireRole } from "./auth";

export default async function handler(req, res) {
  await dbConnect();

  const user = await getUserFromReq(req);
  if (!requireRole(user, ["lead"])) {
    return res.status(403).json({ message: "Access denied" });
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

      const filter = {};

      if (treatment) filter.treatments = treatment;
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
    path: "assignedTo.user", // populate nested user
    model: "User",
    select: "name role email",
  })
  .populate({
    path: "notes.addedBy", // optional, to show who added the note
    model: "User",
    select: "name",
  })
  .lean();

      return res.status(200).json({ success: true, leads });
    } catch (err) {
      console.error("Error fetching leads:", err);
      return res.status(500).json({ message: "Failed to fetch leads" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
