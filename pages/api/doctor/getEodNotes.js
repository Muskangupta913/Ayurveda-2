import jwt from "jsonwebtoken";
import dbConnect from "../../../lib/database";
import User from "../../../models/Users";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Only staff or doctorStaff can view EOD notes
    if (!["staff", "doctorStaff"].includes(user.role)) {
      return res.status(403).json({ message: "Not authorized to view EOD notes" });
    }

    // ✅ Date filter (optional)
    const { date } = req.query;

    let filteredNotes = user.eodNotes || [];

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      filteredNotes = filteredNotes.filter((n) => {
        const noteDate = new Date(n.createdAt);
        return noteDate >= startOfDay && noteDate <= endOfDay;
      });
    }

    // Sort newest first
    filteredNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({
      message: "EOD notes fetched successfully",
      eodNotes: filteredNotes,
    });
  } catch (error) {
    console.error("Get EOD Notes Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
