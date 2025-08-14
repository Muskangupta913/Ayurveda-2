// pages/api/job-postings/delete.js
import dbConnect from "../../../../lib/database";
import JobPosting from "../../../../models/JobPosting";
import JobApplication from "../../../../models/JobApplication";
import Notification from "../../../../models/Notification";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  await dbConnect();

  // 1️⃣ Authentication
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.userId;
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }

  const { id } = req.query; // Job Posting ID

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 2️⃣ Find job
    const job = await JobPosting.findOne({ _id: id, postedBy: userId }).session(session);
    if (!job) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Job not found or not authorized" });
    }

    // 3️⃣ Get all related job application IDs
    const jobApplicationIds = await JobApplication.find({ jobId: id })
      .distinct("_id")
      .session(session);

    // DEBUG: Log IDs to verify they match DB
    console.log("Job Application IDs to delete:", jobApplicationIds);

    // 4️⃣ Delete notifications FIRST
    const notificationResult = await Notification.deleteMany({
      relatedJobApplication: { $in: jobApplicationIds }
    }).session(session);
    console.log("Deleted notifications:", notificationResult.deletedCount);

    // 5️⃣ Delete related job applications
    const applicationResult = await JobApplication.deleteMany({ jobId: id }).session(session);
    console.log("Deleted job applications:", applicationResult.deletedCount);

    // 6️⃣ Delete the job posting
    const jobResult = await JobPosting.deleteOne({ _id: id }).session(session);
    console.log("Deleted job postings:", jobResult.deletedCount);

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "Job, applications, and notifications deleted successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Delete error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
