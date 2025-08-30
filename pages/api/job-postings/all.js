import dbConnect from "../../../lib/database";
import JobPosting from "../../../models/JobPosting";
import User from "../../../models/Users";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  await dbConnect();

  const { location, jobType, department, skills, salary, time,experience, jobId } = req.query;

  // ✅ Always only approved + active
  const filters = { 
    isActive: true,
    status: "approved"
  };

  // ✅ Location filter (case-insensitive partial match)
  if (location?.trim()) {
    filters.location = { $regex: location.trim(), $options: "i" };
  }

  // ✅ Job type
  if (jobType?.trim()) {
    filters.jobType = { $regex: jobType.trim(), $options: "i" };
  }

  // ✅ Department
  if (department?.trim()) {
    filters.department = { $regex: department.trim(), $options: "i" };
  }

  // ✅ Salary (exact match, you can change to regex if flexible matching needed)
  if (salary?.trim()) {
    filters.salary = salary.trim();
  }
  if(experience?.trim()){
    filters.experience = experience.trim();
  }

  // ✅ Job ID
  if (jobId?.trim()) {
    filters._id = jobId.trim();
  }

  // ✅ Skills (comma separated, case-insensitive)
  if (skills?.trim()) {
    const skillsArray = Array.isArray(skills)
      ? skills
      : skills.split(",").map(s => s.trim()).filter(Boolean);

    filters.skills = { $in: skillsArray.map(skill => new RegExp(skill, "i")) };
  }

  // ✅ Time filter (last 7 days)
  if (time === "week") {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    filters.createdAt = { $gte: oneWeekAgo };
  }

  try {
    // Debug logs (optional, remove in production)
    console.log("Filters used:", filters);

    const jobs = await JobPosting.find(filters)
      .populate("postedBy", "username role")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, jobs });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ success: false, error: "Failed to fetch jobs" });
  }
}
