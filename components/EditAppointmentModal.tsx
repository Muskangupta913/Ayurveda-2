"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, Loader2, Calendar, Clock, User, Building2, Stethoscope, AlertCircle } from "lucide-react";

interface EditAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  appointment: {
    _id: string;
    patientId: string;
    patientName: string;
    doctorId: string;
    doctorName: string;
    roomId: string;
    roomName: string;
    status: string;
    followType: string;
    startDate: string | null;
    fromTime: string;
    toTime: string;
    referral: string;
    emergency: string;
    notes: string;
  } | null;
  rooms: Array<{ _id: string; name: string }>;
  doctors: Array<{ _id: string; name: string }>;
  getAuthHeaders: () => Record<string, string>;
}

export default function EditAppointmentModal({
  isOpen,
  onClose,
  onSuccess,
  appointment,
  rooms,
  doctors,
  getAuthHeaders,
}: EditAppointmentModalProps) {
  // Debug logging
  useEffect(() => {
    console.log("EditAppointmentModal - isOpen:", isOpen, "appointment:", appointment);
  }, [isOpen, appointment]);
  const [roomId, setRoomId] = useState<string>(appointment?.roomId || "");
  const [doctorId, setDoctorId] = useState<string>(appointment?.doctorId || "");
  const [status, setStatus] = useState<string>(appointment?.status || "booked");
  const [followType, setFollowType] = useState<string>(appointment?.followType || "first time");
  const [startDate, setStartDate] = useState<string>(
    appointment?.startDate ? appointment.startDate.split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [fromTime, setFromTime] = useState<string>(appointment?.fromTime || "");
  const [toTime, setToTime] = useState<string>(appointment?.toTime || "");
  const [referral, setReferral] = useState<string>(appointment?.referral || "direct");
  const [emergency, setEmergency] = useState<string>(appointment?.emergency || "no");
  const [notes, setNotes] = useState<string>(appointment?.notes || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Update form when appointment changes
  useEffect(() => {
    if (appointment) {
      setRoomId(appointment.roomId || "");
      setDoctorId(appointment.doctorId || "");
      setStatus(appointment.status || "booked");
      setFollowType(appointment.followType || "first time");
      const dateStr = appointment.startDate 
        ? (typeof appointment.startDate === 'string' 
            ? appointment.startDate.split("T")[0] 
            : new Date(appointment.startDate).toISOString().split("T")[0])
        : new Date().toISOString().split("T")[0];
      setStartDate(dateStr);
      setFromTime(appointment.fromTime || "");
      setToTime(appointment.toTime || "");
      setReferral(appointment.referral || "direct");
      setEmergency(appointment.emergency || "no");
      setNotes(appointment.notes || "");
    }
  }, [appointment]);

  const calculateEndTime = (time: string) => {
    if (!time) return "";
    const [hour, min] = time.split(":").map(Number);
    const totalMinutes = hour * 60 + min + 15;
    const newHour = Math.floor(totalMinutes / 60);
    const newMin = totalMinutes % 60;
    return `${String(newHour).padStart(2, "0")}:${String(newMin).padStart(2, "0")}`;
  };

  const handleFromTimeChange = (time: string) => {
    setFromTime(time);
    setToTime(calculateEndTime(time));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment) return;
    
    setLoading(true);
    setError("");
    setFieldErrors({});

    try {
      const headers = getAuthHeaders();
      const response = await axios.put(
        `/api/clinic/update-appointment/${appointment._id}`,
        {
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
        },
        { headers }
      );

      if (response.data.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.data.message || "Failed to update appointment");
        if (response.data.errors) {
          setFieldErrors(response.data.errors);
        }
      }
    } catch (err: any) {
      console.error("Error updating appointment:", err);
      setError(err.response?.data?.message || "Failed to update appointment");
      if (err.response?.data?.errors) {
        setFieldErrors(err.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  if (!appointment) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Appointment</h2>
            <p className="text-sm text-gray-600 mt-1">Patient: {appointment.patientName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            {/* Room */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Room <span className="text-red-500">*</span>
              </label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  fieldErrors.roomId ? "border-red-500" : "border-gray-300"
                }`}
                required
              >
                <option value="">Select Room</option>
                {rooms.map((room) => (
                  <option key={room._id} value={room._id}>
                    {room.name}
                  </option>
                ))}
              </select>
              {fieldErrors.roomId && <p className="text-red-500 text-xs mt-1">{fieldErrors.roomId}</p>}
            </div>

            {/* Doctor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Doctor <span className="text-red-500">*</span>
              </label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  fieldErrors.doctorId ? "border-red-500" : "border-gray-300"
                }`}
                required
              >
                <option value="">Select Doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    {doctor.name}
                  </option>
                ))}
              </select>
              {fieldErrors.doctorId && <p className="text-red-500 text-xs mt-1">{fieldErrors.doctorId}</p>}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  fieldErrors.status ? "border-red-500" : "border-gray-300"
                }`}
                required
              >
                <option value="booked">Booked</option>
                <option value="enquiry">Enquiry</option>
                <option value="Discharge">Discharged</option>
                <option value="Arrived">Arrived</option>
                <option value="Consultation">Consultation</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Follow Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Follow Type <span className="text-red-500">*</span>
              </label>
              <select
                value={followType}
                onChange={(e) => setFollowType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="first time">First Time</option>
                <option value="follow up">Follow Up</option>
                <option value="repeat">Repeat</option>
              </select>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={fromTime}
                  onChange={(e) => handleFromTimeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={toTime}
                  onChange={(e) => setToTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Referral and Emergency */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <select
                  value={referral}
                  onChange={(e) => setReferral(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="direct">Direct</option>
                  <option value="referral">Referral</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency</label>
                <select
                  value={emergency}
                  onChange={(e) => setEmergency(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes..."
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Update Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

