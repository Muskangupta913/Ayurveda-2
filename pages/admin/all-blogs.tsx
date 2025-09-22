import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import axios from "axios";
import { Trash2, Eye, X, Search } from "lucide-react";
import withAdminAuth from "../../components/withAdminAuth";
import AdminLayout from "../../components/AdminLayout";
import type { NextPageWithLayout } from "../_app";

// ✅ Blog interface
interface Blog {
  _id: string;
  title: string;
  content?: string;
  status: string;
  paramlink: string;
  postedBy: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  role: string;
  likes: Array<{ _id: string; user: string }>;
  comments: Array<{
    _id: string;
    user: {
      _id: string;
      name: string;
      email: string;
    };
    username: string;
    text: string;
    createdAt: string;
    replies?: Array<{
      _id: string;
      user: string;
      username: string;
      text: string;
      createdAt: string;
    }>;
  }>;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
  image?: string;
  youtubeUrl?: string;
}

const AdminBlogs = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReadMoreModal, setShowReadMoreModal] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true); // <-- Add loading state
  const blogsPerPage = 20;

  const processBlogs = (blogs: Blog[]) => {
    return blogs.map(blog => ({
      ...blog,
      likesCount: blog.likes?.length || 0,
      commentsCount: blog.comments?.length || 0
    }));
  };

  const fetchBlogs = useCallback(async () => {
    const token = localStorage.getItem("adminToken");
    setLoading(true);
    try {
      const res = await axios.get<{ blogs: Blog[] }>("/api/admin/get-blogs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const processedBlogs = processBlogs(res.data.blogs);
      setBlogs(processedBlogs);
      setFilteredBlogs(processedBlogs);
    } catch (err) {
      // console.error("Error fetching blogs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Search functionality
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page when searching

    if (term.trim() === "") {
      setFilteredBlogs(blogs);
    } else {
      const filtered = blogs.filter(blog =>
        blog.title.toLowerCase().includes(term.toLowerCase()) ||
        (blog.postedBy?.name && blog.postedBy.name.toLowerCase().includes(term.toLowerCase()))
      );
      setFilteredBlogs(filtered);
    }
  };

  const deleteBlog = async (id: string) => {
    const token = localStorage.getItem("adminToken");

    try {
      await axios.delete(`/api/admin/deleteBlog/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedBlogs = blogs.filter((b) => b._id !== id);
      setBlogs(updatedBlogs);

      // Update filtered blogs as well
      const updatedFilteredBlogs = filteredBlogs.filter((b) => b._id !== id);
      setFilteredBlogs(updatedFilteredBlogs);

      setShowDeleteModal(false);
      setSelectedBlog(null);
    } catch (err) {
      // console.error(err);
    }
  };

  const handleDeleteClick = (blog: Blog) => {
    setSelectedBlog(blog);
    setShowDeleteModal(true);
  };

  const handleReadMoreClick = (blog: Blog) => {
    setSelectedBlog(blog);
    setShowReadMoreModal(true);
  };

  const closeModals = () => {
    setShowDeleteModal(false);
    setShowReadMoreModal(false);
    setSelectedBlog(null);
  };

  // Pagination logic - now using filteredBlogs instead of blogs
  const indexOfLastBlog = currentPage * blogsPerPage;
  const indexOfFirstBlog = indexOfLastBlog - blogsPerPage;
  const currentBlogs = filteredBlogs.slice(indexOfFirstBlog, indexOfLastBlog);
  const totalPages = Math.ceil(filteredBlogs.length / blogsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Helper function to extract text from HTML
  const extractTextFromHTML = (html: string, maxLength: number = 150) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = div.textContent || div.innerText || '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Helper to extract first image src from HTML content
  const getFirstImageFromContent = (html?: string): string | null => {
    if (!html) return null;
    const div = document.createElement('div');
    div.innerHTML = html;
    const img = div.querySelector('img');
    return img ? img.src : null;
  };

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  return (
    <div className="p-4 sm:p-6">
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] relative">
          {/* Background glow effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-[#2D9AA5] opacity-10 rounded-full blur-3xl animate-pulse"></div>
          </div>

          {/* Main loader container */}
          <div className="relative z-10 flex flex-col items-center gap-6">

            {/* Enhanced spinner with multiple rings */}
            <div className="relative">
              {/* Outer ring */}
              <div className="w-16 h-16 border-2 border-gray-200 rounded-full animate-spin">
                <div className="w-full h-full border-4 border-[#2D9AA5] border-t-transparent rounded-full animate-spin" style={{ animationDuration: '1s', animationDirection: 'reverse' }}></div>
              </div>

              {/* Inner ring */}
              <div className="absolute top-2 left-2 w-12 h-12 border-2 border-[#2D9AA5] border-t-transparent border-r-transparent rounded-full animate-spin" style={{ animationDuration: '0.8s' }}></div>

              {/* Center dot */}
              <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-[#2D9AA5] rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
            </div>

            {/* Brand name with enhanced styling */}
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold bg-gradient-to-r from-[#2D9AA5] via-[#3BB4C1] to-[#2D9AA5] bg-clip-text text-transparent animate-pulse">
                ZEVA
              </span>
              <span className="text-4xl font-light text-gray-600">
                Blogs
              </span>
            </div>

            {/* Loading text with animated dots */}
            <div className="flex items-center gap-1 text-[#2D9AA5] font-medium">
              <span>Loading</span>
              <div className="flex gap-1">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#2D9AA5] to-[#3BB4C1] rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6 text-black text-center sm:text-left">
            Published Blogs
          </h1>

          {/* ✅ Search Bar */}
          <div className="mb-6 max-w-md mx-auto sm:mx-0">
            <div className="relative">
              <Search
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search by title or author name..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="text-black w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          {/* ✅ Blog Count */}
          <p className="text-sm text-gray-600 mb-4">
            Showing {indexOfFirstBlog + 1}-{Math.min(indexOfLastBlog, filteredBlogs.length)} of {filteredBlogs.length} blogs
            {searchTerm && filteredBlogs.length !== blogs.length && (
              <span className="ml-2 text-[#2D9AA5]">
                (filtered from {blogs.length} total blogs)
              </span>
            )}
          </p>

          {/* ✅ No Results Message */}
          {filteredBlogs.length === 0 && searchTerm && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg mb-2">No blogs found</p>
              <p className="text-gray-400 text-sm">
                Try adjusting your search terms or{" "}
                <button
                  onClick={() => handleSearch("")}
                  className="text-[#2D9AA5] hover:underline"
                >
                  clear search
                </button>
              </p>
            </div>
          )}

          {/* ✅ Responsive Grid */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {currentBlogs.map((blog) => {
              const firstContentImage = getFirstImageFromContent(blog.content);
              return (
                <div
                  key={blog._id}
                  className="flex flex-col bg-white border rounded-2xl shadow-md hover:shadow-lg transition duration-300 overflow-hidden"
                >
                  {/* Blog Image, YouTube, or Placeholder (only one) */}
                  {blog.image || firstContentImage ? (
                    <div className="w-full h-48 overflow-hidden flex items-center justify-center bg-gray-100 ">
                      <div className="relative w-full h-48">
                        <Image
                          src={blog.image ?? firstContentImage ?? "/placeholder-blog.jpg"}
                          alt={blog.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                    </div>
                  ) : blog.youtubeUrl ? (
                    <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <div className="w-16 h-16 mx-auto mb-2 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-xl">▶</span>
                        </div>
                        <p className="text-sm">YouTube Video</p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-48 rounded-t-2xl shadow-lg transition-transform duration-300 hover:scale-105 bg-gradient-to-br from-teal-400 via-teal-500 to-teal-600 flex items-center justify-center relative overflow-hidden">
                      {/* Background Pattern */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0" style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                        }}></div>
                      </div>
                      {/* Content */}
                      <div className="text-center z-10">
                        <div className="mb-3">
                          <svg className="w-12 h-12 text-white mx-auto opacity-80" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h3 className="text-white font-bold text-lg tracking-wider drop-shadow-md">ZEVA</h3>
                        <p className="text-white/90 text-sm font-medium tracking-wide drop-shadow-sm">Blogs</p>
                      </div>
                    </div>
                  )}

                  {/* ✅ Blog Details */}
                  <div className="flex-1 flex flex-col p-4">
                    <h2 className="text-lg sm:text-xl font-semibold text-black mb-2 line-clamp-2">
                      {blog.title}
                    </h2>

                    {/* ✅ Content Preview */}
                    {blog.content && (
                      <p className="text-gray-700 text-sm mb-3 line-clamp-3">
                        {extractTextFromHTML(blog.content)}
                      </p>
                    )}

                    {/* ✅ Meta Info */}
                    <p className="text-xs sm:text-sm text-gray-500 mt-auto">
                      Posted by: {blog.postedBy?.name || "Unknown"} ({blog.role})
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(blog.createdAt).toLocaleString()}
                    </p>

                    {/* ✅ Stats */}
                    <p className="mt-2 text-sm text-gray-600">
                      Likes: {blog.likesCount ?? 0} | Comments: {blog.commentsCount ?? 0}
                    </p>

                    {/* ✅ Action Buttons */}
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => handleReadMoreClick(blog)}
                        className="flex-1 p-2 bg-[#2D9AA5] text-white rounded-lg hover:bg-[#247a84] transition text-sm"
                      >
                        <Eye size={16} className="inline-block mr-1" />
                        Read More
                      </button>
                      <button
                        onClick={() => handleDeleteClick(blog)}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ✅ Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-lg text-sm ${currentPage === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#2D9AA5] text-white hover:bg-[#247a84]'
                  }`}
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  className={`px-3 py-2 rounded-lg text-sm ${currentPage === number
                    ? 'bg-[#2D9AA5] text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  {number}
                </button>
              ))}

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-lg text-sm ${currentPage === totalPages
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#2D9AA5] text-white hover:bg-[#247a84]'
                  }`}
              >
                Next
              </button>
            </div>
          )}

          {/* ✅ Delete Confirmation Modal */}
          {showDeleteModal && selectedBlog && (
            <div className="fixed inset-0 backdrop-blur-lg flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-black mb-2">
                  Confirm Delete
                </h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete &quot;{selectedBlog.title}&quot;? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={closeModals}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteBlog(selectedBlog._id)}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ✅ Read More Modal with Fixed Image/Video Size */}
          {showReadMoreModal && selectedBlog && (
            <div className="fixed inset-0  bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b">
                  <h3 className="text-lg sm:text-xl font-semibold text-black pr-4">
                    {selectedBlog.title}
                  </h3>
                  <button
                    onClick={closeModals}
                    className="text-black p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                  {/* Blog Image or YouTube Video - Strictly Fixed size and centered */}
                  {(selectedBlog.image || selectedBlog.youtubeUrl) && (
                    <div className="w-full h-80 overflow-hidden rounded-lg mb-4 bg-gray-100 flex items-center justify-center">
                      {selectedBlog.image && (
                        <div className="relative w-full h-full">
                        <Image
                          src={selectedBlog.image}
                          alt={selectedBlog.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                      )}
                      {selectedBlog.youtubeUrl && !selectedBlog.image && (
                        <iframe
                          className="w-full h-full rounded-lg"
                          src={selectedBlog.youtubeUrl.replace('watch?v=', 'embed/')}
                          title="YouTube Video"
                          allowFullScreen
                        ></iframe>
                      )}
                    </div>
                  )}

                  {/* Blog Content */}
                  {selectedBlog.content && (
                    <div
                      className="text-gray-700 prose prose-sm sm:prose max-w-none mb-4
                        [&_img]:mx-auto [&_img]:block [&_img]:w-120 [&_img]:h-70 [&_img]:object-cover
                        [&_video]:mx-auto [&_video]:block [&_video]:w-120 [&_video]:h-70 [&_video]:object-cover
                        [&_iframe]:mx-auto [&_iframe]:block [&_iframe]:w-120 [&_iframe]:h-70 [&_iframe]:object-cover"
                      dangerouslySetInnerHTML={{ __html: selectedBlog.content }}
                    />
                  )}

                  {/* Meta Info */}
                  <div className="border-t pt-4 mt-4">
                    <p className="text-sm text-gray-500">
                      Posted by: {selectedBlog.postedBy?.name || "Unknown"} ({selectedBlog.role})
                    </p>
                    <p className="text-sm text-gray-400">
                      {new Date(selectedBlog.createdAt).toLocaleString()}
                    </p>
                    <p className="mt-2 text-sm text-gray-600">
                      Likes: {selectedBlog.likesCount ?? 0} | Comments: {selectedBlog.commentsCount ?? 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

AdminBlogs.getLayout = function PageLayout(page: React.ReactNode) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedDashboard: NextPageWithLayout = withAdminAuth(AdminBlogs);
ProtectedDashboard.getLayout = AdminBlogs.getLayout;

export default ProtectedDashboard;