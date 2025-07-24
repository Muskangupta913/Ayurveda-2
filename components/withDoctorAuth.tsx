'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ComponentType } from 'react';
import { toast, Toaster } from 'react-hot-toast'; // 👈 import toast and Toaster

export default function withDoctorAuth<P extends object>(
  WrappedComponent: ComponentType<P>
) {
  return function WithDoctorAuth(props: P) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
      const checkAuth = async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('doctorToken') : null;

        if (!token) {
          toast.error('Please login to continue');
          router.replace('/doctor/login');
          return;
        }

        try {
          const response = await fetch('/api/doctor/verify-token', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (response.ok && data.valid) {
            setIsAuthenticated(true);
          } else {
            if (data.message === 'Token expired') {
              toast.error('Session expired. Please login again.');
            } else {
              toast.error('Authentication failed. Please login again.');
            }

            localStorage.removeItem('doctorToken');
            router.replace('/doctor/login');
          }
        } catch (error) {
          console.error('Doctor token verification failed:', error);
          toast.error('Something went wrong. Please login again.');
          localStorage.removeItem('doctorToken');
          router.replace('/doctor/login');
        } finally {
          setIsLoading(false);
        }
      };

      checkAuth();
    }, [router]);

    if (isLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-lg">Verifying doctor authentication...</div>
        </div>
      );
    }

    return (
      <>
        <Toaster />
        {isAuthenticated ? <WrappedComponent {...props} /> : null}
      </>
    );
  };
}