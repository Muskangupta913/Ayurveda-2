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

  const filters = { 
    isActive: true,
    status: "approved"   // ✅ Only approved jobs
  };

  // ✅ Apply filters with case-insensitive partial matching
  if (location?.trim()) {
    filters.location = { $regex: location.trim(), $options: "i" };
  }

  if (jobType?.trim()) {
    filters.jobType = { $regex: jobType.trim(), $options: "i" };
  }

  if (department?.trim()) {
    filters.department = { $regex: department.trim(), $options: "i" };
  }

  if (salary?.trim()) {
    filters.salary = salary.trim(); // exact match
  }

  if (jobId?.trim()) {
    filters._id = jobId.trim();
  }

  if (skills?.trim()) {
    const skillsArray = Array.isArray(skills)
      ? skills
      : skills.split(",").map(s => s.trim()).filter(Boolean);

    filters.skills = { $in: skillsArray.map(skill => new RegExp(skill, "i")) };
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
