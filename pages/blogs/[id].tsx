import { useRouter } from "next/router";
import Head from "next/head";
import type { GetServerSideProps } from "next";
import { useEffect, useState, useRef } from "react";
import parse from "html-react-parser";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "../../components/AuthModal";
import SocialMediaShare from "../../components/SocialMediaShare";
// Server-side only imports used in getServerSideProps
import dbConnect from "../../lib/database";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - JS model import
import BlogModel from "../../models/Blog";

type BlogReply = {
  _id: string;
  username: string;
  text: string;
  createdAt: string;
  user?: string | null;
};

type BlogComment = {
  _id: string;
  username: string;
  text: string;
  createdAt: string;
  user?: string | null;
  replies?: BlogReply[];
};

type Blog = {
  _id: string;
  title: string;
  content: string;
  postedBy: { name: string; _id?: string | null };
  createdAt: string;
  image?: string;
  likesCount: number;
  liked?: boolean;
  comments: BlogComment[];
  paramlink?: string | null;
};

type SeoMeta = {
  title: string;
  description: string;
  image: string;
  url: string;
};

interface BlogDetailProps {
  initialBlog: Blog | null;
  seo: SeoMeta | null;
}

export default function BlogDetail({ initialBlog, seo }: BlogDetailProps) {
  const router = useRouter();
  const { id } = router.query;
  const { user, isAuthenticated } = useAuth();

  const [blog, setBlog] = useState<Blog | null>(initialBlog);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("login");
  const [replyTexts, setReplyTexts] = useState<{[commentId: string]: string}>({});

  // Track pending actions after login
  const shouldLikeAfterLogin = useRef(false);
  const shouldCommentAfterLogin = useRef(false);
  const pendingComment = useRef("");

  // Utility to get base URL
  const getBaseUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "https://zeva360.com";
  };

  // Compute share URL
  const shareUrl = blog
    ? `${getBaseUrl()}/blogs/${blog.paramlink || blog._id}`
    : "";

  // Client-side fetch only if not provided by SSR (shouldn't typically happen)
  useEffect(() => {
    if (blog || !id) return;
    const token = localStorage.getItem("token");
    fetch(`/api/blog/getBlogById?id=${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setBlog(json.blog);
        else setError(json.error || "Failed to fetch blog");
      })
      .catch(() => setError("Network error"));
  }, [id, blog]);

  // Retry actions if user logged in after showing modal
  useEffect(() => {
    if (isAuthenticated) {
      if (shouldLikeAfterLogin.current) {
        shouldLikeAfterLogin.current = false;
        performToggleLike();
      }
      if (shouldCommentAfterLogin.current) {
        shouldCommentAfterLogin.current = false;
        setNewComment(pendingComment.current);
        performSubmitComment(pendingComment.current);
        pendingComment.current = "";
      }
    }
  }, [isAuthenticated]);

  // Like handler with auth check
  async function toggleLike() {
    if (!isAuthenticated) {
      setAuthModalMode("login");
      setShowAuthModal(true);
      shouldLikeAfterLogin.current = true;
      return;
    }

    await performToggleLike();
  }

  // Actual like functionality
  async function performToggleLike() {
    if (!id) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/blog/likeBlog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ blogId: id }),
      });
      const json = await res.json();
      if (json.success && blog) {
        setBlog({
          ...blog,
          likesCount: json.likesCount,
          liked: json.liked,
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Comment handler with auth check
  async function submitComment() {
    if (!newComment.trim()) return;

    if (!isAuthenticated) {
      setAuthModalMode("login");
      setShowAuthModal(true);
      shouldCommentAfterLogin.current = true;
      pendingComment.current = newComment;
      return;
    }

    await performSubmitComment(newComment);
  }

  // Actual comment functionality
  async function performSubmitComment(commentText: string) {
    if (!id || !commentText.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/blog/addComment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ blogId: id, text: commentText }),
      });
      const json = await res.json();
      if (json.success && json.comment && blog) {
        // Add the new comment to existing comments
        const newComment: BlogComment = {
          _id: json.comment._id,
          username: json.comment.username,
          text: json.comment.text,
          createdAt: json.comment.createdAt,
          user: json.comment.user,
          replies: json.comment.replies || []
        };

        setBlog({
          ...blog,
          comments: [...blog.comments, newComment],
        });
        setNewComment("");
      } else {
        console.error("Failed to add comment:", json.error);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(commentId: string) {
    if (!confirm("Are you sure you want to delete this comment/reply?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/blog/deleteComment", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ blogId: blog?._id, commentId }),
      });

      const json = await res.json();
      if (json.success) {
        setBlog((prev) => {
          if (!prev) return prev;

          // Remove from comments or replies in state
          return {
            ...prev,
            comments: prev.comments
              .map((c) => {
                if (c._id === commentId) return null; // top-level comment
                return {
                  ...c,
                  replies: c.replies?.filter((r) => r._id !== commentId), // reply
                };
              })
              .filter(Boolean) as typeof prev.comments,
          };
        });
      } else {
        alert(json.error || "Failed to delete");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  }

  // Handle reply submission
  async function handleReplySubmit(commentId: string) {
    const replyText = replyTexts[commentId];
    if (!replyText?.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/blog/addReply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          blogId: blog?._id,
          commentId: commentId,
          text: replyText,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setBlog((prev) => {
          if (!prev) return prev;

          // Normalize the updated comment data
          const normalizeComment = (comment: any) => ({
            _id: String(comment._id || ''),
            username: comment.username || "Anonymous",
            text: comment.text || "",
            createdAt: comment.createdAt 
              ? new Date(comment.createdAt).toISOString()
              : new Date().toISOString(),
            user: comment.user ? String(comment.user) : null,
            replies: Array.isArray(comment.replies) 
              ? comment.replies.map((r: any) => ({
                  _id: String(r._id || ''),
                  username: r.username || user?.name || "Anonymous",
                  text: r.text || "",
                  createdAt: r.createdAt 
                    ? new Date(r.createdAt).toISOString()
                    : new Date().toISOString(),
                  user: r.user ? String(r.user) : null,
                }))
              : []
          });

          return {
            ...prev,
            comments: prev.comments.map((comment) =>
              comment._id === commentId ? normalizeComment(json.comment) : comment
            ),
          };
        });
        // Clear the reply text for this comment
        setReplyTexts(prev => ({
          ...prev,
          [commentId]: ""
        }));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to add reply");
    }
  }

  if (error) return <p>Error: {error}</p>;
  if (!blog) return <p>Loading blog…</p>;

  return (
    <div className="max-w-3xl mx-auto py-6">
      {seo && (
        <Head>
          <title>{seo.title}</title>
          <meta name="description" content={seo.description} />
          {/* Open Graph */}
          <meta property="og:type" content="article" />
          <meta property="og:title" content={seo.title} />
          <meta property="og:description" content={seo.description} />
          <meta property="og:image" content={seo.image} />
          <meta property="og:url" content={seo.url} />
          <meta property="og:site_name" content="Global Ayurveda" />
          {/* Twitter */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={seo.title} />
          <meta name="twitter:description" content={seo.description} />
          <meta name="twitter:image" content={seo.image} />
        </Head>
      )}
      {blog.image && (
        <img
          src={blog.image}
          alt={blog.title}
          className="w-full h-72 object-cover rounded-lg"
        />
      )}
      <h1 className="text-3xl font-bold mt-4">{blog.title}</h1>
      <p className="text-gray-600">
        By {blog.postedBy.name} | {new Date(blog.createdAt).toLocaleString()}
      </p>

      {/* Like section */}
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={toggleLike}
          className={`px-3 py-1 rounded ${
            blog.liked ? "bg-red-500 text-white" : "bg-gray-200"
          }`}
        >
          {blog.liked ? "❤️ Liked" : "🤍 Like"}
        </button>
        <span>
          {blog.likesCount} {blog.likesCount === 1 ? "like" : "likes"}
        </span>
      </div>

      {/* Social Share */}
      <div className="mt-4 mb-4">
        {blog && (
          <SocialMediaShare
            blogTitle={blog.title}
            blogUrl={shareUrl}
            blogDescription={blog.content.replace(/<[^>]+>/g, "").slice(0, 200)}
            triggerLabel="Share"
          />
        )}
      </div>

      {/* Blog content */}
      <div className="mt-4">{parse(blog.content)}</div>

      {/* Comments */}
      <h2 className="text-xl font-semibold mt-6">
        Comments ({blog.comments.length})
      </h2>
      <div className="space-y-4 mt-4">
        {blog.comments.map((c) => {
          const canDeleteComment =
            user &&
            (String(user._id) === String(c.user) || // comment owner
              String(user._id) === String(blog.postedBy._id)); // blog author

          return (
            <div key={c._id} className="border p-3 rounded">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{c.username}</p>
                  <p className="text-gray-700">{c.text}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(c.createdAt).toLocaleString()}
                  </p>
                </div>

                {canDeleteComment && (
                  <button
                    onClick={() => handleDelete(c._id)}
                    className="text-red-500 text-sm hover:underline"
                  >
                    Delete
                  </button>
                )}
              </div>

              {/* Replies */}
              {c.replies && c.replies.length > 0 && c.replies.map((r) => {
                const isAuthorReply =
                  r.user &&
                  String(r.user) === String(blog.postedBy._id);
                const canDeleteReply =
                  user &&
                  (String(user._id) === String(r.user) ||
                    String(user._id) === String(blog.postedBy._id));

                return (
                  <div
                    key={r._id}
                    className={`ml-6 mt-2 p-2 border-l-2 ${
                      isAuthorReply
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p
                          className={`font-semibold ${
                            isAuthorReply ? "text-blue-600" : ""
                          }`}
                        >
                          {r.username}{" "}
                          {isAuthorReply && (
                            <span className="text-blue-600 font-normal">
                              (author)
                            </span>
                          )}
                        </p>
                        <p>{r.text}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(r.createdAt).toLocaleString()}
                        </p>
                      </div>

                      {canDeleteReply && (
                        <button
                          onClick={() => handleDelete(r._id)}
                          className="text-red-500 text-xs hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Reply form for blog author */}
              {user && blog.postedBy.name === user.name && (
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Reply to this comment..."
                    value={replyTexts[c._id] || ""}
                    onChange={(e) => setReplyTexts(prev => ({
                      ...prev,
                      [c._id]: e.target.value
                    }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleReplySubmit(c._id);
                      }
                    }}
                    className="w-full border rounded p-1 text-sm"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add comment */}
      <div className="mt-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="w-full border rounded p-2"
        />
        <button
          onClick={submitComment}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Add Comment
        </button>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            // Actions will retry via useEffect when isAuthenticated changes
          }}
          initialMode={authModalMode}
        />
      )}
    </div>
  );
}

