import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import DoctorLayout from "../../../components/DoctorLayout";
import withDoctorAuth from "../../../components/withDoctorAuth";
import type { NextPageWithLayout } from "../../_app";

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
  };
  senderRole: "user" | "doctor";
  content: string;
  messageType: "text" | "prescription";
  prescription?: string;
  timestamp: string;
  isRead: boolean;
}

interface Chat {
  _id: string;
  user: {
    _id: string;
    name: string;
  };
  doctor: {
    _id: string;
    name: string;
  };
  prescriptionRequest: {
    _id: string;
    healthIssue: string;
    symptoms: string;
    status: string;
  };
  messages: Message[];
  lastMessage: string;
}

interface PrescriptionRequestLite {
  _id: string;
  healthIssue: string;
  symptoms?: string;
  status: string;
}

function DoctorChat() {
  const router = useRouter();
  const { requestId } = router.query;
  const [chat, setChat] = useState<Chat | null>(null);
  const [prescriptionRequest, setPrescriptionRequest] =
    useState<PrescriptionRequestLite | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [prescription, setPrescription] = useState("");
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (requestId) {
      fetchChat();
    }
  }, [requestId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  const fetchChat = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("doctorToken");
      const response = await axios.get(
        `/api/chat/get-messages?prescriptionRequestId=${requestId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setChat(response.data.data.chat);
        setPrescriptionRequest(response.data.data.prescriptionRequest);
      }
    } catch (error) {
      console.error("Failed to fetch chat:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    setSending(true);
    try {
      const token = localStorage.getItem("doctorToken");
      const response = await axios.post(
        "/api/chat/send-message",
        {
          prescriptionRequestId: requestId,
          content: message,
          messageType: "text",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setChat(response.data.data.chat);
        setMessage("");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const sendPrescription = async () => {
    if (!prescription.trim()) return;

    setSending(true);
    try {
      const token = localStorage.getItem("doctorToken");
      const response = await axios.post(
        "/api/chat/send-message",
        {
          prescriptionRequestId: requestId,
          content: "Prescription sent",
          messageType: "prescription",
          prescription: prescription,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setChat(response.data.data.chat);
        setPrescription("");
        setShowPrescriptionModal(false);
      }
    } catch (error) {
      console.error("Failed to send prescription:", error);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
  try {
    const token = localStorage.getItem("doctorToken");
    const response = await axios.delete("/api/prescription/delete-message", {
      headers: { Authorization: `Bearer ${token}` },
      data: { chatId: chat?._id, messageId }
    });

    if (response.data.success) {
      setChat(response.data.chat); // update chat after deletion
    }
  } catch (error) {
    console.error("Failed to delete message:", error);
  }
};


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading chat...</div>
      </div>
    );
  }

  // Allow new chat creation: if no chat yet, show UI with prescriptionRequest info and input
  if (!chat) {
    return (
      <div className="max-w-4xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white border-b p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">New Chat</h1>
              {prescriptionRequest && (
                <>
                  <p className="text-sm text-gray-600">
                    Health Issue: {prescriptionRequest.healthIssue}
                  </p>
                  {prescriptionRequest.symptoms && (
                    <p className="text-sm text-gray-600">
                      Symptoms: {prescriptionRequest.symptoms}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    Status: {prescriptionRequest.status}
                  </p>
                </>
              )}
            </div>
            <button
              onClick={() => setShowPrescriptionModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Write Prescription
            </button>
          </div>
        </div>

        {/* Empty state */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          <div className="text-center text-gray-500 mt-10">
            No messages yet. Start the conversation.
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white border-t p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type your message..."
              className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={sending}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !message.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              Send
            </button>
          </div>
        </div>

        {/* Prescription Modal */}
        {showPrescriptionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">Write Prescription</h3>
              </div>
              <div className="p-4">
                <textarea
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  placeholder="Write the prescription here..."
                  className="w-full h-64 p-3 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="p-4 border-t flex gap-2">
                <button
                  onClick={sendPrescription}
                  disabled={sending || !prescription.trim()}
                  className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                >
                  {sending ? "Sending..." : "Send Prescription"}
                </button>
                <button
                  onClick={() => setShowPrescriptionModal(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">
              Chat with {chat.user.name}
            </h1>
            <p className="text-sm text-gray-600">
              Health Issue: {chat.prescriptionRequest.healthIssue}
            </p>
          </div>
          <button
            onClick={() => setShowPrescriptionModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Write Prescription
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
       {chat.messages.map((msg) => (
  <div
    key={msg._id}
    className={`flex ${
      msg.senderRole === "doctor" ? "justify-end" : "justify-start"
    }`}
  >
    <div
      className={`relative max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        msg.senderRole === "doctor"
          ? "bg-blue-600 text-white"
          : "bg-white text-gray-900 border"
      }`}
    >
      {/* Message Content */}
      {msg.messageType === "prescription" ? (
        <div>
          <div className="font-medium mb-2">Prescription:</div>
          <div className="bg-white text-gray-900 p-3 rounded border">
            {msg.prescription}
          </div>
        </div>
      ) : (
        <div>{msg.content}</div>
      )}
      <div className="text-xs mt-1 opacity-70">
        {new Date(msg.timestamp).toLocaleTimeString()}
      </div>

      {/* Delete button (only for sender) */}
      {msg.sender._id === chat.doctor._id && (
        <button
          onClick={() => handleDeleteMessage(msg._id)}
          className="absolute top-0 right-0 text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          ✕
        </button>
      )}
    </div>
  </div>
))}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={sending || !message.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            Send
          </button>
        </div>
      </div>

      {/* Prescription Modal */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Write Prescription</h3>
            </div>
            <div className="p-4">
              <textarea
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                placeholder="Write the prescription here..."
                className="w-full h-64 p-3 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="p-4 border-t flex gap-2">
              <button
                onClick={sendPrescription}
                disabled={sending || !prescription.trim()}
                className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
              >
                {sending ? "Sending..." : "Send Prescription"}
              </button>
              <button
                onClick={() => setShowPrescriptionModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

DoctorChat.getLayout = function PageLayout(page: React.ReactNode) {
  return <DoctorLayout>{page}</DoctorLayout>;
};

const ProtectedDoctorChat: NextPageWithLayout = withDoctorAuth(DoctorChat);
ProtectedDoctorChat.getLayout = DoctorChat.getLayout;

export default ProtectedDoctorChat;
