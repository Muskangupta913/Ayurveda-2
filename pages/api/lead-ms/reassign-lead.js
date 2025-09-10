// /pages/lead/assign-lead.js
import dbConnect from "../../../lib/database";
import Lead from "../../../models/Lead";
import User from '../../../models/Users';
import Treatment from '../../../models/Treatment';
import { getUserFromReq, requireRole } from "./auth";

export default async function handler(req, res) {
  await dbConnect();

  const user = await getUserFromReq(req);
  if (!requireRole(user, ["lead"])) {
    return res.status(403).json({ message: "Access denied" });
  }

  if (req.method === "POST") {
    try {
      const { leadId, agentIds, followUpDate } = req.body;

      if (!leadId || !agentIds || (Array.isArray(agentIds) && agentIds.length === 0)) {
        return res.status(400).json({ message: "LeadId and agentIds required" });
      }

      const agentsArray = Array.isArray(agentIds) ? agentIds : [agentIds];

      // Build update object
      const updateData = {
        $push: {
          assignedTo: {
            $each: agentsArray.map((id) => ({ user: id, assignedAt: new Date() })),
          },
        },
      };

      if (followUpDate) {
        // Ensure followUps is an array and push new date
        updateData.$push.followUps = { $each: [{ date: new Date(followUpDate) }] };
      }

      // Update lead and populate assignedTo users and treatments
      const updatedLead = await Lead.findByIdAndUpdate(
        leadId,
        updateData,
        { new: true }
      )
        .populate("assignedTo.user", "name email")
        .populate("treatments.treatment", "name")
        .lean();

      return res.status(200).json({
        success: true,
        message: "Lead updated successfully",
        lead: updatedLead,
      });
    } catch (err) {
      console.error("Error updating lead:", err);
      return res.status(500).json({ success: false, message: "Failed to update lead" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
  