import dbConnect from "../../../lib/database";
import PettyCash from "../../../models/PettyCash";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "staff" && decoded.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { id, type, data } = req.body;

    if (!id || !type || !data) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const pettyCash = await PettyCash.findById(id);
    if (!pettyCash) {
      return res.status(404).json({ message: "Petty Cash record not found" });
    }

    // Check if editable today only
    const today = new Date();
    const recordDate = new Date(pettyCash.createdAt);
    if (today.toDateString() !== recordDate.toDateString()) {
      return res
        .status(400)
        .json({ message: "You can only edit today's records" });
    }

    if (type === "allocated") {
      // Update allocated amounts & note
      if (data.newAmount) {
        pettyCash.allocatedAmounts.push({
          amount: data.newAmount,
          receipts: data.receipts || [],
          date: new Date(),
        });
      }

      if (data.note !== undefined) {
        pettyCash.note = data.note;
      }
   } else if (type === "expense") {
  const { expenseId, description, spentAmount, receipts } = data;

  if (expenseId) {
    // 🔹 Find and update existing expense
    const expense = pettyCash.expenses.id(expenseId);
    if (expense) {
      expense.description = description;
      expense.spentAmount = spentAmount;
      expense.receipts = receipts || [];
      expense.date = new Date();
    } else {
      return res.status(404).json({ message: "Expense not found in record" });
    }
  } else {
    // 🔹 Add new expense
    pettyCash.expenses.push({
      description,
      spentAmount,
      receipts: receipts || [],
      date: new Date(),
    });
  }
}


    await pettyCash.save();

    res.status(200).json({
      success: true,
      message: "Updated successfully",
      pettyCash,
    });
  } catch (err) {
    console.error("Error updating petty cash:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
