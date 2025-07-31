// pages/api/job-postings/all.js
import dbConnect from "../../../lib/database";
import JobPosting from "../../../models/JobPosting";
import User from "../../../models/Users"; 

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  await dbConnect();

  // ✅ Extract all query params
  const { location, jobType, department, skills, salary, time, jobId } = req.query;

  const filters = { isActive: true };

  // ✅ Apply filters
  if (location) filters.location = location;
  if (jobType) filters.jobType = jobType;
  if (department) filters.department = department;
  if (salary) filters.salary = salary;
  if (jobId) filters._id = jobId;

  if (skills) {
    const skillsArray = Array.isArray(skills) ? skills : skills.split(",");
    filters.skills = { $in: skillsArray };
  }

  // ✅ Filter by last week
  if (time === "week") {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    filters.createdAt = { $gte: oneWeekAgo };
  }

  try {
    const jobs = await JobPosting.find(filters)
      .populate("postedBy", "username role")
      .sort({ createdAt: -1 });

    res.status(200).json({ jobs });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
}
