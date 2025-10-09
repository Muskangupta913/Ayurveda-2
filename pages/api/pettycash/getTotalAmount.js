// pages/api/pettycash/getTotalAmount.js
import dbConnect from "../../../lib/database"; // adjust path if needed
import PettyCash from "../../../models/PettyCash";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export default async function handler(req, res) {
  await dbConnect();

  try {
    // Require auth and derive staffId
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "Token missing" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const staffId = decoded.userId;
    if (!staffId) return res.status(401).json({ success: false, message: "Invalid token" });

    // Accept date as YYYY-MM-DD (client will pass this). If not provided, default to today's date.
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    // normalize to midnight start and next day start
    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    // Aggregation: filter allocatedAmounts & expenses to only those entries within [start, end)
    const pipeline = [
      // Only include petty cash documents for this staff user
      {
        $match: { staffId: new mongoose.Types.ObjectId(staffId) },
      },
      {
        $project: {
          patientName: 1,
          patientEmail: 1,
          // filter allocatedAmounts for the date
          allocatedForDate: {
            $filter: {
              input: "$allocatedAmounts",
              as: "alloc",
              cond: {
                $and: [
                  { $gte: ["$$alloc.date", start] },
                  { $lt: ["$$alloc.date", end] },
                ],
              },
            },
          },
          // filter expenses for the date
          expensesForDate: {
            $filter: {
              input: "$expenses",
              as: "exp",
              cond: {
                $and: [
                  { $gte: ["$$exp.date", start] },
                  { $lt: ["$$exp.date", end] },
                ],
              },
            },
          },
        },
      },
      // compute per-document sums for that date
      {
        $addFields: {
          allocatedForDateSum: {
            $cond: [
              { $gt: [{ $size: "$allocatedForDate" }, 0] },
              { $sum: "$allocatedForDate.amount" },
              0,
            ],
          },
          expensesForDateSum: {
            $cond: [
              { $gt: [{ $size: "$expensesForDate" }, 0] },
              { $sum: "$expensesForDate.spentAmount" },
              0,
            ],
          },
        },
      },
      // Keep only documents where either allocated or expense exists for the date, optional
      // If you want to include everyone (with zeros), remove the match below
      {
        $match: {
          $or: [
            { allocatedForDateSum: { $gt: 0 } },
            { expensesForDateSum: { $gt: 0 } },
          ],
        },
      },
      // Now group to compute global sums, and push patient breakdown
      {
        $group: {
          _id: null,
          globalAllocated: { $sum: "$allocatedForDateSum" },
          globalSpent: { $sum: "$expensesForDateSum" },
          patients: {
            $push: {
              _id: "$_id",
              patientName: "$patientName",
              patientEmail: "$patientEmail",
              allocatedForDate: "$allocatedForDate",
              expensesForDate: "$expensesForDate",
              allocatedForDateSum: "$allocatedForDateSum",
              expensesForDateSum: "$expensesForDateSum",
              remainingForDate: {
                $subtract: ["$allocatedForDateSum", "$expensesForDateSum"],
              },
            },
          },
        },
      },
      // Project nice shape
      {
        $project: {
          _id: 0,
          globalAllocated: 1,
          globalSpent: 1,
          globalRemaining: { $subtract: ["$globalAllocated", "$globalSpent"] },
          patients: 1,
        },
      },
    ];

    const agg = await PettyCash.aggregate(pipeline);

    // if no entries for that date, return zeros and empty patient list
    if (!agg || agg.length === 0) {
      return res.status(200).json({
        success: true,
        date: start.toISOString(),
        globalAllocated: 0,
        globalSpent: 0,
        globalRemaining: 0,
        patients: [],
      });
    }

    const result = agg[0];
    return res.status(200).json({
      success: true,
      date: start.toISOString(),
      globalAllocated: result.globalAllocated,
      globalSpent: result.globalSpent,
      globalRemaining: result.globalRemaining,
      patients: result.patients,
    });
  } catch (err) {
    console.error("global-total error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
