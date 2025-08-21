import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import axios from "axios";

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

function UserChat() {
  const router = useRouter();
  const { requestId } = router.query;
  const [chat, setChat] = useState<Chat | null>(null);
  const [prescriptionRequest, setPrescriptionRequest] =
    useState<PrescriptionRequestLite | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (requestId) {
      fetchChat();
      // Start polling every 5s to receive new messages/prescriptions
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      pollingRef.current = setInterval(() => {
        fetchChat(true);
      }, 5000);
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [requestId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  const fetchChat = async (isPoll = false) => {
    try {
      if (!isPoll) setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `/api/chat/get-messages?prescriptionRequestId=${requestId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const { chat: chatData, prescriptionRequest: pr } = response.data.data;
        setChat(chatData);
        setPrescriptionRequest(pr);
      }
    } catch (error) {
      if (!isPoll) console.error("Failed to fetch chat:", error);
    } finally {
      if (!isPoll) setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    setSending(true);
    try {
      const token = localStorage.getItem("token");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading chat...</div>
      </div>
    );
  }

  // If no chat yet, allow user to start it and show request details
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
              onClick={() => router.push("/user/profile")}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Back to Profile
            </button>
          </div>
        </div>

        {/* Empty state */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          <div className="text-center text-gray-500 mt-10">
            No messages yet. You can start the conversation or wait for the
            doctor's prescription.
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
              Chat with Dr. {chat.doctor.name}
            </h1>
            <p className="text-sm text-gray-600">
              Health Issue: {chat.prescriptionRequest.healthIssue}
            </p>
            <p className="text-sm text-gray-600">
              Status: {chat.prescriptionRequest.status}
            </p>
          </div>
          <button
            onClick={() => router.push("/user/profile")}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Back to Profile
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {chat.messages.map((msg) => (
          <div
            key={msg._id}
            className={`flex ${
              msg.senderRole === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.senderRole === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-900 border"
              }`}
            >
              {msg.messageType === "prescription" ? (
                <div>
                  <div className="font-medium mb-2">
                    Prescription from Dr. {chat.doctor.name}:
                  </div>
                  <pre className="bg-yellow-50 text-gray-900 p-3 rounded border border-yellow-200 whitespace-pre-wrap font-mono text-sm">
                    {msg.prescription}
                  </pre>
                </div>
              ) : (
                <div>{msg.content}</div>
              )}
              <div className="text-xs mt-1 opacity-70">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
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
    </div>
  );
}

export default UserChat;
