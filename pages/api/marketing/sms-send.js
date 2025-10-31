import axios from "axios";
import dbConnect from "../../../lib/database";
import SmsMarketing from "../../../models/SmsMarketing";
import { getUserFromReq, requireRole } from "../lead-ms/auth";
import Clinic from "../../../models/Clinic";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!requireRole(user, ["doctor", "clinic"])) {
      return res.status(403).json({ success: false, message: "Forbidden: Only doctor or clinic can send SMS" });
    }

    const { body, mediaUrl, to } = req.body;
    if (!body || !to) {
      return res.status(400).json({ success: false, message: "Missing parameters" });
    }

    const recipients = Array.isArray(to) ? to : [to];
    const results = [];

    // Fetch clinic info
    const clinic = await Clinic.findOne({ owner: user._id });
    const clinicId = clinic ? clinic._id : null;
    const senderName = clinic ? clinic.name : user.name;

    if (!clinicId) {
      return res.status(400).json({ success: false, message: "Clinic not found for this user" });
    }

    // Live MSG91 credentials from env
    const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
    const SENDER_ID = process.env.MSG91_SENDER_ID;
    const ROUTE = process.env.MSG91_ROUTE || "4"; // transactional
    const COUNTRY = process.env.MSG91_COUNTRY || "91";
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    for (const mobile of recipients) {
      try {
        const trackingUrl = `${BASE_URL}/api/marketing/info?phone=${mobile}&type=${user.role}&id=${clinicId}`;
        const messageWithTracking = `From: ${senderName}\n${body}\n👉 ${trackingUrl}`;

        // MSG91 live API URL
        const url = `https://api.msg91.com/api/sendhttp.php?authkey=${MSG91_AUTH_KEY}&mobiles=${mobile}&message=${encodeURIComponent(
          messageWithTracking
        )}&sender=${SENDER_ID}&route=${ROUTE}&country=${COUNTRY}`;

        const response = await axios.get(url);
        results.push({ to: mobile, status: response.data, error: "" });
      } catch (err) {
        results.push({ to: mobile, status: "failed", error: err.message });
      }
    }

    // Save SMS logs
    await SmsMarketing.create({
      userId: user._id,
      role: user.role,
      message: body,
      mediaUrl,
      recipients,
      results,
    });

    return res.status(200).json({ success: true, data: results });
  } catch (err) {
    console.error("SMS API error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
