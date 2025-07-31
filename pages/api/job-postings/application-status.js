import dbConnect from "../../../lib/database";
import JobApplication from "../../../models/JobApplication";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  await dbConnect();

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.userId;
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }

  const { applicationId, status } = req.body;

  try {
    await JobApplication.findByIdAndUpdate(applicationId, { status });
    return res.status(200).json({ message: "Status updated" });
  } catch (error) {
    console.error("Status update error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
