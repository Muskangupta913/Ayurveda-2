import dbConnect from "../../../../lib/database";
import jwt from "jsonwebtoken";
import User from "../../../../models/Users";
import PatientRegistration from "../../../../models/PatientRegistration";

async function getUserFromToken(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.split(" ")[1];
  if (!token) throw { status: 401, message: "No token provided" };
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) throw { status: 401, message: "User not found" };
    return user;
  } catch (err) {
    throw { status: 401, message: "Invalid or expired token" };
  }
}

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method !== "PUT") {
    res.setHeader("Allow", ["PUT"]);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  try {
    // Auth and role check
    const user = await getUserFromToken(req);
    if (user.role !== "doctorStaff") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const patient = await PatientRegistration.findById(id);
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    // Ensure the logged-in doctor is assigned to this patient
    const doctorIdString = String(user._id);
    const belongsToDoctor = patient.doctor === doctorIdString || patient.doctor === user.name;
    if (!belongsToDoctor) {
      return res.status(403).json({ success: false, message: "You are not assigned to this patient" });
    }

    // Whitelist fields that doctor can update
    const allowedFields = [
      "firstName",
      "lastName",
      "email",
      "mobileNumber",
      "referredBy",
      "service",
      "treatment",
      "package",
      "notes",
    ];

    const updates = req.body || {};
    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(updates, field)) {
        patient[field] = updates[field];
      }
    });

    // Mark as approved by doctor
    patient.advanceClaimStatus = "Approved by doctor";
    patient.advanceClaimReleaseDate = new Date();
    patient.advanceClaimReleasedBy = user.name || user.email || user._id.toString();

    await patient.save();

    return res.status(200).json({ success: true, message: "Patient updated and approved by doctor", data: patient });
  } catch (err) {
    console.error("Doctor update patient error:", err);
    return res.status(err.status || 500).json({ success: false, message: err.message || "Server error" });
  }
}


