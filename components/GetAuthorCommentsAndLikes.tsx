import React, { useEffect, useState } from "react";

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
};

interface GetAuthorCommentsAndLikesProps {
  tokenKey: "clinicToken" | "doctorToken";
}

const GetAuthorCommentsAndLikes: React.FC<GetAuthorCommentsAndLikesProps> = ({ tokenKey }) => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Track reply inputs for comments by blogId_commentId key
  const [replyTexts, setReplyTexts] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    async function fetchBlogs() {
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
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!data.success) {
          setError(data.error || 'Failed to fetch blogs');
        } else {
          setBlogs(data.blogs);
        }
      } catch (err) {
        setError('Network error while fetching blogs');
      } finally {
        setLoading(false);
      }
    }

    fetchBlogs();
  }, [tokenKey]);

  // Handle reply input change
  const handleReplyChange = (blogId: string, commentId: string, value: string) => {
    setReplyTexts(prev => ({ ...prev, [`${blogId}_${commentId}`]: value }));
  };

  // Submit reply (hits addReply API)
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
        // Update blog comments with new comment (with updated replies) from API
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
        // Clear input
        setReplyTexts(prev => ({ ...prev, [`${blogId}_${commentId}`]: '' }));
      }
    } catch (err) {
      setError('Network error while adding reply');
    }
  };

  // Delete comment/reply
  async function deleteComment(blogId: string, commentId: string) {
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
        // Remove deleted comment from state
        setBlogs(prevBlogs =>
          prevBlogs.map(blog => {
            if (blog._id !== blogId) return blog;
            return {
              ...blog,
              comments: blog.comments
                .filter(comment => comment._id !== commentId) // remove top-level
                .map(comment => ({
                  ...comment,
                  replies: comment.replies?.filter(r => r._id !== commentId) || [], // remove from replies too
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
  }

  if (loading) return <p>Loading blogs...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (blogs.length === 0) return <p>No blogs found.</p>;

  return (
    <div className="max-w-3xl mx-auto py-6">
      <h1 className="text-3xl font-bold mb-4">Your Blogs</h1>
      {blogs.map(blog => (
        <div key={blog._id} className="border rounded p-4 mb-6">
          <h2 className="text-xl font-semibold">{blog.title}</h2>
          <p className="text-gray-600 text-sm mb-2">
            Created: {new Date(blog.createdAt).toLocaleString()}
          </p>
          <p>
            Likes: <strong>{blog.likesCount}</strong> | Comments: <strong>{blog.commentsCount}</strong>
          </p>

          {blog.comments.length > 0 && (
            <div className="mt-3">
              <h3 className="font-semibold">Comments Preview:</h3>
              <div className="space-y-4">
                {blog.comments.slice(0, 3).map(comment => (
                  <div key={comment._id} className="border p-2 rounded">
                    <p>
                      <span className="font-semibold">{comment.username}:</span> {comment.text}
                    </p>

                    {/* Show replies */}
                    {comment.replies &&
                      comment.replies.map(r => {
                        const isAuthorReply =
                          r.user &&
                          blog.postedBy &&
                          String(r.user) === String(blog.postedBy._id || blog.postedBy);
                        return (
                          <div
                            key={r._id}
                            className={`ml-6 mt-2 p-2 border-l-2 ${
                              isAuthorReply ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                            }`}
                          >
                            <p className={`font-semibold ${isAuthorReply ? 'text-blue-600' : ''}`}>
                              {r.username}
                            </p>
                            <button
                              onClick={() => deleteComment(blog._id, r._id)}
                              className="text-red-500 text-xs hover:underline"
                            >
                              Delete
                            </button>
                            <p>{r.text}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(r.createdAt).toLocaleString()}
                            </p>
                          </div>
                        );
                      })}

                    {/* Reply input for author */}
                    {/* Show reply input only if logged in user is blog author */}
                    {true /* Assume user is author - you can implement user check */}
                    && (
                      <div className="mt-2 flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Reply to this comment..."
                          className="flex-grow border rounded p-1 text-sm"
                          value={replyTexts[`${blog._id}_${comment._id}`] || ''}
                          onChange={e =>
                            handleReplyChange(blog._id, comment._id, e.target.value)
                          }
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              submitReply(blog._id, comment._id);
                            }
                          }}
                        />
                        <button
                          className="px-3 py-1 bg-blue-600 text-white rounded"
                          onClick={() => submitReply(blog._id, comment._id)}
                        >
                          Reply
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {blog.comments.length > 3 && <p>And more...</p>}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default GetAuthorCommentsAndLikes;
