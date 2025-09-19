import dbConnect from "../../../lib/database";
import JobApplication from "../../../models/JobApplication";
import jwt from "jsonwebtoken";
import { emitNotificationToUser } from "../push-notification/socketio";
import Notification from "../../../models/Notification";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  await dbConnect();

  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  // let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.userId;
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }

  const { applicationId, status } = req.body;
  try {
    const updatedApplication = await JobApplication.findByIdAndUpdate(
      applicationId,
      { status },
      { new: true }
    )
      .populate("applicantId")
      .populate("jobId");

    if (!updatedApplication) {
      return res.status(404).json({ message: "Application not found" });
    }

    const applicantUserId = updatedApplication.applicantId._id;
    const jobTitle = updatedApplication.jobId?.jobTitle || "Job Posting";

    console.log("Populated JobId:", jobTitle );


    // ✅ Create notification in DB
    const notification = await Notification.create({
      user: applicantUserId,
      message: `Your application for "${jobTitle}" has been updated to "${status}"`,
      type: "job-status",
      relatedJobApplication: updatedApplication._id,
      relatedJob: updatedApplication.jobId._id,
    });

    // ✅ Emit socket events
    emitNotificationToUser(applicantUserId.toString(), {
      _id: notification._id,
      message: notification.message,
      createdAt: notification.createdAt,
      isRead: false,
    });

    emitNotificationToUser(applicantUserId.toString(), {
      type: "applicationStatusChanged",
      message: notification.message,
      applicationId: updatedApplication._id,
      newStatus: status,
    });

    // ✅ Return full response (not just message)
    return res.status(200).json({
      message: "Status updated & notification sent",
      application: updatedApplication,
      notification,
    });
  } catch {
    console.error("Status update error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
