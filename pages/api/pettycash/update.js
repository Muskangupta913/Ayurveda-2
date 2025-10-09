import dbConnect from "../../../lib/database";
import PettyCash from "../../../models/PettyCash";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // ✅ Authenticate
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!["staff", "admin"].includes(decoded.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // ✅ Extract payload
    const { id, type, data } = req.body;

    if (!id || !type || !data) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const pettyCash = await PettyCash.findById(id);
    if (!pettyCash) {
      return res.status(404).json({ message: "Petty Cash record not found" });
    }

    // ✅ Allow editing only today
    const today = new Date();
    const recordDate = new Date(pettyCash.createdAt);
    if (today.toDateString() !== recordDate.toDateString()) {
      return res
        .status(400)
        .json({ message: "You can only edit today's records" });
    }

    // ---------- ALLOCATED ----------
    if (type === "allocated") {
      const { newAmount, receipts, note } = data;

      if (newAmount === undefined || newAmount === null) {
        return res.status(400).json({ message: "Allocated amount is required" });
      }

      pettyCash.allocatedAmounts.push({
        amount: newAmount,
        receipts: receipts || [],
        date: new Date(),
      });

      if (note !== undefined) {
        pettyCash.note = note;
      }

    // ---------- EXPENSE ----------
    } else if (type === "expense") {
      const { expenseId, description, spentAmount, receipts } = data;

      if (!description) {
        return res.status(400).json({ message: "Expense description is required" });
      }

      if (spentAmount === undefined || spentAmount === null) {
        return res.status(400).json({ message: "Expense amount is required" });
      }

      if (expenseId) {
        // 🔹 Update existing expense
        const expense = pettyCash.expenses.id(expenseId);
        if (!expense) {
          return res.status(404).json({ message: "Expense not found in record" });
        }

        expense.description = description;
        expense.spentAmount = spentAmount;
        expense.receipts = receipts || [];
        expense.date = new Date();
      } else {
        // 🔹 Add new expense
        pettyCash.expenses.push({
          description,
          spentAmount,
          receipts: receipts || [],
          date: new Date(),
        });
      }
    } else {
      return res.status(400).json({ message: "Invalid type provided" });
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
