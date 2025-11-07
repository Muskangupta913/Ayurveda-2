// pages/api/lead-ms/lead-delete.js
import dbConnect from "../../../lib/database";
import Lead from "../../../models/Lead";
import { getUserFromReq, requireRole } from "./auth";
import Clinic from "../../../models/Clinic"; 

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const me = await getUserFromReq(req);
    if (!me || !requireRole(me, ["clinic", "agent"])) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { leadId } = req.body;
    if (!leadId) {
      return res.status(400).json({ success: false, message: "leadId is required" });
    }

    // Determine the clinic for the user
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

    // Delete the lead only if it belongs to the user's clinic
    const deletedLead = await Lead.findOneAndDelete({
      _id: leadId,
      clinicId: clinic._id,
    });

    if (!deletedLead) {
      return res.status(404).json({ success: false, message: "Lead not found or not authorized" });
    }

    return res.status(200).json({
      success: true,
      message: "Lead deleted successfully",
      lead: deletedLead,
    });
  } catch (err) {
    console.error("Error deleting Lead:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}
