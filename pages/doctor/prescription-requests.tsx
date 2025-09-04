// import React
import React, { useEffect, useState } from "react";
import axios from "axios";
import DoctorLayout from "../../components/DoctorLayout";
import withDoctorAuth from "../../components/withDoctorAuth";
import type { NextPageWithLayout } from "../_app";

interface PrescriptionRequest {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  doctor: {
    _id: string;
    name: string;
    email: string;
  };
  status: "pending" | "in_progress" | "completed" | "cancelled";
  healthIssue: string;
  symptoms: string;
  prescription?: string;
  prescriptionDate?: string;
  createdAt: string;
  updatedAt: string;
}

function DoctorPrescriptionRequests() {
  const [requests, setRequests] = useState<PrescriptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("doctorToken");
      const response = await axios.get("/api/prescription/doctor-requests", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setRequests(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatClick = (requestId: string) => {
    window.location.href = `/doctor/chat/${requestId}`;
  };

  const confirmDecline = async () => {
    if (!deleteId) return;
    try {
      const token = localStorage.getItem("doctorToken");
      const response = await axios.delete(
        `/api/prescription/delete?id=${deleteId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setRequests((prev) => prev.filter((req) => req._id !== deleteId));
        setShowConfirm(false);
        setDeleteId(null);
      } else {
        alert(response.data.message || "Failed to delete");
      }
    } catch (err) {
      console.error("Decline error:", err);
      alert("Something went wrong");
    }
  };

  const openDeclineModal = (id: string) => {
    setDeleteId(id);
    setShowConfirm(true);
  };

  if (loading) {
    return <div className="p-6">Loading prescription requests...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Prescription Requests</h1>

      {requests.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No prescription requests yet.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {requests.map((request) => (
            <div key={request._id} className="bg-white border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{request.user.name}</h3>
                  <p className="text-gray-600">{request.user.email}</p>
                  <p className="text-gray-600">{request.user.phone}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleChatClick(request._id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Chat
                  </button>
                  <button
                    onClick={() => openDeclineModal(request._id)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Decline
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="font-medium">Health Issue:</h4>
                  <p className="bg-gray-50 p-3 rounded">{request.healthIssue}</p>
                </div>

                {request.symptoms && (
                  <div>
                    <h4 className="font-medium">Symptoms:</h4>
                    <p className="bg-gray-50 p-3 rounded">{request.symptoms}</p>
                  </div>
                )}

                <div>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      request.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : request.status === "in_progress"
                        ? "bg-blue-100 text-blue-800"
                        : request.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {request.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h1 className="text-xl font-bold mb-4 text-red-600">
              This prescription will permanently be deleted
            </h1>
            <p className="mb-6 text-gray-600">
              Are you sure you want to decline and delete this prescription?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={confirmDecline}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

DoctorPrescriptionRequests.getLayout = function PageLayout(
  page: React.ReactNode
) {
  return <DoctorLayout>{page}</DoctorLayout>;
};

const ProtectedDoctorPrescriptionRequests: NextPageWithLayout =
  withDoctorAuth(DoctorPrescriptionRequests);
ProtectedDoctorPrescriptionRequests.getLayout =
  DoctorPrescriptionRequests.getLayout;

export default ProtectedDoctorPrescriptionRequests;
