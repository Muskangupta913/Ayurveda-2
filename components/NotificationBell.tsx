import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";

let socket;

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const decoded = jwtDecode(token);
    const userId = decoded.userId;

    // 1️⃣ Fetch existing notifications
    fetch(`/api/push-notification/reply-notifications?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        setNotifications(data.notifications || []);
      })
      .catch(err => console.error("Error fetching notifications:", err));

    // 2️⃣ Socket.IO connection
    socket = io({ path: "/api/push-notification/socketio" });
    socket.emit("register", userId);

    // Receive new notifications live
    socket.on("newNotification", (notif) => {
      if (Notification.permission === "granted") {
        new Notification("New Reply", { body: notif.message });
      }
      setNotifications(prev => [{ ...notif, isRead: false }, ...prev]);
    });

    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  // 3️⃣ Mark all as read when dropdown opens
  const handleToggleDropdown = () => {
    const newState = !showDropdown;
    setShowDropdown(newState);

    if (newState && unreadCount > 0) {
      fetch(`/api/push-notification/mark-read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: notifications.filter(n => !n.isRead).map(n => n._id) })
      }).then(() => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      });
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggleDropdown}
        className="relative p-2"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg z-50">
          {notifications.length === 0 ? (
            <p className="p-4 text-gray-500">No notifications</p>
          ) : (
            notifications.map((n, i) => (
              <div
                key={n._id || i}
                className={`p-3 border-b cursor-pointer ${
                  n.isRead ? "bg-gray-100" : "bg-white"
                } hover:bg-gray-50`}
                onClick={() => {
                  window.location.href = `/blogs/${n.relatedBlog}#${n.relatedComment}`;
                }}
              >
                <p className="text-sm">{n.message}</p>
                <p className="text-xs text-gray-400">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
