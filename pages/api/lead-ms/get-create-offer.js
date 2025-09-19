//get-created offer
import dbConnect from "../../../lib/database";
import Offer from "../../../models/CreateOffer";
import Treatment from "../../../models/Treatment";
import { getUserFromReq, requireRole } from "./auth";

export default async function handler(req, res) {
  try {
    await dbConnect();

    if (req.method !== "GET") {
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed" });
    }

    const user = await getUserFromReq(req);
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    if (!requireRole(user, ["clinic"]))
      return res.status(403).json({ success: false, message: "Access denied" });

    const filter = {};
    if (user.role === "clinic") {
  filter.clinicId = user._id; // ✅ fetch only clinic’s own offers
}

    if (user.clinicId) filter.clinicId = user.clinicId;

    // Fetch offers with treatments populated
    const offers = await Offer.find(filter)
      .populate("treatments", "name slug subcategories") // fetch main treatments
      .sort({ createdAt: -1 })
      .lean();

    const shapedOffers = offers.map((offer) => {
      const treatments = (offer.treatments || []).map((t) => ({
        mainTreatment: t.name,
        mainTreatmentSlug: t.slug,
        subTreatments: (t.subcategories || []).map((sub) => {
          const matched = (offer.subTreatments || []).find(
            (st) => st.slug === sub.slug
          );
          return {
            name: sub.name,
            slug: sub.slug,
            price: matched ? matched.price : null,
          };
        }),
      }));

      return {
        ...offer,
        treatments,
      };
    });

    res.status(200).json({ success: true, offers: shapedOffers });
  } catch (err) {
    console.error("Error fetching offers:", err);
    res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
}
