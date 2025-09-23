// // /pages/api/lead/reassign-lead.js
// import dbConnect from "../../../lib/database";
// import Lead from "../../../models/Lead";
// import User from "../../../models/Users";
// import Clinic from "../../../models/Clinic"; // ✅ import Clinic
// import Treatment from "../../../models/Treatment";
// import { getUserFromReq, requireRole } from "./auth";

// export default async function handler(req, res) {
//   await dbConnect();

//   const user = await getUserFromReq(req);
//   if (!requireRole(user, ["clinic"])) {
//     return res.status(403).json({ message: "Access denied" });
//   }

//   if (req.method === "POST") {
//     try {
//       const { leadId, agentIds, followUpDate } = req.body;

//       if (!leadId || !agentIds || (Array.isArray(agentIds) && agentIds.length === 0)) {
//         return res.status(400).json({ message: "LeadId and agentIds required" });
//       }

//       const agentsArray = Array.isArray(agentIds) ? agentIds : [agentIds];

//       // ✅ Fetch clinic for this user
//       const clinic = await Clinic.findOne({ owner: user._id }).select("_id");
//       if (!clinic) {
//         return res.status(400).json({ success: false, message: "Clinic not found for this user" });
//       }

//       // Build update object
//       const updateData = {
//         $push: {
//           assignedTo: {
//             $each: agentsArray.map((id) => ({ user: id, assignedAt: new Date() })),
//           },
//         },
//       };

//       if (followUpDate) {
//         updateData.$push.followUps = { $each: [{ date: new Date(followUpDate) }] };
//       }

//       // ✅ Ensure we filter by clinicId (not user._id)
//       const updatedLead = await Lead.findOneAndUpdate(
//         { _id: leadId, clinicId: clinic._id },
//         updateData,
//         { new: true }
//       )
//         .populate("assignedTo.user", "name email")
//         .populate("treatments.treatment", "name")
//         .lean();

//       if (!updatedLead) {
//         return res.status(404).json({ success: false, message: "Lead not found for this clinic" });
//       }

//       return res.status(200).json({
//         success: true,
//         message: "Lead updated successfully",
//         lead: updatedLead,
//       });
//     } catch (err) {
//       console.error("Error updating lead:", err);
//       return res.status(500).json({ success: false, message: "Failed to update lead" });
//     }
//   }

//   return res.status(405).json({ message: "Method not allowed" });
// }
