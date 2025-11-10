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
    if (!me || !requireRole(me, ["clinic", "agent", "admin"])) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { leadId } = req.body;
    if (!leadId) {
      return res.status(400).json({ success: false, message: "leadId is required" });
    }

    // ✅ First, get the lead to determine which clinic it belongs to
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    // Determine the clinic for the user
    let clinic;
    if (me.role === "clinic") {
      clinic = await Clinic.findOne({ owner: me._id });
      // Ensure the lead belongs to this clinic
      if (lead.clinicId.toString() !== clinic._id.toString()) {
        return res.status(403).json({ success: false, message: "Not allowed to access this lead" });
      }
    } else if (me.role === "agent") {
      if (!me.clinicId) {
        return res.status(403).json({ success: false, message: "Agent not linked to any clinic" });
      }
      clinic = await Clinic.findById(me.clinicId);
      // Ensure the lead belongs to this clinic
      if (lead.clinicId.toString() !== clinic._id.toString()) {
        return res.status(403).json({ success: false, message: "Not allowed to access this lead" });
      }
    } else if (me.role === "admin") {
      // Admin can delete any lead
      clinic = await Clinic.findById(lead.clinicId);
      if (!clinic) {
        return res.status(404).json({ success: false, message: "Clinic not found" });
      }
    }

    if (!clinic) {
      return res.status(404).json({ success: false, message: "Clinic not found for this user" });
    }

    // ✅ Check permission for deleting leads (only for clinic and agent, admin bypasses)
    if (me.role !== "admin") {
      const { checkClinicPermission } = await import("./permissions-helper");
      const { hasPermission, error } = await checkClinicPermission(
        clinic._id,
        "lead",
        "delete"
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: error || "You do not have permission to delete leads"
        });
      }
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
