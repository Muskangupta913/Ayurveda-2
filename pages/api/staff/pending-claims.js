import dbConnect from "../../../lib/database"; // your MongoDB connection util
import jwt from "jsonwebtoken";
import PatientRegistration from "../../../models/PatientRegistration";
import User from "../../../models/Users";



  async function getUserFromToken(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.split(" ")[1];
  if (!token) throw { status: 401, message: "No token provided" };
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) throw { status: 401, message: "User not found" };
    return user;
  } catch (err) {
    throw { status: 401, message: "Invalid or expired token" };
  }
}

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const user = await getUserFromToken(req);
      if (user.role !== "doctorStaff") {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
      const patients = await PatientRegistration.find().sort({ createdAt: -1 });
      return res.status(200).json({ success: true, data: patients });
    } catch (err) {
      console.error("GET /api/patients error:", err);
      return res.status(err.status || 500).json({ success: false, message: err.message || "Server error" });
    }
  }

  if (req.method === "PATCH") {
    // update advanceClaimStatus (release or cancel)
    try {
      const user = await getUserFromToken(req);
      if (user.role !== "doctorStaff") {
        return res.status(403).json({ success: false, message: "Access denied" });
      }

      const { id, action, checklist } = req.body;
      if (!id || !action) {
        return res.status(400).json({ success: false, message: "id and action required" });
      }

      const patient = await PatientRegistration.findById(id);
      if (!patient) {
        return res.status(404).json({ success: false, message: "Patient not found" });
      }

      // Actions: 'release' or 'cancel'
      if (action === "release") {
        // checklist must be provided and all required keys true
        const requiredKeys = [
          "appointment",
          "personalDetails",
          "treatment",
          "amount",
          "complains",
          "vitalSign",
          "consentForm",
          "allergy",
          "invoiceDate",
          "familyDetails",
          "diagnosis",
          "startDate",
        ];

        if (!checklist || typeof checklist !== "object") {
          return res.status(400).json({ success: false, message: "Checklist object required for release" });
        }

        const missed = requiredKeys.filter((k) => !checklist[k]);
        if (missed.length > 0) {
          return res.status(400).json({
            success: false,
            message: `Checklist incomplete. Missing: ${missed.join(", ")}`,
          });
        }

        patient.advanceClaimStatus = "Released";
        patient.advanceClaimReleaseDate = new Date();
        patient.advanceClaimReleasedBy = user.name || user.email || user._id.toString();
        await patient.save();

        return res.status(200).json({ success: true, message: "Claim released", data: patient });
      } else if (action === "cancel") {
        patient.advanceClaimStatus = "Cancelled";
        // Clearing release info when cancelling
        patient.advanceClaimReleaseDate = undefined;
        patient.advanceClaimReleasedBy = undefined;
        await patient.save();

        return res.status(200).json({ success: true, message: "Claim cancelled", data: patient });
      } else {
        return res.status(400).json({ success: false, message: "Invalid action" });
      }
    } catch (err) {
      console.error("PATCH /api/patients error:", err);
      return res.status(err.status || 500).json({ success: false, message: err.message || "Server error" });
    }
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
}