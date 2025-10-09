// import React, { useState, useEffect, useMemo, useCallback } from "react";
// import { Calendar, User, DollarSign, FileText, AlertCircle } from "lucide-react";

// // ✅ Constant data (moved outside component to avoid re-creation)

// const paymentMethods = ["Cash", "Card", "BT", "Tabby", "Tamara"];

// const INITIAL_FORM_DATA = {
//   invoiceNumber: "",
//   emrNumber: "",
//   firstName: "",
//   lastName: "",
//   email: "",
//   mobileNumber: "",
//   gender: "",
//   doctor: "",
//   service: "",
//   treatment: "",
//   package: "",
//   patientType: "",
//   referredBy: "",
//   amount: "",
//   paid: "",
//   advance: "",
//   paymentMethod: "",
//   insurance: "No",
//   advanceGivenAmount: "",
//   coPayPercent: "",
//   advanceClaimStatus: "Pending",
// };



// const InvoiceManagementSystem = () => {
//   const [currentUser, setCurrentUser] = useState({ name: "", role: "" });
//   const [formData, setFormData] = useState(INITIAL_FORM_DATA);
//   const [autoFields, setAutoFields] = useState({
//     invoicedDate: new Date().toISOString(),
//     invoicedBy: " ",
//     advanceClaimReleaseDate: null,
//     advanceClaimReleasedBy: null,
//   });

//   const [doctorList, setDoctorList] = useState([]);
//   const [fetchedTreatments, setFetchedTreatments] = useState([]);
//   const [fetchedPackages, setFetchedPackages] = useState([]);
//   const [calculatedFields, setCalculatedFields] = useState({ pending: 0, needToPay: 0 });
//   const [errors, setErrors] = useState({});
//   const [usedEMRNumbers] = useState(() => new Set());

//   useEffect(() => {
//     const fetchDoctors = async () => {
//       try {
//         const res = await fetch("/api/admin/get-all-doctor-staff");

//         if (!res.ok) {
//           console.error(`HTTP error! status: ${res.status}`);
//           return;
//         }

//         const data = await res.json();

//         if (data.success) {
//           setDoctorList(data.data);
//         } else {
//           console.error("Failed to fetch doctors:", data.message);
//         }
//       } catch (err) {
//         console.error("Error fetching doctors:", err);
//       }
//     };

//     fetchDoctors();
//   }, []);

//   useEffect(() => {
//     const fetchUser = async () => {
//       try {
//         const token = localStorage.getItem("userToken");
//         if (!token) throw new Error("User not authenticated");

//         const res = await fetch("/api/staff/patient-registration", {
//           method: "GET",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`
//           },
//         });

//         const data = await res.json();
//         if (!data.success) throw new Error(data.message);

//         setCurrentUser(data.data);
//         setAutoFields(prev => ({ ...prev, invoicedBy: data.data.name }));
//       } catch (err) {
//         console.error(err);
//       }
//     };

//     fetchUser();
//   }, []);



//   // -------------------------------
//   // Fetch treatments/packages from API
//   // -------------------------------

//   useEffect(() => {
//     const fetchOptions = async () => {
//       try {
//         const res = await fetch("/api/admin/staff-treatments");
//         const data = await res.json();

//         if (res.ok && data.success) {
//           // Map API fields to "name" for dropdown
//           const treatments = data.data
//             .filter(item => item.treatment)
//             .map(item => ({ _id: item._id, name: item.treatment }));

//           const packages = data.data
//             .filter(item => item.package)
//             .map(item => ({ _id: item._id, name: item.package }));

//           setFetchedTreatments(treatments);
//           setFetchedPackages(packages);
//         } else {
//           console.error("Failed to fetch staff-treatments:", data.message);
//         }
//       } catch (error) {
//         console.error("Error fetching staff-treatments:", error);
//       }
//     };

//     fetchOptions();
//   }, []);


//   // -------------------------------
//   // Auto-update Advance Given Amount for insurance when Paid + Advance changes
//   // -------------------------------
//   useEffect(() => {
//     if (formData.insurance === "Yes") {
//       const paid = parseFloat(formData.paid) || 0;
//       const advance = parseFloat(formData.advance) || 0;
//       const totalAdvance = paid + advance;

