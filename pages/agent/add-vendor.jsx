import React from "react";
import VendorForm from "../../components/VendorForm";
import AgentLayout from '../../components/AgentLayout';
import withAgentAuth from '../../components/withAgentAuth';

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
  return <AgentLayout>{page}</AgentLayout>;
};

const ProtectedDashboard = withAgentAuth(AdminCreateVendor);
ProtectedDashboard.getLayout = AdminCreateVendor.getLayout;

export default ProtectedDashboard;