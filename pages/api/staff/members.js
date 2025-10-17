import dbConnect from "../../../lib/database";
import jwt from "jsonwebtoken";
import User from "../../../models/Users";
import Membership from "../../../models/Membership";

async function getUserFromToken(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.split(" ")[1];
  if (!token) throw { status: 401, message: "No token provided" };
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) throw { status: 401, message: "User not found" };
    return user;
  } catch {
    throw { status: 401, message: "Invalid or expired token" };
  }
}

export default async function handler(req, res) {
  await dbConnect();
  let user;
  try {
    user = await getUserFromToken(req);
  } catch (err) {
    return res.status(err.status || 401).json({ success: false, message: err.message });
  }

  if (req.method === "POST") {
    try {
      const { emrNumber, patientId, packageName, packageAmount, packageStartDate, packageEndDate, packageDurationMonths, paymentMethod, paidAmount, treatments } = req.body;
      if (!emrNumber || !packageName || packageAmount === undefined || !packageEndDate || !packageDurationMonths) {
        return res.status(400).json({ success: false, message: "emrNumber, packageName, packageAmount, packageEndDate and packageDurationMonths are required" });
      }

      const normalizedPkg = Number(packageAmount) || 0;
      const normalizedPaid = Number(paidAmount) || 0;
      const normalizedDuration = Number(packageDurationMonths) || 1;

      const normalizedTreatments = Array.isArray(treatments) ? treatments.map(t => ({
        treatmentName: t.treatmentName,
        unitCount: Number(t.unitCount) || 0,
        unitPrice: Number(t.unitPrice) || 0,
        lineTotal: Number(t.unitCount || 0) * Number(t.unitPrice || 0),
      })) : [];

      const membership = await Membership.create({
        emrNumber,
        patientId: patientId || null,
        staffId: user._id,
        packageName,
        packageAmount: normalizedPkg,
        packageStartDate: packageStartDate ? new Date(packageStartDate) : new Date(),
        packageEndDate: new Date(packageEndDate),
        packageDurationMonths: normalizedDuration,
        paymentMethod: paymentMethod || "",
        paidAmount: normalizedPaid,
        treatments: normalizedTreatments,
      });

      return res.status(201).json({ success: true, data: membership });
    } catch (err) {
      console.error("Create membership error:", err);
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  }

  if (req.method === "GET") {
    try {
      const { emrNumber } = req.query;
      const query = {};
      if (emrNumber) query.emrNumber = emrNumber;
      const list = await Membership.find(query).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, data: list });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  }

  if (req.method === "PUT") {
    try {
      const { membershipId, treatments } = req.body;
      if (!membershipId) {
        return res.status(400).json({ success: false, message: "membershipId is required" });
      }

      const membership = await Membership.findOne({ _id: membershipId, staffId: user._id });
      if (!membership) {
        return res.status(404).json({ success: false, message: "Membership not found" });
      }

      const normalizedTreatments = Array.isArray(treatments) ? treatments.map(t => ({
        treatmentName: t.treatmentName,
        unitCount: Number(t.unitCount) || 0,
        unitPrice: Number(t.unitPrice) || 0,
        lineTotal: Number(t.unitCount || 0) * Number(t.unitPrice || 0),
      })) : [];

      if (normalizedTreatments.length > 0) {
        membership.treatments.push(...normalizedTreatments);
      }

      await membership.save();
      return res.status(200).json({ success: true, data: membership });
    } catch (err) {
      console.error("Update membership error:", err);
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  }

  if (req.method === "PATCH") {
    // Transfer membership (by EMR)
    try {
      const { membershipId, toEmrNumber, toPatientId, toName, amount, note } = req.body;
      if (!membershipId || !toEmrNumber) {
        return res.status(400).json({ success: false, message: "membershipId and toEmrNumber are required" });
      }

      const membership = await Membership.findOne({ _id: membershipId, staffId: user._id });
      if (!membership) {
        return res.status(404).json({ success: false, message: "Membership not found" });
      }

      const transferAmount = Number(amount) || 0;
      const remainingBalance = Number(membership.remainingBalance || 0);
      
      // Validate transfer amount
      if (transferAmount > remainingBalance) {
        return res.status(400).json({ success: false, message: `Transfer amount (₹${transferAmount}) cannot exceed remaining balance (₹${remainingBalance})` });
      }

      // Record transfer (logical tracking)
      const transferRecord = {
        fromEmr: membership.emrNumber,
        toEmr: toEmrNumber,
        toPatientId: toPatientId || null,
        toName: toName || "",
        transferredAmount: transferAmount,
        note: note || "",
        transferredBy: user._id,
      };
      
      membership.transferHistory.push(transferRecord);

      // Deduct the transferred amount from current membership
      if (transferAmount > 0) {
        // Add a "transfer deduction" treatment to track the deduction
        membership.treatments.push({
          treatmentName: `Transfer to ${toEmrNumber}${toName ? ` (${toName})` : ''}`,
          unitCount: 1,
          unitPrice: transferAmount,
          lineTotal: transferAmount,
          addedAt: new Date()
        });
      }

      // If full transfer (amount === 0 or equals remaining balance), reassign to new EMR
      if (transferAmount === 0 || transferAmount === remainingBalance) {
        membership.emrNumber = toEmrNumber;
        membership.patientId = toPatientId || membership.patientId;
      }

      await membership.save();

      // If partial transfer, create a new membership for the recipient
      if (transferAmount > 0 && transferAmount < remainingBalance) {
        const recipientMembership = await Membership.create({
          emrNumber: toEmrNumber,
          patientId: toPatientId || null,
          staffId: user._id,
          packageName: membership.packageName,
          packageAmount: transferAmount,
          paymentMethod: "Transfer",
          paidAmount: 0,
          treatments: [],
          transferHistory: [{
            fromEmr: membership.emrNumber,
            toEmr: toEmrNumber,
            toPatientId: toPatientId || null,
            toName: toName || "",
            transferredAmount: transferAmount,
            note: `Transferred from ${membership.emrNumber}${note ? ` - ${note}` : ''}`,
            transferredBy: user._id,
          }]
        });
      }

      return res.status(200).json({ success: true, data: membership });
    } catch (err) {
      console.error("Transfer membership error:", err);
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "PUT", "PATCH"]);
  return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
}


