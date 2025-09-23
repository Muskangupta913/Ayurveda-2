// // pages/api/agents/getA.js
// import dbConnect from "../../../lib/database";
// import User from "../../../models/Users";
// import Clinic from "../../../models/Clinic";   // ✅ import Clinic
// import { getUserFromReq, requireRole } from "./auth";

// export default async function handler(req, res) {
//   await dbConnect();

//   const user = await getUserFromReq(req);
//   if (!requireRole(user, ["admin", "clinic"])) {
//     return res.status(403).json({ success: false, message: "Access denied" });
//   }

//   if (req.method === "GET") {
//     try {
//       let query = { role: "agent", isApproved: true };

//       // ✅ If logged-in user is a clinic, fetch only their clinic’s agents
//       if (user.role === "clinic") {
//         const clinic = await Clinic.findOne({ owner: user._id }).select("_id");
//         if (!clinic) {
//           return res.status(400).json({ success: false, message: "Clinic not found for this user" });
//         }
//         query.clinicId = clinic._id; // ✅ use clinicId, not user._id
//       }

//       const agents = await User.find(query).select("_id name email clinicId");

//       return res.status(200).json({ success: true, agents });
//     } catch (err) {
//       console.error("Error fetching agents:", err);
//       return res.status(500).json({ success: false, message: "Failed to fetch agents" });
//     }
//   }

//   return res.status(405).json({ success: false, message: "Method not allowed" });
// }
