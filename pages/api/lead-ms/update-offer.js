// // File: /pages/api/lead-ms/update-offer.js
// import dbConnect from "../../../lib/database";
// import Offer from "../../../models/CreateOffer";
// import Treatment from "../../../models/Treatment";
// import { getUserFromReq, requireRole } from "./auth";
// import mongoose from "mongoose";

// export default async function handler(req, res) {
//   await dbConnect();

//   try {
//     const user = await getUserFromReq(req);
//     if (!user)
//       return res.status(401).json({ success: false, message: "User not authenticated" });

//     if (!requireRole(user, ["clinic"]))
//       return res.status(403).json({ success: false, message: "Access denied" });

//     const { id } = req.query;
//     if (!id || !mongoose.Types.ObjectId.isValid(id))
//       return res.status(400).json({ success: false, message: "Valid offerId is required" });

//     // 🔹 GET: Fetch offer by ID for update form
//     if (req.method === "GET") {
//       const offer = await Offer.findById(id).lean();
//       if (!offer) return res.status(404).json({ success: false, message: "Offer not found" });

//       // Fetch parent treatments
//       const treatments = await Treatment.find({ _id: { $in: offer.treatments } })
//         .select("name slug subcategories duration price")
//         .lean();

//       // Map treatments into frontend format and merge subTreatments
//       const mappedTreatments = treatments.map((t) => {
//         const relatedSubTreatments =
//           offer.subTreatments
//             ?.filter((st) => st.treatmentId.toString() === t._id.toString())
//             .map((st) => ({
//               name: st.name,
//               slug: st.slug,
//               price: st.price || null,
//             })) || [];

//         return {
//           mainTreatment: t.name,
//           mainTreatmentSlug: t.slug,
//           duration: t.duration || null,
//           subTreatments: relatedSubTreatments,
//         };
//       });

//       return res.status(200).json({
//         success: true,
//         offer: {
//           ...offer,
//           treatments: mappedTreatments,
//         },
//       });
//     }

//     // 🔹 PUT: Update existing offer
//     if (req.method === "PUT") {
//       const data = req.body;
//       const offer = await Offer.findById(id);
//       if (!offer) return res.status(404).json({ success: false, message: "Offer not found" });

//       let treatmentIds = [];
//       let subTreatments = [];

//       if (Array.isArray(data.treatments) && data.treatments.length > 0) {
//         for (const item of data.treatments) {
//           let treatment = null;

//           if (mongoose.Types.ObjectId.isValid(item)) {
//             treatment = await Treatment.findById(item);
//           } else {
//             const slug = typeof item === "string" ? item : item.slug;
//             if (slug) {
//               treatment = await Treatment.findOne({
//                 $or: [{ slug }, { "subcategories.slug": slug }],
//               });
//             }
//           }

//           if (!treatment) {
//             return res.status(400).json({
//               success: false,
//               message: `Treatment not found: ${JSON.stringify(item)}`,
//             });
//           }

//           // Parent match
//           if (treatment.slug === (typeof item === "string" ? item : item.slug)) {
//             treatmentIds.push(treatment._id);
//           }

//           // Subcategory match
//           if (treatment.subcategories && treatment.subcategories.length > 0) {
//             const sub = treatment.subcategories.find(
//               (s) => s.slug === (typeof item === "string" ? item : item.slug)
//             );
//             if (sub) {
//               treatmentIds.push(treatment._id); // ensure parent is included
//               subTreatments.push({
//                 treatmentId: treatment._id,
//                 slug: sub.slug,
//                 name: sub.name,
//                 price: sub.price || null,
//               });
//             }
//           }
//         }

//         // Remove duplicate parent treatment IDs
//         treatmentIds = Array.from(new Set(treatmentIds.map((id) => id.toString()))).map(
//           (id) => new mongoose.Types.ObjectId(id)
//         );
//       }

//       // Update offer fields
//       offer.title = data.title ?? offer.title;
//       offer.description = data.description ?? offer.description;
//       offer.type = data.type ?? offer.type;
//       offer.value = data.value !== undefined ? Number(data.value) : offer.value;
//       offer.currency = data.currency ?? offer.currency;
//       offer.code = data.code ?? offer.code;
//       offer.slug = data.slug ?? offer.slug;
//       offer.startsAt = data.startsAt ? new Date(data.startsAt) : offer.startsAt;
//       offer.endsAt = data.endsAt ? new Date(data.endsAt) : offer.endsAt;
//       offer.timezone = data.timezone ?? offer.timezone;
//       offer.maxUses = data.maxUses !== undefined ? Number(data.maxUses) : offer.maxUses;
//       offer.perUserLimit = data.perUserLimit !== undefined ? Number(data.perUserLimit) : offer.perUserLimit;
//       offer.channels = data.channels ?? offer.channels;
//       offer.utm = data.utm ?? offer.utm;
//       offer.conditions = data.conditions ?? offer.conditions;
//       offer.status = data.status ?? offer.status;

//       if (treatmentIds.length > 0) offer.treatments = treatmentIds;
//       if (subTreatments.length > 0) offer.subTreatments = subTreatments;

//       offer.updatedBy = user._id;
//       offer.updatedAt = new Date();

//       await offer.save();

//       return res.status(200).json({ success: true, offer });
//     }

//     return res.status(405).json({ success: false, message: "Method not allowed" });
//   } catch (err) {
//     console.error("Error in update-offer:", err);
//     return res.status(500).json({ success: false, message: err.message || "Server error" });
//   }
// }
