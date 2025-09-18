import dbConnect from "../../../lib/database";
import Clinic from "../../../models/Clinic";
import { getUserFromReq, requireRole } from "./auth";
export default async function handler(req, res) {
  await dbConnect();

  try {
    // ✅ Get the logged-in user from request
    const user = await getUserFromReq(req);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    // ✅ Role check: only clinic users can fetch their treatments
    if (!requireRole(user, ["clinic"])) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (req.method === "GET") {
      // ✅ Fetch clinic where this user is the owner
      const clinic = await Clinic.findOne({ owner: user._id }).lean();

      if (!clinic) {
        return res.status(404).json({
          success: false,
          message: "Clinic not found for this user",
        });
      }

      // ✅ Return clinic info and treatments
      return res.status(200).json({
        success: true,
        userId: user._id, // ✅ include userId if needed
        clinicId: clinic._id,
        clinic: {
          id: clinic._id,
          name: clinic.name,
          address: clinic.address,
        },
        treatments: clinic.treatments || [],
      });
    }

    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  } catch (err) {
    console.error("Error fetching clinic treatments:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch clinic treatments",
    });
  }
}
