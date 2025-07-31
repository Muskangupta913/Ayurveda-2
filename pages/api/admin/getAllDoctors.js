import dbConnect from "../../../lib/database";
import DoctorProfile from "../../../models/DoctorProfile";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const doctorProfiles = await DoctorProfile.find()
      .populate("user", "name email phone isApproved declined password")
      .select("degree experience address treatments resumeUrl user")
      .lean();

    // Set base URL for resume URLs
    const getBaseUrl = () => {
      if (process.env.NODE_ENV === "production") {
        return "https://ayurvedanearme.ae";
      }
      return "http://localhost:3000";
    };

    // Convert resume URLs to full URLs
    const processedProfiles = doctorProfiles.map((profile) => {
      if (profile.resumeUrl) {
        // Handle corrupted URLs that contain full file system paths
        let cleanResumeUrl = profile.resumeUrl;

        // If the URL contains a full file system path, extract just the filename
        if (cleanResumeUrl.includes("uploads/clinic/")) {
          const filenameMatch = cleanResumeUrl.match(
            /uploads\/clinic\/[^\/]+$/
          );
          if (filenameMatch) {
            cleanResumeUrl = `/${filenameMatch[0]}`;
          }
        }

        // Convert to full URL
        profile.resumeUrl = cleanResumeUrl.startsWith("http")
          ? cleanResumeUrl
          : `${getBaseUrl()}${cleanResumeUrl}`;
      }
      return profile;
    });

    res.status(200).json({ success: true, doctorProfiles: processedProfiles });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
