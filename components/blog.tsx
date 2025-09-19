import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";

type Blog = {
  _id: string;
  title: string;
  content: string;
  postedBy: { name: string };
  role: string;
  createdAt: string;
  image?: string;
  images?: string[];
};

export default function BlogList() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement | null>(null);

  // Function to extract first image from HTML content
  const extractFirstImageFromContent = (htmlContent: string): string | null => {
    const imgRegex = /<img[^>]+src="([^">]+)"/i;
    const match = htmlContent.match(imgRegex);
    return match ? match[1] : null;
  };

  // Function to get display image info
  const getDisplayImage = (blog: Blog): { src: string; isPlaceholder: boolean } => {
    if (blog.image) return { src: blog.image, isPlaceholder: false };

    const contentImage = extractFirstImageFromContent(blog.content);
    if (contentImage) return { src: contentImage, isPlaceholder: false };

    return { src: "", isPlaceholder: true };
  };

  // Function to limit content to 20 words
  const limitContentToWords = (htmlContent: string, wordLimit: number = 20): string => {
    // Remove HTML tags to get plain text
    const textContent = htmlContent.replace(/<[^>]*>/g, '');
    // Split into words and limit
    const words = textContent.trim().split(/\s+/);
    const limitedWords = words.slice(0, wordLimit);
    return limitedWords.join(' ') + (words.length > wordLimit ? '...' : '');
  };

  // Navigation functions
  const slideLeft = () => {
    if (sliderRef.current) {
      const slideWidth = sliderRef.current.clientWidth;
      sliderRef.current.scrollBy({
        left: -slideWidth,
        behavior: "smooth",
      });
      setCurrentSlide(prev => (prev - 1 + blogs.length) % blogs.length);
    }
  };

  const slideRight = () => {
    if (sliderRef.current) {
      const slideWidth = sliderRef.current.clientWidth;
      const maxScroll = sliderRef.current.scrollWidth - sliderRef.current.clientWidth;

      if (sliderRef.current.scrollLeft >= maxScroll) {
        sliderRef.current.scrollTo({ left: 0, behavior: "smooth" });
        setCurrentSlide(0);
      } else {
        sliderRef.current.scrollBy({
          left: slideWidth,
          behavior: "smooth",
        });
        setCurrentSlide(prev => (prev + 1) % blogs.length);
      }
    }
  };

 useEffect(() => {
  async function fetchBlogs() {
    try {
      const res = await fetch("/api/blog/getAllBlogs");
      const json = await res.json();
      if (res.ok && json.success) {
        const allBlogs = json.blogs || json.data;

        // ✅ Sort by createdAt DESC
        const sortedBlogs = allBlogs.sort(
          (a: Blog, b: Blog) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // ✅ Take latest 6
        setBlogs(sortedBlogs.slice(0, 6));
      } else {
        setError(json.error || "Failed to fetch blogs");
      }
    } catch {
      setError("Network error");
    } finally {
      setIsLoading(false);
    }
  }
  fetchBlogs();
}, []);

  if (error) {
    return (
      <div className="w-full bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 font-medium">Error: {error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-5 w-5 rounded-full border-2 border-gray-300 border-t-[#2D9AA5] animate-spin"></div>
          <p className="text-gray-700 text-sm font-medium">Loading blogs...</p>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-24 sm:w-32 animate-pulse"></div>
          <div className="h-8 sm:h-10 bg-gray-200 rounded-lg w-28 sm:w-36 animate-pulse"></div>
        </div>
        <div className="flex space-x-3 sm:space-x-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[240px] sm:min-w-[280px] bg-gray-100 rounded-xl h-[180px] sm:h-[200px] animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!blogs.length) {
    return (
      <div className="w-full px-2 sm:px-4 lg:px-6 py-6">
        <div className="bg-white border border-gray-100 rounded-xl p-6 text-center shadow-sm">
          <p className="text-gray-700 font-medium">No blogs found.</p>
          <p className="text-gray-500 text-sm mt-1">Please check back later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">Latest Blogs</h2>
          <p className="text-gray-600 text-sm">Discover insights and stories from our community</p>
        </div>
        <Link href="/blogs/viewBlogs">
          <button className="bg-[#2D9AA5] hover:bg-[#237a82] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center space-x-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
            <span>View All Blogs</span>
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </Link>
      </div>

      {/* Slider Container */}
      <div className="relative">
        {/* Left Arrow */}
        <button
          onClick={slideLeft}
          className="absolute left-0 sm:left-2 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-50 shadow-lg hover:shadow-xl rounded-full p-2 sm:p-3 transition-all duration-300 border border-gray-200 group"
          disabled={currentSlide === 0}
        >
          <svg
            className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300 ${currentSlide === 0
                ? 'text-gray-400'
                : 'text-gray-600 group-hover:text-[#2D9AA5]'
              }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Right Arrow */}
        <button
          onClick={slideRight}
          className="absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-50 shadow-lg hover:shadow-xl rounded-full p-2 sm:p-3 transition-all duration-300 border border-gray-200 group"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-[#2D9AA5] transition-colors duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div
          ref={sliderRef}
          className="flex overflow-x-hidden space-x-3 sm:space-x-6 scroll-smooth pb-6 mx-8 sm:mx-12"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {blogs.map((blog) => {
            // const paragraphs =
            //   blog.content.split("</p>").slice(0, 2).join("</p>") + "</p>";

            const imageInfo = getDisplayImage(blog);

            return (
              <div
                key={blog._id}
                className="w-[240px] xs:w-[260px] sm:w-[280px] md:w-[300px] lg:w-[320px] xl:w-[340px] group flex-shrink-0"
                style={{ scrollSnapAlign: "start" }}
              >
                <Link href={`/blogs/${blog._id}`}>
                  <div className="cursor-pointer bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-50 group-hover:border-[#2D9AA5]/30 h-[320px] sm:h-[360px] w-full flex flex-col">

                    {/* Image section */}
                    <div className="h-32 sm:h-40 relative overflow-hidden flex-shrink-0">
                      {imageInfo.isPlaceholder ? (
                        <div className="w-full h-full rounded-t-2xl shadow-lg transition-transform duration-300 group-hover:scale-105 bg-gradient-to-br from-teal-400 via-teal-500 to-teal-600 flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 opacity-10">
                            <div
                              className="absolute inset-0"
                              style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                              }}
                            ></div>
                          </div>

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
                      ) : (
                        <>
                          <img
                            src={imageInfo.src}
                            alt={blog.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        </>
                      )}

                      <div className="absolute top-2 right-2">
                        {blog.image ? (
                          <div className="bg-green-500 w-2 h-2 rounded-full" title="Featured Image"></div>
                        ) : extractFirstImageFromContent(blog.content) ? (
                          <div className="bg-blue-500 w-2 h-2 rounded-full" title="Content Image"></div>
                        ) : (
                          <div className="bg-gray-400 w-2 h-2 rounded-full" title="Placeholder Image"></div>
                        )}
                      </div>
                    </div>

                    <div className="p-3 sm:p-4 flex flex-col flex-1">
                      <h3 className="text-sm sm:text-base font-bold text-gray-800 leading-snug line-clamp-2 group-hover:text-[#2D9AA5] transition-colors duration-300 mb-2">
                        {blog.title}
                      </h3>

                      <div className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-2 flex-1 break-words overflow-hidden">
                        {limitContentToWords(blog.content, 15)}
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                        <div className="flex items-center text-xs text-gray-500 space-x-1 sm:space-x-2">
                          <span className="font-medium text-gray-700 truncate max-w-[80px] sm:max-w-none">{blog.postedBy?.name || "Unknown Author"}</span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full flex-shrink-0"></span>
                          <span className="flex-shrink-0">
                            {new Date(blog.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="text-xs text-[#2D9AA5] font-semibold flex-shrink-0">
                          Read More →
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Dynamic Slide Indicators */}
        <div className="flex justify-center mt-4 sm:mt-6 space-x-2">
          {blogs.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentSlide
                  ? 'bg-[#2D9AA5] w-4 sm:w-6'
                  : 'bg-gray-300'
                }`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}