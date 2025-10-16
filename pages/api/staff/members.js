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
      const { emrNumber, patientId, packageName, packageAmount, paymentMethod, paidAmount, treatments } = req.body;
      if (!emrNumber || !packageName || packageAmount === undefined) {
        return res.status(400).json({ success: false, message: "emrNumber, packageName and packageAmount are required" });
      }

      const normalizedPkg = Number(packageAmount) || 0;
      const normalizedPaid = Number(paidAmount) || 0;

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

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
}


