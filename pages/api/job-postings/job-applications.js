// pages/api/job-postings/job-applications.js
import dbConnect from "../../../lib/database";
import JobApplication from "../../../models/JobApplication";
import JobPosting from "../../../models/JobPosting";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  await dbConnect();

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { userId } = decoded;

    // Get jobs posted by this user
    const postedJobs = await JobPosting.find({ postedBy: userId }).select("_id");
    const jobIds = postedJobs.map((job) => job._id);

    // Fetch applications
    const applications = await JobApplication.find({ jobId: { $in: jobIds } })
      .populate("jobId", "jobTitle location jobType")
      .populate("applicantId", "name email phone role")
      .select("jobId applicantId resume status createdAt updatedAt");

    // Correct resume URL handling
    const formattedApps = applications.map((app) => {
      let resumeUrl = null;
      if (app.resume) {
        resumeUrl = app.resume.startsWith("http")
          ? app.resume
          : `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}${app.resume}`;
      }
      return {
        ...app.toObject(),
        resumeUrl,
      };
    });

    res.status(200).json({ applications: formattedApps });
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ message: "Server Error" });
  }
}
