// //components/withLeadAuth.tsx

// 'use client';
// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/router';
// import { ComponentType } from 'react';
// import { toast, Toaster } from 'react-hot-toast'; // 👈 import toast and Toaster

// export default function withDoctorAuth<P extends object>(
//   WrappedComponent: ComponentType<P>
// ) {
//   return function WithDoctorAuth(props: P) {
//     const [isAuthenticated, setIsAuthenticated] = useState(false);
//     const [isLoading, setIsLoading] = useState(true);
//     const router = useRouter();

//     useEffect(() => {
//       const clearStorage = () => {
//         // Remove generic and doctor-specific keys from both storages
//         const keys = ['token', 'clinicToken'];
//         keys.forEach((k) => {
//           try { localStorage.removeItem(k); } catch {}
//           try { sessionStorage.removeItem(k); } catch {}
//         });
//       };

//       const checkAuth = async () => {
//         const token = typeof window !== 'undefined'
//           ? (localStorage.getItem('clinicToken') || sessionStorage.getItem('clinicToken') || localStorage.getItem('token') || sessionStorage.getItem('token'))
//           : null;
//         const user = typeof window !== 'undefined'
//           ? (localStorage.getItem('clinicToken') || sessionStorage.getItem('clinicToken'))
//           : null;

//         if (!token || !user) {
//           toast.error('Please login to continue');
//           clearStorage();
//           setTimeout(() => router.replace('/lead'), 4000);
//           return;
//         }

//         try {
//           const response = await fetch('/api/doctor/verify-token', {
//             headers: {
//               Authorization: `Bearer ${token}`,
//             },
//           });

//           const data = await response.json();

//           if (response.ok && data.valid) {
//             setIsAuthenticated(true);
//           } else {
//             if (data.message === 'Token expired') {
//               toast.error('Session expired. Logging out in 4 seconds…');
//             } else {
//               toast.error('Authentication failed. Logging out in 4 seconds…');
//             }
//             clearStorage();
//             setTimeout(() => router.replace('/lead'), 4000);
//           }
//         } catch (error) {
//           console.error('Doctor token verification failed:', error);
//           toast.error('Something went wrong. Logging out in 4 seconds…');
//           clearStorage();
//           setTimeout(() => router.replace('/lead'), 4000);
//         } finally {
//           setIsLoading(false);
//         }
//       };

//       checkAuth();
//     }, [router]);

//     if (isLoading) {
//       return (
//         <div className="flex min-h-screen items-center justify-center">
//           <div className="text-lg">Verifying authentication...</div>
//         </div>
//       );
//     }

//     return (
//       <>
//         <Toaster />
//         {isAuthenticated ? <WrappedComponent {...props} /> : null}
//       </>
//     );
//   };
// }