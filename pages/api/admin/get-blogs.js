import dbConnect from "../../../lib/database";
import Blog from "../../../models/Blog";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  await dbConnect();

  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // only admin role can fetch
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Forbidden - Admin only" });
    }

    if (req.method === "GET") {
      const blogs = await Blog.find({ status: "published" }) // ✅ Only published
        .populate("postedBy", "name email role")
        .populate("comments.user", "name email")
        .sort({ createdAt: -1 });

      return res.status(200).json({ success: true, blogs });
    } else {
      return res.status(405).json({ message: "Method not allowed" });
    }
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}
