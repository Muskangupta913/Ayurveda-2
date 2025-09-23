// import React, { useEffect, useState, useCallback, useMemo } from 'react';
// import axios from 'axios';
// import Link from 'next/link';
// import AdminLayout from '../../components/AdminLayout';
// import withAdminAuth from '../../components/withAdminAuth'; 
// import type { NextPageWithLayout } from '../_app';
// // import Adminstats from '../../components/Adminstats';

// interface AnalyticsData {
//   pendingClinicCount: number;
//   pendingDoctorCount: number;
//   approvedClinicCount: number;
//   approvedDoctorCount: number;
// }

// interface ChartData {
//   name: string;
//   value: number;
//   color: string;
// }

// const AdminDashboard = () => {
//   const [analytics, setAnalytics] = useState<AnalyticsData>({
//     pendingClinicCount: 0,
//     pendingDoctorCount: 0,
//     approvedClinicCount: 0,
//     approvedDoctorCount: 0,
//   });
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [userCount, setUserCount] = useState<number | null>(null);
//   const [currentDateTime, setCurrentDateTime] = useState(new Date());
//   const [refreshing, setRefreshing] = useState(false);

//   // Update date and time every second
//   useEffect(() => {
//     const timer = setInterval(() => {
//       setCurrentDateTime(new Date());
//     }, 1000);
//     return () => clearInterval(timer);
//   }, []);

//   // Fetch user count from API
//   const fetchUserCount = useCallback(async () => {
//     try {
//       const res = await axios.get('/api/admin/user-count');
//       setUserCount(res.data.userCount);
//     } catch (error) {
//       console.error('Error fetching user count:', error);
//       setUserCount(0);
//     }
//   }, []);

//   // Fetch analytics data from API
//   const fetchAnalyticsData = useCallback(async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem('adminToken');
      
//       if (!token) {
//         setError('No admin token found');
//         return;
//       }

//       const pendingRes = await axios.get('/api/admin/pending-counts', {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       setAnalytics({
//         pendingClinicCount: pendingRes.data.pendingClinicCount || 0,
//         pendingDoctorCount: pendingRes.data.pendingDoctorCount || 0,
//         approvedClinicCount: pendingRes.data.approvedClinicCount || 0,
//         approvedDoctorCount: pendingRes.data.approvedDoctorCount || 0,
//       });

//     } catch {
//       setError('Failed to fetch dashboard data');
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Refresh all data including Adminstats
//   const handleRefresh = useCallback(async () => {
//     setRefreshing(true);
//     setError(null);
//     try {
//       await Promise.all([fetchUserCount(), fetchAnalyticsData()]);
//       // Force refresh of Adminstats component by triggering a re-render
//       window.location.reload();
//     } finally {
//       setRefreshing(false);
//     }
//   }, [fetchUserCount, fetchAnalyticsData]);

//   // Fetch data on component mount
//   useEffect(() => {
//     fetchUserCount();
//     fetchAnalyticsData();
//   }, [fetchUserCount, fetchAnalyticsData]);

//   // Memoized calculated values
//   const totalClinics = useMemo(() => 
//     analytics.pendingClinicCount + analytics.approvedClinicCount, 
//     [analytics.pendingClinicCount, analytics.approvedClinicCount]
//   );

//   const totalDoctors = useMemo(() => 
//     analytics.pendingDoctorCount + analytics.approvedDoctorCount, 
//     [analytics.pendingDoctorCount, analytics.approvedDoctorCount]
//   );

//   // Chart data
//   const chartData = useMemo((): ChartData[] => [
//     {
//       name: 'Total Users',
//       value: userCount || 0,
//       color: '#2D9AA5'
//     },
//     {
//       name: 'Approved Clinics',
//       value: analytics.approvedClinicCount,
//       color: '#10B981'
//     },
//     {
//       name: 'Approved Doctors',
//       value: analytics.approvedDoctorCount,
//       color: '#F59E0B'
//     }
//   ], [userCount, analytics]);

//   // Format date and time
//   const formatDate = (date: Date) => {
//     return date.toLocaleDateString('en-US', {
//       weekday: 'long',
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric'
//     });
//   };

//   const formatTime = (date: Date) => {
//     return date.toLocaleTimeString('en-US', {
//       hour: '2-digit',
//       minute: '2-digit',
//       second: '2-digit'
//     });
//   };

//   const getGreeting = () => {
//     const hour = currentDateTime.getHours();
//     if (hour < 12) return 'Good morning';
//     if (hour < 17) return 'Good afternoon';
//     return 'Good evening';
//   };

//   // Simple Bar Chart Component
//   const SimpleBarChart = ({ data }: { data: ChartData[] }) => {
//     const maxValue = Math.max(...data.map(d => d.value));
    
//     return (
//       <div className="space-y-6">
//         <div className="flex items-center justify-between mb-6">
//           <h3 className="text-lg font-semibold text-gray-900">Platform Overview</h3>
//           <div className="flex items-center space-x-2 text-sm text-green-600">
//             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
//             <span>Live Data</span>
//           </div>
//         </div>
        
