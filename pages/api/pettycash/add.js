import jwt from "jsonwebtoken";
import dbConnect from "../../../lib/database";
import PettyCash from "../../../models/PettyCash";
import User from "../../../models/Users";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const staffId = decoded.userId;

    const staffUser = await User.findById(staffId);
    if (!staffUser || staffUser.role !== "staff") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { patientName, patientEmail, patientPhone, note, allocatedAmounts } = req.body;

    if (!patientName || !patientEmail || !patientPhone || !allocatedAmounts?.length) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    const formattedAllocations = allocatedAmounts.map((amt) => ({
      amount: Number(amt),
      date: new Date(),
    }));

    const newPettyCash = new PettyCash({
      staffId,
      patientName,
      patientEmail,
      patientPhone,
      note,
      allocatedAmounts: formattedAllocations,
    });

    await newPettyCash.save();

    res.status(201).json({
      message: "Petty cash entry added successfully",
      pettyCash: newPettyCash,
    });
  } catch (error) {
    console.error("Error adding petty cash:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}
