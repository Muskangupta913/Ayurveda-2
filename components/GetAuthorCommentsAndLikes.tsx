import React, { useEffect, useState } from "react";
import { ThumbsUp, MessageCircle, Search, ChevronLeft, ChevronRight } from "lucide-react";

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

const BubbleChart: React.FC<{ totalLikes: number; totalComments: number }> = ({ totalLikes, totalComments }) => {
  const maxValue = Math.max(totalLikes, totalComments, 100);
  const likesSize = (totalLikes / maxValue) * 60 + 40;
  const commentsSize = (totalComments / maxValue) * 60 + 40;

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Total Engagement</h3>
      <div className="flex justify-center items-center space-x-8 h-32">
        <div className="flex flex-col items-center">
          <div 
            className="bg-yellow-400 rounded-full flex items-center justify-center text-white font-bold"
            style={{ width: `${likesSize}px`, height: `${likesSize}px` }}
          >
            <ThumbsUp size={Math.min(likesSize / 3, 24)} />
          </div>
          <span className="text-black mt-2 text-sm font-medium">{totalLikes} Likes</span>
        </div>
        <div className="flex flex-col items-center">
          <div 
            className="bg-[#2D9AA5] rounded-full flex items-center justify-center text-white font-bold"
            style={{ width: `${commentsSize}px`, height: `${commentsSize}px` }}
          >
            <MessageCircle size={Math.min(commentsSize / 3, 24)} />
          </div>
          <span className="text-black mt-2 text-sm font-medium">{totalComments} Comments</span>
        </div>
      </div>
    </div>
  );
};