//       setFormData(prev => ({
//         ...prev,
//         advanceGivenAmount: totalAdvance.toFixed(2),
//       }));
//     }
//   }, [formData.paid, formData.advance, formData.insurance]);



//   // -------------------------------
//   // Generate invoice number on mount
//   // -------------------------------
//   useEffect(() => {
//     generateInvoiceNumber();
//   }, []);

//   // -------------------------------
//   // Auto-calculate fields
//   // -------------------------------
//   useEffect(() => {
//     calculatePending();
//   }, [formData.amount, formData.paid, formData.advance]);

//   useEffect(() => {
//     calculateNeedToPay();
//   }, [formData.amount, formData.coPayPercent, formData.insurance]);

//   // -------------------------------
//   // Handlers
//   // -------------------------------
//   const generateInvoiceNumber = useCallback(() => {
//     const date = new Date();
//     const seq = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
//     const id = `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
//       date.getDate()
//     ).padStart(2, "0")}-${seq}`;
//     setFormData(prev => ({ ...prev, invoiceNumber: id }));
//   }, []);

//   const calculatePending = useCallback(() => {
//     const amount = parseFloat(formData.amount) || 0;
//     const paid = parseFloat(formData.paid) || 0;
//     const advance = parseFloat(formData.advance) || 0;
//     const pending = Math.max(0, amount - (paid + advance));
//     setCalculatedFields(prev => ({ ...prev, pending }));
//   }, [formData.amount, formData.paid, formData.advance]);

//   const calculateNeedToPay = useCallback(() => {
//     if (formData.insurance === "Yes" && formData.coPayPercent) {
//       const totalAmount = parseFloat(formData.amount) || 0;
//       const coPayPercent = parseFloat(formData.coPayPercent) || 0;
//       const needToPay = Math.max(0, totalAmount * (coPayPercent / 100));
//       setCalculatedFields(prev => ({ ...prev, needToPay }));
//     } else {
//       setCalculatedFields(prev => ({ ...prev, needToPay: 0 }));
//     }
//   }, [formData.amount, formData.coPayPercent, formData.insurance]);


//   const handleInputChange = useCallback(
//     e => {
//       const { name, value } = e.target;
//       setFormData(prev => ({ ...prev, [name]: value }));
//       if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));

//       if (name === "insurance" && value === "No") {
//         setFormData(prev => ({
//           ...prev,
//           advanceGivenAmount: "",
//           coPayPercent: "",
//           advanceClaimStatus: "Pending",
//         }));
//         setAutoFields(prev => ({
//           ...prev,
//           advanceClaimReleaseDate: null,
//           advanceClaimReleasedBy: null,
//         }));
//       }
//     },
//     [errors]
//   );

//   const validateForm = useCallback(() => {
//     const newErrors = {};
//     const {
//       invoiceNumber,
//       emrNumber,
//       firstName,
//       lastName,
//       email,
//       gender,
//       doctor,
//       service,
//       treatment,
//       package: selectedPackage,
//       patientType,
//       amount,
//       paymentMethod,
//       insurance,
//       advanceGivenAmount,
//       coPayPercent,
//     } = formData;

//     if (!invoiceNumber.trim()) newErrors.invoiceNumber = "Invoice Number is required";
//     if (!emrNumber.trim()) newErrors.emrNumber = "EMR Number is required";
//     else if (usedEMRNumbers.has(emrNumber))
//       newErrors.emrNumber = "EMR Number already exists. Must be unique.";

//     if (!firstName.trim()) newErrors.firstName = "First Name is required";
//     if (!lastName.trim()) newErrors.lastName = "Last Name is required";
//     if (!email.trim()) newErrors.email = "Email is required";
//     else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
//       newErrors.email = "Valid email is required";

//     if (!gender) newErrors.gender = "Gender is required";
//     if (!patientType) newErrors.patientType = "Patient Type is required";
//     if (!doctor) newErrors.doctor = "Doctor is required";
//     if (!service) newErrors.service = "Service is required";
//     if (service === "Treatment" && !treatment) newErrors.treatment = "Treatment is required";
//     if (service === "Package" && !selectedPackage) newErrors.package = "Package selection is required";

