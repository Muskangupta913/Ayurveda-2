// pages/clinic/post-job.tsx
import React, { useState } from 'react';
import JobPostingForm from "../../components/JobPostingForm";
import ClinicLayout from "../../components/ClinicLayout";
import withClinicAuth from "../../components/withClinicAuth";
import { jobPostingService } from "../../services/jobService";
import type { NextPageWithLayout } from "../_app";
import type { JobFormData } from "../../components/JobPostingForm";

function ClinicPostJobPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleJobSubmit = async (formData: JobFormData): Promise<void> => {
    setIsSubmitting(true);
    try {
      await jobPostingService.createClinicJob(formData);
    } catch (error) {
      throw error; // Re-throw to let the component handle the error display
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <JobPostingForm
      onSubmit={handleJobSubmit}
      isSubmitting={isSubmitting}
      title="Post a Job - Clinic"
      subtitle="Create a new job posting for your clinic"
    />
  );
}

ClinicPostJobPage.getLayout = function PageLayout(page: React.ReactNode) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

// Apply HOC and assign correct type
const ProtectedClinicJobPage: NextPageWithLayout = withClinicAuth(ClinicPostJobPage);

// Reassign layout (TS-safe now)
ProtectedClinicJobPage.getLayout = ClinicPostJobPage.getLayout;

export default ProtectedClinicJobPage;