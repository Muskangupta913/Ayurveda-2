import React from "react";
import VendorForm from "../../components/VendorForm";
import ClinicLayout from '../../../components/ClinicLayout';
import withClinicAuth from '../../../components/withClinicAuth';

function AdminCreateVendor() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <VendorForm />
      </div>
    </div>
  );
}

AdminCreateVendor.getLayout = function PageLayout(page) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

const ProtectedDashboard = withClinicAuth(AdminCreateVendor);
ProtectedDashboard.getLayout = AdminCreateVendor.getLayout;

export default ProtectedDashboard;