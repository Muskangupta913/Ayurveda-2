import React from "react";
import VendorForm from "../../components/VendorForm";

export default function AdminCreateVendor() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <VendorForm />
      </div>
    </div>
  );
}
