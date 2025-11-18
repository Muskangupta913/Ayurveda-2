import jwt from "jsonwebtoken";
import dbConnect from "../../../lib/database";
import User from "../../../models/Users";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded);
    const user = await User.findById(decoded.userId);
    console.log("User Found:", user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Only staff or doctorStaff can add EOD note
    if (!["staff", "doctorStaff"].includes(user.role)) {
      return res
        .status(403)
        .json({ message: "Not authorized to add EOD notes" });
    }

    const { note } = req.body;
    if (!note || note.trim() === "") {
      return res.status(400).json({ message: "Note cannot be empty" });
    }

    user.eodNotes.push({ note });
    await user.save();

    return res.status(200).json({
      message: "EOD note added successfully",
      eodNotes: user.eodNotes,
    });
  } catch (error) {
    console.error("EOD Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
