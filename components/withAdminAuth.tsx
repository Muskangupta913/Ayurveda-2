import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ComponentType } from 'react';

// Define proper TypeScript types for the HOC
export default function withAdminAuth<P extends object>(
  WrappedComponent: ComponentType<P>
) {
  return function WithAdminAuth(props: P) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    
   useEffect(() => {
  const checkAuth = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

    if (!token) {
      router.replace('/admin');
      return;
    }

    try {
      const response = await fetch('/api/admin/verify-token', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setIsAuthenticated(true);
      } else {
        // Show alert if token expired
        if (data.message === 'Token expired') {
          alert('Session expired. Please login again.');
        }

        localStorage.removeItem('adminToken');
        router.replace('/admin');
      }
    } catch (error) {
      console.error('Authentication verification failed:', error);
      localStorage.removeItem('adminToken');
      router.replace('/admin');
    } finally {
      setIsLoading(false);
    }
  };

  checkAuth();
}, [router]);

    
    if (isLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-lg">Verifying authentication...</div>
        </div>
      );
    }
    
    // Only render the protected component if authenticated
    return isAuthenticated ? <WrappedComponent {...props} /> : null;

  };
}
