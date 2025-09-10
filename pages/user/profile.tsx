import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";

import {
  Bell,
  BellRing,
  Home,
  LogOut,
  Briefcase,
  MessageCircle,
  User,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  Building,
  Award,
  Users,
  FileText,
  TrendingUp,
  Activity
} from "lucide-react";
// Removed NextPageWithLayout import to avoid missing type errors
// Removed duplicate import to avoid name conflict with local NotificationBell component
// =============================================
// TYPE DEFINITIONS
// =============================================

interface Job {
  _id: string;
  jobTitle: string;
  companyName: string;
  location: string;
  salary: string;
  jobType: string;
  qualification: string;
  department: string;
  workingDays: string;
  jobTiming: string;
  establishment: string;
  languagesPreferred: string[];
  perks: string[];
  skills: string[];
  description: string;
  isActive: boolean;
}

interface ApplicantInfo {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
}

interface AppliedJob {
  _id: string;
  jobId: Job | null;
  applicantInfo?: ApplicantInfo;
  status: string;
  createdAt: string;
}

interface Reply {
  _id: string;
  user?: string | { _id: string };
  username: string;
  text: string;
  createdAt: string;
}

interface CommentWithReplies {
  blogId: string;
  blogTitle: string;
  blogAuthor?: { _id?: string } | string;
  commentId: string;
  commentText: string;
  commentCreatedAt: string;
  replies: Reply[];
}

interface CommentsResponse {
  success: boolean;
  commentsWithReplies?: CommentWithReplies[];
  error?: string;
}

interface ChatMessage {
  _id: string;
  senderRole: "user" | "doctor";
  messageType: "text" | "prescription";
  content?: string;
  prescription?: string;
  timestamp: string;
}

interface PrescriptionRequest {
  _id: string;
  healthIssue: string;
  status: string;
}

interface Chat {
  _id: string;
  doctor: { name: string };
  prescriptionRequest?: PrescriptionRequest;
  messages: ChatMessage[];
}

interface ChatsResponse {
  success: boolean;
  data: Chat[];
}

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  relatedBlog?: string;
  relatedJob?: string;
  relatedComment?: string;
  isRead: boolean;
  createdAt: string;
}

interface Statistics {
  jobs: {
    total: number;
    active: number;
    pending: number;
    approved: number;
  };
  comments: {
    total: number;
    withReplies: number;
    totalReplies: number;
  };
  chats: {
    total: number;
    active: number;
    completed: number;
  };
}

type TabType = 'jobs' | 'comments' | 'chats';

// =============================================
// UTILITY FUNCTIONS
// =============================================

const decodeUserIdFromToken = (token: string): string | null => {
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return null;
    const payloadJson = typeof window !== 'undefined'
      ? atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'))
      : Buffer.from(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const payload = JSON.parse(payloadJson);
    return payload?.userId || null;
  } catch {
    return null;
  }
};

const getStatusColor = (status: string): string => {
  const statusColors = {
    pending: 'text-yellow-400 bg-yellow-400/10',
    approved: 'text-green-400 bg-green-400/10',
    rejected: 'text-red-400 bg-red-400/10',
    active: 'text-blue-400 bg-blue-400/10',
    completed: 'text-green-400 bg-green-400/10',
    default: 'text-gray-400 bg-gray-400/10'
  };

  return statusColors[status.toLowerCase() as keyof typeof statusColors] || statusColors.default;
};

const calculateStatistics = (
  appliedJobs: AppliedJob[],
  comments: CommentWithReplies[],
  chats: Chat[]
): Statistics => ({
  jobs: {
    total: appliedJobs.length,
    active: appliedJobs.filter(job => job.jobId?.isActive).length,
    pending: appliedJobs.filter(job => job.status === 'pending').length,
    approved: appliedJobs.filter(job => job.status === 'approved').length
  },
  comments: {
    total: comments.length,
    withReplies: comments.filter(comment => comment.replies.length > 0).length,
    totalReplies: comments.reduce((sum, comment) => sum + comment.replies.length, 0)
  },
  chats: {
    total: chats.length,
    active: chats.filter(chat => chat.prescriptionRequest?.status === 'active').length,
    completed: chats.filter(chat => chat.prescriptionRequest?.status === 'completed').length
  }
});

