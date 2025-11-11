import dbConnect from "../../../lib/database";
import User from "../../../models/Users";
import Clinic from "../../../models/Clinic";
import { getUserFromReq, requireRole } from "../lead-ms/auth";
import { getClinicIdFromUser, checkClinicPermission } from "./permissions-helper";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  await dbConnect();
  const me = await getUserFromReq(req);

  // Allow admin, clinic, doctor, and agent roles to create agents
  if (!me || !requireRole(me, ["admin", "clinic", "doctor", "agent"])) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }

  try {
    const { clinicId, error, isAdmin } = await getClinicIdFromUser(me);
    if (error && !isAdmin) {
      return res.status(404).json({ success: false, message: error });
    }

    // For admin or doctor without clinicId, allow creation but agent won't be tied to a clinic unless clinicId is provided
    let resolvedClinicId = clinicId;
    if (!resolvedClinicId && me.role === "admin" && req.body.clinicId) {
      const clinic = await Clinic.findById(req.body.clinicId);
      if (!clinic) {
        return res.status(404).json({ success: false, message: "Clinic not found" });
      }
      resolvedClinicId = clinic._id;
    }

    if (!isAdmin && !resolvedClinicId) {
      return res.status(400).json({ success: false, message: "Clinic not found for this user" });
    }

    // Permission checks for clinic/agent roles
    if (!isAdmin && resolvedClinicId) {
      const { hasPermission, error: permError } = await checkClinicPermission(
        resolvedClinicId,
        "create_agent",
        "create"
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: permError || "You do not have permission to create agents",
        });
      }
    }

    // Check if agent already exists with this email
    // If clinicId is provided, check within that clinic
    // If no clinicId (admin), check for agents without clinicId (admin-created)
    const existingQuery = { email, role: "agent" };
    if (resolvedClinicId) {
      existingQuery.clinicId = resolvedClinicId;
    } else {
      // For admin-created agents (no clinicId), check for agents with null/undefined clinicId
      existingQuery.$or = [
        { clinicId: null },
        { clinicId: { $exists: false } }
      ];
    }
    
    const existing = await User.findOne(existingQuery);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: clinicId 
          ? "Agent already exists for this clinic" 
          : "Agent with this email already exists (admin-created agent)",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create agent - clinicId is optional (for admin-created agents)
    const agentData = {
      name,
      email,
      phone: phone || undefined,
      password: hashedPassword,
      role: "agent",
      createdBy: me._id, // ✅ Store who created this agent
      isApproved: true,
      declined: false,
    };
    
    if (resolvedClinicId) {
      agentData.clinicId = resolvedClinicId;
    }

    const agent = await User.create(agentData);

    return res.status(201).json({
      success: true,
      agent: {
        _id: agent._id,
        name: agent.name,
        email: agent.email,
        phone: agent.phone,
        clinicId: agent.clinicId || null,
      },
    });
  } catch (err) {
    console.error("Error creating agent:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
}
