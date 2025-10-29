import dbConnect from "../../../lib/database";
import Contract from "../../../models/Contract";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "Token missing" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded);
    if (!decoded || decoded.role !== "staff") {
      return res.status(403).json({ success: false, message: "Access denied. Staff only." });
    }

    // Fetch contracts assigned to this staff member
    console.log("Looking for contracts with responsiblePerson:", decoded.userId);
    const contracts = await Contract.find({
      responsiblePerson: decoded.userId,
    })
      .populate("responsiblePerson", "name email")
      .sort({ createdAt: -1 })
      .lean();
    
    console.log("Found contracts:", contracts.length);

    res.status(200).json({
      success: true,
      count: contracts.length,
      data: contracts,
    });
  } catch (error) {
    console.error("Error fetching staff contracts:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
}