//     if (!amount || parseFloat(amount) <= 0) newErrors.amount = "Valid amount is required";
//     if (!paymentMethod) newErrors.paymentMethod = "Payment Method is required";

//     if (insurance === "Yes") {
//       if (!advanceGivenAmount || parseFloat(advanceGivenAmount) <= 0)
//         newErrors.advanceGivenAmount = "Advance Given Amount is required when insurance is Yes";
//       if (!coPayPercent || parseFloat(coPayPercent) < 0 || parseFloat(coPayPercent) > 100)
//         newErrors.coPayPercent = "Valid Co-Pay % (0-100) is required";
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   }, [formData, usedEMRNumbers]);

//   const handleReleaseClaim = useCallback(() => {
//     const allowedRoles = ["Staff", "Admin", "Super Admin"];
//     if (allowedRoles.includes(currentUser.role)) {
//       setFormData(prev => ({ ...prev, advanceClaimStatus: "Released" }));
//       setAutoFields(prev => ({
//         ...prev,
//         advanceClaimReleaseDate: new Date().toISOString(),
//         advanceClaimReleasedBy: currentUser.name,
//       }));
//     } else {
//       alert("Only Staff and Admin users can release claims");
//     }
//   }, [currentUser]);


//   const handleSubmit = useCallback(async () => {
//     // 1️⃣ Validate form
//     if (!validateForm()) {
//       alert("Please fix the errors before submitting");
//       return;
//     }

//     // 2️⃣ Prepare invoice data
//     const invoiceData = {
//       ...formData,
//       ...autoFields,
//       userId: currentUser._id, // optional if needed by API
//       calculatedFields: {
//         pending: parseFloat(calculatedFields.pending) || 0,
//         needToPay: parseFloat(calculatedFields.needToPay) || 0,
//       },
//     };

//     try {
//       const token = localStorage.getItem("userToken");
//       if (!token) {
//         alert("Authentication token not found. Please login again.");
//         return;
//       }

//       // 3️⃣ Call API
//       const res = await fetch("/api/staff/patient-registration", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(invoiceData),
//       });

//       const data = await res.json();

//       // 4️⃣ Handle API response
//       if (res.ok && data.success) {
//         alert("Invoice saved successfully!");
//         resetForm();
//       } else {
//         alert(`Error: ${data.message || "Failed to save invoice"}`);
//         console.error("API Error:", data);
//       }
//     } catch (err) {
//       console.error("Network Error:", err);
//       alert("Network error. Please try again later.");
//     }
//   }, [formData, autoFields, currentUser, calculatedFields, validateForm]);



//   const resetForm = useCallback(() => {
//     setFormData(INITIAL_FORM_DATA);
//     setAutoFields({
//       invoicedDate: new Date().toISOString(),
//       invoicedBy: " ",
//       advanceClaimReleaseDate: null,
//       advanceClaimReleasedBy: null,
//     });
//     setCalculatedFields({ pending: 0, needToPay: 0 });
//     setErrors({});
//     generateInvoiceNumber();
//   }, [currentUser.name, generateInvoiceNumber]);

//   const canViewMobileNumber = useMemo(
//     () => ["Admin", "Super Admin"].includes(currentUser.role),
//     [currentUser.role]
//   );


import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Calendar, User, DollarSign, FileText, AlertCircle, Search } from "lucide-react";

// ✅ Constant data (moved outside component to avoid re-creation)
const paymentMethods = ["Cash", "Card", "BT", "Tabby", "Tamara"];

const INITIAL_FORM_DATA = {
  invoiceNumber: "",
  emrNumber: "",
  firstName: "",
  lastName: "",
  email: "",
  mobileNumber: "",
  gender: "",
  doctor: "",
  service: "",
  treatment: "",
  package: "",
  patientType: "",
  referredBy: "",
  amount: "",
  paid: "",
  advance: "",
  paymentMethod: "",
  insurance: "No",
  advanceGivenAmount: "",
  coPayPercent: "",
  advanceClaimStatus: "Pending",
};

