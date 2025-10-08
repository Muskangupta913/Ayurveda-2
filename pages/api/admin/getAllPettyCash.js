import jwt from "jsonwebtoken";
import dbConnect from "../../../lib/database";
import User from "../../../models/Users";
import PettyCash from "../../../models/PettyCash";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET")
    return res.status(405).json({ message: "Method Not Allowed" });

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await User.findById(decoded.id);

    if (!admin) return res.status(404).json({ message: "Admin not found" });
    if (admin.role !== "admin")
      return res.status(403).json({ message: "Access denied: Admins only" });

    const { staffName, startDate, endDate } = req.query;

    // Fetch all staff for dropdown
    const staffUsers = await User.find({ role: { $in: ["staff", "doctorStaff"] } }).select("name");

    // Find staffId if staffName is selected
    let staffIdFilter;
    if (staffName) {
      const staff = staffUsers.find(
        (s) => s.name.toLowerCase() === staffName.toLowerCase()
      );
      staffIdFilter = staff ? staff._id : null;
    }

    // Build date range filter
    let start, end;
if (startDate && !endDate) {
  // only startDate provided → same day filter
  start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  end = new Date(startDate);
  end.setHours(23, 59, 59, 999);
} else if (!startDate && endDate) {
  // only endDate provided → same day filter
  start = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
} else {
  // both provided or both empty
  start = startDate ? new Date(startDate) : new Date();
  start.setHours(0, 0, 0, 0);
  end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);
}


    // Query PettyCash: fetch only records having allocatedAmounts OR expenses in the date range
    const query = {
      ...(staffIdFilter && { staffId: staffIdFilter }),
      $or: [
        { "allocatedAmounts.date": { $gte: start, $lte: end } },
        { "expenses.date": { $gte: start, $lte: end } },
      ],
    };

    const records = await PettyCash.find(query)
      .populate("staffId", "name email")
      .sort({ createdAt: -1 });

    // Group by staff
    const groupedData = {};
    records.forEach((record) => {
      // Filter allocated and expenses by date
      const allocatedFiltered = record.allocatedAmounts.filter(
        (a) => new Date(a.date) >= start && new Date(a.date) <= end
      );
      const expensesFiltered = record.expenses.filter(
        (e) => new Date(e.date) >= start && new Date(e.date) <= end
      );

      if (allocatedFiltered.length === 0 && expensesFiltered.length === 0) return;

      const staffId = record.staffId._id;
      if (!groupedData[staffId]) {
        groupedData[staffId] = {
          staff: record.staffId,
          patients: [],
          expenses: [],
          totalAllocated: 0,
          totalSpent: 0,
          totalAmount: 0,
        };
      }

      // Add patient info
      groupedData[staffId].patients.push({
        name: record.patientName,
        email: record.patientEmail,
        phone: record.patientPhone,
        allocatedAmounts: allocatedFiltered,
      });

      // Add expenses
      groupedData[staffId].expenses.push(...expensesFiltered);

      // Update totals
      groupedData[staffId].totalAllocated += allocatedFiltered.reduce(
        (sum, a) => sum + a.amount,
        0
      );
      groupedData[staffId].totalSpent += expensesFiltered.reduce(
        (sum, e) => sum + e.spentAmount,
        0
      );
      groupedData[staffId].totalAmount =
        groupedData[staffId].totalAllocated - groupedData[staffId].totalSpent;
    });

    const finalData = Object.values(groupedData);

    return res.status(200).json({
      success: true,
      data: finalData,
      staffList: staffUsers.map((s) => s.name),
    });
  } catch (error) {
    console.error("Error fetching petty cash:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
}
