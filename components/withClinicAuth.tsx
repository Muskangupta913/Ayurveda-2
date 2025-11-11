'use client';
import { useEffect, useState, ComponentType } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';

export default function withClinicAuth<P extends Record<string, unknown> = Record<string, unknown>>(WrappedComponent: ComponentType<P>) {
  return function ProtectedClinicPage(props: P) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
      const checkAuth = async () => {
        try {
          // Check if we're on an agent route - if so, allow agent tokens
          const isAgentRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/agent/');
          
          let token = localStorage.getItem('clinicToken') || sessionStorage.getItem('clinicToken');
          let user = localStorage.getItem('clinicUser') || sessionStorage.getItem('clinicUser');
          
          // If on agent route and no clinicToken, try agentToken
          if (isAgentRoute && !token) {
            token = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
            
            if (token) {
              // Verify agent token instead
              try {
                const response = await fetch('/api/agent/verify-token', {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });

                const data = await response.json();

                if (response.ok && data.valid) {
                  setIsAuthorized(true);
                  setLoading(false);
                  return;
                }
              } catch (error) {
                console.error('Agent token verification failed:', error);
              }
            }
          }

          if (!token || (!user && !isAgentRoute)) {
            if (!isAgentRoute) {
              toast.error('Please login to continue');
              clearStorage();
              router.replace('/clinic/login-clinic');
            }
            setLoading(false);
            return;
          }

          const tokenParts = token.split('.');
          if (tokenParts.length !== 3) {
            alert('Invalid token format. Please login again.');
            clearStorage();
            router.replace('/clinic/login-clinic');
            return;
          }

          // For agent routes with agentToken, verify agent token
          // For clinic routes with clinicToken, verify clinic token
          const verifyEndpoint = isAgentRoute && token === (localStorage.getItem('agentToken') || sessionStorage.getItem('agentToken'))
            ? '/api/agent/verify-token' 
            : '/api/clinics/verify-token';
            
          const res = await fetch(verifyEndpoint, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await res.json();

          if (!res.ok || !data.valid) {
            if (!isAgentRoute) {
              clearStorage();
              if (data.message === 'Token expired') {
                alert('Session expired. Please login again.');
                // ⏳ Wait 3 seconds before redirecting
                setTimeout(() => {
                  router.replace('/clinic/login-clinic');
                }, 4000);
              } else {
                toast.error('Authentication failed.');
                router.replace('/clinic/login-clinic');
              }
            }
            setLoading(false);
            return;
          }

          const userObj = JSON.parse(user);
          if (userObj.role === 'clinic') {
            setIsAuthorized(true);
          } else {
            toast.error('Access denied: Invalid user role');
            clearStorage();
            router.replace('/clinic/login-clinic');
          }
        } catch (err) {
          console.error('Auth error:', err);
          toast.error('Session expired. Please login again.');
          clearStorage();
          setTimeout(() => {
            router.replace('/clinic/login-clinic');
          }, 3000);
        } finally {
          setLoading(false);
        }
      };

      const clearStorage = () => {
        localStorage.removeItem('clinicToken');
        localStorage.removeItem('clinicUser');
        localStorage.removeItem('clinicEmail');
        localStorage.removeItem('clinicName');
        sessionStorage.removeItem('clinicToken');
        sessionStorage.removeItem('clinicUser');
        sessionStorage.removeItem('clinicEmail');
        sessionStorage.removeItem('clinicName');
      };

      checkAuth();
    }, [router]);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-[#2D9AA5] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Verifying Clinic...</p>
          </div>
        </div>
      );
    }

    return isAuthorized ? <WrappedComponent {...(props as P)} /> : null;
  };
}
