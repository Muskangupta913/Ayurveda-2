// /pages/lead/assign-lead.js
import dbConnect from "../../../lib/database";
import Lead from "../../../models/Lead";
import { getUserFromReq, requireRole } from "./auth";

export default async function handler(req, res) {
  await dbConnect();

  const user = await getUserFromReq(req);
  if (!requireRole(user, ["lead"])) {
    return res.status(403).json({ message: "Access denied" });
  }

  if (req.method === "POST") {
    try {
      const { leadId, agentId } = req.body;

      if (!leadId || !agentId) {
        return res.status(400).json({ message: "LeadId and AgentId required" });
      }

      const lead = await Lead.findByIdAndUpdate(
        leadId,
        { assignedTo: agentId },
        { new: true }
      ).populate("assignedTo", "name email");

      return res
        .status(200)
        .json({ success: true, message: "Lead assigned successfully", lead });
    } catch (err) {
      console.error("Error assigning lead:", err);
      return res.status(500).json({ message: "Failed to assign lead" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
