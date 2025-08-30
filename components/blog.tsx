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
  const [isTransitioning, setIsTransitioning] = useState(false);
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

  // Extract first image from HTML content (excluding all video content)
  const extractFirstImage = (content: string): string | null => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    
    // Remove all iframe and video elements first
    const iframes = doc.getElementsByTagName('iframe');
    const videos = doc.getElementsByTagName('video');
    
    // Remove iframes (YouTube embeds, etc.)
    for (let i = iframes.length - 1; i >= 0; i--) {
      iframes[i].remove();
    }
    
    // Remove video elements
    for (let i = videos.length - 1; i >= 0; i--) {
      videos[i].remove();
    }
    
    // Now get images, but be very strict about filtering
    const images = doc.getElementsByTagName('img');
    
    for (let i = 0; i < images.length; i++) {
      const src = images[i].src;
      const alt = images[i].alt?.toLowerCase() || '';
      
      // Skip if no src
      if (!src) continue;
      
      // Skip all video-related content
      if (
        src.includes('youtube') || 
        src.includes('youtu.be') || 
        src.includes('ytimg') ||
        src.includes('vimeo') ||
        src.includes('dailymotion') ||
        src.includes('video') ||
        alt.includes('video') ||
        alt.includes('youtube') ||
        alt.includes('play')
      ) {
        continue;
      }
      
      // Only return actual image files
      if (
        src.includes('.jpg') || 
        src.includes('.jpeg') || 
        src.includes('.png') || 
        src.includes('.gif') || 
        src.includes('.webp') ||
        src.includes('.svg')
      ) {
        return src;
      }
    }
    return null;
  };

  // Get the number of slides that can fit in the current viewport
  const getSlidesPerView = () => {
    if (typeof window === 'undefined') return 1;
    const width = window.innerWidth;
    if (width >= 1024) return 3; // lg screens
    if (width >= 768) return 2;  // md screens
    return 1; // sm screens
  };

  const [slidesPerView, setSlidesPerView] = useState(1);

  useEffect(() => {
    const updateSlidesPerView = () => {
      setSlidesPerView(getSlidesPerView());
    };
    
    updateSlidesPerView();
    window.addEventListener('resize', updateSlidesPerView);
    return () => window.removeEventListener('resize', updateSlidesPerView);
  }, []);

  const totalSlides = Math.max(0, blogs.length - slidesPerView + 1);

  // Manual slide navigation
  const goToSlide = (slideIndex: number) => {
    if (isTransitioning || slideIndex === currentSlide) return;
    
    setIsTransitioning(true);
    setCurrentSlide(slideIndex);
    
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const nextSlide = () => {
    const nextIndex = currentSlide >= totalSlides - 1 ? 0 : currentSlide + 1;
    goToSlide(nextIndex);
  };

  const prevSlide = () => {
    const prevIndex = currentSlide <= 0 ? totalSlides - 1 : currentSlide - 1;
    goToSlide(prevIndex);
  };

  // Auto-slide every 4 seconds
  useEffect(() => {
    if (blogs.length <= slidesPerView) return; // Don't auto-slide if all cards fit
    
    const interval = setInterval(() => {
      if (!isTransitioning) {
        nextSlide();
      }
    }, 4000);
    
    return () => clearInterval(interval);
  }, [blogs, currentSlide, isTransitioning, slidesPerView, totalSlides]);

  if (error) return (
    <div className="w-full bg-red-50 border border-red-200 rounded-lg p-4">
      <p className="text-red-600 font-medium">Error: {error}</p>
    </div>
  );

  if (!blogs.length) return (
    <div className="w-full px-4 py-6">
      <div className="flex justify-between items-center mb-8">
        <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded-lg w-36 animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-100 rounded-xl h-[400px] animate-pulse"></div>
        ))}
      </div>
    </div>
  );

  // Default image component
  const DefaultImage = () => (
    <div className="w-full h-48 rounded-t-2xl shadow-lg transition-transform duration-300 group-hover:scale-105 bg-gradient-to-br from-teal-400 via-teal-500 to-teal-600 flex items-center justify-center relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>
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
      <div className="relative overflow-hidden">
        {/* Navigation Arrows */}
        {blogs.length > slidesPerView && (
          <>
            <button
              onClick={prevSlide}
              disabled={isTransitioning}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={nextSlide}
              disabled={isTransitioning}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Slider */}
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{
              transform: `translateX(-${currentSlide * (100 / slidesPerView)}%)`,
            }}
          >
            {blogs.map((blog) => {
              const paragraphs = blog.content.split("</p>").slice(0, 2).join("</p>") + "</p>";
              const firstImage = extractFirstImage(blog.content);
              const blogImage = blog.image || firstImage;

              return (
                <div
                  key={blog._id}
                  className="w-full md:w-1/2 lg:w-1/3 flex-shrink-0 px-3"
                >
                  <Link href={`/blogs/${blog._id}`}>
                    <div className="cursor-pointer bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-50 hover:border-[#2D9AA5]/30 h-[400px] w-full flex flex-col group">
                      
                      {/* Image Section - Consistent Height */}
                      <div className="h-48 relative overflow-hidden flex-shrink-0">
                        {blogImage ? (
                          <img
                            src={blogImage}
                            alt={blog.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            onError={(e) => {
                              // If image fails to load, show default
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                parent.innerHTML = `
                                  <div class="w-full h-48 bg-gradient-to-br from-teal-400 via-teal-500 to-teal-600 flex items-center justify-center relative overflow-hidden">
                                    <div class="absolute inset-0 opacity-10">
                                      <div class="absolute inset-0" style="background-image: url('data:image/svg+xml,%3Csvg width=\\'60\\' height=\\'60\\' viewBox=\\'0 0 60 60\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'none\\' fill-rule=\\'evenodd\\'%3E%3Cg fill=\\'%23ffffff\\' fill-opacity=\\'0.1\\'%3E%3Cpath d=\\'m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"></div>
                                    </div>
                                    <div class="text-center z-10">
                                      <div class="mb-3">
                                        <svg class="w-12 h-12 text-white mx-auto opacity-80" fill="currentColor" viewBox="0 0 20 20">
                                          <path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                                        </svg>
                                      </div>
                                      <h3 class="text-white font-bold text-lg tracking-wider drop-shadow-md">ZEVA</h3>
                                      <p class="text-white/90 text-sm font-medium tracking-wide drop-shadow-sm">Blogs</p>
                                    </div>
                                  </div>
                                `;
                              }
                            }}
                          />
                        ) : (
                          <DefaultImage />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      </div>
                      
                      {/* Content Section */}
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
        </div>

        {/* Slide Indicators */}
        {blogs.length > slidesPerView && (
          <div className="flex justify-center mt-6 space-x-2">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                disabled={isTransitioning}
                className={`h-2 rounded-full transition-all duration-300 disabled:cursor-not-allowed ${
                  index === currentSlide 
                    ? 'bg-[#2D9AA5] w-8' 
                    : 'bg-gray-300 w-2 hover:bg-gray-400'
                }`}
              ></button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}