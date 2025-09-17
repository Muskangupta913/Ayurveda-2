import dbConnect from "../../../lib/database";
import User from "../../../models/Users";
import Treatment from "../../../models/Treatment";
import { getUserFromReq, requireRole } from "./auth";

export default async function handler(req, res) {
  await dbConnect();

  const user = await getUserFromReq(req);
  if (!requireRole(user, ["admin", "clinic"])) {
    return res.status(403).json({ message: "Access denied" });
  }

  if (req.method === "GET") {
    try {
      const agents = await User.find({
        role: "agent",
        isApproved: true,
      }).select("_id name email");
      return res.status(200).json({ success: true, agents });
    } catch (err) {
      console.error("Error fetching agents:", err);
      return res.status(500).json({ message: "Failed to fetch agents" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
