//assign-lead2
import dbConnect from "../../../lib/database";
import User from "../../../models/Users"; // agents live here
import { getUserFromReq, requireRole } from "./auth";
import Clinic from "../../../models/Clinic";

export default async function handler(req, res) {
  await dbConnect();

  const user = await getUserFromReq(req);

  const me = await getUserFromReq(req);
    if (!requireRole(me, ["clinic"])) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
  const clinic = await Clinic.findOne({ owner: me._id });
    if (!clinic) {
      return res.status(400).json({ success: false, message: "Clinic not found for this user" });
    }

  if (req.method === "GET") {
    try {
      // ✅ fetch only agents that belong to this clinic
      const agents = await User.find({
        role: "agent",
         isApproved: true, // ✅ only approved
        declined: false,
        clinicId: clinic._id, // match current logged-in clinic
      }).select("name email  clinicId ");

      return res.status(200).json({ users: agents });
    } catch (err) {
      console.error("Error fetching agents:", err);
      return res.status(500).json({ message: "Failed to fetch agents" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
