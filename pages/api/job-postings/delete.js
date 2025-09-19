import dbConnect from "../../../lib/database";
import JobPosting from "../../../models/JobPosting";
import JobApplication from "../../../models/JobApplication";
import Notification from "../../../models/Notification";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  await dbConnect();

  // Authentication
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.userId;
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }

  const { jobId } = req.query;
  if (!jobId) {
    return res.status(400).json({ message: "Job ID is required" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find and verify job ownership
    const job = await JobPosting.findOne({ _id: jobId, postedBy: userId }).session(session);
    if (!job) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Job not found or not authorized" });
    }

    // Get all job applications for this job
    const jobApplications = await JobApplication.find({ jobId }).session(session);
    const jobApplicationIds = jobApplications.map(app => app._id);

    console.log("📌 Found applications:", jobApplications.length);
    console.log("📌 Application IDs:", jobApplicationIds);

    // Delete ONLY notifications linked to these applications
    const notificationResult = await Notification.deleteMany({
      relatedJobApplication: { $in: jobApplicationIds }
    }).session(session);

    console.log("🗑 Notifications deleted:", notificationResult.deletedCount);

    // Delete job applications
    const applicationResult = await JobApplication.deleteMany({ jobId }).session(session);
    console.log("🗑 Applications deleted:", applicationResult.deletedCount);

    // Delete job posting
    const jobResult = await JobPosting.deleteOne({ _id: jobId }).session(session);
    console.log("🗑 Job deleted:", jobResult.deletedCount);

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "Job, applications, and related notifications deleted successfully",
      deletedCounts: {
        notifications: notificationResult.deletedCount,
        applications: applicationResult.deletedCount,
        jobs: jobResult.deletedCount
      }
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Delete error:", error);

    if (error.code === 112) {
      return res.status(500).json({ message: "Write conflict. Please try again." });
    }

    return res.status(500).json({ message: "Server error" });
  }
}
