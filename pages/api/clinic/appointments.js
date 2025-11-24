import dbConnect from "../../../lib/database";
import Appointment from "../../../models/Appointment";
import Clinic from "../../../models/Clinic";
import { getUserFromReq } from "../lead-ms/auth";

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

    // GET: Fetch appointments for the clinic
    if (req.method === "GET") {
      const { date, doctorId, roomId } = req.query;

      let query = { clinicId };

      // Filter by date if provided
      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        query.startDate = { $gte: startOfDay, $lte: endOfDay };
      }

      // Filter by doctor if provided
      if (doctorId) {
        query.doctorId = doctorId;
      }

      // Filter by room if provided
      if (roomId) {
        query.roomId = roomId;
      }

      const appointments = await Appointment.find(query)
        .populate("patientId", "firstName lastName mobileNumber email")
        .populate("doctorId", "name email")
        .populate("roomId", "name")
        .sort({ startDate: 1, fromTime: 1 })
        .lean();

      return res.status(200).json({
        success: true,
        appointments: appointments.map((apt) => ({
          _id: apt._id.toString(),
          patientId: apt.patientId?._id?.toString(),
          patientName: apt.patientId
            ? `${apt.patientId.firstName || ""} ${apt.patientId.lastName || ""}`.trim()
            : "Unknown",
          doctorId: apt.doctorId?._id?.toString(),
          doctorName: apt.doctorId?.name || "Unknown",
          roomId: apt.roomId?._id?.toString(),
          roomName: apt.roomId?.name || "Unknown",
          status: apt.status,
          followType: apt.followType,
          startDate: apt.startDate,
          fromTime: apt.fromTime,
          toTime: apt.toTime,
          referral: apt.referral,
          emergency: apt.emergency,
          notes: apt.notes,
          createdAt: apt.createdAt,
        })),
      });
    }

    // POST: Create a new appointment
    if (req.method === "POST") {
      const {
        patientId,
        doctorId,
        roomId,
        status,
        followType,
        startDate,
        fromTime,
        toTime,
        referral,
        emergency,
        notes,
      } = req.body;

      // Detailed validation
      const missingFields = [];
      const fieldLabels = {
        patientId: "Patient",
        doctorId: "Doctor",
        roomId: "Room",
        status: "Status",
        followType: "Follow Type",
        startDate: "Start Date",
        fromTime: "From Time",
        toTime: "To Time",
      };

      if (!patientId) missingFields.push("patientId");
      if (!doctorId) missingFields.push("doctorId");
      if (!roomId) missingFields.push("roomId");
      if (!status) missingFields.push("status");
      if (!followType) missingFields.push("followType");
      if (!startDate) missingFields.push("startDate");
      if (!fromTime) missingFields.push("fromTime");
      if (!toTime) missingFields.push("toTime");

      if (missingFields.length > 0) {
        const missingFieldLabels = missingFields.map((field) => fieldLabels[field] || field);
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
          missingFields: missingFields,
          missingFieldLabels: missingFieldLabels,
          errors: missingFields.reduce((acc, field) => {
            acc[field] = `${fieldLabels[field] || field} is required`;
            return acc;
          }, {}),
        });
      }

      // Verify doctor belongs to clinic
      const User = (await import("../../../models/Users")).default;
      const doctor = await User.findOne({
        _id: doctorId,
        role: "doctorStaff",
        clinicId: clinicId,
      });

      if (!doctor) {
        return res.status(400).json({
          success: false,
          message: "Doctor not found or does not belong to this clinic",
        });
      }

      // Verify room belongs to clinic
      const Room = (await import("../../../models/Room")).default;
      const room = await Room.findOne({
        _id: roomId,
        clinicId: clinicId,
      });

      if (!room) {
        return res.status(400).json({
          success: false,
          message: "Room not found or does not belong to this clinic",
        });
      }

      // Check for overlapping appointments (same doctor, room, date, and time)
      const appointmentDate = new Date(startDate);
      const existingAppointment = await Appointment.findOne({
        clinicId,
        $or: [
          { doctorId, startDate: appointmentDate, fromTime, toTime },
          {
            doctorId,
            startDate: appointmentDate,
            $or: [
              { fromTime: { $gte: fromTime, $lt: toTime } },
              { toTime: { $gt: fromTime, $lte: toTime } },
              { fromTime: { $lte: fromTime }, toTime: { $gte: toTime } },
            ],
          },
        ],
      });

      if (existingAppointment) {
        return res.status(400).json({
          success: false,
          message: "An appointment already exists for this doctor at this time",
        });
      }

      // Create appointment
      const appointment = await Appointment.create({
        clinicId,
        patientId,
        doctorId,
        roomId,
        status,
        followType,
        startDate: appointmentDate,
        fromTime,
        toTime,
        referral: referral || "direct",
        emergency: emergency || "no",
        notes: notes || "",
        createdBy: clinicUser._id,
      });

      const populatedAppointment = await Appointment.findById(appointment._id)
        .populate("patientId", "firstName lastName mobileNumber email")
        .populate("doctorId", "name email")
        .populate("roomId", "name")
        .lean();

      return res.status(201).json({
        success: true,
        message: "Appointment created successfully",
        appointment: {
          _id: populatedAppointment._id.toString(),
          patientId: populatedAppointment.patientId?._id?.toString(),
          patientName: populatedAppointment.patientId
            ? `${populatedAppointment.patientId.firstName || ""} ${populatedAppointment.patientId.lastName || ""}`.trim()
            : "Unknown",
          doctorId: populatedAppointment.doctorId?._id?.toString(),
          doctorName: populatedAppointment.doctorId?.name || "Unknown",
          roomId: populatedAppointment.roomId?._id?.toString(),
          roomName: populatedAppointment.roomId?.name || "Unknown",
          status: populatedAppointment.status,
          followType: populatedAppointment.followType,
          startDate: populatedAppointment.startDate,
          fromTime: populatedAppointment.fromTime,
          toTime: populatedAppointment.toTime,
          referral: populatedAppointment.referral,
          emergency: populatedAppointment.emergency,
          notes: populatedAppointment.notes,
        },
      });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ success: false, message: "Method not allowed" });
  } catch (error) {
    console.error("Error in appointments API:", error);
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

