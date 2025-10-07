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

    const { pettyCashId, description, spentAmount } = req.body;

    if (!pettyCashId || !description || !spentAmount) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const pettyCash = await PettyCash.findById(pettyCashId);

    if (!pettyCash) {
      return res.status(404).json({ message: "Petty cash record not found" });
    }

    if (pettyCash.staffId.toString() !== staffId.toString()) {
      return res.status(403).json({ message: "You are not authorized to add expense to this record" });
    }

    pettyCash.expenses.push({
      description,
      spentAmount: Number(spentAmount),
      date: new Date(),
    });

    await pettyCash.save();

    res.status(200).json({
      message: "Expense added successfully",
      pettyCash,
    });
  } catch (error) {
    console.error("Error adding expense:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}
