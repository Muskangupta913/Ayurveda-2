import React from "react";
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
  likes?: string[];       // ✅ needed for your includes check
  likesCount?: number;
  commentsCount?: number;
  liked?: boolean;
};


export default function BlogList() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const blogsPerPage = 15;

  // Popup state for thumb up
  const [setShowThumbPopup] = useState<{ [key: string]: boolean }>({});

  const { isAuthenticated, user } = useAuth();
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
        const res = await fetch("/api/blog/getAllBlogs", {
          headers: {
            ...(isAuthenticated && localStorage.getItem("token") && {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            }),
          },
        });

        const json = await res.json();
        if (res.ok && json.success) {
          let blogData = json.blogs || json.data;

          if (isAuthenticated && user?._id) {
            blogData = blogData.map((b: Blog): Blog => ({
              ...b,
              liked: b.likes?.includes(user._id) ?? false,
            }));
          } else {
            blogData = blogData.map((b: Blog): Blog => ({ ...b, liked: false }));
          }


          setBlogs(blogData);
          setFilteredBlogs(blogData);
        } else {
          setError(json.error || "Failed to fetch blogs");
        }
      } catch {
        setError("Network error");
      }
    }
    fetchBlogs();
  }, [isAuthenticated, user?._id]); // 👈 depend on user._id too

  // Search and sorting functionality
  useEffect(() => {
    let filtered = blogs;

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = blogs.filter((blog) =>
        blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.postedBy?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    if (sortBy === "popular") {
      filtered = [...filtered].sort((a, b) => {
        const aPopularity = (a.likesCount || 0) + (a.commentsCount || 0);
        const bPopularity = (b.likesCount || 0) + (b.commentsCount || 0);
        return bPopularity - aPopularity;
      });
    } else {
      // Sort by latest (default)
      filtered = [...filtered].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    setFilteredBlogs(filtered);
    // Reset to first page when search or sort changes
    setCurrentPage(1);
  }, [searchTerm, blogs, sortBy]);

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

    // Find the current blog to check its liked status
    const currentBlog = blogs.find(blog => blog._id === blogId);
    const isCurrentlyLiked = currentBlog?.liked || false;

    // Show thumb popup only when liking (not when unliking)
    if (!isCurrentlyLiked) {
      setShowThumbPopup(prev => ({ ...prev, [blogId]: true }));

      // Hide popup after 2 seconds
      setTimeout(() => {
        setShowThumbPopup(prev => ({ ...prev, [blogId]: false }));
      }, 2000);
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

  const handleClearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredBlogs.length / blogsPerPage);
  const startIndex = (currentPage - 1) * blogsPerPage;
  const endIndex = startIndex + blogsPerPage;
  const currentBlogs = filteredBlogs.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (error) return <p>Error: {error}</p>;

  // Helper function to extract only image URLs from HTML content (excluding videos)
  const extractImageOnly = (htmlContent: string): string | null => {
    // Match img tags that are not YouTube videos or Drive videos
    const imgRegex = /<img[^>]+src="([^">]+)"/gi;
    let match;

    while ((match = imgRegex.exec(htmlContent)) !== null) {
      const src = match[1];
      // Skip YouTube thumbnails, Drive video previews, and any video-related content
      if (!src.includes('youtube.com') &&
        !src.includes('youtu.be') &&
        !src.includes('drive.google.com') &&
        !src.includes('googleapis.com') &&
        !src.includes('ytimg.com') &&
        !src.includes('video')) {
        return src;
      }
    }
    return null;
  };

  // Helper function to remove all images, videos, and their containers from HTML content
  const removeImagesFromContent = (htmlContent: string): string => {
    let cleanContent = htmlContent;

    // Remove YouTube iframes and embed codes
    cleanContent = cleanContent.replace(/<iframe[^>]*youtube[^>]*>.*?<\/iframe>/gi, '');
    cleanContent = cleanContent.replace(/<iframe[^>]*youtu\.be[^>]*>.*?<\/iframe>/gi, '');

    // Remove video elements
    cleanContent = cleanContent.replace(/<video[^>]*>.*?<\/video>/gi, '');

    // Remove img tags and their common containers
    cleanContent = cleanContent.replace(/<figure[^>]*>.*?<\/figure>/gi, '');
    cleanContent = cleanContent.replace(/<div[^>]*class="[^"]*image[^"]*"[^>]*>.*?<\/div>/gi, '');
    cleanContent = cleanContent.replace(/<div[^>]*class="[^"]*video[^"]*"[^>]*>.*?<\/div>/gi, '');
    cleanContent = cleanContent.replace(/<p[^>]*>\s*<img[^>]*>\s*<\/p>/gi, '');
    cleanContent = cleanContent.replace(/<p[^>]*>\s*<iframe[^>]*>\s*<\/p>/gi, '');
    cleanContent = cleanContent.replace(/<img[^>]*>/gi, '');

    // Remove empty paragraphs that might be left behind
    cleanContent = cleanContent.replace(/<p[^>]*>\s*<\/p>/gi, '');
    cleanContent = cleanContent.replace(/<div[^>]*>\s*<\/div>/gi, '');

    return cleanContent;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Main Heading - Responsive text sizes */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-center mb-4 bg-gradient-to-r from-slate-800 via-teal-600 to-slate-700 bg-clip-text text-transparent tracking-tight px-2">
          {searchTerm ? `Search Results` : sortBy === "popular" ? "Popular Articles" : "Latest Articles"}
        </h1>

        {searchTerm && (
          <div className="text-center mb-6 sm:mb-8 px-2">
            <span className="text-lg sm:text-xl text-gray-600 font-medium">
              for <span className="text-teal-700 font-semibold">{searchTerm}</span>
            </span>
          </div>
        )}

        {/* Enhanced Search Section - Better mobile spacing */}
        <div className="bg-white/90 backdrop-blur-xl border border-teal-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl mb-6 sm:mb-8">
          <div className="relative max-w-2xl mx-auto mb-4 sm:mb-6">
            <div className="absolute inset-y-0 left-0 pl-4 sm:pl-6 flex items-center pointer-events-none">
              <svg className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search articles by title, content, or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 sm:pl-14 pr-12 sm:pr-14 py-3 sm:py-4 bg-white/95 border-2 border-teal-200 rounded-xl sm:rounded-2xl text-sm sm:text-base text-gray-700 font-medium placeholder-gray-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 focus:outline-none transition-all duration-300 shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-4 sm:pr-6 flex items-center text-gray-400 hover:text-red-500 transition-colors duration-200"
              >
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filter Buttons - Better mobile layout */}
          <div className="flex justify-center gap-2 sm:gap-3">
            <button
              onClick={() => setSortBy("latest")}
              className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-semibold text-xs sm:text-sm transition-all duration-300 ${sortBy === "latest"
                ? 'bg-teal-600 text-white shadow-lg border-2 border-teal-600'
                : 'bg-white/80 text-gray-600 border-2 border-teal-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300'
                }`}
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden xs:inline">Latest</span>
            </button>
            <button
              onClick={() => setSortBy("popular")}
              className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-semibold text-xs sm:text-sm transition-all duration-300 ${sortBy === "popular"
                ? 'bg-teal-600 text-white shadow-lg border-2 border-teal-600'
                : 'bg-white/80 text-gray-600 border-2 border-teal-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300'
                }`}
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="hidden xs:inline">Popular</span>
            </button>
          </div>
        </div>

        {/* Statistics - More responsive */}
        <div className="text-center mb-6 sm:mb-8 px-2">
          {searchTerm && (
            <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-white/90 border border-teal-200 text-teal-800 px-3 sm:px-6 py-2 sm:py-3 rounded-full font-semibold text-xs sm:text-sm backdrop-blur-md shadow-lg">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="break-words">Found {filteredBlogs.length} article{filteredBlogs.length !== 1 ? 's' : ''}</span>
              {totalPages > 1 && <span className="hidden sm:inline">• Page {currentPage} of {totalPages}</span>}
            </div>
          )}

          {!searchTerm && totalPages > 1 && (
            <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-white/90 border border-teal-200 text-teal-800 px-3 sm:px-6 py-2 sm:py-3 rounded-full font-semibold text-xs sm:text-sm backdrop-blur-md shadow-lg">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="break-words text-center">
                <span className="block sm:inline">Showing {startIndex + 1}-{Math.min(endIndex, filteredBlogs.length)} of {filteredBlogs.length}</span>
                <span className="block sm:inline sm:ml-1">• Page {currentPage} of {totalPages}</span>
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        {!blogs.length ? (
          <div className="text-center py-12 sm:py-20">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-teal-200 border-l-teal-600 rounded-full animate-spin mx-auto mb-4 sm:mb-6"></div>
            <p className="text-gray-600 text-base sm:text-lg font-medium">Loading articles...</p>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="text-center py-12 sm:py-20 bg-white/60 rounded-xl sm:rounded-2xl mx-auto max-w-2xl">
            <div className="text-4xl sm:text-6xl mb-4 sm:mb-6">📝</div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">No articles found</h3>
            <p className="text-gray-600 mb-4 sm:mb-6 text-base sm:text-lg px-4">No articles were found that match your search terms.</p>
            <button
              onClick={handleClearSearch}
              className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-semibold hover:from-teal-700 hover:to-teal-800 transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
            >
              View All Articles
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-6 sm:space-y-8">
              {currentBlogs.map((blog, index) => {
                const contentWithoutImages = removeImagesFromContent(blog.content);
                const paragraphs = contentWithoutImages.split("</p>").slice(0, 2).join("</p>") + "</p>";
                // Check for actual uploaded image first
                const blogImage = extractImageOnly(blog.content) ||
                  (blog.image &&
                    !blog.image.includes('youtube') &&
                    !blog.image.includes('youtu.be') &&
                    !blog.image.includes('drive.google') &&
                    !blog.image.includes('ytimg.com') &&
                    !blog.image.includes('video') ? blog.image : null);

                return (
                  <article
                    key={blog._id}
                    className="bg-white border border-teal-100 rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 sm:hover:-translate-y-2 hover:border-teal-200 shadow-lg animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex flex-col lg:flex-row gap-0 lg:gap-8 items-start">
                      {/* Image Section - Fully visible images with consistent sizing */}
                      <div className="w-full lg:w-80 lg:flex-shrink-0 p-4 sm:p-6 pb-0 lg:pb-6">
                        {blogImage ? (
                          // Show actual uploaded image with object-contain to show full image
                          <div className="w-full h-48 sm:h-56 lg:h-52 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg transition-transform duration-300 hover:scale-105 bg-gray-50 flex items-center justify-center">
                            <img
                              src={blogImage}
                              alt={blog.title}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : (
                          // Show placeholder with "ZEVA Blogs" text - consistent sizing
                          <div className="w-full h-48 sm:h-56 lg:h-52 rounded-xl sm:rounded-2xl shadow-lg transition-transform duration-300 hover:scale-105 bg-gradient-to-br from-teal-400 via-teal-500 to-teal-600 flex items-center justify-center relative overflow-hidden">
                            {/* Background Pattern */}
                            <div className="absolute inset-0 opacity-10">
                              <div className="absolute inset-0" style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                              }}></div>
                            </div>

                            {/* Content */}
                            <div className="text-center z-10">
                              <div className="mb-2 sm:mb-3">
                                <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white mx-auto opacity-80" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <h3 className="text-white font-bold text-base sm:text-lg lg:text-xl tracking-wider drop-shadow-md">ZEVA</h3>
                              <p className="text-white/90 text-xs sm:text-sm font-medium tracking-wide drop-shadow-sm">Blogs</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content Section - Better mobile spacing */}
                      <div className="flex-1 p-4 sm:p-6 lg:py-8 pt-2 sm:pt-4 lg:pt-8">
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight text-gray-900 mb-3 sm:mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                          {blog.title}
                        </h2>

                        <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-3 mb-4 sm:mb-5 text-sm">
                          <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-teal-50 to-teal-100 text-teal-800 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full font-semibold text-xs sm:text-xs">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            <span className="truncate max-w-[120px] sm:max-w-none">{blog.postedBy?.name || "Unknown Author"}</span>
                          </div>
                          <span className="text-gray-500 font-medium text-xs sm:text-sm">
                            {new Date(blog.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>

                        {/* Content preview - Better mobile text */}
                        <div className="text-gray-600 leading-relaxed text-sm sm:text-base mb-4 sm:mb-6">
                          {parse(paragraphs)}
                        </div>

                        {/* Action buttons - Mobile-first design */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-4 sm:pt-5 border-t border-teal-50">
                          <div className="flex items-center gap-2 sm:gap-4 justify-center sm:justify-start">
                            {/* Like Button */}
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleLike(blog._id);
                                }}
                                className={`group flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full font-semibold text-xs sm:text-sm transition-all duration-200 ${blog.liked
                                  ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                  : "bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-500 border border-gray-200 hover:border-blue-200"
                                  }`}
                              >
                                <svg
                                  className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-200 hover:scale-105 ${blog.liked ? "text-red-500" : "text-gray-400 hover:text-red-400"
                                    }`}
                                  fill={blog.liked ? "currentColor" : "none"}
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 
         7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 
         0 0 0 0-7.78z"
                                  />
                                </svg>

                                <span className="bg-white/50 px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-bold">
                                  {blog.likesCount ?? 0}
                                </span>
                              </button>
                            </div>

                            {/* Comment Button */}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                router.push(`/blogs/${blog._id}`);
                              }}
                              className="group flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full font-semibold text-xs sm:text-sm bg-gray-50 text-gray-600 hover:bg-green-50 hover:text-green-600 border border-gray-200 hover:border-green-200 transition-all duration-200"
                            >
                              <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 hover:text-blue-500 transition-colors duration-200">
                                <path d="M21.99 4c0-1.1-.89-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"
                                  fill="currentColor" />
                              </svg>
                              <span className="bg-white/50 px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-bold">
                                {blog.commentsCount ?? 0}
                              </span>
                            </button>
                          </div>

                          <Link href={`/blogs/${blog._id}`}>
                            <button className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 bg-teal-600 text-white font-semibold rounded-full shadow-md hover:bg-teal-700 hover:shadow-lg transform hover:scale-105 transition-all duration-200 text-sm sm:text-base">
                              Read More
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                              </svg>
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Professional Pagination - Mobile responsive */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-12 sm:mt-16 py-6 sm:py-8">
                {/* Mobile: Stack buttons vertically on very small screens */}
                <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 sm:px-4 py-2 sm:py-3 bg-white border-2 border-teal-200 text-gray-600 font-semibold text-xs sm:text-sm rounded-lg sm:rounded-xl transition-all duration-300 hover:bg-teal-600 hover:text-white hover:-translate-y-1 hover:shadow-lg disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="hidden xs:inline">Prev</span>
                  </button>

                  <div className="flex gap-1 sm:gap-2 mx-2">
                    {currentPage > 3 && (
                      <>
                        <button
                          onClick={() => handlePageChange(1)}
                          className="min-w-[36px] sm:min-w-[44px] h-9 sm:h-11 bg-white border-2 border-teal-200 text-gray-600 font-semibold text-xs sm:text-sm rounded-lg sm:rounded-xl transition-all duration-300 hover:bg-teal-600 hover:text-white hover:-translate-y-1 hover:shadow-lg"
                        >
                          1
                        </button>
                        {currentPage > 4 && (
                          <span className="flex items-center px-1 sm:px-2 text-gray-400 font-bold text-xs sm:text-sm">⋯</span>
                        )}
                      </>
                    )}

                    {Array.from({ length: totalPages }, (_, index) => index + 1)
                      .filter(page => {
                        if (currentPage <= 3) return page <= 5;
                        if (currentPage >= totalPages - 2) return page >= totalPages - 4;
                        return Math.abs(page - currentPage) <= 2;
                      })
                      .map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`min-w-[36px] sm:min-w-[44px] h-9 sm:h-11 font-semibold text-xs sm:text-sm rounded-lg sm:rounded-xl transition-all duration-300 ${currentPage === page
                            ? 'bg-teal-600 text-white border-2 border-teal-600 shadow-lg'
                            : 'bg-white border-2 border-teal-200 text-gray-600 hover:bg-teal-600 hover:text-white hover:-translate-y-1 hover:shadow-lg'
                            }`}
                        >
                          {page}
                        </button>
                      ))}

                    {currentPage < totalPages - 2 && totalPages > 5 && (
                      <>
                        {currentPage < totalPages - 3 && (
                          <span className="flex items-center px-1 sm:px-2 text-gray-400 font-bold text-xs sm:text-sm">⋯</span>
                        )}
                        <button
                          onClick={() => handlePageChange(totalPages)}
                          className="min-w-[36px] sm:min-w-[44px] h-9 sm:h-11 bg-white border-2 border-teal-200 text-gray-600 font-semibold text-xs sm:text-sm rounded-lg sm:rounded-xl transition-all duration-300 hover:bg-teal-600 hover:text-white hover:-translate-y-1 hover:shadow-lg"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 sm:px-4 py-2 sm:py-3 bg-white border-2 border-teal-200 text-gray-600 font-semibold text-xs sm:text-sm rounded-lg sm:rounded-xl transition-all duration-300 hover:bg-teal-600 hover:text-white hover:-translate-y-1 hover:shadow-lg disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  >
                    <span className="hidden xs:inline">Next</span>
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}

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
      </div>

      {/* Enhanced CSS for better responsiveness */}
      <style jsx>{`
      @keyframes fade-in-up {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-fade-in-up {
        animation: fade-in-up 0.6s ease-out both;
      }
      
      /* Custom breakpoint for very small screens */
      @media (min-width: 475px) {
        .xs\\:flex-row {
          flex-direction: row;
        }
        .xs\\:items-center {
          align-items: center;
        }
        .xs\\:inline {
          display: inline;
        }
      }
    `}</style>
    </div>
  );
}