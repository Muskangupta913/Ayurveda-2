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
    const admin = await User.findById(decoded.id);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (admin.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    const { date, staffName } = req.query;

    // ✅ Fetch all staff/doctorStaff users
    const staffUsers = await User.find({
      role: { $in: ["staff", "doctorStaff"] },
    }).select("name eodNotes");

    // ✅ Collect all notes with staff name
    let allNotes = [];
    staffUsers.forEach((user) => {
      user.eodNotes.forEach((note) => {
        const noteDate = new Date(note.createdAt);
        allNotes.push({
          staffName: user.name,
          note: note.note,
          createdAt: noteDate,
        });
      });
    });

    // ✅ Filter by date if provided
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      allNotes = allNotes.filter(
        (n) => n.createdAt >= startOfDay && n.createdAt <= endOfDay
      );
    }

    // ✅ Filter by staff name if provided
    if (staffName) {
      allNotes = allNotes.filter(
        (n) => n.staffName.toLowerCase() === staffName.toLowerCase()
      );
    }

    // ✅ Sort newest first
    allNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // ✅ Return staff names list for dropdown
    const staffList = staffUsers.map((s) => s.name);

    return res.status(200).json({
      message: "EOD notes fetched successfully",
      eodNotes: allNotes,
      staffList,
    });
  } catch (error) {
    console.error("Admin EOD Notes Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
