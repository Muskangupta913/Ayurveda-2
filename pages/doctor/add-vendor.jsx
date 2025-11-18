import React from "react";
import VendorForm from "../../components/VendorForm";
import DoctorLayout from '../../components/DoctorLayout';
import withDoctorAuth from '../../components/withDoctorAuth';

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
  return <DoctorLayout>{page}</DoctorLayout>;
};

const ProtectedDashboard = withDoctorAuth(AdminCreateVendor);
ProtectedDashboard.getLayout = AdminCreateVendor.getLayout;

export default ProtectedDashboard;