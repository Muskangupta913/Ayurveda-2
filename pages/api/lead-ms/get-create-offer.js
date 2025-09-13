// File: /pages/api/offers/index.js
import dbConnect from "../../../lib/database";
import Offer from "../../../models/CreateOffer";
import Treatment from "../../../models/Treatment";
import { getUserFromReq, requireRole } from "../lead-ms/auth"; // adjust path if needed

export default async function handler(req, res) {
  await dbConnect();

  try {
    if (req.method !== "GET") {
      return res.status(405).json({ success: false, message: "Method not allowed" });
    }

    // Optional: Get user from token
    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    if (!requireRole(user, ["clinic"])) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // ✅ Filter by clinicId if user has one
    const filter = {};
    if (user.clinicId) {
      filter.clinicId = user.clinicId;
    }

    // Fetch all offers and populate treatments
    const offers = await Offer.find(filter)
      .populate("treatments", "name slug") // populate treatment names
      .sort({ createdAt: -1 }); // newest first

    // Format offers for frontend
    const formattedOffers = offers.map((offer) => ({
      _id: offer._id,
      title: offer.title,
      description: offer.description,
      type: offer.type,
      value: offer.value,
      currency: offer.currency,
      startsAt: offer.startsAt,
      endsAt: offer.endsAt,
      timezone: offer.timezone,
      maxUses: offer.maxUses,
      usesCount: offer.usesCount,
      perUserLimit: offer.perUserLimit,
      channels: offer.channels,
      utm: offer.utm,
      status: offer.status,
      treatments: offer.treatments.map((t) => ({
        _id: t._id,
        name: t.name,
        slug: t.slug,
      })),
      createdBy: offer.createdBy,
      updatedBy: offer.updatedBy,
      createdAt: offer.createdAt,
      updatedAt: offer.updatedAt,
    }));

    res.status(200).json({ success: true, offers: formattedOffers });
  } catch (err) {
    console.error("Error fetching offers:", err);
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
}
