import dbConnect from "../../../lib/database";
import Offer from "../../../models/CreateOffer";
import Clinic from "../../../models/Clinic";
import { getUserFromReq } from "./auth";
import mongoose from "mongoose";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "DELETE") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
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

    const filter = { _id: new mongoose.Types.ObjectId(id) };

    if (user.role === "clinic" || user.role === "agent") {
      let clinic = null;
      if (user.role === "clinic") {
        clinic = await Clinic.findOne({ owner: user._id }).select("_id");
      } else if (user.role === "agent") {
        if (!user.clinicId) {
          return res.status(403).json({ success: false, message: "No clinic linked to this user" });
        }
        clinic = await Clinic.findById(user.clinicId).select("_id");
      }

      if (!clinic) {
        return res.status(403).json({ success: false, message: "Clinic not found" });
      }

      filter.clinicId = clinic._id;
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
    console.error("Error deleting offer:", err.message || err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
}