// =============================================
// SUB-COMPONENTS
// =============================================

const LoadingSpinner = ({ text }: { text: string }) => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2D9AA5]"></div>
    <span className="ml-3 text-gray-400">{text}</span>
  </div>
);

const EmptyState = ({
  icon: Icon,
  title,
  description
}: {
  icon: any;
  title: string;
  description: string;
}) => (
  <div className="text-center py-12">
    <Icon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
    <p className="text-gray-400 text-lg">{title}</p>
    <p className="text-gray-500 mt-2">{description}</p>
  </div>
);

const StatisticCard = ({
  title,
  value,
  icon: Icon,
  subtitle,
  subtitleIcon: SubtitleIcon
}: {
  title: string;
  value: number;
  icon: any;
  subtitle: string;
  subtitleIcon: any;
}) => (
  <div className="bg-[#2D9AA5]/10 border border-[#2D9AA5]/20 rounded-xl p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-white text-2xl font-bold">{value}</p>
      </div>
      <Icon className="w-8 h-8 text-[#2D9AA5]" />
    </div>
    <div className="mt-4 flex items-center">
      <SubtitleIcon className="w-4 h-4 text-green-400 mr-1" />
      <span className="text-green-400 text-sm">{subtitle}</span>
    </div>
  </div>
);