const InvoiceManagementSystem = () => {
  const [currentUser, setCurrentUser] = useState({ name: "", role: "" });
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [autoFields, setAutoFields] = useState({
    invoicedDate: new Date().toISOString(),
    invoicedBy: " ",
    advanceClaimReleaseDate: null,
    advanceClaimReleasedBy: null,
  });
  const [doctorList, setDoctorList] = useState([]);
  const [fetchedTreatments, setFetchedTreatments] = useState([]);
  const [fetchedPackages, setFetchedPackages] = useState([]);
  const [calculatedFields, setCalculatedFields] = useState({ pending: 0, needToPay: 0 });
  const [errors, setErrors] = useState({});
  const [usedEMRNumbers] = useState(() => new Set());
  const [fetching, setFetching] = useState(false);

  // -------------------------------
  // Fetch doctors
  // -------------------------------
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch("/api/admin/get-all-doctor-staff");
        if (!res.ok) return console.error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        if (data.success) setDoctorList(data.data);
        else console.error("Failed to fetch doctors:", data.message);
      } catch (err) {
        console.error("Error fetching doctors:", err);
      }
    };
    fetchDoctors();
  }, []);

  // -------------------------------
  // Fetch logged-in user
  // -------------------------------
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("userToken");
        if (!token) throw new Error("User not authenticated");
        const res = await fetch("/api/staff/patient-registration", {
          method: "GET",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        setCurrentUser(data.data);
        setAutoFields(prev => ({ ...prev, invoicedBy: data.data.name }));
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, []);

  // -------------------------------
  // Fetch treatments/packages
  // -------------------------------
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await fetch("/api/admin/staff-treatments");
        const data = await res.json();
        if (res.ok && data.success) {
          const treatments = data.data
            .filter(item => item.treatment)
            .map(item => ({ _id: item._id, name: item.treatment }));
          const packages = data.data
            .filter(item => item.package)
            .map(item => ({ _id: item._id, name: item.package }));
          setFetchedTreatments(treatments);
          setFetchedPackages(packages);
        } else console.error("Failed to fetch staff-treatments:", data.message);
      } catch (error) {
        console.error("Error fetching staff-treatments:", error);
      }
    };
    fetchOptions();
  }, []);

  // -------------------------------
  // Auto-calc Advance Given Amount when insurance = Yes
  // -------------------------------
  useEffect(() => {
    if (formData.insurance === "Yes") {
      const paid = parseFloat(formData.paid) || 0;
      const advance = parseFloat(formData.advance) || 0;
      const totalAdvance = paid + advance;
      setFormData(prev => ({ ...prev, advanceGivenAmount: totalAdvance.toFixed(2) }));
    }
  }, [formData.paid, formData.advance, formData.insurance]);

  // -------------------------------
  // Generate invoice number on mount
  // -------------------------------
  useEffect(() => {
    generateInvoiceNumber();
  }, []);

  // -------------------------------
  // Auto-calculate pending and needToPay
  // -------------------------------
  useEffect(() => {
    calculatePending();
  }, [formData.amount, formData.paid, formData.advance]);

  useEffect(() => {
    calculateNeedToPay();
  }, [formData.amount, formData.coPayPercent, formData.insurance]);

  // -------------------------------
  // Functions
  // -------------------------------
  const generateInvoiceNumber = useCallback(() => {
    const date = new Date();
    const seq = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
    const id = `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
      date.getDate()
    ).padStart(2, "0")}-${seq}`;
    setFormData(prev => ({ ...prev, invoiceNumber: id }));
  }, []);

  const calculatePending = useCallback(() => {
    const amount = parseFloat(formData.amount) || 0;
    const paid = parseFloat(formData.paid) || 0;
    const advance = parseFloat(formData.advance) || 0;
    const pending = Math.max(0, amount - (paid + advance));
    setCalculatedFields(prev => ({ ...prev, pending }));
  }, [formData.amount, formData.paid, formData.advance]);

  const calculateNeedToPay = useCallback(() => {
    if (formData.insurance === "Yes" && formData.coPayPercent) {
      const totalAmount = parseFloat(formData.amount) || 0;
      const coPayPercent = parseFloat(formData.coPayPercent) || 0;
      const needToPay = Math.max(0, totalAmount * (coPayPercent / 100));
      setCalculatedFields(prev => ({ ...prev, needToPay }));
    } else setCalculatedFields(prev => ({ ...prev, needToPay: 0 }));
  }, [formData.amount, formData.coPayPercent, formData.insurance]);

  const handleInputChange = useCallback(
    e => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
      if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
      if (name === "insurance" && value === "No") {
        setFormData(prev => ({
          ...prev,
          advanceGivenAmount: "",
          coPayPercent: "",
          advanceClaimStatus: "Pending",
        }));
        setAutoFields(prev => ({
          ...prev,
          advanceClaimReleaseDate: null,
          advanceClaimReleasedBy: null,
        }));
      }
    },
    [errors]
  );

  // -------------------------------
  // 🔍 Fetch EMR Number Data
  // -------------------------------
  const fetchEMRData = useCallback(async () => {
    if (!formData.emrNumber.trim()) {
      alert("Please enter an EMR Number first");
      return;
    }
    try {
      setFetching(true);
      const token = localStorage.getItem("userToken");
      const res = await fetch(`/api/staff/patient-registration/${formData.emrNumber}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        const fetched = data.data;
        setFormData(prev => ({
          ...prev,
          firstName: fetched.firstName || "",
          lastName: fetched.lastName || "",
          email: fetched.email || "",
          mobileNumber: fetched.mobileNumber || "",
          gender: fetched.gender || "",
          doctor: fetched.doctor || "",
          service: fetched.service || "",
          treatment: fetched.treatment || "",
          package: fetched.package || "",
          patientType: fetched.patientType || "",
          referredBy: fetched.referredBy || "",
          amount: fetched.amount || "",
          paid: fetched.paid || "",
          advance: fetched.advance || "",
          paymentMethod: fetched.paymentMethod || "",
          insurance: fetched.insurance || "No",
          advanceGivenAmount: fetched.advanceGivenAmount || "",
          coPayPercent: fetched.coPayPercent || "",
          advanceClaimStatus: fetched.advanceClaimStatus || "Pending",
        }));
        alert("✅ Patient data fetched successfully!");
      } else {
        alert("⚠️ No data found for this EMR number. You can fill manually.");
      }
    } catch (err) {
      console.error("Error fetching EMR data:", err);
      alert("❌ Failed to fetch EMR data. Try again later.");
    } finally {
      setFetching(false);
    }
  }, [formData.emrNumber]);

  // -------------------------------
  // Validation, Submit, Reset, etc.
  // -------------------------------
  const validateForm = useCallback(() => {
    const newErrors = {};
    const {
      invoiceNumber,
      emrNumber,
      firstName,
      lastName,
      email,
      gender,
      doctor,
      service,
      treatment,
      package: selectedPackage,
      patientType,
      amount,
      paymentMethod,
      insurance,
      advanceGivenAmount,
      coPayPercent,
    } = formData;
    if (!invoiceNumber.trim()) newErrors.invoiceNumber = "Invoice Number is required";
    if (!emrNumber.trim()) newErrors.emrNumber = "EMR Number is required";
    else if (usedEMRNumbers.has(emrNumber))
      newErrors.emrNumber = "EMR Number already exists.";
    if (!firstName.trim()) newErrors.firstName = "First Name is required";
    if (!lastName.trim()) newErrors.lastName = "Last Name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Valid email required";
    if (!gender) newErrors.gender = "Gender is required";
    if (!patientType) newErrors.patientType = "Patient Type is required";
    if (!doctor) newErrors.doctor = "Doctor is required";
    if (!service) newErrors.service = "Service is required";
    if (service === "Treatment" && !treatment) newErrors.treatment = "Treatment required";
    if (service === "Package" && !selectedPackage) newErrors.package = "Package required";
    if (!amount || parseFloat(amount) <= 0) newErrors.amount = "Valid amount required";
    if (!paymentMethod) newErrors.paymentMethod = "Payment Method is required";
    if (insurance === "Yes") {
      if (!advanceGivenAmount || parseFloat(advanceGivenAmount) <= 0)
        newErrors.advanceGivenAmount = "Advance Given Amount required";
      if (!coPayPercent || parseFloat(coPayPercent) < 0 || parseFloat(coPayPercent) > 100)
        newErrors.coPayPercent = "Valid Co-Pay % (0-100) required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, usedEMRNumbers]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      alert("Please fix the errors before submitting");
      return;
    }
    const invoiceData = {
      ...formData,
      ...autoFields,
      userId: currentUser._id,
      calculatedFields,
    };
    try {
      const token = localStorage.getItem("userToken");
      const res = await fetch("/api/staff/patient-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(invoiceData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("✅ Invoice saved successfully!");
        resetForm();
      } else {
        alert(`❌ Error: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      alert("Network error, please try again later.");
    }
  }, [formData, autoFields, currentUser, calculatedFields, validateForm]);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setAutoFields({
      invoicedDate: new Date().toISOString(),
      invoicedBy: " ",
      advanceClaimReleaseDate: null,
      advanceClaimReleasedBy: null,
    });
    setCalculatedFields({ pending: 0, needToPay: 0 });
    setErrors({});
    generateInvoiceNumber();
  }, [generateInvoiceNumber]);

  const canViewMobileNumber = useMemo(
    () => ["Admin", "Super Admin"].includes(currentUser.role),
    [currentUser.role]
  );




  // ✅ JSX — identical UI, untouched
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
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
              <div className="font-semibold text-indigo-600">
                {autoFields.invoicedBy || "Loading..."}
              </div>
              <div className="text-xs text-gray-500">
                {currentUser.role || "Loading..."}
              </div>
            </div>

          </div>

          <div className="space-y-6">
            {/* Auto-Generated Fields */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-6 border-l-4 border-indigo-500">
              <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Invoice Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono font-semibold ${errors.invoiceNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                  />
                  {errors.invoiceNumber && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.invoiceNumber}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Invoiced Date</label>
                  <input
                    type="text"
                    value={new Date(autoFields.invoicedDate).toLocaleString()}
                    disabled
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Invoiced By</label>
                  <input
                    type="text"
                    value={autoFields.invoicedBy}
                    disabled
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Patient Information */}
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Patient Information
              </h2>

<div className="flex items-center gap-2">
  <input
    type="text"
    name="emrNumber"
    value={formData.emrNumber}
    onChange={handleInputChange}
    placeholder="Enter EMR Number"
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
  />
  <button
    type="button"
    onClick={fetchEMRData}
    disabled={fetching}
    className={`px-4 py-2 rounded-lg text-white font-semibold transition ${
      fetching ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
    }`}
  >
    {fetching ? "Loading..." : "Search"}
  </button>
</div>


              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    EMR Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="emrNumber"
                    value={formData.emrNumber}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.emrNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    placeholder="Unique EMR number"
                  />
                  {errors.emrNumber && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.emrNumber}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.firstName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    placeholder="First name"
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.lastName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    placeholder="Last name"
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.lastName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    placeholder="email@example.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.email}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number {!canViewMobileNumber && '(Restricted)'}
                  </label>
                  <input
                    type='number'
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder='10-digit mobile'
                    maxLength="10"
                  />
                  {!canViewMobileNumber && (
                    <p className="text-xs text-gray-500 mt-1">Admin access required</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.gender ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.gender}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patient Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="patientType"
                    value={formData.patientType}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.patientType ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                  >
                    <option value="">Select Type</option>
                    <option value="New">New</option>
                    <option value="Old">Old</option>
                  </select>
                  {errors.patientType && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.patientType}
                    </p>
                  )}
                </div>
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

            {/* Medical Details */}
            <div className="bg-green-50 rounded-lg p-6 border border-green-200">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Medical Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Doctor Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Doctor <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="doctor"
                    value={formData.doctor}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.doctor ? "border-red-500 bg-red-50" : "border-gray-300"
                      }`}
                  >
                    <option value="">Select from Doctor Master List</option>
                    {doctorList.map((doctor) => (
                      <option key={doctor._id} value={doctor._id}>
                        {doctor.name} ({doctor.role})
                      </option>
                    ))}
                  </select>
                  {errors.doctor && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.doctor}
                    </p>
                  )}
                </div>

                {/* Service Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="service"
                    value={formData.service}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.service ? "border-red-500 bg-red-50" : "border-gray-300"
                      }`}
                  >
                    <option value="">Select service</option>
                    <option value="Package">Package</option>
                    <option value="Treatment">Treatment</option>
                  </select>
                  {errors.service && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.service}
                    </p>
                  )}
                </div>

                {/* Conditional Dropdowns */}
                {formData.service === "Package" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Package <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="package"
                      value={formData.package || ""}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.package ? "border-red-500 bg-red-50" : "border-gray-300"
                        }`}
                    >
                      <option value="">Select package</option>
                      {fetchedPackages.map((pkg) => (
                        <option key={pkg._id} value={pkg.name}>
                          {pkg.name}
                        </option>
                      ))}
                    </select>
                    {errors.package && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.package}
                      </p>
                    )}
                  </div>
                )}

                {formData.service === "Treatment" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Treatment <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="treatment"
                      value={formData.treatment}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.treatment ? "border-red-500 bg-red-50" : "border-gray-300"
                        }`}
                    >
                      <option value="">Select treatment</option>
                      {fetchedTreatments.map((t) => (
                        <option key={t._id} value={t.name}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    {errors.treatment && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.treatment}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>



            {/* Payment Details */}
            <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
              <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-yellow-600" />
                Payment Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.amount ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                  {errors.amount && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.amount}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Paid</label>
                  <input
                    type="number"
                    name="paid"
                    value={formData.paid}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Advance</label>
                  <input
                    type="number"
                    name="advance"
                    value={formData.advance}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pending (Auto)
                  </label>
                  <input
                    type="text"
                    value={`₹ ${calculatedFields.pending.toFixed(2)}`}
                    disabled
                    className="w-full px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-400 rounded-lg text-gray-900 cursor-not-allowed font-bold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.paymentMethod ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                  >
                    <option value="">Select payment method</option>
                    {paymentMethods.map((method, index) => (
                      <option key={index} value={method}>{method}</option>
                    ))}
                  </select>
                  {errors.paymentMethod && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.paymentMethod}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Insurance Details */}
            <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Insurance Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Insurance</label>
                  <select
                    name="insurance"
                    value={formData.insurance}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                {formData.insurance === 'Yes' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Advance Given Amount <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="advanceGivenAmount"
                        value={formData.advanceGivenAmount}
                        disabled
                        className="w-full px-4 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"
                      />

                      {errors.advanceGivenAmount && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.advanceGivenAmount}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Co-Pay % <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="coPayPercent"
                        value={formData.coPayPercent}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.coPayPercent ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                        placeholder="0-100"
                        min="0"
                        max="100"
                      />
                      {errors.coPayPercent && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.coPayPercent}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Need to Pay Amount (Auto)
                      </label>
                      <input
                        type="text"
                        value={`₹ ${calculatedFields.needToPay.toFixed(2)}`}
                        disabled
                        className="w-full px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-400 rounded-lg text-gray-900 cursor-not-allowed font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Advance Claim Status
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.advanceClaimStatus}
                          disabled
                          className={`flex-1 px-4 py-2 border rounded-lg cursor-not-allowed font-semibold ${formData.advanceClaimStatus === 'Released'
                              ? 'bg-green-100 border-green-400 text-green-800'
                              : 'bg-yellow-100 border-yellow-400 text-yellow-800'
                            }`}
                        />
                        {/* {formData.advanceClaimStatus === 'Pending' && (
                            <button
                                type="button"
                                onClick={handleReleaseClaim}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md font-semibold"
                              disabled  
                            >
                                Release
                            </button>
                            )} */}
                        {formData.advanceClaimStatus === "Pending" && (
                          <button
                            type="button"
                            onClick={() => {
                              alert("Doctor approval required before releasing the claim.");
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md font-semibold"
                          >
                            Release
                          </button>
                        )}

                      </div>
                    </div>
                    {autoFields.advanceClaimReleaseDate && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Advance Claim Release Date (Auto)
                          </label>
                          <input
                            type="text"
                            value={new Date(autoFields.advanceClaimReleaseDate).toLocaleString()}
                            disabled
                            className="w-full px-4 py-2 bg-white border border-gray-400 rounded-lg text-gray-700 cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Advance Claim Released By (Auto)
                          </label>
                          <input
                            type="text"
                            value={autoFields.advanceClaimReleasedBy || ''}
                            disabled
                            className="w-full px-4 py-2 bg-white border border-gray-400 rounded-lg text-gray-700 cursor-not-allowed"
                          />
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-semibold"
              >
                Reset Form
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold shadow-lg hover:shadow-xl"
              >
                Save Invoice
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceManagementSystem;