// Helpers
function stripHtml(html: string): string {
  if (!html) return "";
  const withoutTags = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return withoutTags;
}

function extractFirstImageSrc(html: string): string | null {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  if (!match) return null;
  const src = match[1];
  if (!src || src.startsWith("data:")) return null;
  return src;
}

export const getServerSideProps: GetServerSideProps<BlogDetailProps> = async ({
  params,
  req,
}) => {
  try {
    const { id } = params as { id: string };
    await dbConnect();
    // @ts-ignore
    const blogDoc = await BlogModel.findById(id)
      .populate("postedBy", "name _id")
      .lean();
    if (!blogDoc) {
      return { notFound: true };
    }

    const host = req.headers.host || "localhost:3000";
    const proto = (req.headers["x-forwarded-proto"] as string) || "http";
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${proto}://${host}`;
    const url = `${baseUrl}/blogs/${id}`;

    const description = stripHtml(blogDoc.content || "").slice(0, 200);
    const imageFromContent = extractFirstImageSrc(blogDoc.content || "");
    const image =
      imageFromContent || `${baseUrl}/assets/health_treatments_logo.png`;

    // Create the blog object, ensuring no undefined values
    const initialBlog: Blog = {
      _id: String(blogDoc._id),
      title: blogDoc.title || "Blog",
      content: blogDoc.content || "",
      postedBy: { 
        name: blogDoc.postedBy?.name || "Author",
        _id: blogDoc.postedBy?._id ? String(blogDoc.postedBy._id) : null
      },
      createdAt: blogDoc.createdAt
        ? new Date(blogDoc.createdAt).toISOString()
        : new Date().toISOString(),
      likesCount: Array.isArray(blogDoc.likes) ? blogDoc.likes.length : 0,
      liked: false,
      comments: Array.isArray(blogDoc.comments)
        ? blogDoc.comments.map((c: any) => ({
            _id: String(c._id || ''),
            username: c.username || "Anonymous",
            text: c.text || "",
            createdAt: c.createdAt 
              ? new Date(c.createdAt).toISOString()
              : new Date().toISOString(),
            user: c.user ? String(c.user) : null,
            replies: Array.isArray(c.replies) 
              ? c.replies.map((r: any) => ({
                  _id: String(r._id || ''),
                  username: r.username || "Anonymous",
                  text: r.text || "",
                  createdAt: r.createdAt 
                    ? new Date(r.createdAt).toISOString()
                    : new Date().toISOString(),
                  user: r.user ? String(r.user) : null,
                }))
              : []
          }))
        : [],
      paramlink: blogDoc.paramlink || null,
    };

    // Only add image property if it exists (not null/undefined)
    const finalImage = blogDoc.image || imageFromContent;
    if (finalImage) {
      initialBlog.image = finalImage;
    }

    const seo: SeoMeta = {
      title: initialBlog.title,
      description,
      image,
      url,
    };

    return { props: { initialBlog, seo } };
  } catch (e) {
    console.error("getServerSideProps error:", e);
    return { props: { initialBlog: null, seo: null } };
  }
};