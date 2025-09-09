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
  const [replyTexts, setReplyTexts] = useState<{ [commentId: string]: string }>(
    {}
  );

  // Track pending actions after login
  const shouldLikeAfterLogin = useRef(false);
  const shouldCommentAfterLogin = useRef(false);
  const pendingComment = useRef("");
  const [showAllComments, setShowAllComments] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});
  const [expandedReplies, setExpandedReplies] = useState<{
    [commentId: string]: boolean;
  }>({});
  const [showReplyInput, setShowReplyInput] = useState<{
    [commentId: string]: boolean;
  }>({});

  // Utility to get base URL
  const getBaseUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "https://zeva360.com";
  };
  const toggleCommentExpansion = (commentId) => {
    setExpandedComments((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const isLongComment = (text) => {
    return text.split("\n").length > 4;
  };

  const truncateComment = (text, isExpanded) => {
    const lines = text.split("\n");
    if (!isExpanded && lines.length > 4) {
      return lines.slice(0, 4).join("\n");
    }
    return text;
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
          replies: json.comment.replies || [],
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
        // Fetch latest replies for this comment
        const res2 = await fetch(
          `/api/blog/getCommentReplies?blogId=${blog?._id}&commentId=${commentId}`
        );
        const json2 = await res2.json();
        setBlog((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            comments: prev.comments.map((comment) =>
              comment._id === commentId
                ? { ...comment, replies: json2.replies || [] }
                : comment
            ),
          };
        });
        setReplyTexts((prev) => ({ ...prev, [commentId]: "" }));
        setShowReplyInput((prev) => ({ ...prev, [commentId]: false }));
        setExpandedReplies((prev) => ({ ...prev, [commentId]: true }));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to add reply");
    }
  }

  if (error) return <p>Error: {error}</p>;
  if (!blog) return <p>Loading blog…</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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
          {/* Quill CSS to preserve editor formatting on view page */}
          <link
            rel="stylesheet"
            href="https://cdn.quilljs.com/1.3.6/quill.snow.css"
          />
        </Head>
      )}

      <style jsx global>{`
        /* Professional typography and spacing */
        .blog-container {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
          line-height: 1.7;
          color: #2c3e50;
        }

        /* Enhanced blog content media styling - UNIFORM SIZE FOR ALL IMAGES */
        .blog-content img,
        .blog-content video,
        .blog-content iframe,
        .blog-content embed,
        .blog-content object,
        .blog-content * img,
        .blog-content * video,
        .blog-content * iframe,
        .blog-content * embed,
        .blog-content * object {
          display: block !important;
          margin: 2.5rem auto !important;
          width: 700px !important;
          max-width: 700px !important;
          min-width: 700px !important;
          height: 400px !important;
          max-height: 400px !important;
          min-height: 400px !important;
          object-fit: cover !important;
          border-radius: 16px !important;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08),
            0 8px 24px rgba(0, 0, 0, 0.04) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          transition: all 0.4s ease !important;
        }

        .blog-content img:hover,
        .blog-content video:hover,
        .blog-content iframe:hover {
          transform: translateY(-4px) scale(1.02) !important;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.12),
            0 12px 32px rgba(0, 0, 0, 0.08) !important;
        }

        /* Enhanced YouTube and Google Drive embeds - UNIFORM SIZE */
        .blog-content iframe[src*="youtube"],
        .blog-content iframe[src*="youtu.be"],
        .blog-content iframe[src*="drive.google"],
        .blog-content iframe[src*="docs.google"],
        .blog-content iframe[src*="googleapis"],
        .blog-content iframe[src*="embed"],
        .blog-content iframe[title*="YouTube"],
        .blog-content iframe[title*="Google Drive"],
        .blog-content *[src*="youtube"],
        .blog-content *[src*="youtu.be"],
        .blog-content *[src*="drive.google"],
        .blog-content *[src*="docs.google"] {
          display: block !important;
          margin: 2.5rem auto !important;
          width: 700px !important;
          max-width: 700px !important;
          min-width: 700px !important;
          height: 400px !important;
          max-height: 400px !important;
          min-height: 400px !important;
          border-radius: 16px !important;
          border: none !important;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08),
            0 8px 24px rgba(0, 0, 0, 0.04) !important;
          transition: all 0.4s ease !important;
        }

        .blog-content iframe[src*="youtube"]:hover,
        .blog-content iframe[src*="youtu.be"]:hover {
          transform: translateY(-4px) scale(1.02) !important;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.12),
            0 12px 32px rgba(0, 0, 0, 0.08) !important;
        }

        /* Video wrapper enhancements */
        .blog-content *:has(iframe[src*="youtube"]),
        .blog-content *:has(iframe[src*="youtu.be"]),
        .blog-content *:has(iframe[src*="drive.google"]),
        .blog-content *:has(iframe[src*="docs.google"]),
        .blog-content *:has(*[src*="youtube"]),
        .blog-content *:has(*[src*="youtu.be"]),
        .blog-content *:has(*[src*="drive.google"]) {
          text-align: center !important;
          display: block !important;
          width: 100% !important;
        }

        .blog-content .video-wrapper,
        .blog-content .embed-responsive,
        .blog-content .youtube-embed,
        .blog-content .video-embed,
        .blog-content .iframe-wrapper {
          text-align: center !important;
          display: block !important;
          width: 100% !important;
        }

        .blog-content .video-wrapper iframe,
        .blog-content .embed-responsive iframe,
        .blog-content .youtube-embed iframe,
        .blog-content .video-embed iframe,
        .blog-content .iframe-wrapper iframe {
          display: block !important;
          margin: 2.5rem auto !important;
          width: 700px !important;
          max-width: 700px !important;
          min-width: 700px !important;
          height: 400px !important;
          max-height: 400px !important;
          min-height: 400px !important;
          border-radius: 16px !important;
          border: none !important;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08),
            0 8px 24px rgba(0, 0, 0, 0.04) !important;
        }

        /* Text alignment controls */
        .blog-content .ql-align-center {
          text-align: center !important;
        }
        .blog-content .ql-align-right {
          text-align: right !important;
        }
        .blog-content .ql-align-justify {
          text-align: justify !important;
        }
        .blog-content .ql-align-left {
          text-align: left !important;
        }

        /* Enhanced text styling */
        .blog-content p {
          margin-bottom: 1.8rem;
          font-size: 1.125rem;
          color: #374151;
          line-height: 1.8;
        }

        .blog-content h1,
        .blog-content h2,
        .blog-content h3,
        .blog-content h4 {
          color: #1f2937;
          font-weight: 700;
          margin-top: 3rem;
          margin-bottom: 1.5rem;
          line-height: 1.3;
        }

        .blog-content h1 {
          font-size: 2.5rem;
        }

        .blog-content h2 {
          font-size: 2rem;
          color: #2d9aa5;
        }

        .blog-content h3 {
          font-size: 1.5rem;
        }

        .blog-content blockquote {
          border-left: 4px solid #2d9aa5;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 1.5rem 2rem;
          margin: 2rem 0;
          font-style: italic;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .blog-content ul,
        .blog-content ol {
          margin: 1.5rem 0;
          padding-left: 2rem;
          list-style-position: outside;
        }

        .blog-content li {
          margin-bottom: 0.5rem;
          color: #374151;
        }

        /* Ensure list markers appear */
        .blog-content ul {
          list-style-type: disc;
        }
        .blog-content ol {
          list-style-type: decimal;
        }
        .blog-content ul ul {
          list-style-type: circle;
        }
        .blog-content ul ul ul {
          list-style-type: square;
        }

        /* Quill font size classes */
        .blog-content .ql-size-small {
          font-size: 0.875rem;
        }
        .blog-content .ql-size-large {
          font-size: 1.5rem;
        }
        .blog-content .ql-size-huge {
          font-size: 2.25rem;
        }

        /* Quill font family classes */
        .blog-content .ql-font-serif {
          font-family: Georgia, Cambria, "Times New Roman", Times, serif;
        }
        .blog-content .ql-font-monospace {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
        }
        .blog-content .ql-font-sans {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
        }

        /* Responsive design - MAINTAINING UNIFORM SIZES */
        @media (max-width: 768px) {
          .blog-content img,
          .blog-content video,
          .blog-content iframe,
          .blog-content embed,
          .blog-content object,
          .blog-content * img,
          .blog-content * video,
          .blog-content * iframe,
          .blog-content * embed,
          .blog-content * object,
          .blog-content iframe[src*="youtube"],
          .blog-content iframe[src*="youtu.be"],
          .blog-content iframe[src*="drive.google"],
          .blog-content iframe[src*="docs.google"],
          .blog-content iframe[src*="googleapis"],
          .blog-content *[src*="youtube"],
          .blog-content *[src*="youtu.be"],
          .blog-content *[src*="drive.google"],
          .blog-content .video-wrapper iframe,
          .blog-content .embed-responsive iframe,
          .blog-content .youtube-embed iframe,
          .blog-content .video-embed iframe,
          .blog-content .iframe-wrapper iframe {
            width: 500px !important;
            max-width: 500px !important;
            min-width: 500px !important;
            height: 300px !important;
            max-height: 300px !important;
            min-height: 300px !important;
            margin: 1.5rem auto !important;
          }

          .blog-content p {
            font-size: 1rem;
          }

          .blog-content h1 {
            font-size: 2rem;
          }

          .blog-content h2 {
            font-size: 1.75rem;
          }
        }

        @media (max-width: 600px) {
          .blog-content img,
          .blog-content video,
          .blog-content iframe,
          .blog-content embed,
          .blog-content object,
          .blog-content * img,
          .blog-content * video,
          .blog-content * iframe,
          .blog-content * embed,
          .blog-content * object,
          .blog-content iframe[src*="youtube"],
          .blog-content iframe[src*="youtu.be"],
          .blog-content iframe[src*="drive.google"],
          .blog-content iframe[src*="docs.google"],
          .blog-content iframe[src*="googleapis"],
          .blog-content *[src*="youtube"],
          .blog-content *[src*="youtu.be"],
          .blog-content *[src*="drive.google"],
          .blog-content .video-wrapper iframe,
          .blog-content .embed-responsive iframe,
          .blog-content .youtube-embed iframe,
          .blog-content .video-embed iframe,
          .blog-content .iframe-wrapper iframe {
            width: 380px !important;
            max-width: 380px !important;
            min-width: 380px !important;
            height: 228px !important;
            max-height: 228px !important;
            min-height: 228px !important;
          }
        }

        @media (max-width: 400px) {
          .blog-content img,
          .blog-content video,
          .blog-content iframe,
          .blog-content embed,
          .blog-content object,
          .blog-content * img,
          .blog-content * video,
          .blog-content * iframe,
          .blog-content * embed,
          .blog-content * object,
          .blog-content iframe[src*="youtube"],
          .blog-content iframe[src*="youtu.be"],
          .blog-content iframe[src*="drive.google"],
          .blog-content iframe[src*="docs.google"],
          .blog-content iframe[src*="googleapis"],
          .blog-content *[src*="youtube"],
          .blog-content *[src*="youtu.be"],
          .blog-content *[src*="drive.google"],
          .blog-content .video-wrapper iframe,
          .blog-content .embed-responsive iframe,
          .blog-content .youtube-embed iframe,
          .blog-content .video-embed iframe,
          .blog-content .iframe-wrapper iframe {
            width: 320px !important;
            max-width: 320px !important;
            min-width: 320px !important;
            height: 192px !important;
            max-height: 192px !important;
            min-height: 192px !important;
          }
        }

        /* Custom scrollbar */
        .blog-container::-webkit-scrollbar {
          width: 8px;
        }

        .blog-container::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 4px;
        }

        .blog-container::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #2d9aa5 0%, #236b73 100%);
          border-radius: 4px;
        }

        .blog-container::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #236b73 0%, #1d5a61 100%);
        }

        /* Glassmorphism effect */
        .glass-effect {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }

        /* Floating animation */
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        .floating {
          animation: float 3s ease-in-out infinite;
        }

        /* Pulse animation for buttons */
        @keyframes pulse-ring {
          0% {
            transform: scale(0.8);
          }
          40%,
          50% {
            opacity: 0;
          }
          100% {
            opacity: 0;
            transform: scale(1.2);
          }
        }

        .pulse-ring::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100%;
          border-radius: inherit;
          background: currentColor;
          opacity: 0.2;
          animation: pulse-ring 2s ease-out infinite;
        }

        /* Smooth transitions for all interactive elements */
        * {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

      <div className="blog-container">
        {/* Hero Section with Featured Image */}
        <div className="relative bg-white">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-teal-50/30"></div>
          <div className="relative max-w-5xl mx-auto px-6 py-16">
            {blog.image && (
              <div className="relative mb-16 overflow-hidden rounded-3xl shadow-2xl group">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10"></div>
                <img
                  src={blog.image}
                  alt={blog.title}
                  className="w-full h-[500px] object-cover transform group-hover:scale-110 transition-all duration-700"
                  style={{
                    filter: "brightness(0.95) contrast(1.05) saturate(1.1)",
                  }}
                />
                <div className="absolute top-6 right-6 z-20">
                  <div className="glass-effect px-4 py-2 rounded-full text-white text-sm font-medium floating">
                    <span className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      <span>Featured Article</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Article Header */}
            <div className="max-w-4xl mx-auto text-center mb-16">
              <h1 className="text-5xl md:text-6xl font-bold mb-8 text-gray-900 leading-tight tracking-tight">
                {blog.title}
              </h1>

              <div className="flex items-center justify-center space-x-8 text-gray-600 mb-12">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#2D9AA5] to-[#236b73] rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {blog.postedBy?.name?.charAt(0).toUpperCase() || "A"}
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-gray-900 text-lg">
                      By {blog.postedBy?.name || "Author"}
                    </span>
                    <p className="text-sm text-gray-500">Author</p>
                  </div>
                </div>
                <div className="w-px h-12 bg-gray-300"></div>
                <div className="text-center">
                  <time className="text-lg font-medium text-gray-700 block">
                    {new Date(blog.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                  <p className="text-sm text-gray-500">Published</p>
                </div>
              </div>

              {/* Enhanced Interactive Elements Bar */}
              <div className="flex items-center justify-center space-x-6 mb-12">
                {/* Like Button */}
                <button
                  onClick={toggleLike}
                  className={`group relative flex items-center space-x-3 px-8 py-4 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                    blog.liked
                      ? "bg-gradient-to-r from-red-50 to-pink-50 text-red-600 border-2 border-red-200 hover:from-red-100 hover:to-pink-100"
                      : "bg-white text-gray-600 border-2 border-gray-200 hover:border-red-200 hover:text-red-600"
                  }`}
                >
                  <svg
                    className={`w-6 h-6 transition-all duration-200 hover:scale-110 ${
                      blog.liked
                        ? "text-red-500"
                        : "text-gray-400 hover:text-red-400"
                    }`}
                    fill={blog.liked ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                    />
                  </svg>
                  <div className="text-left">
                    <span className="font-semibold text-lg">
                      {blog.likesCount}
                    </span>
                    <p className="text-sm opacity-70">
                      {blog.likesCount === 1 ? "" : ""}
                    </p>
                  </div>
                </button>

                {/* Comment Navigation Button */}
                <button
                  onClick={() => {
                    const commentsSection =
                      document.getElementById("comments-section");
                    if (commentsSection) {
                      commentsSection.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }
                  }}
                  className="group flex items-center space-x-3 px-8 py-4 bg-white text-gray-600 border-2 border-gray-200 rounded-full hover:border-blue-200 hover:text-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-6 h-6 text-gray-500 hover:text-blue-500 transition-colors duration-200"
                  >
                    <path
                      d="M21.99 4c0-1.1-.89-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"
                      fill="currentColor"
                    />
                  </svg>
                  <div className="text-left">
                    <span className="font-semibold text-lg">
                      {blog.comments.length}
                    </span>
                    <p className="text-sm opacity-70">
                      {blog.comments.length === 1 ? "" : ""}
                    </p>
                  </div>
                </button>

                {/* Social Share */}
                <div className="social-share-wrapper">
                  {blog && (
                    <SocialMediaShare
                      blogTitle={blog.title}
                      blogUrl={shareUrl}
                      blogDescription={blog.content
                        .replace(/<[^>]+>/g, "")
                        .slice(0, 200)}
                      triggerLabel={
                        <div className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-[#2D9AA5] to-[#236b73] text-white rounded-full hover:from-[#236b73] hover:to-[#1d5a61] transition-all duration-300 font-semibold transform hover:scale-105 shadow-lg hover:shadow-xl">
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                            />
                          </svg>
                          <span>Share Article</span>
                        </div>
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <div className="bg-white shadow-2xl">
          <div className="max-w-4xl mx-auto px-8 py-20">
            <article className="blog-content">{parse(blog.content)}</article>
          </div>
        </div>

        {/* Comments Section */}
        <section id="comments-section">
          <div className="space-y-8 mb-16">
            {blog.comments
              .slice(0, showAllComments ? blog.comments.length : 4)
              .map((c) => {
                const canDeleteComment =
                  user &&
                  (String(user._id) === String(c.user) ||
                    String(user._id) === String(blog.postedBy?._id));

                const isExpanded = expandedComments[c._id];
                const isLong = isLongComment(c.text);
                const displayText = truncateComment(c.text, isExpanded);

                return (
                  <div
                    key={c._id}
                    className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 hover:shadow-lg transition-all duration-300 border border-gray-100"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#2D9AA5] to-[#236b73] rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {c.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-lg">
                            {c.username}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {new Date(c.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>

                      {canDeleteComment && (
                        <button
                          onClick={() => handleDelete(c._id)}
                          className="text-gray-400 hover:text-red-500 transition-all duration-200 p-2 rounded-full hover:bg-red-50"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Comment text with line break preservation and expand/collapse */}
                    <div className="text-gray-700 leading-relaxed mb-6 text-lg">
                      <pre className="whitespace-pre-wrap font-sans">
                        {displayText}
                      </pre>
                      {isLong && (
                        <button
                          onClick={() => toggleCommentExpansion(c._id)}
                          className="text-[#2D9AA5] hover:text-[#236b73] font-medium text-sm mt-2 flex items-center transition-colors duration-200"
                        >
                          {isExpanded ? (
                            <>
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 15l7-7 7 7"
                                />
                              </svg>
                              Show less
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                              Show more
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Replies toggle and count */}
                    <div className="flex items-center gap-2 ml-8 mb-2">
                      {c.replies && c.replies.length > 0 && (
                        <button
                          className="flex items-center text-gray-500 hover:text-[#2D9AA5] text-sm"
                          onClick={() =>
                            setExpandedReplies((prev) => ({
                              ...prev,
                              [c._id]: !prev[c._id],
                            }))
                          }
                        >
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 8h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V10a2 2 0 012-2h2"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 3h-6a2 2 0 00-2 2v0a2 2 0 002 2h6a2 2 0 002-2v0a2 2 0 00-2-2z"
                            />
                          </svg>
                          {expandedReplies[c._id]
                            ? `Hide replies (${c.replies.length})`
                            : `Show replies (${c.replies.length})`}
                        </button>
                      )}
                      {/* Reply button */}
                      <button
                        className="ml-2 text-[#2D9AA5] hover:underline text-sm"
                        onClick={() =>
                          setShowReplyInput((prev) => ({
                            ...prev,
                            [c._id]: !prev[c._id],
                          }))
                        }
                      >
                        Reply
                      </button>
                    </div>
                    {/* Reply input box, only if toggled for this comment */}
                    {user && showReplyInput[c._id] && (
                      <div className="mt-2 ml-8">
                        <div className="flex space-x-4">
                          <div className="w-8 h-8 bg-[#2D9AA5] rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <input
                            type="text"
                            placeholder="Reply to this comment..."
                            value={replyTexts[c._id] || ""}
                            onChange={(e) =>
                              setReplyTexts((prev) => ({
                                ...prev,
                                [c._id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleReplySubmit(c._id);
                              }
                            }}
                            className="flex-1 border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-[#2D9AA5]/20 focus:border-[#2D9AA5] transition-all duration-200"
                          />
                        </div>
                      </div>
                    )}
                    {/* Replies section, only if expanded for this comment */}
                    {c.replies &&
                      c.replies.length > 0 &&
                      expandedReplies[c._id] && (
                        <div className="space-y-4 ml-8 border-l-4 border-[#2D9AA5] pl-6">
                          {c.replies.map((r) => {
                            const isAuthorReply =
                              r.user &&
                              String(r.user) === String(blog.postedBy?._id);
                            const canDeleteReply =
                              user &&
                              (String(user._id) === String(r.user) ||
                                String(user._id) ===
                                  String(blog.postedBy?._id));
                            return (
                              <div
                                key={r._id}
                                className={`p-6 rounded-xl ${
                                  isAuthorReply
                                    ? "bg-gradient-to-br from-[#2D9AA5]/10 to-[#2D9AA5]/5 border-2 border-[#2D9AA5]/20"
                                    : "bg-white border border-gray-200"
                                }`}
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-center space-x-3">
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                        isAuthorReply
                                          ? "bg-gradient-to-br from-[#2D9AA5] to-[#236b73]"
                                          : "bg-gradient-to-br from-gray-400 to-gray-500"
                                      }`}
                                    >
                                      {r.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <p
                                        className={`font-bold text-sm flex items-center ${
                                          isAuthorReply
                                            ? "text-[#2D9AA5]"
                                            : "text-gray-700"
                                        }`}
                                      >
                                        {r.username}
                                        {isAuthorReply && (
                                          <span className="ml-2 text-xs bg-[#2D9AA5] text-white px-3 py-1 rounded-full">
                                            Author
                                          </span>
                                        )}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {new Date(
                                          r.createdAt
                                        ).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                  {canDeleteReply && (
                                    <button
                                      onClick={() => handleDelete(r._id)}
                                      className="text-gray-400 hover:text-red-500 transition-colors duration-200 p-1 rounded-full hover:bg-red-50"
                                    >
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                                <pre className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                                  {r.text}
                                </pre>
                              </div>
                            );
                          })}
                        </div>
                      )}
                  </div>
                );
              })}

            {/* Show More/Less Comments Button */}
            {blog.comments.length > 4 && (
              <div className="text-center pt-8">
                <button
                  onClick={() => setShowAllComments(!showAllComments)}
                  className="px-8 py-3 bg-gradient-to-r from-[#2D9AA5] to-[#236b73] text-white rounded-xl font-medium hover:from-[#236b73] hover:to-[#1d5a61] transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  {showAllComments
                    ? `Show Less (${blog.comments.length - 4} hidden)`
                    : `Show More Comments (${blog.comments.length - 4} more)`}
                </button>
              </div>
            )}
          </div>

          {/* Add Comment Form */}
          <div className="border-t-2 border-gray-100 pt-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2 text-gray-900">
                Share Your Thoughts
              </h3>
              <p className="text-gray-600">
                We'd love to hear your perspective on this article
              </p>
            </div>
            <div className="space-y-6">
              <div className="relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="What are your thoughts on this article? Share your insights, questions, or experiences..."
                  rows={5}
                  className="w-full border-2 border-gray-300 rounded-2xl px-6 py-4 focus:outline-none focus:ring-4 focus:ring-[#2D9AA5]/20 focus:border-[#2D9AA5] transition-all duration-200 resize-none text-lg placeholder-gray-400"
                />
                <div className="absolute bottom-4 right-4 text-sm text-gray-400">
                  {newComment.length}/1000
                </div>
              </div>
              <div className="flex justify-center ">
                <button
                  onClick={submitComment}
                  className="relative px-12 py-4 bg-gradient-to-r from-[#2D9AA5] to-[#236b73] text-white rounded-2xl font-bold text-lg hover:from-[#236b73] hover:to-[#1d5a61] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl pulse-ring"
                >
                  <span className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                    <span>Post Comment</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Auth Modal */}
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onSuccess={() => {
              setShowAuthModal(false);
            }}
            initialMode={authModalMode}
          />
        )}

        {/* Floating Back to Top Button */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-[#2D9AA5] to-[#236b73] text-white rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center z-50"
          style={{
            opacity:
              typeof window !== "undefined" && window.scrollY > 300 ? 1 : 0,
            visibility:
              typeof window !== "undefined" && window.scrollY > 300
                ? "visible"
                : "hidden",
          }}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
      </div>
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
        _id: blogDoc.postedBy?._id ? String(blogDoc.postedBy._id) : null,
      },
      createdAt: blogDoc.createdAt
        ? new Date(blogDoc.createdAt).toISOString()
        : new Date().toISOString(),
      likesCount: Array.isArray(blogDoc.likes) ? blogDoc.likes.length : 0,
      liked: Boolean(liked), // ✅ real value now
      comments: Array.isArray(blogDoc.comments)
        ? blogDoc.comments.map((c: any) => ({
            _id: String(c._id || ""),
            username: c.username || "Anonymous",
            text: c.text || "",
            createdAt: c.createdAt
              ? new Date(c.createdAt).toISOString()
              : new Date().toISOString(),
            user: c.user ? String(c.user) : null,
            replies: Array.isArray(c.replies)
              ? c.replies.map((r: any) => ({
                  _id: String(r._id || ""),
                  username: r.username || "Anonymous",
                  text: r.text || "",
                  createdAt: r.createdAt
                    ? new Date(r.createdAt).toISOString()
                    : new Date().toISOString(),
                  user: r.user ? String(r.user) : null,
                }))
              : [],
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
