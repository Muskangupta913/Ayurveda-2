// Dynamic agent route handler
// Converts /agent/[slug] to render admin/clinic/doctor pages with AgentLayout
'use client';

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AgentLayout from '../../components/AgentLayout';
import withAgentAuth from '../../components/withAgentAuth';

// Map of agent routes to their corresponding admin/clinic/doctor pages
// Note: These pages are wrapped with withAdminAuth/withClinicAuth/withDoctorAuth, but we'll use withAgentAuth instead
const routeMap: { [key: string]: () => Promise<any> } = {
  // Admin routes
  'AdminClinicApproval': () => import('../admin/AdminClinicApproval'),
  'approve-doctors': () => import('../admin/approve-doctors'),
  'add-treatment': () => import('../admin/add-treatment'),
  'all-blogs': () => import('../admin/all-blogs'),
  'analytics': () => import('../admin/analytics'),
  'get-in-touch': () => import('../admin/get-in-touch'),
  'job-manage': () => import('../admin/job-manage'),
  'manage-clinic-permissions': () => import('../admin/manage-clinic-permissions'),
  'create-agent': () => import('../admin/create-agent'),
  'create-staff': () => import('../admin/create-staff'),
  'admin-add-service': () => import('../admin/admin-add-service'),
  'admin-create-vendor': () => import('../admin/admin-create-vendor'),
  'getAllEodNotes': () => import('../admin/getAllEodNotes'),
  'patient-report': () => import('../admin/patient-report'),
  'track-expenses': () => import('../admin/track-expenses'),
  'contracters': () => import('../admin/contractor'),
  'dashboard-admin': () => import('../admin/dashboard-admin'),
  'seed-navigation': () => import('../admin/seed-navigation'),
  'all-clinic': () => import('../admin/all-clinic'),
  'register-clinic': () => import('../admin/register-clinic'),
  
  // Clinic routes
  'myallClinic': () => import('../clinic/myallClinic'),
  'clinic-dashboard': () => import('../clinic/clinic-dashboard'),
  'clinic-BlogForm': () => import('../clinic/BlogForm'),
  'job-posting': () => import('../clinic/job-posting'),
  'clinic-published-blogs': () => import('../clinic/published-blogs'),
  'clinic-my-jobs': () => import('../clinic/my-jobs'),
  'clinic-job-applicants': () => import('../clinic/job-applicants'),
  'clinic-getAuthorCommentsAndLikes': () => import('../clinic/getAuthorCommentsAndLikes'),
  'getAllReview': () => import('../clinic/getAllReview'),
  'get-Enquiry': () => import('../clinic/get-Enquiry'),
  'enquiry-form': () => import('../clinic/enquiry-form'),
  'review-form': () => import('../clinic/review-form'),
  'clinic-seed-navigation': () => import('../clinic/seed-navigation'),
  
  // Staff Management routes (staff pages)
  'staff-dashboard': () => import('../staff/staff-dashboard'),
  'add-service': () => import('../staff/add-service'),
  'patient-registration': () => import('../staff/patient-registration'),
  'patient-information': () => import('../staff/patient-information'),
  'eodNotes': () => import('../staff/eodNotes'),
  'AddPettyCashForm': () => import('../staff/AddPettyCashForm'),
  'add-vendor': () => import('../staff/add-vendor'),
  'membership': () => import('../staff/membership'),
  'contract': () => import('../staff/contract'),
  
  // Doctor routes
  'doctor-dashboard': () => import('../doctor/doctor-dashboard'),
  'manageDoctor': () => import('../doctor/manageDoctor'),
  'getReview': () => import('../doctor/getReview'),
  'doctor-BlogForm': () => import('../doctor/BlogForm'),
  'doctor-published-blogs': () => import('../doctor/published-blogs'),
  'doctor-getAuthorCommentsAndLikes': () => import('../doctor/getAuthorCommentsAndLikes'),
  'create-job': () => import('../doctor/create-job'),
  'doctor-my-jobs': () => import('../doctor/my-jobs'),
  'doctor-job-applicants': () => import('../doctor/job-applicants'),
  'prescription-requests': () => import('../doctor/prescription-requests'),
  'doctor-seed-navigation': () => import('../doctor/seed-navigation'),
};

const AgentDynamicPage = () => {
  const router = useRouter();
  const { slug } = router.query;
  const [PageComponent, setPageComponent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || typeof slug !== 'string') {
      setLoading(false);
      return;
    }

    const loadPage = async () => {
      try {
        const pageLoader = routeMap[slug];
        if (!pageLoader) {
          setError(`Page not found: /agent/${slug}`);
          setLoading(false);
          return;
        }

        const module = await pageLoader();
        // Get the default export (the page component)
        // Note: This is wrapped with withAdminAuth, which checks for adminToken
        const ExportedComponent = module.default;
        
        // The exported component is wrapped with withAdminAuth
        // withAdminAuth checks for adminToken and redirects if not found
        // Since we're already protected by withAgentAuth on this page,
        // we need to temporarily provide an adminToken to bypass the check
        // OR we need to extract the underlying component
        // The exported component is wrapped with withAdminAuth
        // withAdminAuth will check for adminToken and redirect if not found
        // Since we can't easily unwrap it, we'll render it as-is
        // The _app.tsx will override the layout to use AgentLayout
        // But we still need to handle the auth check
        
        // Create a wrapper that renders the component
        // The withAdminAuth will fail, but we'll handle that by showing an error
        // OR we can temporarily set adminToken (not ideal but works)
        const WrappedComponent = (props: any) => {
          // Render the component - it will check for adminToken via withAdminAuth
          // If it fails, it will redirect or show nothing
          // We need to prevent that redirect
          return <ExportedComponent {...props} />;
        };
        
        setPageComponent(() => WrappedComponent);
      } catch (err: any) {
        console.error('Error loading page:', err);
        setError(`Failed to load page: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (!PageComponent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Page not found</div>
      </div>
    );
  }

  return <PageComponent />;
};

// Use AgentLayout instead of AdminLayout/ClinicLayout/DoctorLayout
AgentDynamicPage.getLayout = function PageLayout(page: React.ReactNode) {
  return <AgentLayout>{page}</AgentLayout>;
};

const ProtectedAgentDynamicPage = withAgentAuth(AgentDynamicPage);
// @ts-ignore - getLayout is added dynamically
ProtectedAgentDynamicPage.getLayout = AgentDynamicPage.getLayout;

export default ProtectedAgentDynamicPage;

