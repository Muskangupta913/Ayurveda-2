// import dbConnect from '../../../lib/database';
// import Lead from '../../../models/Lead';
// import { getUserFromReq, requireRole } from '../lead-ms/auth';   

// export default async function handler(req, res) {
//   await dbConnect();

//   if (req.method !== "PUT") {
//     return res.status(405).json({ message: "Method not allowed" });
//   }

//   try {
//     const user = await getUserFromReq(req);
//     if (!requireRole(user, ["agent"])) {
//       return res.status(403).json({ message: "Access denied" });
//     }

//     const { leadId, text, nextFollowUp } = req.body;
//     if (!leadId || !text) {
//       return res.status(400).json({ message: "leadId and text are required" });
//     }

//     const lead = await Lead.findById(leadId);
//     if (!lead) return res.status(404).json({ message: "Lead not found" });

//     // ✅ Append note
//     lead.notes.push({
//       text,
//       addedBy: user._id,
//       createdAt: new Date(),
//     });

//     // ✅ If nextFollowUp is provided, push to nextFollowUps array
//     if (nextFollowUp) {
//       lead.nextFollowUps.push({
//         date: new Date(nextFollowUp), // store full date & time
//       });
//     }

//     await lead.save();
//     return res.status(200).json({ success: true, lead });

//   } catch (error) {
//     console.error("Error updating note & followUp:", error);
//     return res.status(500).json({ success: false, message: "Server Error" });
//   }
// }
