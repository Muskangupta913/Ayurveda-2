import dbConnect from "../../../lib/database";
import JobApplication from "../../../models/JobApplication";
import JobPosting from "../../../models/JobPosting";
import User from "../../../models/Users"; // Important for .populate()

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { jobId, applicantId, applicantInfo } = req.body;

  if (!jobId || !applicantId) {
    return res.status(400).json({ message: "Missing jobId or applicantId" });
  }

  try {
    const existing = await JobApplication.findOne({ jobId, applicantId });
    if (existing) {
      return res.status(400).json({ message: "Already applied to this job." });
    }

    const application = new JobApplication({
      jobId,
      applicantId,
      applicantInfo,
    });

    await application.save();

    res.status(200).json({ message: "Application submitted successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}
