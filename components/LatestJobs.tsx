import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

type Job = {
    _id: string;
    companyName: string;
    location: string;
    salary?: string;
    salaryType?: string;
    role: string;
    createdAt: string;
    jobType?: string;
    department?: string;
    experience?: string;
    jobTitle?: string;
};

interface LatestJobsSliderProps {
    className?: string;
}

const LatestJobsSlider: React.FC<LatestJobsSliderProps> = ({ className = "" }) => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [itemsPerView, setItemsPerView] = useState(1);

    const fetchLatestJobs = async () => {
        try {
            setLoading(true);
            const res = await axios.get<{ jobs: Job[] }>(
                `/api/job-postings/all?limit=6&sort=createdAt&order=desc`
            );
            setJobs(res.data.jobs.slice(0, 6));
        } catch (err) {
            console.error("Error fetching latest jobs:", err);
            setJobs([]);
        } finally {
            setLoading(false);
        }
    };

    // Enhanced responsive items per view
    const updateItemsPerView = () => {
        const width = window.innerWidth;
        if (width >= 1440) setItemsPerView(3);
        else if (width >= 1024) setItemsPerView(3);
        else if (width >= 768) setItemsPerView(2);
        else if (width >= 640) setItemsPerView(1);
        else setItemsPerView(1);
    };

    useEffect(() => {
        updateItemsPerView();
        window.addEventListener('resize', updateItemsPerView);
        return () => window.removeEventListener('resize', updateItemsPerView);
    }, []);

    // Reset currentIndex when itemsPerView changes to prevent out-of-bounds
    useEffect(() => {
        const maxIndex = Math.max(0, jobs.length - itemsPerView);
        if (currentIndex > maxIndex) {
            setCurrentIndex(maxIndex);
        }
    }, [itemsPerView, jobs.length, currentIndex]);

    const maxIndex = Math.max(0, jobs.length - itemsPerView);

    // Manual navigation only
    const nextSlide = () => {
        if (currentIndex < maxIndex) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const prevSlide = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    const formatPostedDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    const formatSalary = (job: Job) => {
        if (job.salary) {
            // Handle salary ranges (e.g., "200000-300000" or "200000,300000")
            const salaryStr = job.salary.toString();
            const rangePattern = /(\d+)[\s]*[-,][\s]*(\d+)/;
            const match = salaryStr.match(rangePattern);

            if (match) {
                // It's a range
                const minSalary = parseInt(match[1]);
                const maxSalary = parseInt(match[2]);

                const formatNumber = (num: number) => {
                    return num >= 1000 ? `${(num / 1000).toFixed(0)}K` : num.toString();
                };

                return `${formatNumber(minSalary)}-${formatNumber(maxSalary)} AED`;
            } else {
                // Single salary value
                const salaryNum = parseInt(salaryStr.replace(/[^\d]/g, ''));
                if (salaryNum >= 1000) {
                    return `${(salaryNum / 1000).toFixed(0)}K AED`;
                }
                return `${salaryStr} AED`;
            }
        }
        return "Competitive";
    };

    const truncateText = (text: string, maxLength: number) => {
        if (!text) return "";
        return text.length <= maxLength ? text : text.substring(0, maxLength) + "...";
    };

    useEffect(() => {
        fetchLatestJobs();
    }, []);

    const showNavigation = jobs.length > itemsPerView;
    const canGoPrev = currentIndex > 0;
    const canGoNext = currentIndex < maxIndex;

    return (
        <div className={`w-full ${className}`}>
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 lg:p-8 relative overflow-hidden">

                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 bg-gradient-to-br from-[#2D9AA5] to-[#238892] opacity-5 rounded-full -translate-y-4 sm:-translate-y-8 translate-x-4 sm:translate-x-8"></div>

                {/* Enhanced Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 relative z-10 gap-4">
                    <div className="flex-1">
                        <h2 className="text-2xl sm:text-3xl font-bold text-[#2D9AA5] mb-1 sm:mb-2">
                            ZEVA JobFeed
                        </h2>

                        {/* <p className="text-gray-600 text-sm">Discover your next career move</p> */}
                    </div>
                    <div className="flex items-center justify-between sm:justify-end space-x-4">
                        <div className="text-left sm:text-right">
                            {/* <p className="text-xs text-gray-500">{jobs.length} positions available</p> */}
                        </div>
                        <Link
                            href="/job-listings"
                            className="inline-flex items-center px-3 sm:px-4 py-2 bg-[#2D9AA5] text-white rounded-lg transition-all duration-300 font-medium text-sm shadow-md whitespace-nowrap"
                        >
                            <span className="hidden sm:inline">Explore All</span>
                            <span className="sm:hidden">View All</span>
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        {[...Array(itemsPerView)].map((_, i) => (
                            <div key={i} className="flex-1 animate-pulse">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                                    <div className="bg-gray-200 h-4 sm:h-5 rounded mb-3"></div>
                                    <div className="bg-gray-200 h-3 sm:h-4 rounded mb-2 w-3/4"></div>
                                    <div className="bg-gray-200 h-3 rounded w-1/2 mb-4"></div>
                                    <div className="bg-gray-200 h-3 rounded w-2/3"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                        <div className="w-12 sm:w-16 h-12 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 sm:w-8 h-6 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                            </svg>
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">No positions available</h3>
                        <p className="text-sm text-gray-500">New opportunities will appear here soon</p>
                    </div>
                ) : (
                    /* Enhanced Professional Slider */
                    <div className="relative">
                        {/* Premium Navigation Arrows */}
                        {showNavigation && (
                            <>
                                <button
                                    onClick={prevSlide}
                                    disabled={!canGoPrev}
                                    className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-4 z-20 w-10 sm:w-12 h-10 sm:h-12 rounded-full transition-all duration-300 flex items-center justify-center shadow-lg ${canGoPrev
                                        ? 'bg-white border-2 border-gray-200 text-gray-700'
                                        : 'bg-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                    aria-label="Previous jobs"
                                >
                                    <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>

                                <button
                                    onClick={nextSlide}
                                    disabled={!canGoNext}
                                    className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-4 z-20 w-10 sm:w-12 h-10 sm:h-12 rounded-full transition-all duration-300 flex items-center justify-center shadow-lg ${canGoNext
                                        ? 'bg-white border-2 border-gray-200 text-gray-700'
                                        : 'bg-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                    aria-label="Next jobs"
                                >
                                    <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </>
                        )}

                        {/* Slider Container */}
                        <div className="overflow-hidden rounded-xl">
                            <div
                                className="flex transition-transform duration-500 ease-out"
                                style={{
                                    transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
                                }}
                            >
                                {jobs.map((job) => (
                                    <Link
                                        key={job._id}
                                        href={`/job-details/${job._id}`}
                                        className="flex-shrink-0 px-2 sm:px-3"
                                        style={{ width: `${100 / itemsPerView}%` }}
                                    >
                                        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-lg relative overflow-hidden">

                                            {/* Card Accent */}
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#2D9AA5] to-[#238892]"></div>

                                            {/* New Job Indicator */}
                                            {new Date().getTime() - new Date(job.createdAt).getTime() < 24 * 60 * 60 * 1000 && (
                                                <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                                                    <div className="w-2 sm:w-3 h-2 sm:h-3 bg-green-500 rounded-full animate-pulse"></div>
                                                </div>
                                            )}

                                            {/* Premium Job Header */}
                                            <div className="mb-3 sm:mb-4">
                                                <div className="flex items-start justify-between mb-2 gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-bold text-[#2D9AA5] text-base sm:text-lg leading-tight mb-1 break-words">
                                                            {truncateText(job.jobTitle || job.role, itemsPerView === 1 ? 50 : 35)}
                                                        </h3>
                                                        <p className="text-gray-900 font-semibold text-sm sm:text-base break-words">
                                                            {truncateText(job.companyName, itemsPerView === 1 ? 40 : 28)}
                                                        </p>
                                                    </div>
                                                    {job.jobType && (
                                                        <span className="flex-shrink-0 px-2 sm:px-3 py-1 text-xs font-semibold bg-gradient-to-r from-[#2D9AA5] to-[#238892] text-white rounded-full shadow-sm">
                                                            {job.jobType}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Premium Details Grid - Stack on mobile */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-5">
                                                <div className="flex items-center">
                                                    <div className="w-7 sm:w-8 h-7 sm:h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                                                        <svg className="w-3 sm:w-4 h-3 sm:h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        </svg>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
                                                        <p className="text-sm font-medium text-gray-900 truncate">{job.location}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center">
                                                    <div className="w-7 sm:w-8 h-7 sm:h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                                                        <span className="text-gray-600 text-xs sm:text-sm font-bold">د.إ</span>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Salary</p>
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {formatSalary(job)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Professional Tags */}
                                            <div className="flex flex-wrap gap-2 mb-4 sm:mb-5">
                                                {job.department && (
                                                    <span className="px-2 sm:px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg border">
                                                        {truncateText(job.department, 15)}
                                                    </span>
                                                )}
                                                {job.experience && (
                                                    <span className="px-2 sm:px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg border">
                                                        {job.experience}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Premium CTA */}
                                            <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-100">
                                                <div className="flex items-center text-xs sm:text-sm text-gray-500">
                                                    <svg className="w-3 sm:w-4 h-3 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {formatPostedDate(job.createdAt)}
                                                </div>
                                                <div className="flex items-center text-[#2D9AA5] font-semibold text-xs sm:text-sm">
                                                    <span className="hidden sm:inline">View Details</span>
                                                    <span className="sm:hidden">Details</span>
                                                    <svg className="w-3 sm:w-4 h-3 sm:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Enhanced Progress Dots */}
                        {showNavigation && (
                            <div className="flex items-center justify-center mt-6 sm:mt-8 space-x-2 sm:space-x-3">
                                {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => goToSlide(index)}
                                        className={`transition-all duration-300 rounded-full ${currentIndex === index
                                            ? 'w-6 sm:w-8 h-2 bg-[#2D9AA5] shadow-md'
                                            : 'w-2 h-2 bg-gray-300'
                                            }`}
                                        aria-label={`Go to slide ${index + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LatestJobsSlider;