//         <div className="space-y-4">
//           {data.map((item, index) => (
//             <div key={index} className="p-4 bg-gray-50 rounded-lg">
//               <div className="flex items-center justify-between mb-2">
//                 <span className="text-sm font-medium text-gray-700">{item.name}</span>
//                 <span className="text-lg font-bold text-gray-900">
//                   {item.value.toLocaleString()}
//                 </span>
//               </div>
//               <div className="w-full bg-gray-200 rounded-full h-2">
//                 <div
//                   className="h-2 rounded-full transition-all duration-300"
//                   style={{
//                     width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
//                     backgroundColor: item.color
//                   }}
//                 ></div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   };

//   // Loading Component
//   const LoadingSkeleton = () => (
//     <div className="min-h-screen bg-gray-50">
//       <div className="h-1 bg-[#2D9AA5] animate-pulse"></div>
//       <div className="container mx-auto px-4 py-8 max-w-7xl">
//         <div className="animate-pulse space-y-8">
//           <div className="bg-white rounded-lg p-8 shadow border">
//             <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
//             <div className="h-4 bg-gray-200 rounded w-96 mb-6"></div>
//             <div className="h-20 bg-gray-200 rounded w-48"></div>
//           </div>
          
//           <div className="bg-white rounded-lg p-8 shadow border">
//             <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
//             <div className="space-y-4">
//               {Array.from({ length: 3 }, (_, i) => (
//                 <div key={i} className="h-12 bg-gray-200 rounded"></div>
//               ))}
//             </div>
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//             {Array.from({ length: 4 }, (_, i) => (
//               <div key={i} className="bg-white rounded-lg p-6 shadow border">
//                 <div className="h-16 bg-gray-200 rounded"></div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );

//   // Error Component
//   const ErrorComponent = () => (
//     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//       <div className="max-w-md w-full mx-4">
//         <div className="bg-white rounded-lg shadow p-8 text-center border">
//           <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
//             <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//             </svg>
//           </div>
//           <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Error</h2>
//           <p className="text-gray-600 mb-6">{error}</p>
//           <button 
//             onClick={() => {
//               setError(null);
//               handleRefresh();
//             }} 
//             className="bg-[#2D9AA5] hover:bg-[#2D9AA5]/90 text-white px-6 py-2 rounded font-medium transition-colors"
//           >
//             Try Again
//           </button>
//         </div>
//       </div>
//     </div>
//   );

//   if (loading) {
//     return <LoadingSkeleton />;
//   }

//   if (error) {
//     return <ErrorComponent />;
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Top Progress Bar */}
//       <div className="h-1 bg-[#2D9AA5]"></div>
      
//       <div className="container mx-auto px-4 py-8 max-w-7xl">
//         {/* Header Section */}
//         <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 shadow border mb-6 sm:mb-8">
//           <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 sm:gap-6">
//             <div className="flex-1 w-full">
//               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
//                 <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
//                   {getGreeting()}, Admin!
//                 </h1>
                
//                 {/* Refresh Button */}
//                 <button
//                   onClick={handleRefresh}
//                   disabled={refreshing}
//                   className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#2D9AA5] hover:bg-[#2D9AA5]/90 text-white rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start"
//                 >
//                   <svg 
//                     className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} 
//                     fill="none" 
//                     stroke="currentColor" 
//                     viewBox="0 0 24 24"
//                   >
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//                   </svg>
//                   <span>
//                     {refreshing ? 'Refreshing...' : 'Refresh'}
//                   </span>
//                 </button>
//               </div>
              
//               <p className="text-gray-600 mb-4">
//                 Welcome back to your dashboard. Monitor and manage your platform efficiently.
//               </p>
              
//               <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 text-xs sm:text-sm">
//                 <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded w-full sm:w-auto">
//                   <svg className="w-4 h-4 text-[#2D9AA5] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                   </svg>
//                   <span className="font-medium text-gray-700 truncate">{formatDate(currentDateTime)}</span>
//                 </div>
//                 <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded w-full sm:w-auto">
//                   <svg className="w-4 h-4 text-[#2D9AA5] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//                   </svg>
//                   <span className="font-medium text-gray-700">{formatTime(currentDateTime)}</span>
//                 </div>
//               </div>
//             </div>

//             {/* User Count Card */}
//             <div className="w-full xl:w-auto xl:min-w-[200px] lg:min-w-[240px]">
//               <div className="bg-[#2D9AA5]/10 rounded-lg p-4 sm:p-6 border border-[#2D9AA5]/20">
//                 <div className="text-center">
//                   <div className="flex items-center justify-center mb-2 sm:mb-3">
//                     <div className="p-2 bg-[#2D9AA5] rounded text-white">
//                       <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
//                       </svg>
//                     </div>
//                   </div>
//                   <div className="text-2xl sm:text-3xl font-bold mb-1 text-[#2D9AA5]">
//                     {userCount?.toLocaleString() || '0'}
//                   </div>
//                   <div className="text-gray-700 font-medium text-sm sm:text-base">Total Users</div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Analytics Chart */}
//         <div className="bg-white rounded-lg shadow border p-6 sm:p-8 mb-8">
//           <SimpleBarChart data={chartData} />
//         </div>

