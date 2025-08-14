import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import parse from "html-react-parser";

type Blog = {
  _id: string;
  title: string;
  content: string;
  postedBy: { name: string };
  role: string;
  createdAt: string;
  image?: string;
};

export default function BlogList() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function fetchBlogs() {
      try {
        const res = await fetch("/api/blog/getAllBlogs");
        const json = await res.json();
        if (res.ok && json.success) {
          const allBlogs = json.blogs || json.data;
          setBlogs(allBlogs.slice(0, 6)); // only first 6
        } else {
          setError(json.error || "Failed to fetch blogs");
        }
      } catch {
        setError("Network error");
      }
    }
    fetchBlogs();
  }, []);

  // Auto-slide every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (sliderRef.current && blogs.length > 0) {
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
    }, 3000);
    return () => clearInterval(interval);
  }, [blogs]);

  if (error) return (
    <div className="w-full bg-red-50 border border-red-200 rounded-lg p-4">
      <p className="text-red-600 font-medium">Error: {error}</p>
    </div>
  );

  if (!blogs.length) return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded-lg w-36 animate-pulse"></div>
      </div>
      <div className="flex space-x-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="min-w-[320px] bg-gray-100 rounded-xl h-[220px] animate-pulse"></div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full px-4 py-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-1">Latest Blogs</h2>
          <p className="text-gray-600 text-sm">Discover insights and stories from our community</p>
        </div>
        <Link href="/blogs/viewBlogs">
          <button className="bg-[#2D9AA5] hover:bg-[#237a82] text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center space-x-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
            <span>View All Blogs</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </Link>
      </div>

      {/* Slider Container */}
      <div className="relative">
        <div
          ref={sliderRef}
          className="flex overflow-x-hidden space-x-6 scroll-smooth pb-6"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {blogs.map((blog, index) => {
            const paragraphs =
              blog.content.split("</p>").slice(0, 2).join("</p>") + "</p>";

            return (
              <div
                key={blog._id}
                className="w-[280px] sm:w-[320px] lg:w-[360px] group flex-shrink-0"
                style={{ scrollSnapAlign: "start" }}
              >
                <Link href={`/blogs/${blog._id}`}>
                  <div className="cursor-pointer bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-50 group-hover:border-[#2D9AA5]/30 h-[400px] w-full flex flex-col">
                    
                    {blog.image ? (
                      // Card with image
                      <>
                        <div className="h-48 relative overflow-hidden flex-shrink-0">
                          <img
                            src={blog.image}
                            alt={blog.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        </div>
                        
                        <div className="p-5 flex flex-col flex-1">
                          <h3 className="text-base font-bold text-gray-800 leading-snug line-clamp-3 group-hover:text-[#2D9AA5] transition-colors duration-300 mb-3">
                            {blog.title}
                          </h3>
                          
                          <div className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-4 flex-1">
                            {parse(paragraphs)}
                          </div>
                          
                          <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                            <div className="flex items-center text-xs text-gray-500 space-x-2">
                              <span className="font-medium text-gray-700">{blog.postedBy.name}</span>
                              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                              <span>
                                {new Date(blog.createdAt).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            <div className="text-xs text-[#2D9AA5] font-semibold">
                              Read →
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      // Card without image - same height and structure
                      <div className="p-6 flex flex-col h-full">
                        {/* <div className="h-48 flex items-center justify-center mb-4 bg-gradient-to-br from-[#2D9AA5]/5 to-[#2D9AA5]/10 rounded-lg flex-shrink-0">
                          <div className="text-[#2D9AA5]/30">
                            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                            </svg>
                          </div>
                        </div> */}
                        
                        <div className="flex flex-col flex-1">
                          <h3 className="text-base font-bold text-gray-800 leading-snug line-clamp-3 group-hover:text-[#2D9AA5] transition-colors duration-300 mb-3">
                            {blog.title}
                          </h3>
                          
                          <div className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-4 flex-1">
                            {parse(paragraphs)}
                          </div>
                          
                          <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                            <div className="flex items-center text-xs text-gray-500 space-x-2">
                              <span className="font-medium text-gray-700">{blog.postedBy.name}</span>
                              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                              <span>
                                {new Date(blog.createdAt).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            <div className="text-xs text-[#2D9AA5] font-semibold">
                              Read More →
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Dynamic Slide Indicators */}
        <div className="flex justify-center mt-6 space-x-2">
          {blogs.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-[#2D9AA5] w-6' 
                  : 'bg-gray-300'
              }`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}