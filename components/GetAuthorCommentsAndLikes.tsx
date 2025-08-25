import React, { useEffect, useState } from "react";
import {
  ThumbsUp,
  MessageCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Reply,
  Trash2,
  Send,
  Filter,
  Calendar,
  MoreVertical,
  X,
  Download,
  SortAsc,
  SortDesc,
  Clock,
  AlertCircle,
  Star,
  RefreshCw,
} from "lucide-react";
import parse from "html-react-parser";

type Reply = {
  _id: string;
  user?: string;
  username: string;
  text: string;
  createdAt: string;
};

type Comment = {
  _id: string;
  username: string;
  text: string;
  createdAt: string;
  replies?: Reply[];
};

type Blog = {
  _id: string;
  title: string;
  likesCount: number;
  commentsCount: number;
  comments: Comment[];
  createdAt: string;
  postedBy?: { _id: string } | string;
};

interface Props {
  tokenKey: "clinicToken" | "doctorToken";
}

type FilterOption = "all" | "today" | "week" | "month" | "year";
type SortOption = "newest" | "oldest" | "most_liked" | "most_commented";

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}> = ({ title, value, icon, trend, trendUp }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {trend && (
          <div
            className={`flex items-center mt-2 text-sm ${
              trendUp ? "text-green-600" : "text-red-600"
            }`}
          >
            <TrendingUp
              size={14}
              className={`mr-1 ${!trendUp && "rotate-180"}`}
            />
            {trend}
          </div>
        )}
      </div>
      <div className="p-3 bg-blue-50 rounded-lg">{icon}</div>
    </div>
  </div>
);

