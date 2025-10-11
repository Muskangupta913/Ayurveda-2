import dbConnect from "../../../lib/database";
import jwt from "jsonwebtoken";
import PettyCash from "../../../models/PettyCash";
import User from "../../../models/Users";

// Helper: verify JWT and get user
async function getUserFromToken(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.split(" ")[1];
  if (!token) throw { status: 401, message: "No token provided" };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) throw { status: 401, message: "User not found" };
    return user;
  } catch (err) {
    throw { status: 401, message: "Invalid or expired token" };
  }
}

// Helper: upload files to Cloudinary
async function uploadToCloudinary(files) {
  if (!files?.length) return [];
  const uploadedUrls = [];

  for (const file of files) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
    );

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`,
      { method: "POST", body: formData }
    );

    const data = await res.json();
    if (data.secure_url) uploadedUrls.push(data.secure_url);
  }

  return uploadedUrls;
}

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  let user;
  try {
    user = await getUserFromToken(req);
  } catch (err) {
    return res.status(err.status || 401).json({ success: false, message: err.message });
  }

  try {
    const { note, amount } = req.body;
    
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: "Valid amount is required" });
    }

    // Upload receipts if any
    let receiptUrls = [];
    if (req.files && req.files.receipts) {
      const files = Array.isArray(req.files.receipts) ? req.files.receipts : [req.files.receipts];
      receiptUrls = await uploadToCloudinary(files);
    }

    // Check if there's already a PettyCash record for this staff member today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    let pettyCashRecord = await PettyCash.findOne({
      staffId: user._id,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    if (!pettyCashRecord) {
      // Create new PettyCash record for manual addition
      pettyCashRecord = await PettyCash.create({
        staffId: user._id,
        patientName: "Manual Addition",
        patientEmail: "manual@system.com",
        patientPhone: "0000000000",
        note: note || "Manual petty cash addition",
        allocatedAmounts: [{
          amount: parseFloat(amount),
          receipts: receiptUrls,
          date: new Date()
        }],
        expenses: []
      });
    } else {
      // Add to existing record
      pettyCashRecord.allocatedAmounts.push({
        amount: parseFloat(amount),
        receipts: receiptUrls,
        date: new Date()
      });
      await pettyCashRecord.save();
    }

    return res.status(201).json({
      success: true,
      message: "Petty cash added successfully",
      data: pettyCashRecord
    });

  } catch (err) {
    console.error("Error adding manual petty cash:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