const DonutChart: React.FC<{ likes: number; comments: number; title: string }> = ({ likes, comments, title }) => {
  const total = likes + comments;
  const likesPercentage = total > 0 ? (likes / total) * 100 : 0;
  const commentsPercentage = total > 0 ? (comments / total) * 100 : 0;
  
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const likesStroke = (likesPercentage / 100) * circumference;
  const commentsStroke = (commentsPercentage / 100) * circumference;

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>
      <div className="flex items-center justify-center">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="10"/>
            <circle 
              cx="50" cy="50" r={radius} fill="none" 
              stroke="#fbbf24" strokeWidth="10"
              strokeDasharray={`${likesStroke} ${circumference}`}
              strokeLinecap="round"
            />
            <circle 
              cx="50" cy="50" r={radius} fill="none" 
              stroke="#2D9AA5" strokeWidth="10"
              strokeDasharray={`${commentsStroke} ${circumference}`}
              strokeDashoffset={-likesStroke}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-gray-800">{total}</span>
          </div>
        </div>
      </div>
      <div className="flex justify-center space-x-4 mt-4">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
          <span className="text-sm text-black">{likes} Likes</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-[#2D9AA5] rounded-full mr-2"></div>
          <span className="text-sm text-black">{comments} Comments</span>
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
  const [replyTexts, setReplyTexts] = useState<{ [key: string]: string }>({});

  const blogsPerPage = 15;

  useEffect(() => {
    fetchBlogs();
  }, [tokenKey]);

  useEffect(() => {
    const filtered = blogs.filter(blog => 
      blog.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBlogs(filtered);
    setCurrentPage(1);
  }, [blogs, searchTerm]);

  const fetchBlogs = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem(tokenKey);

    if (!token) {
      setError('You must be logged in to view your blogs.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/blog/getAuthorCommentsAndLikes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to fetch blogs');
      } else {
        setBlogs(data.blogs);
      }
    } catch {
      setError('Network error while fetching blogs');
    } finally {
      setLoading(false);
    }
  };

  const handleReplyChange = (blogId: string, commentId: string, value: string) => {
    setReplyTexts(prev => ({ ...prev, [`${blogId}_${commentId}`]: value }));
  };

  const submitReply = async (blogId: string, commentId: string) => {
    const text = replyTexts[`${blogId}_${commentId}`]?.trim();
    if (!text) return;

    const token = localStorage.getItem(tokenKey);
    if (!token) {
      setError('You must be logged in to reply.');
      return;
    }

    try {
      const res = await fetch('/api/blog/addReply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ blogId, commentId, text }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Failed to add reply');
      } else {
        setBlogs(prevBlogs =>
          prevBlogs.map(blog => {
            if (blog._id !== blogId) return blog;
            return {
              ...blog,
              comments: blog.comments.map(comment =>
                comment._id === commentId ? data.comment : comment
              ),
            };
          })
        );
        setReplyTexts(prev => ({ ...prev, [`${blogId}_${commentId}`]: '' }));
      }
    } catch {
      setError('Network error while adding reply');
    }
  };

  const deleteComment = async (blogId: string, commentId: string) => {
    const token = localStorage.getItem(tokenKey);
    if (!token) {
      setError('You must be logged in to delete a comment.');
      return;
    }

    try {
      const res = await fetch('/api/blog/deleteComment', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ blogId, commentId }),
      });

      const data = await res.json();
      if (data.success) {
        setBlogs(prevBlogs =>
          prevBlogs.map(blog => {
            if (blog._id !== blogId) return blog;
            return {
              ...blog,
              comments: blog.comments
                .filter(comment => comment._id !== commentId)
                .map(comment => ({
                  ...comment,
                  replies: comment.replies?.filter(r => r._id !== commentId) || [],
                })),
            };
          })
        );
      } else {
        setError(data.error || 'Failed to delete comment');
      }
    } catch {
      setError('Network error while deleting comment');
    }
  };

  const totalLikes = blogs.reduce((sum, blog) => sum + blog.likesCount, 0);
  const totalComments = blogs.reduce((sum, blog) => sum + blog.commentsCount, 0);

  const indexOfLastBlog = currentPage * blogsPerPage;
  const indexOfFirstBlog = indexOfLastBlog - blogsPerPage;
  const currentBlogs = filteredBlogs.slice(indexOfFirstBlog, indexOfLastBlog);
  const totalPages = Math.ceil(filteredBlogs.length / blogsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-[#2D9AA5] text-xl">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Blog Analytics</h1>
          <p className="text-gray-600">Track your blog performance and engagement</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Total Blogs</h3>
            <p className="text-3xl font-bold text-[#2D9AA5]">{blogs.length}</p>
          </div>
          <BubbleChart totalLikes={totalLikes} totalComments={totalComments} />
          {selectedBlog && (
            <DonutChart 
              likes={selectedBlog.likesCount} 
              comments={selectedBlog.commentsCount}
              title={`${selectedBlog.title.substring(0, 20)}...`}
            />
          )}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search blogs..."
              className="text-black w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D9AA5]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
          <p className="text-gray-600 text-sm mb-4">Click on any blog card to view likes and comments analytics.</p>
        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {currentBlogs.map(blog => (
            <div 
              key={blog._id} 
              className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer border-l-4 border-[#2D9AA5]"
              onClick={() => setSelectedBlog(blog)}
            >
              <h3 className="text-lg font-semibold mb-3 text-gray-800 line-clamp-2">{blog.title}</h3>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <ThumbsUp className="text-yellow-500" size={16} />
                    <span className="text-black text-sm font-medium">{blog.likesCount}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="text-[#2D9AA5]" size={16} />
                    <span className="text-black text-sm font-medium">{blog.commentsCount}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {new Date(blog.createdAt).toLocaleDateString()}
              </p>
              
              {/* Comments Preview */}
              {blog.comments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium mb-2">Recent Comments:</h4>
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
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center px-4 py-2 bg-white rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft size={20} />
              Previous
            </button>
            
            <div className="flex space-x-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg ${
                      currentPage === page 
                        ? 'bg-[#2D9AA5] text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    } shadow`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex items-center px-4 py-2 bg-white rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Empty State */}
        {filteredBlogs.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {searchTerm ? 'No blogs found matching your search.' : 'No blogs found.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogAnalytics;