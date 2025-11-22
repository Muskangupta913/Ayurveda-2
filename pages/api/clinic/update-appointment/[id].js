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
    const appointmentId = req.query.id;

    if (req.method === "PUT") {
      const {
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

      // Find the appointment
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({ success: false, message: "Appointment not found" });
      }

      // Verify appointment belongs to this clinic
      if (appointment.clinicId.toString() !== clinicId.toString()) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }

      // Verify doctor belongs to clinic if doctorId is being updated
      if (doctorId) {
        const User = (await import("../../../../../models/Users")).default;
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
      }

      // Verify room belongs to clinic if roomId is being updated
      if (roomId) {
        const Room = (await import("../../../../../models/Room")).default;
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
      }

      // Update appointment fields
      if (doctorId) appointment.doctorId = doctorId;
      if (roomId) appointment.roomId = roomId;
      if (status) appointment.status = status;
      if (followType) appointment.followType = followType;
      if (startDate) appointment.startDate = new Date(startDate);
      if (fromTime) appointment.fromTime = fromTime;
      if (toTime) appointment.toTime = toTime;
      if (referral) appointment.referral = referral;
      if (emergency) appointment.emergency = emergency;
      if (notes !== undefined) appointment.notes = notes;

      // Update timestamps based on status
      if (status === "Arrived" && !appointment.arrivedAt) {
        appointment.arrivedAt = new Date();
      }
      if (status === "Completed" && !appointment.completedAt) {
        appointment.completedAt = new Date();
      }
      if (status === "Cancelled" && !appointment.cancelledAt) {
        appointment.cancelledAt = new Date();
        appointment.cancelledBy = clinicUser._id;
      }

      await appointment.save();

      // Populate and return updated appointment
      const updatedAppointment = await Appointment.findById(appointmentId)
        .populate("patientId", "firstName lastName mobileNumber email emrNumber invoiceNumber gender")
        .populate("doctorId", "name email")
        .populate("roomId", "name")
        .lean();

      return res.status(200).json({
        success: true,
        message: "Appointment updated successfully",
        appointment: updatedAppointment,
      });
    }

    res.setHeader("Allow", ["PUT"]);
    return res.status(405).json({ success: false, message: "Method not allowed" });
  } catch (error) {
    console.error("Error in update-appointment API:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

