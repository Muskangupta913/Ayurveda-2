import dbConnect from "../../../lib/database";
import Clinic from "../../../models/Clinic";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  await dbConnect();

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Log decoded info
    console.log("🔑 Decoded token:", decoded); // 👈 check the id and role
    console.log("📦 Headers token:", token);

    if (decoded.role !== "clinic") {
      return res.status(403).json({ message: "Access denied" });
    }

    const clinic = await Clinic.findOne({ owner: decoded.userId }).lean();

    // ✅ Log result of DB query
    console.log("🏥 Clinic found:", clinic);

    if (!clinic) return res.status(404).json({ message: "Clinic not found" });

    // Helper to get base URL
    function getBaseUrl() {
      if (process.env.NODE_ENV === "production") {
        return "https://ayurvedanearme.ae";
      }
      return "http://localhost:3000";
    }

    // Ensure photos are absolute URLs
    if (clinic.photos && Array.isArray(clinic.photos)) {
      clinic.photos = clinic.photos.map((photo) =>
        photo.startsWith("http") ? photo : `${getBaseUrl()}${photo}`
      );
    }
    if (clinic.licenseDocumentUrl) {
      clinic.licenseDocumentUrl = clinic.licenseDocumentUrl.startsWith("http")
        ? clinic.licenseDocumentUrl
        : `${getBaseUrl()}${clinic.licenseDocumentUrl}`;
    }

    return res.status(200).json({ success: true, clinic });
  } catch (err) {
    console.error("❌ Token decode or DB error:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
}
