import React, { useState, useEffect } from 'react';
import { Calendar, User, DollarSign, FileText } from 'lucide-react';
import StaffLayout from '../../components/staffLayout';
import withClinicAuth from '../../components/withStaffAuth';


const InvoiceManagementSystem = ()=> {
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    emrNumber: '',
    patientName: '',
    mobileNumber: '',
    gender: '',
    doctor: '',
    treatment: '',
    patientType: '',
    referredBy: '',
    amount: '',
    paid: '',
    advance: '',
    insurance: 'No',
    advanceGivenAmount: '',
    coPayPercent: '',
    advanceClaimStatus: 'Pending Release'
  });

  const [autoFields, setAutoFields] = useState({
    invoicedDate: new Date().toISOString(),
    invoicedBy: 'Admin User',
    advanceClaimReleaseDate: null,
    advanceClaimReleasedBy: null
  });

  const [calculatedFields, setCalculatedFields] = useState({
    pending: 0,
    needToPay: 0
  });

  const [userRole] = useState('Admin');
  const [errors, setErrors] = useState({});


  useEffect(() => {
    generateInvoiceNumber();
  }, []);

  useEffect(() => {
    calculatePending();
    calculateNeedToPay();
  }, [formData.amount, formData.paid, formData.advance, formData.coPayPercent]);

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const seq = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    setFormData(prev => ({ ...prev, invoiceNumber: `INV-${year}${month}${day}-${seq}` }));
  };

  const calculatePending = () => {
    const amount = parseFloat(formData.amount) || 0;
    const paid = parseFloat(formData.paid) || 0;
    const advance = parseFloat(formData.advance) || 0;
    setCalculatedFields(prev => ({ ...prev, pending: amount - (paid + advance) }));
  };

  const calculateNeedToPay = () => {
    if (formData.insurance === 'Yes' && formData.coPayPercent) {
      const amount = parseFloat(formData.amount) || 0;
      const coPayPercent = parseFloat(formData.coPayPercent) || 0;
      const needToPay = (amount * (100 - coPayPercent)) / 100;
      setCalculatedFields(prev => ({ ...prev, needToPay }));
    } else {
      setCalculatedFields(prev => ({ ...prev, needToPay: 0 }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.emrNumber) newErrors.emrNumber = 'EMR Number is required';
    if (!formData.patientName) newErrors.patientName = 'Patient Name is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.doctor) newErrors.doctor = 'Doctor is required';
    if (!formData.treatment) newErrors.treatment = 'Treatment is required';
    if (!formData.patientType) newErrors.patientType = 'Patient Type is required';
    if (!formData.amount) newErrors.amount = 'Amount is required';

    if (formData.insurance === 'Yes') {
      if (!formData.advanceGivenAmount) newErrors.advanceGivenAmount = 'Advance Given Amount is required';
      if (!formData.coPayPercent) newErrors.coPayPercent = 'Co-Pay % is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReleaseClaim = () => {
    setFormData(prev => ({ ...prev, advanceClaimStatus: 'Released' }));
    setAutoFields(prev => ({
      ...prev,
      advanceClaimReleaseDate: new Date().toISOString(),
      advanceClaimReleasedBy: 'Admin User'
    }));
  };

  const handleSubmit = () => {
    if (validateForm()) {
      alert('Invoice saved successfully!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <FileText className="text-indigo-600" />
                Medical Invoice Management
              </h1>
              <p className="text-gray-600 mt-2">Complete invoice and patient details</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Logged in as:</div>
              <div className="font-semibold text-indigo-600">{autoFields.invoicedBy}</div>
            </div>
          </div>

          {/* Auto-Generated Fields */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                Auto-Generated Fields
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Number</label>
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Invoiced Date</label>
                  <input
                    type="text"
                    value={new Date(autoFields.invoicedDate).toLocaleString()}
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Invoiced By</label>
                  <input
                    type="text"
                    value={autoFields.invoicedBy}
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Patient Info */}
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Patient Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* EMR Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    EMR Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="emrNumber"
                    value={formData.emrNumber}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.emrNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter unique EMR number"
                  />
                  {errors.emrNumber && <p className="text-red-500 text-xs mt-1">{errors.emrNumber}</p>}
                </div>
                {/* Patient Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patient Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="patientName"
                    value={formData.patientName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.patientName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter patient name"
                  />
                  {errors.patientName && <p className="text-red-500 text-xs mt-1">{errors.patientName}</p>}
                </div>
                {/* Mobile Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number {userRole !== 'Admin' && userRole !== 'Super Admin' && '(Hidden)'}
                  </label>
                  <input
                    type={userRole === 'Admin' || userRole === 'Super Admin' ? 'tel' : 'password'}
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter mobile number"
                  />
                </div>
                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.gender ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
                </div>
                {/* Patient Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patient Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="patientType"
                    value={formData.patientType}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.patientType ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Type</option>
                    <option value="New">New</option>
                    <option value="Old">Old</option>
                  </select>
                  {errors.patientType && <p className="text-red-500 text-xs mt-1">{errors.patientType}</p>}
                </div>
                {/* Referred By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Referred By</label>
                  <input
                    type="text"
                    name="referredBy"
                    value={formData.referredBy}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>
<div className="bg-gray-50 rounded-lg p-6 border border-gray-300">
  <h2 className="text-lg font-semibold text-black mb-4">Medical Details</h2>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium text-black mb-2">
        Doctor <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        name="doctor"
        value={formData.doctor}
        onChange={handleInputChange}
        placeholder="Enter doctor's name"
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
          errors.doctor ? 'border-red-500' : 'border-gray-400'
        }`}
      />
      {errors.doctor && <p className="text-red-500 text-xs mt-1">{errors.doctor}</p>}
    </div>
    <div>
      <label className="block text-sm font-medium text-black mb-2">
        Treatment <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        name="treatment"
        value={formData.treatment}
        onChange={handleInputChange}
        placeholder="Enter treatment"
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
          errors.treatment ? 'border-red-500' : 'border-gray-400'
        }`}
      />
      {errors.treatment && <p className="text-red-500 text-xs mt-1">{errors.treatment}</p>}
    </div>
  </div>
</div>


            <div className="bg-gray-50 rounded-lg p-6 border border-gray-300">
              <h2 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-yellow-600" />
                Payment Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.amount ? 'border-red-500' : 'border-gray-400'
                    }`}
                    placeholder="0.00"
                    step="0.01"
                  />
                  {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Paid</label>
                  <input
                    type="number"
                    name="paid"
                    value={formData.paid}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Advance</label>
                  <input
                    type="number"
                    name="advance"
                    value={formData.advance}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Pending</label>
                  <input
                    type="number"
                    value={calculatedFields.pending.toFixed(2)}
                    disabled
                    className="w-full px-4 py-2 bg-gray-200 border border-gray-400 rounded-lg text-black cursor-not-allowed font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 border border-gray-300">
              <h2 className="text-lg font-semibold text-black mb-4">Insurance Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Insurance</label>
                  <select
                    name="insurance"
                    value={formData.insurance}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                {formData.insurance === 'Yes' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Advance Given Amount <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="advanceGivenAmount"
                        value={formData.advanceGivenAmount}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                          errors.advanceGivenAmount ? 'border-red-500' : 'border-gray-400'
                        }`}
                        placeholder="0.00"
                        step="0.01"
                      />
                      {errors.advanceGivenAmount && <p className="text-red-500 text-xs mt-1">{errors.advanceGivenAmount}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Co-Pay % <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="coPayPercent"
                        value={formData.coPayPercent}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                          errors.coPayPercent ? 'border-red-500' : 'border-gray-400'
                        }`}
                        placeholder="0"
                        min="0"
                        max="100"
                      />
                      {errors.coPayPercent && <p className="text-red-500 text-xs mt-1">{errors.coPayPercent}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">Need to Pay Amount</label>
                      <input
                        type="number"
                        value={calculatedFields.needToPay.toFixed(2)}
                        disabled
                        className="w-full px-4 py-2 bg-gray-200 border border-gray-400 rounded-lg text-black cursor-not-allowed font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">Advance Claim Status</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.advanceClaimStatus}
                          disabled
                          className="flex-1 px-4 py-2 bg-gray-200 border border-gray-400 rounded-lg text-black cursor-not-allowed"
                        />
                        {formData.advanceClaimStatus === 'Pending Release' && (
                          <button
                            type="button"
                            onClick={handleReleaseClaim}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Release
                          </button>
                        )}
                      </div>
                    </div>
                    {autoFields.advanceClaimReleaseDate && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-black mb-2">Advance Claim Release Date</label>
                          <input
                            type="text"
                            value={new Date(autoFields.advanceClaimReleaseDate).toLocaleString()}
                            disabled
                            className="w-full px-4 py-2 bg-gray-200 border border-gray-400 rounded-lg text-black cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-black mb-2">Advance Claim Released By</label>
                          <input
                            type="text"
                            value={autoFields.advanceClaimReleasedBy || ''}
                            disabled
                            className="w-full px-4 py-2 bg-gray-200 border border-gray-400 rounded-lg text-black cursor-not-allowed"
                          />
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
              >
                Save Invoice
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// Wrap with HOC for protected route
const ProtectedInvoice = withClinicAuth(InvoiceManagementSystem);

// Assign layout (optional)
ProtectedInvoice.getLayout = function PageLayout(page) {
  return <StaffLayout>{page}</StaffLayout>;
};

export default ProtectedInvoice;

