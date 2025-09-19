import dbConnect from "../../../lib/database";
import Offer from "../../../models/CreateOffer";
import { getUserFromReq } from "./auth";
import mongoose from "mongoose";

export default async function handler(req, res) {
  try {
    await dbConnect();

    if (req.method !== "DELETE") {
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed" });
    }

    const user = await getUserFromReq(req);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const { id } = req.query;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or missing Offer ID" });
    }

    // Build filter
    const filter = { _id: id };

    if (user.role === "clinic") {
      if (!user.clinicId) {
        return res
          .status(403)
          .json({ success: false, message: "Clinic not linked to user" });
      }
      filter.clinicId = user.clinicId; // ✅ use user's clinicId directly
    }

    const offer = await Offer.findOneAndDelete(filter);

    if (!offer) {
      return res
        .status(404)
        .json({ success: false, message: "Offer not found or not authorized" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Offer deleted successfully" });
  } catch (err) {
    console.error("Error deleting offer:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
}
