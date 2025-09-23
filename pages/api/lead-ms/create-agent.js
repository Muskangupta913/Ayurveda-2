// import dbConnect from "../../../lib/database";
// import User from "../../../models/Users";
// import Clinic from "../../../models/Clinic";   // ✅ import Clinic model
// import { getUserFromReq, requireRole } from "../lead-ms/auth";
// import bcrypt from "bcryptjs";

// export default async function handler(req, res) {
//   if (req.method !== "POST") {
//     return res
//       .status(405)
//       .json({ success: false, message: "Method not allowed" });
//   }

//   await dbConnect();
//   const me = await getUserFromReq(req);

//   // Only clinic owners can create agents
//   if (!me || !requireRole(me, ["clinic"])) {
//     return res.status(403).json({ success: false, message: "Access denied" });
//   }

//   const { name, email, phone, password } = req.body;
//   if (!name || !email || !phone || !password) {
//     return res
//       .status(400)
//       .json({ success: false, message: "Missing required fields" });
//   }

//   try {
//     // ✅ Find clinic owned by the logged-in user
//     const clinic = await Clinic.findOne({ owner: me._id });
//     if (!clinic) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Clinic not found for this user" });
//     }

//     // Check if agent already exists for this clinic
//     const existing = await User.findOne({
//       email,
//       role: "agent",
//       clinicId: clinic._id,
//     });
//     if (existing) {
//       return res.status(400).json({
//         success: false,
//         message: "Agent already exists for this clinic",
//       });
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // ✅ Tie agent to clinic._id instead of user._id
//     const agent = await User.create({
//       name,
//       email,
//       phone,
//       password: hashedPassword,
//       role: "agent",
//       clinicId: clinic._id,
//       isApproved: true,
//       declined: false,
//     });

//     return res.status(201).json({
//       success: true,
//       agent: {
//         _id: agent._id,
//         name: agent.name,
//         email: agent.email,
//         phone: agent.phone,
//         clinicId: agent.clinicId, // ✅ correct clinicId
//       },
//     });
//   } catch (err) {
//     console.error("Error creating agent:", err);
//     return res
//       .status(500)
//       .json({ success: false, message: "Internal Server Error" });
//   }
// }
