import React from 'react';
import ClinicLayout from '../../components/staffLayout';
import withClinicAuth from '../../components/withStaffAuth';

const ClinicDashboard = () => {
  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-8">
        <h1 className="text-3xl font-bold">Hi, Staff!</h1>
        <p className="mt-3 text-sm text-gray-600">
          Welcome to your clinic dashboard.
        </p>

        {/* quick stats / placeholder */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 border rounded">
            Patients
            <br />
            <span className="text-xl font-semibold">--</span>
          </div>
          <div className="p-4 border rounded">
            Appointments
            <br />
            <span className="text-xl font-semibold">--</span>
          </div>
          <div className="p-4 border rounded">
            Messages
            <br />
            <span className="text-xl font-semibold">--</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Define layout function
ClinicDashboard.getLayout = function PageLayout(page) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

// Apply HOC
const ProtectedDashboard = withClinicAuth(ClinicDashboard);

// Reassign layout
ProtectedDashboard.getLayout = ClinicDashboard.getLayout;

export default ProtectedDashboard;
