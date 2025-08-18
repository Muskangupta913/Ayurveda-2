import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import parse from "html-react-parser";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "../../components/AuthModal";

type Blog = {
  _id: string;
  title: string;
  content: string;
  postedBy: { name: string };
  role: string;
  createdAt: string;
  image?: string;
  likesCount?: number;
  commentsCount?: number;
  liked?: boolean;
};

export default function BlogList() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">(
    "login"
  );

  // Action retry refs
  const pendingLikeBlogId = useRef<string | null>(null);
  const pendingComment = useRef<{ blogId: string; text: string } | null>(null);

  useEffect(() => {
    async function fetchBlogs() {
      try {
        const res = await fetch("/api/blog/getAllBlogs");
        const json = await res.json();
        if (res.ok && json.success) {
          setBlogs(json.blogs || json.data);
        } else {
          setError(json.error || "Failed to fetch blogs");
        }
      } catch {
        setError("Network error");
      }
    }
    fetchBlogs();
  }, []);

  // Retry pending actions after login
  useEffect(() => {
    if (isAuthenticated) {
      if (pendingLikeBlogId.current) {
        handleLike(pendingLikeBlogId.current);
        pendingLikeBlogId.current = null;
      }
      if (pendingComment.current) {
        handleComment(
          pendingComment.current.blogId,
          pendingComment.current.text
        );
        pendingComment.current = null;
      }
    }
  }, [isAuthenticated]);

  const handleLike = async (blogId: string) => {
    if (!isAuthenticated) {
      setAuthModalMode("login");
      setShowAuthModal(true);
      pendingLikeBlogId.current = blogId;
      return;
    }

    try {
      const res = await fetch("/api/blog/likeBlog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ blogId }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setBlogs((prev) =>
          prev.map((blog) =>
            blog._id === blogId
              ? {
                  ...blog,
                  likesCount: json.likesCount,
                  liked: json.liked,
                }
              : blog
          )
        );
      }
    } catch (err) {
      console.error("Like error:", err);
    }
  };
  const handleComment = async (blogId: string, text: string) => {
    if (!isAuthenticated) {
      setAuthModalMode("login");
      setShowAuthModal(true);
      pendingComment.current = { blogId, text };
      return;
    }

    try {
      const res = await fetch("/api/blog/commentBlog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ blogId, text }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setBlogs((prev) =>
          prev.map((blog) =>
            blog._id === blogId
              ? { ...blog, commentsCount: json.commentsCount }
              : blog
          )
        );
      } else {
        console.error("Failed to post comment:", json.error);
      }
    } catch (err) {
      console.error("Comment error:", err);
    }
  };

  if (error) return <p>Error: {error}</p>;
  if (!blogs.length) return <p>Loading blogs…</p>;

  return (
    <>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {blogs.map((blog) => {
          const paragraphs =
            blog.content.split("</p>").slice(0, 2).join("</p>") + "</p>";

          return (
            <div
              key={blog._id}
              className="border rounded-lg shadow-md p-4 hover:shadow-lg transition"
            >
              <Link href={`/blogs/${blog._id}`}>
                <div className="cursor-pointer">
                  {blog.image && (
                    <img
                      src={blog.image}
                      alt={blog.title}
                      className="w-full h-48 object-cover rounded"
                    />
                  )}
                  <h2 className="text-xl font-bold mt-2">{blog.title}</h2>
                  <p className="text-sm text-gray-600">
                    By {blog.postedBy.name} |{" "}
                    {new Date(blog.createdAt).toLocaleDateString()}
                  </p>
                  <div className="mt-2 text-gray-700 line-clamp-4">
                    {parse(paragraphs)}
                  </div>
                </div>
              </Link>

              {/* Buttons */}
              <div className="flex gap-4 mt-4 items-center">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleLike(blog._id);
                  }}
                  className="text-blue-500"
                >
                  👍 Like {blog.likesCount ?? 0}
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(`/blogs/${blog._id}`);
                  }}
                  className="text-green-500"
                >
                  💬 Comment {blog.commentsCount ?? 0}
                </button>
                ;
              </div>
            </div>
          );
        })}
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            // Will retry like/comment after login because of useEffect
          }}
          initialMode={authModalMode}
        />
      )}
    </>
  );
}
