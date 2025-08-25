// pages/api/job-postings/delete-application/[id].js
import dbConnect from "../../../../lib/database";
import JobApplication from "../../../../models/JobApplication";
import Notification from "../../../../models/Notification";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  await dbConnect();

  // 🔐 Auth
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token provided" });
  const token = authHeader.split(" ")[1];
  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.userId;
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }

  const { id } = req.query; // applicationId

  try {
    // 1️⃣ Find application
    const application = await JobApplication.findById(id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // 2️⃣ Delete related notifications
    await Notification.deleteMany({ relatedJobApplication: application._id });

    // 3️⃣ Delete application
    await JobApplication.deleteOne({ _id: id });

    return res.status(200).json({ message: "Application deleted successfully" });
  } catch (error) {
    console.error("Delete application error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