const EngagementChart: React.FC<{
  totalLikes: number;
  totalComments: number;
}> = ({ totalLikes, totalComments }) => {
  const maxValue = Math.max(totalLikes, totalComments, 100);
  const likesWidth = totalLikes > 0 ? (totalLikes / maxValue) * 100 : 0;
  const commentsWidth =
    totalComments > 0 ? (totalComments / maxValue) * 100 : 0;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Engagement Overview
        </h3>
        <BarChart3 size={20} className="text-blue-600" />
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <ThumbsUp size={16} className="text-blue-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">Likes</span>
            </div>
            <span className="text-sm font-bold text-gray-900">
              {totalLikes}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${likesWidth}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <MessageCircle size={16} className="text-green-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">
                Comments
              </span>
            </div>
            <span className="text-sm font-bold text-gray-900">
              {totalComments}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${commentsWidth}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const CommentsPopup: React.FC<{
  blog: Blog;
  isOpen: boolean;
  onClose: () => void;
  onReply: (blogId: string, commentId: string, text: string) => Promise<void>;
  onDelete: (blogId: string, commentId: string) => Promise<void>;
}> = ({ blog, isOpen, onClose, onReply, onDelete }) => {
  const [replyTexts, setReplyTexts] = useState<{ [key: string]: string }>({});
  const [activeReply, setActiveReply] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReply = async (commentId: string) => {
    const text = replyTexts[commentId]?.trim();
    if (!text) return;

    await onReply(blog._id, commentId, text);
    setReplyTexts((prev) => ({ ...prev, [commentId]: "" }));
    setActiveReply(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Comments</h2>
            <p className="text-sm text-gray-500 mt-1">{blog.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {blog.comments.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No comments yet
              </h3>
              <p className="text-gray-500">
                Be the first to start a conversation!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {blog.comments.map((comment) => (
                <div key={comment._id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {comment.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {comment.username}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onDelete(blog._id, comment._id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <p className="text-gray-700 mb-4">{comment.text}</p>

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {comment.replies.map((reply) => (
                        <div
                          key={reply._id}
                          className="ml-6 bg-white rounded-lg p-3 border-l-2 border-blue-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-medium">
                                  {reply.username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {reply.username}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(reply.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => onDelete(blog._id, reply._id)}
                              className="p-1 text-red-400 hover:text-red-600"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <p className="text-sm text-gray-700">{reply.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Input */}
                  <div className="border-t border-gray-200 pt-3">
                    {activeReply === comment._id ? (
                      <div className="space-y-3">
                        <textarea
                          placeholder="Write your reply..."
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={3}
                          value={replyTexts[comment._id] || ""}
                          onChange={(e) =>
                            setReplyTexts((prev) => ({
                              ...prev,
                              [comment._id]: e.target.value,
                            }))
                          }
                        />
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setActiveReply(null)}
                            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleReply(comment._id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveReply(comment._id)}
                        className="flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <Reply size={14} className="mr-1" />
                        Reply
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// BlogDetailsModal component
const BlogDetailsModal = ({ isOpen, onClose, blog }) => {
  if (!isOpen || !blog) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 relative overflow-y-auto max-h-[90vh]">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <X size={24} />
        </button>
        {blog.image && (
          <a href={blog.image} target="_blank" rel="noopener noreferrer">
            <img
              src={blog.image}
              alt={blog.title}
              className="w-full h-64 object-cover rounded mb-4"
            />
          </a>
        )}
        <h2 className="text-2xl font-bold mb-2">{blog.title}</h2>
        <p className="text-gray-600 mb-2">
          By {blog.postedBy?.name || "Author"} |{" "}
          {new Date(blog.createdAt).toLocaleString()}
        </p>
        <div className="mb-4">{parse(blog.content || "")}</div>
        {blog.youtubeUrl && (
          <div className="mb-4">
            <iframe
              width="100%"
              height="315"
              src={blog.youtubeUrl}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
            <a
              href={blog.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline block mt-2"
            >
              Watch on YouTube
            </a>
          </div>
        )}
        <div className="flex gap-4 mt-4">
          <span className="text-sm text-gray-700">
            Likes: {blog.likesCount}
          </span>
          <span className="text-sm text-gray-700">
            Comments: {blog.comments?.length || 0}
          </span>
        </div>
      </div>
    </div>
  );
};

const BlogAnalytics: React.FC<Props> = ({ tokenKey }) => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCommentsPopup, setShowCommentsPopup] = useState(false);
  const [popupBlog, setPopupBlog] = useState<Blog | null>(null);
  const [filterOption, setFilterOption] = useState<FilterOption>("all");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsBlog, setDetailsBlog] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const blogsPerPage = 12;

  useEffect(() => {
    fetchBlogs();
  }, [tokenKey]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [blogs, searchTerm, filterOption, sortOption]);

  const fetchBlogs = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem(tokenKey);

    if (!token) {
      setError("You must be logged in to view your blogs.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/blog/getAuthorCommentsAndLikes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to fetch blogs");
      } else {
        setBlogs(data.blogs);
      }
    } catch {
      setError("Network error while fetching blogs");
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchBlogs();
    setRefreshing(false);
  };

  const applyFiltersAndSort = () => {
    let filtered = blogs.filter((blog) =>
      blog.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply date filter
    const now = new Date();
    switch (filterOption) {
      case "today":
        filtered = filtered.filter((blog) => {
          const blogDate = new Date(blog.createdAt);
          return blogDate.toDateString() === now.toDateString();
        });
        break;
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(
          (blog) => new Date(blog.createdAt) >= weekAgo
        );
        break;
      case "month":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(
          (blog) => new Date(blog.createdAt) >= monthAgo
        );
        break;
      case "year":
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(
          (blog) => new Date(blog.createdAt) >= yearAgo
        );
        break;
    }

    // Apply sorting
    switch (sortOption) {
      case "newest":
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "oldest":
        filtered.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case "most_liked":
        filtered.sort((a, b) => b.likesCount - a.likesCount);
        break;
      case "most_commented":
        filtered.sort((a, b) => b.commentsCount - a.commentsCount);
        break;
    }

    setFilteredBlogs(filtered);
    setCurrentPage(1);
  };

  const exportData = async () => {
    setIsExporting(true);
    try {
      const data = {
        exportDate: new Date().toISOString(),
        summary: {
          totalBlogs: blogs.length,
          totalLikes: blogs.reduce((sum, blog) => sum + blog.likesCount, 0),
          totalComments: blogs.reduce(
            (sum, blog) => sum + blog.commentsCount,
            0
          ),
          avgEngagement:
            blogs.length > 0
              ? (
                  blogs.reduce(
                    (sum, blog) => sum + blog.likesCount + blog.commentsCount,
                    0
                  ) / blogs.length
                ).toFixed(2)
              : 0,
        },
        blogs: blogs.map((blog) => ({
          title: blog.title,
          createdAt: blog.createdAt,
          likesCount: blog.likesCount,
          commentsCount: blog.commentsCount,
          totalEngagement: blog.likesCount + blog.commentsCount,
          comments: blog.comments.map((comment) => ({
            username: comment.username,
            text: comment.text,
            createdAt: comment.createdAt,
            repliesCount: comment.replies?.length || 0,
          })),
        })),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `blog-analytics-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      setError("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  const submitReply = async (
    blogId: string,
    commentId: string,
    text: string
  ) => {
    const token = localStorage.getItem(tokenKey);
    if (!token) {
      setError("You must be logged in to reply.");
      return;
    }

    try {
      const res = await fetch("/api/blog/addReply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ blogId, commentId, text }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed to add reply");
      } else {
        setBlogs((prevBlogs) =>
          prevBlogs.map((blog) => {
            if (blog._id !== blogId) return blog;
            return {
              ...blog,
              comments: blog.comments.map((comment) =>
                comment._id === commentId ? data.comment : comment
              ),
            };
          })
        );
      }
    } catch {
      setError("Network error while adding reply");
    }
  };

  const deleteComment = async (blogId: string, commentId: string) => {
    const token = localStorage.getItem(tokenKey);
    if (!token) {
      setError("You must be logged in to delete a comment.");
      return;
    }

    try {
      const res = await fetch("/api/blog/deleteComment", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ blogId, commentId }),
      });

      const data = await res.json();
      if (data.success) {
        setBlogs((prevBlogs) =>
          prevBlogs.map((blog) => {
            if (blog._id !== blogId) return blog;
            return {
              ...blog,
              comments: blog.comments
                .filter((comment) => comment._id !== commentId)
                .map((comment) => ({
                  ...comment,
                  replies:
                    comment.replies?.filter((r) => r._id !== commentId) || [],
                })),
            };
          })
        );
      } else {
        setError(data.error || "Failed to delete comment");
      }
    } catch {
      setError("Network error while deleting comment");
    }
  };

  const openCommentsPopup = (blog: Blog) => {
    setPopupBlog(blog);
    setShowCommentsPopup(true);
  };

  const totalLikes = blogs.reduce((sum, blog) => sum + blog.likesCount, 0);
  const totalComments = blogs.reduce(
    (sum, blog) => sum + blog.commentsCount,
    0
  );
  const avgEngagement =
    blogs.length > 0
      ? ((totalLikes + totalComments) / blogs.length).toFixed(1)
      : "0";

  const indexOfLastBlog = currentPage * blogsPerPage;
  const indexOfFirstBlog = indexOfLastBlog - blogsPerPage;
  const currentBlogs = filteredBlogs.slice(indexOfFirstBlog, indexOfLastBlog);
  const totalPages = Math.ceil(filteredBlogs.length / blogsPerPage);

  const filterOptions = [
    { value: "all", label: "All Time", icon: Clock },
    { value: "today", label: "Today", icon: Calendar },
    { value: "week", label: "Last Week", icon: Calendar },
    { value: "month", label: "Last Month", icon: Calendar },
    { value: "year", label: "Last Year", icon: Calendar },
  ];

  const sortOptions = [
    { value: "newest", label: "Newest First", icon: SortDesc },
    { value: "oldest", label: "Oldest First", icon: SortAsc },
    { value: "most_liked", label: "Most Liked", icon: ThumbsUp },
    { value: "most_commented", label: "Most Commented", icon: MessageCircle },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg border border-red-200 max-w-md">
          <div className="text-center">
            <div className="bg-red-100 rounded-full p-3 w-fit mx-auto mb-4">
              <AlertCircle size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex space-x-3 justify-center">
              <button
                onClick={fetchBlogs}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
              <button
                onClick={() => setError(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Blog Analytics
              </h1>
              <p className="text-gray-600 mt-1">
                Monitor and manage your blog performance
              </p>
<<<<<<< HEAD
              
              {/* Comments Preview */}
              {blog.comments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-black text-sm font-medium mb-2">Recent Comments:</h4>
                  {blog.comments.slice(0, 2).map(comment => (
                    <div key={comment._id} className="mb-2">
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-xs font-medium">{comment.username}</p>
                        <p className="text-xs text-gray-600 line-clamp-2">{comment.text}</p>
                        
                        {/* Replies */}
                        {comment.replies?.map(reply => (
                          <div key={reply._id} className="ml-4 mt-2 bg-white rounded p-2">
                            <p className="text-xs font-medium text-[#2D9AA5]">{reply.username}</p>
                            <p className="text-xs text-gray-600">{reply.text}</p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteComment(blog._id, reply._id);
                              }}
                              className="text-red-500 text-xs hover:underline mt-1"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                        
                        {/* Reply Input */}
                        <div className="mt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            placeholder="Reply..."
                            className="flex-1 text-xs border rounded px-2 py-1"
                            value={replyTexts[`${blog._id}_${comment._id}`] || ''}
                            onChange={(e) => handleReplyChange(blog._id, comment._id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                submitReply(blog._id, comment._id);
                              }
                            }}
                          />
                          <button
                            className="px-2 py-1 bg-[#2D9AA5] text-white rounded text-xs"
                            onClick={() => submitReply(blog._id, comment._id)}
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {blog.comments.length > 2 && (
                    <p className="text-xs text-gray-500">+{blog.comments.length - 2} more comments</p>
                  )}
=======
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={`mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Calendar size={16} className="mr-2" />
                  {
                    filterOptions.find((opt) => opt.value === filterOption)
                      ?.label
                  }
                </button>
                {showFilterDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    {filterOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilterOption(option.value as FilterOption);
                          setShowFilterDropdown(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                      >
                        <option.icon size={16} className="mr-2" />
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={exportData}
                disabled={isExporting}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Download size={16} className="mr-2" />
                {isExporting ? "Exporting..." : "Export Data"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Blogs"
            value={blogs.length}
            icon={<BarChart3 size={24} className="text-blue-600" />}
            trend="+12% from last month"
            trendUp={true}
          />
          <StatCard
            title="Total Likes"
            value={totalLikes}
            icon={<ThumbsUp size={24} className="text-blue-600" />}
            trend="+8% from last month"
            trendUp={true}
          />
          <StatCard
            title="Total Comments"
            value={totalComments}
            icon={<MessageCircle size={24} className="text-blue-600" />}
            trend="+15% from last month"
            trendUp={true}
          />
          <StatCard
            title="Avg Engagement"
            value={avgEngagement}
            icon={<Users size={24} className="text-blue-600" />}
            trend="+5% from last month"
            trendUp={true}
          />
        </div>

        {/* Engagement Chart */}
        <div className="mb-8">
          <EngagementChart
            totalLikes={totalLikes}
            totalComments={totalComments}
          />
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search blogs by title..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Filter size={16} className="mr-2" />
                  Sort:{" "}
                  {sortOptions.find((opt) => opt.value === sortOption)?.label}
                </button>
                {showSortDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortOption(option.value as SortOption);
                          setShowSortDropdown(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                      >
                        <option.icon size={16} className="mr-2" />
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-sm text-gray-500">
                Showing {currentBlogs.length} of {filteredBlogs.length} blogs
              </span>
            </div>
          </div>
        </div>

        {/* Blog Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {currentBlogs.map((blog) => (
            <div
              key={blog._id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1 mr-2">
                    {blog.title}
                  </h3>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreVertical size={16} className="text-gray-400" />
                  </button>
>>>>>>> f83a4b7bfdcee5c9bc3221732444cb0be71e9ecb
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1 text-blue-600">
                      <ThumbsUp size={16} />
                      <span className="text-sm font-medium">
                        {blog.likesCount}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-green-600">
                      <MessageCircle size={16} />
                      <span className="text-sm font-medium">
                        {blog.commentsCount}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(blog.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {/* Engagement Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Engagement</span>
                    <span>{blog.likesCount + blog.commentsCount}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          ((blog.likesCount + blog.commentsCount) /
                            Math.max(totalLikes + totalComments, 100)) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <button
                      className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      onClick={async () => {
                        if (tokenKey === "adminToken") {
                          alert("Hit the API to show blog details");
                        } else {
                          const token = localStorage.getItem(tokenKey);
                          if (!token) {
                            alert(
                              "You must be logged in to view blog details."
                            );
                            return;
                          }
                          setDetailsLoading(true);
                          try {
                            const res = await fetch(
                              `/api/blog/published?id=${blog._id}`,
                              {
                                headers: { Authorization: `Bearer ${token}` },
                              }
                            );
                            const data = await res.json();
                            if (data.success) {
                              setDetailsBlog(data.blog);
                              setDetailsModalOpen(true);
                            } else {
                              alert(
                                data.error || "Failed to fetch blog details"
                              );
                            }
                          } catch {
                            alert("Network error while fetching blog details");
                          } finally {
                            setDetailsLoading(false);
                          }
                        }
                      }}
                    >
                      <Eye size={14} className="mr-1" />
                      View Details
                    </button>
                    {blog.comments.length > 0 && (
                      <button
                        onClick={() => openCommentsPopup(blog)}
                        className="flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <MessageCircle size={14} className="mr-1" />
                        View All Comments
                      </button>
                    )}
                  </div>

                  {/* Performance Indicator */}
                  <div className="flex items-center">
                    {blog.likesCount + blog.commentsCount > avgEngagement ? (
                      <div className="flex items-center text-green-600">
                        <TrendingUp size={14} className="mr-1" />
                        <span className="text-xs font-medium">High</span>
                      </div>
                    ) : blog.likesCount + blog.commentsCount >
                      avgEngagement / 2 ? (
                      <div className="flex items-center text-yellow-600">
                        <TrendingUp size={14} className="mr-1" />
                        <span className="text-xs font-medium">Medium</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-400">
                        <TrendingUp size={14} className="mr-1 rotate-180" />
                        <span className="text-xs font-medium">Low</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Comments Preview */}
                {/* {blog.comments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <MessageCircle size={14} className="mr-1" />
                      Recent Activity
                    </h4>
                    <div className="space-y-2">
                      {blog.comments.slice(0, 2).map((comment) => (
                        <div
                          key={comment._id}
                          className="bg-gray-50 rounded-lg p-2"
                        >
                          <div className="flex items-start space-x-2">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-medium">
                                {comment.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900">
                                {comment.username}
                              </p>
                              <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                                {comment.text}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(
                                  comment.createdAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {blog.comments.length > 2 && (
                        <button
                          onClick={() => openCommentsPopup(blog)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          +{blog.comments.length - 2} more comments
                        </button>
                      )}
                    </div>
                  </div>
                )} */}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {indexOfFirstBlog + 1} to{" "}
                {Math.min(indexOfLastBlog, filteredBlogs.length)} of{" "}
                {filteredBlogs.length} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} className="mr-1" />
                  Previous
                </button>

                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg ${
                          currentPage === page
                            ? "bg-blue-600 text-white"
                            : "text-gray-500 hover:bg-gray-50 border border-gray-300"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight size={16} className="ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredBlogs.length === 0 && !loading && (
          <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
            <div className="bg-gray-100 rounded-full p-4 w-fit mx-auto mb-4">
              <BarChart3 size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || filterOption !== "all"
                ? "No blogs found"
                : "No blogs yet"}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterOption !== "all"
                ? "Try adjusting your search terms or filters."
                : "Start creating blogs to see analytics here."}
            </p>
            {(searchTerm || filterOption !== "all") && (
              <div className="flex justify-center space-x-3">
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Clear Search
                  </button>
                )}
                {filterOption !== "all" && (
                  <button
                    onClick={() => setFilterOption("all")}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comments Popup */}
      {popupBlog && (
        <CommentsPopup
          blog={popupBlog}
          isOpen={showCommentsPopup}
          onClose={() => {
            setShowCommentsPopup(false);
            setPopupBlog(null);
          }}
          onReply={submitReply}
          onDelete={deleteComment}
        />
      )}

      {/* Click outside to close dropdowns */}
      {(showFilterDropdown || showSortDropdown) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowFilterDropdown(false);
            setShowSortDropdown(false);
          }}
        />
      )}

      {/* Blog Details Modal */}
      <BlogDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        blog={detailsBlog}
      />
    </div>
  );
};

export default BlogAnalytics;
