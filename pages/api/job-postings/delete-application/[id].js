import dbConnect from "../../../../lib/database";
import JobApplication from "../../../../models/JobApplication";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  await dbConnect();

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

  const { id } = req.query;

  try {
    const deleted = await JobApplication.findOneAndDelete({ _id: id });

    if (!deleted) {
      return res.status(404).json({ message: "Application not found" });
    }

    return res.status(200).json({ message: "Application deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