const NotificationBell = ({
  notifications,
  showNotifications,
  setShowNotifications,
  handleNotificationClick,
  clearAllNotifications,
  notificationsLoading,
  notificationsError,
  refreshNotifications
}: {
  notifications: Notification[];
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  handleNotificationClick: (notification: Notification) => void;
  clearAllNotifications: () => void;
  notificationsLoading: boolean;
  notificationsError: string | null;
  refreshNotifications: () => void;
}) => {
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-white hover:bg-white/10 rounded-full transition-colors"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-6 h-6 animate-bounce" />
        ) : (
          <Bell className="w-6 h-6" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-[#18232b] border border-[#2D9AA5]/20 rounded-lg shadow-2xl z-50">
          <div className="p-4 border-b border-[#2D9AA5]/20 flex justify-between items-center">
            <h3 className="text-white font-semibold">Notifications</h3>
            <div className="flex items-center space-x-2">
              {notificationsError && (
                <button
                  onClick={refreshNotifications}
                  className="text-[#2D9AA5] text-xs hover:text-white transition-colors"
                >
                  Retry
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="text-[#2D9AA5] text-sm hover:text-white transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notificationsLoading ? (
              <div className="p-4 text-gray-400 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#2D9AA5] mr-2"></div>
                Loading...
              </div>
            ) : notificationsError ? (
              <div className="p-4">
                <p className="text-red-400 text-sm mb-2">Failed to load notifications</p>
                <p className="text-gray-500 text-xs mb-2">{notificationsError}</p>
                <button
                  onClick={refreshNotifications}
                  className="text-[#2D9AA5] text-sm hover:text-white transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-gray-400">No notifications</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 border-b border-[#2D9AA5]/10 hover:bg-[#2D9AA5]/10 transition-colors cursor-pointer ${!notification.isRead ? 'bg-[#2D9AA5]/5' : ''
                    }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!notification.isRead ? 'bg-[#2D9AA5]' : 'bg-gray-500'}`} />
                    <div className="flex-1">
                      <h4 className="text-white font-medium text-sm">{notification.title}</h4>
                      <p className="text-gray-400 text-sm mt-1">{notification.message}</p>
                      <p className="text-gray-500 text-xs mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const TabNavigation = ({
  activeTab,
  setActiveTab,
  statistics
}: {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  statistics: Statistics;
}) => {
  const tabs = [
    {
      id: 'jobs' as TabType,
      icon: Briefcase,
      label: `Applied Jobs (${statistics.jobs.total})`
    },
    {
      id: 'comments' as TabType,
      icon: MessageCircle,
      label: `Comments (${statistics.comments.total})`
    },
    {
      id: 'chats' as TabType,
      icon: Users,
      label: `Doctor Chats (${statistics.chats.total})`
    }
  ];

  return (
    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-1 mb-8 bg-[#2D9AA5]/10 p-2 rounded-xl">
      {tabs.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all ${activeTab === id
              ? 'bg-[#2D9AA5] text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-[#2D9AA5]/20'
            }`}
        >
          <Icon className="w-5 h-5" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
};

const JobCard = ({
  application
}: {
  application: AppliedJob
}) => {
  const job = application.jobId;
  const applicant = application.applicantInfo || {};

  if (!job) return null;

  return (
    <div className="bg-[#2D9AA5]/5 border border-[#2D9AA5]/20 rounded-xl p-6 hover:bg-[#2D9AA5]/10 transition-colors">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-start gap-3 mb-2">
            <h3 className="text-xl font-semibold text-white">{job.jobTitle}</h3>
            {!job.isActive && (
              <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                Expired
              </span>
            )}
          </div>
          <div className="flex items-center text-gray-400 text-sm mb-3">
            <Building className="w-4 h-4 mr-2" />
            <span>{job.companyName}</span>
            <MapPin className="w-4 h-4 ml-4 mr-2" />
            <span>{job.location}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
            {application.status}
          </span>
        </div>
      </div>

      {/* Job Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div className="flex items-center text-sm text-gray-300">
          <DollarSign className="w-4 h-4 mr-2 text-[#2D9AA5]" />
          <span>{job.salary}</span>
        </div>
        <div className="flex items-center text-sm text-gray-300">
          <Clock className="w-4 h-4 mr-2 text-[#2D9AA5]" />
          <span>{job.jobTiming}</span>
        </div>
        <div className="flex items-center text-sm text-gray-300">
          <Calendar className="w-4 h-4 mr-2 text-[#2D9AA5]" />
          <span>{job.workingDays}</span>
        </div>
        <div className="flex items-center text-sm text-gray-300">
          <Award className="w-4 h-4 mr-2 text-[#2D9AA5]" />
          <span>{job.qualification}</span>
        </div>
        <div className="flex items-center text-sm text-gray-300">
          <Building className="w-4 h-4 mr-2 text-[#2D9AA5]" />
          <span>{job.department}</span>
        </div>
        <div className="flex items-center text-sm text-gray-300">
          <FileText className="w-4 h-4 mr-2 text-[#2D9AA5]" />
          <span>{job.jobType}</span>
        </div>
      </div>

      {/* Skills and Languages */}
      <div className="space-y-3 mb-4">
        {job.skills.length > 0 && (
          <div>
            <span className="text-gray-400 text-sm font-medium">Skills: </span>
            <div className="flex flex-wrap gap-2 mt-1">
              {job.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-[#2D9AA5]/20 text-[#2D9AA5] text-xs rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {job.languagesPreferred.length > 0 && (
          <div>
            <span className="text-gray-400 text-sm font-medium">Languages: </span>
            <span className="text-gray-300 text-sm">{job.languagesPreferred.join(", ")}</span>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="mb-4">
        <p className="text-gray-300 text-sm leading-relaxed">{job.description}</p>
      </div>

      {/* Application Info */}
      <div className="bg-[#18232b]/50 rounded-lg p-4 border border-[#2D9AA5]/10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h4 className="text-white font-medium mb-2">Application Details</h4>
            <p className="text-gray-400 text-sm">Applied: {new Date(application.createdAt).toLocaleDateString()}</p>
            <p className="text-gray-400 text-sm">Status: {application.status}</p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">Applicant Info</h4>
            <p className="text-gray-400 text-sm">Name: {applicant.name}</p>
            <p className="text-gray-400 text-sm">Email: {applicant.email}</p>
            <p className="text-gray-400 text-sm">Phone: {applicant.phone}</p>
            <p className="text-gray-400 text-sm">Role: {applicant.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const CommentCard = ({
  comment
}: {
  comment: CommentWithReplies
}) => {
  const { blogId, blogTitle, blogAuthor, commentId, commentText, commentCreatedAt, replies } = comment;

  return (
    <div className="bg-[#2D9AA5]/5 border border-[#2D9AA5]/20 rounded-xl p-6 hover:bg-[#2D9AA5]/10 transition-colors">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-white mb-2">{blogTitle}</h3>
        <p className="text-gray-400 text-sm mb-3">
          Commented on: {new Date(commentCreatedAt).toLocaleString()}
        </p>
        <div className="bg-[#18232b]/50 rounded-lg p-4 border border-[#2D9AA5]/10">
          <p className="text-gray-300">{commentText}</p>
        </div>
      </div>

      <div className="ml-6">
        <h4 className="text-white font-medium mb-3 flex items-center">
          <MessageCircle className="w-4 h-4 mr-2 text-[#2D9AA5]" />
          Replies ({replies.length})
        </h4>
        {replies.length === 0 ? (
          <p className="text-gray-500 italic">No replies yet.</p>
        ) : (
          <div className="space-y-3">
            {replies.map(reply => {
              const isAuthorReply = blogAuthor && reply.user &&
                String(reply.user) === String((blogAuthor as any)?._id || blogAuthor);

              return (
                <div
                  key={reply._id}
                  className={`p-4 rounded-lg border-l-4 ${isAuthorReply
                      ? 'border-[#2D9AA5] bg-[#2D9AA5]/10'
                      : 'border-gray-600 bg-[#18232b]/30'
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className={`font-semibold ${isAuthorReply ? 'text-[#2D9AA5]' : 'text-white'}`}>
                      {reply.username}
                      {isAuthorReply && <span className="text-sm font-normal ml-2">(author)</span>}
                    </p>
                    <span className="text-xs text-gray-500">
                      {new Date(reply.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-300">{reply.text}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const ChatCard = ({
  chat,
  router
}: {
  chat: Chat;
  router: any;
}) => (
  <div className="bg-[#2D9AA5]/5 border border-[#2D9AA5]/20 rounded-xl p-6 hover:bg-[#2D9AA5]/10 transition-colors">
    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6">
      <div className="flex-1">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 bg-[#2D9AA5]/20 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-[#2D9AA5]" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Dr. {chat.doctor.name}</h3>
            <p className="text-gray-400 text-sm">Medical Consultation</p>
          </div>
        </div>

        {chat.prescriptionRequest ? (
          <div className="bg-[#18232b]/50 rounded-lg p-4 border border-[#2D9AA5]/10 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm font-medium">Health Issue:</p>
                <p className="text-white">{chat.prescriptionRequest.healthIssue}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm font-medium">Status:</p>
                <span className={`inline-flex px-2 py-1 rounded-full text-sm ${getStatusColor(chat.prescriptionRequest.status)}`}>
                  {chat.prescriptionRequest.status}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
            <p className="text-red-400 text-sm">No prescription request yet</p>
          </div>
        )}
      </div>

      <button
        onClick={() => router.push(`/user/chat/${chat.prescriptionRequest?._id}`)}
        className="px-6 py-2 bg-[#2D9AA5] text-white rounded-lg hover:bg-[#2D9AA5]/80 transition-colors font-medium"
      >
        Continue Chat
      </button>
    </div>

    {/* Recent Messages Preview */}
    <div className="space-y-3">
      <h4 className="text-white font-medium flex items-center">
        <MessageCircle className="w-4 h-4 mr-2 text-[#2D9AA5]" />
        Recent Messages
      </h4>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {chat.messages.slice(-3).map((msg) => (
          <div
            key={msg._id}
            className={`p-3 rounded-lg ${msg.senderRole === "user"
                ? "bg-[#2D9AA5]/20 ml-6"
                : "bg-[#18232b]/50 mr-6 border border-[#2D9AA5]/10"
              }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-medium text-sm text-white">
                {msg.senderRole === "user" ? "You" : `Dr. ${chat.doctor.name}`}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
            {msg.messageType === "prescription" ? (
              <div>
                <div className="flex items-center mb-2">
                  <FileText className="w-4 h-4 text-[#2D9AA5] mr-2" />
                  <span className="font-medium text-sm text-[#2D9AA5]">Prescription:</span>
                </div>
                <div className="bg-[#2D9AA5]/10 p-3 rounded border border-[#2D9AA5]/20">
                  <p className="text-gray-300 text-sm">{msg.prescription}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-300 text-sm">{msg.content}</p>
            )}
          </div>
        ))}

        {chat.messages.length > 3 && (
          <div className="text-center">
            <button
              onClick={() => router.push(`/user/chat/${chat.prescriptionRequest?._id}`)}
              className="text-[#2D9AA5] text-sm hover:text-white transition-colors"
            >
              View all {chat.messages.length} messages...
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
);

// =============================================
// CUSTOM HOOKS
// =============================================

const useNotifications = (router: any) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchNotifications = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    if (!token) {
      setNotificationsError("Authentication token not found");
      return;
    }

    try {
      const uid = decodeUserIdFromToken(token);
      if (!uid) {
        setNotificationsError("Invalid authentication token");
        return;
      }
      setUserId(uid);
    } catch (e) {
      setNotificationsError("Failed to read authentication token");
      return;
    }

    setNotificationsLoading(true);
    setNotificationsError(null);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const uid = userId || ((): string | null => {
        try {
          const t = localStorage.getItem("token");
          if (!t) return null;
          return decodeUserIdFromToken(t);
        } catch {
          return null;
        }
      })();
      const response = await axios.get<any>(`${apiBase}/api/push-notification/reply-notifications`, {
        params: { userId: uid || undefined },
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });

      if (response.data && Array.isArray(response.data.notifications)) {
        setNotifications(response.data.notifications);
      } else if (Array.isArray(response.data)) {
        setNotifications(response.data);
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        setNotifications(response.data.data);
      } else {
        setNotifications([]);
      }
    } catch (error: any) {
      console.error("Failed to fetch notifications", error);

      if (error.response?.status === 404) {
        setNotificationsError("Notifications API not found. Feature may not be available.");
        setNotifications([]);
      } else if (error.response?.status === 401) {
        setNotificationsError("Authentication failed. Please log in again.");
        setNotifications([]);
      } else if (error.response?.status === 500) {
        setNotificationsError("Server error. Please try again later.");
        setNotifications([]);
      } else if (error.code === 'ERR_NETWORK') {
        setNotificationsError("Network error. Please check your connection.");
        setNotifications([]);
      } else {
        setNotificationsError("Failed to load notifications.");
        setNotifications([]);
      }
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    const token = localStorage.getItem("token");

    // Mark as read if possible (ignore errors if API doesn't exist)
    if (token) {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
        await axios.post<any>(`${apiBase}/api/push-notification/mark-read`, {
          ids: [notification._id]
        }, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          withCredentials: true
        });

        setNotifications(prev =>
          prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n)
        );
      } catch (error) {
        console.warn("Failed to mark notification as read", error);
        // Continue with navigation even if marking as read fails
      }
    }

    // Handle navigation based on notification type
    try {
      if (notification.type === "blog-reply" && notification.relatedBlog) {
        const url = notification.relatedComment
          ? `/blogs/${notification.relatedBlog}#${notification.relatedComment}`
          : `/blogs/${notification.relatedBlog}`;
        router.push(url);
      } else if (notification.type === "job-status" && notification.relatedJob) {
        router.push(`/job-details/${notification.relatedJob}`);
      } else if (notification.link) {
        // Fallback to link property
        if (notification.link.startsWith('http')) {
          window.open(notification.link, '_blank');
        } else {
          router.push(notification.link);
        }
      } else {
        console.log("No navigation configured for this notification type:", notification.type);
      }
    } catch (navigationError) {
      console.error("Navigation error:", navigationError);
    }

    // Close notifications dropdown
    setShowNotifications(false);
  };

  const clearAllNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const uid = userId;
      await axios.delete<any>(`${apiBase}/api/push-notification/clearAll-notification`, {
        params: { userId: uid || undefined },
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setNotifications([]);
    } catch (error) {
      console.error("Failed to clear notifications", error);
      // Optionally clear locally even if API fails
      setNotifications([]);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Optional: Set up polling for real-time notifications
    const interval = setInterval(fetchNotifications, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return {
    notifications,
    showNotifications,
    setShowNotifications,
    notificationsLoading,
    notificationsError,
    handleNotificationClick,
    clearAllNotifications,
    refreshNotifications: fetchNotifications
  };
};

const useApiData = () => {
  const [appliedJobs, setAppliedJobs] = useState<AppliedJob[]>([]);
  const [commentsWithReplies, setCommentsWithReplies] = useState<CommentWithReplies[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [appliedJobsLoading, setAppliedJobsLoading] = useState(false);

  // Fetch applied jobs
  useEffect(() => {
    const fetchAppliedJobs = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      setAppliedJobsLoading(true);
      try {
        const response = await axios.get<AppliedJob[]>("/api/users/applied-jobs", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAppliedJobs(response.data || []);
      } catch (error) {
        console.error("Failed to fetch applied jobs", error);
      } finally {
        setAppliedJobsLoading(false);
      }
    };
    fetchAppliedJobs();
  }, []);

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      setLoadingComments(true);
      setCommentsError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        setCommentsError("You must be logged in to see your comments.");
        setLoadingComments(false);
        return;
      }
      try {
        const res = await axios.get<CommentsResponse>("/api/users/comments-with-replies", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          setCommentsWithReplies(res.data.commentsWithReplies || []);
        } else {
          setCommentsError(res.data.error || "Failed to fetch comments");
        }
      } catch (err) {
        setCommentsError("Network error while fetching comments");
      } finally {
        setLoadingComments(false);
      }
    };
    fetchComments();
  }, []);

  // Fetch chats
  useEffect(() => {
    const fetchChats = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      setChatsLoading(true);
      try {
        const response = await axios.get<ChatsResponse>("/api/chat/user-chats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setChats((response.data.data || []).filter((chat) => chat.prescriptionRequest));
        }
      } catch (error) {
        console.error("Failed to fetch chats", error);
      } finally {
        setChatsLoading(false);
      }
    };
    fetchChats();
  }, []);

  return {
    appliedJobs,
    commentsWithReplies,
    chats,
    loadingComments,
    commentsError,
    chatsLoading,
    appliedJobsLoading
  };
};

// =============================================
// MAIN COMPONENT
// =============================================

const AppliedJobs = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('jobs');

  // Custom hooks for data and notifications
  const {
    notifications,
    showNotifications,
    setShowNotifications,
    notificationsLoading,
    notificationsError,
    handleNotificationClick,
    clearAllNotifications,
    refreshNotifications
  } = useNotifications(router);

  const {
    appliedJobs,
    commentsWithReplies,
    chats,
    loadingComments,
    commentsError,
    chatsLoading,
    appliedJobsLoading
  } = useApiData();

  // Calculate statistics
  const statistics = calculateStatistics(appliedJobs, commentsWithReplies, chats);

  // Navigation handlers
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = '/';
  };

  const goHome = () => {
    router.push("/");
  };

  // Render functions for each tab
  const renderJobsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <Briefcase className="w-6 h-6 text-[#2D9AA5]" />
        <h2 className="text-2xl font-bold text-white">Jobs You've Applied To</h2>
      </div>

      {appliedJobsLoading ? (
        <LoadingSpinner text="Loading jobs..." />
      ) : appliedJobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No job applications yet."
          description="Start applying to see your applications here."
        />
      ) : (
        <div className="grid gap-6">
          {appliedJobs.map((application) => (
            <JobCard key={application._id} application={application} />
          ))}
        </div>
      )}
    </div>
  );

  const renderCommentsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <MessageCircle className="w-6 h-6 text-[#2D9AA5]" />
        <h2 className="text-2xl font-bold text-white">Your Comments and Replies</h2>
      </div>

      {loadingComments ? (
        <LoadingSpinner text="Loading comments..." />
      ) : commentsError ? (
        <div className="text-center py-12">
          <p className="text-red-400 text-lg">Error: {commentsError}</p>
        </div>
      ) : commentsWithReplies.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No comments found."
          description="Start commenting on blogs to see them here."
        />
      ) : (
        <div className="space-y-6">
          {commentsWithReplies.map((comment) => (
            <CommentCard key={comment.commentId} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );

  const renderChatsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <Users className="w-6 h-6 text-[#2D9AA5]" />
        <h2 className="text-2xl font-bold text-white">Your Chat History with Doctors</h2>
      </div>

      {chatsLoading ? (
        <LoadingSpinner text="Loading chat history..." />
      ) : chats.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No chat history yet."
          description="Start consulting with doctors to see your chats here."
        />
      ) : (
        <div className="grid gap-6">
          {chats.map((chat) => (
            <ChatCard key={chat._id} chat={chat} router={router} />
          ))}
        </div>
      )}
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'jobs':
        return renderJobsTab();
      case 'comments':
        return renderCommentsTab();
      case 'chats':
        return renderChatsTab();
      default:
        return renderJobsTab();
    }
  };

  return (
    <div className="min-h-screen bg-[#18232b]">
      {/* Header */}
      <header className="bg-[#2D9AA5] shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="text-white font-bold text-xl">Zeva User Dashboard</div>
            </div>

            <div className="flex items-center space-x-4">
              <NotificationBell
                notifications={notifications}
                showNotifications={showNotifications}
                setShowNotifications={setShowNotifications}
                handleNotificationClick={handleNotificationClick}
                clearAllNotifications={clearAllNotifications}
                notificationsLoading={notificationsLoading}
                notificationsError={notificationsError}
                refreshNotifications={refreshNotifications}
              />

              <button
                onClick={goHome}
                className="group relative flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-out border border-slate-600/50 hover:border-slate-500 backdrop-blur-sm"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl"></div>
                <Home className="w-4 h-4 relative z-10 group-hover:text-blue-200 transition-colors" />
                <span className="hidden sm:inline relative z-10 font-medium group-hover:text-blue-200 transition-colors">Home</span>
              </button>

              <button
                onClick={handleLogout}
                className="group relative flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-out border border-red-500/50 hover:border-red-400 backdrop-blur-sm"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl"></div>
                <LogOut className="w-4 h-4 relative z-10 group-hover:text-red-200 transition-colors" />
                <span className="hidden sm:inline relative z-10 font-medium group-hover:text-red-200 transition-colors">Logout</span>
              </button>

            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatisticCard
            title="Total Applications"
            value={statistics.jobs.total}
            icon={Briefcase}
            subtitle={`${statistics.jobs.active} Active`}
            subtitleIcon={TrendingUp}
          />
          <StatisticCard
            title="Comments"
            value={statistics.comments.total}
            icon={MessageCircle}
            subtitle={`${statistics.comments.totalReplies} Replies`}
            subtitleIcon={Activity}
          />
          <StatisticCard
            title="Doctor Chats"
            value={statistics.chats.total}
            icon={Users}
            subtitle={`${statistics.chats.active} Active`}
            subtitleIcon={Activity}
          />
        </div>

        {/* Tab Navigation */}
        <TabNavigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          statistics={statistics}
        />

        {/* Tab Content */}
        {renderActiveTab()}
      </main>
    </div>
  )
};

AppliedJobs.getLayout = function PageLayout(page: React.ReactNode) {
  return page;
};

export default AppliedJobs;