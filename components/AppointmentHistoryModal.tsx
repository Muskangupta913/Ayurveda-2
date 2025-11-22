"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, Loader2, Calendar, Clock, User, Building2, Stethoscope } from "lucide-react";

interface AppointmentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  getAuthHeaders: () => Record<string, string>;
}

interface HistoryAppointment {
  _id: string;
  visitId: string;
  doctorName: string;
  doctorEmail: string;
  roomName: string;
  status: string;
  followType: string;
  startDate: string;
  fromTime: string;
  toTime: string;
  referral: string;
  emergency: string;
  notes: string;
  appointmentNumber: number | null;
  createdAt: string;
  arrivedAt: string | null;
  completedAt: string | null;
}

export default function AppointmentHistoryModal({
  isOpen,
  onClose,
  patientId,
  patientName,
  getAuthHeaders,
}: AppointmentHistoryModalProps) {
  const [appointments, setAppointments] = useState<HistoryAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Debug logging
  useEffect(() => {
    console.log("AppointmentHistoryModal - isOpen:", isOpen, "patientId:", patientId);
  }, [isOpen, patientId]);

  useEffect(() => {
    if (isOpen && patientId) {
      fetchHistory();
    } else {
      setAppointments([]);
      setError("");
    }
  }, [isOpen, patientId]);

  const fetchHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const headers = getAuthHeaders();
      const response = await axios.get(`/api/clinic/patient-appointment-history/${patientId}`, { headers });

      if (response.data.success) {
        setAppointments(response.data.appointments || []);
      } else {
        setError(response.data.message || "Failed to fetch appointment history");
      }
    } catch (err: any) {
      console.error("Error fetching appointment history:", err);
      setError(err.response?.data?.message || "Failed to fetch appointment history");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "discharged") return "bg-blue-100 text-blue-800";
    if (statusLower === "completed") return "bg-green-100 text-green-800";
    if (statusLower === "booked") return "bg-yellow-100 text-yellow-800";
    if (statusLower === "cancelled") return "bg-red-100 text-red-800";
    if (statusLower === "arrived") return "bg-indigo-100 text-indigo-800";
    return "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Appointment History</h2>
            <p className="text-sm text-gray-600 mt-1">Patient: {patientName}</p>
            <p className="text-xs text-gray-500 mt-1">Total Appointments: {appointments.length}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No appointment history found</div>
          ) : (
            <div className="space-y-4">
              {appointments.map((apt) => (
                <div
                  key={apt._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {apt.appointmentNumber || apt.visitId}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          Visit ID: {apt.visitId}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDateTime(apt.createdAt)}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                        apt.status
                      )}`}
                    >
                      {apt.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500 text-xs mb-1">Date & Time</div>
                      <div className="font-medium">
                        {formatDate(apt.startDate)} {apt.fromTime} - {apt.toTime}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs mb-1">Doctor</div>
                      <div className="font-medium">{apt.doctorName}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs mb-1">Room</div>
                      <div className="font-medium">{apt.roomName}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs mb-1">Follow Type</div>
                      <div className="font-medium capitalize">{apt.followType}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs mb-1">Source</div>
                      <div className="font-medium capitalize">{apt.referral}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs mb-1">Emergency</div>
                      <div className="font-medium capitalize">{apt.emergency}</div>
                    </div>
                  </div>

                  {apt.arrivedAt && (
                    <div className="mt-2 text-xs text-gray-500">
                      Arrived: {formatDateTime(apt.arrivedAt)}
                    </div>
                  )}

                  {apt.completedAt && (
                    <div className="mt-2 text-xs text-gray-500">
                      Completed: {formatDateTime(apt.completedAt)}
                    </div>
                  )}

                  {apt.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-gray-500 text-xs mb-1">Notes</div>
                      <div className="text-sm text-gray-700">{apt.notes}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

