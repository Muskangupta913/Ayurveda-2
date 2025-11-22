import dbConnect from "../../../../../lib/database";
import Appointment from "../../../../../models/Appointment";
import Clinic from "../../../../../models/Clinic";
import { getUserFromReq } from "../../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  try {
    // Verify clinic authentication
    const clinicUser = await getUserFromReq(req);
    if (!clinicUser) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (clinicUser.role !== "clinic") {
      return res.status(403).json({ success: false, message: "Access denied. Clinic role required." });
    }

    // Find the clinic associated with this user
    const clinic = await Clinic.findOne({ owner: clinicUser._id }).lean();
    if (!clinic) {
      return res.status(404).json({ success: false, message: "Clinic not found" });
    }

    const clinicId = clinic._id;
    const patientId = req.query.patientId;

    if (req.method === "GET") {
      // Fetch all appointments for this patient in this clinic
      const appointments = await Appointment.find({
        clinicId,
        patientId,
      })
        .populate("doctorId", "name email")
        .populate("roomId", "name")
        .sort({ startDate: -1, createdAt: -1 })
        .lean();

      // Format appointments for frontend
      const formatted = appointments.map((apt) => {
        const doctor = apt.doctorId || {};
        const room = apt.roomId || {};

        return {
          _id: apt._id.toString(),
          visitId: apt._id.toString().slice(-4),
          doctorName: doctor.name || "Unknown",
          doctorEmail: doctor.email || "",
          roomName: room.name || "-",
          status: apt.status,
          followType: apt.followType,
          startDate: apt.startDate ? apt.startDate.toISOString() : null,
          fromTime: apt.fromTime,
          toTime: apt.toTime,
          referral: apt.referral || "direct",
          emergency: apt.emergency || "no",
          notes: apt.notes || "",
          appointmentNumber: apt.appointmentNumber || null,
          createdAt: apt.createdAt ? apt.createdAt.toISOString() : null,
          arrivedAt: apt.arrivedAt ? apt.arrivedAt.toISOString() : null,
          completedAt: apt.completedAt ? apt.completedAt.toISOString() : null,
        };
      });

      return res.status(200).json({
        success: true,
        appointments: formatted,
        total: formatted.length,
      });
    }

    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ success: false, message: "Method not allowed" });
  } catch (error) {
    console.error("Error in patient-appointment-history API:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