//         {/* Quick Stats Grid */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
//           {[
//             { 
//               title: "Total Clinics", 
//               value: totalClinics, 
//               icon: (
//                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
//                 </svg>
//               ),
//               href: "/admin/AdminClinicApproval",
//               color: "#10B981"
//             },
//             { 
//               title: "Total Doctors", 
//               value: totalDoctors, 
//               icon: (
//                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
//                 </svg>
//               ),
//               href: "/admin/approve-doctors",
//               color: "#2D9AA5"
//             },
//             { 
//               title: "Pending Clinics", 
//               value: analytics.pendingClinicCount, 
//               icon: (
//                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//               ),
//               href: "/admin/AdminClinicApproval",
//               color: "#F59E0B"
//             },
//             { 
//               title: "Pending Doctors", 
//               value: analytics.pendingDoctorCount, 
//               icon: (
//                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//               ),
//               href: "/admin/approve-doctors",
//               color: "#EF4444"
//             }
//           ].map((stat, index) => (
//             <Link key={index} href={stat.href} className="block group">
//               <div className="bg-white rounded-lg p-6 shadow border hover:shadow-md transition-shadow h-full">
//                 <div className="flex items-start justify-between mb-4">
//                   <div 
//                     className="p-2 rounded text-white"
//                     style={{ backgroundColor: stat.color }}
//                   >
//                     {stat.icon}
//                   </div>
//                   <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//                   </svg>
//                 </div>
//                 <h3 className="text-sm font-medium text-gray-600 mb-2">{stat.title}</h3>
//                 <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
//               </div>
//             </Link>
//           ))}
//         </div>

//         {/* Admin Stats Component */}
//         <div className='mb-8'>
//           <Adminstats />
//         </div>

//         {/* Quick Actions */}
//         <div className="bg-white rounded-lg shadow border p-4 sm:p-6 lg:p-8">
//           <div className="flex items-center gap-3 mb-4 sm:mb-6">
//             <div className="p-2 bg-[#2D9AA5] rounded text-white">
//               <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//               </svg>
//             </div>
//             <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Quick Actions</h2>
//           </div>
          
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
//             {[
//               { 
//                 name: "Manage Clinics", 
//                 icon: (
//                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
//                   </svg>
//                 ),
//                 description: "View & approve clinics", 
//                 href: "/admin/AdminClinicApproval" 
//               },
//               { 
//                 name: "Manage Doctors", 
//                 icon: (
//                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
//                   </svg>
//                 ),
//                 description: "Doctor verification", 
//                 href: "/admin/approve-doctors" 
//               },
//               { 
//                 name: "Add Treatment", 
//                 icon: (
//                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
//                   </svg>
//                 ),
//                 description: "Add new treatments", 
//                 href: "/admin/add-treatment" 
//               },
//               { 
//                 name: "User Analytics", 
//                 icon: (
//                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
//                   </svg>
//                 ),
//                 description: "View analytics", 
//                 href: "/admin/analytics" 
//               },
//               { 
//                 name: "All Blogs", 
//                 icon: (
//                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
//                   </svg>
//                 ),
//                 description: "Manage blog posts", 
//                 href: "/admin/all-blogs" 
//               },
//               { 
//                 name: "Call Requests", 
//                 icon: (
//                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
//                   </svg>
//                 ),
//                 description: "Call back requests", 
//                 href: "/admin/get-in-touch" 
//               },
//               { 
//                 name: "Manage Jobs", 
//                 icon: (
//                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6m8 0H8" />
//                   </svg>
//                 ),
//                 description: "Job postings", 
//                 href: "/admin/job-manage" 
//               }
//             ].map((action, index) => (
//               <Link key={index} href={action.href} className="block group">
//                 <div className="bg-gray-50 hover:bg-gray-100 rounded-lg p-4 sm:p-6 transition-colors border h-full">
//                   <div className="flex items-center justify-between mb-3 sm:mb-4">
//                     <div className="text-[#2D9AA5]">
//                       <div className="w-5 h-5 sm:w-6 sm:h-6">
//                         {action.icon}
//                       </div>
//                     </div>
//                     <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//                     </svg>
//                   </div>
//                   <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">{action.name}</h3>
//                   <p className="text-xs sm:text-sm text-gray-600">{action.description}</p>
//                 </div>
//               </Link>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// AdminDashboard.getLayout = function PageLayout(page: React.ReactNode) {
//   return <AdminLayout>{page}</AdminLayout>;
// };

// const ProtectedDashboard: NextPageWithLayout = withAdminAuth(AdminDashboard);
// ProtectedDashboard.getLayout = AdminDashboard.getLayout;

// export default ProtectedDashboard;