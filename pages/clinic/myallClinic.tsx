"use client";
import { useEffect, useState, useRef, ReactNode } from "react";
import axios from "axios";
import withAdminAuth from "../../components/withClinicAuth";
import type { NextPageWithLayout } from "../_app";
import ClinicLayout from "../../components/ClinicLayout";
import {
  Edit3,
  MapPin,
  Heart,
  Clock,
  Plus,
  X,
  Calendar,
  Leaf,
  Building2,
  Camera,
} from "lucide-react";
import Image from 'next/image';
import { Toaster, toast } from "react-hot-toast";

interface Clinic {
  _id: string;
  name: string;
  address: string;
  treatments: string[];
  servicesName: string[];
  pricing: string;
  timings: string;
  photos: string[];
  location: { coordinates: [number, number] };
  createdAt: string;
}

interface Treatment {
  _id: string;
  treatment_name: string;
}

const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
      <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-black mx-auto mb-4"></div>
      <p className="text-black text-center">Loading clinics...</p>
    </div>
  </div>
);

const Header = ({
  onEditClick,
  hasClinic,
  isEditing,
}: {
  onEditClick: () => void;
  hasClinic: boolean;
  isEditing: boolean;
}) => (
  <header className="bg-white shadow-sm border-b border-gray-200">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="text-center relative">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-black rounded-xl mb-2">
          <Building2 className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-black mb-1">
          Clinic Management
        </h1>
        <p className="text-base text-black max-w-2xl mx-auto">
          Manage your clinic information and services with ease
        </p>
        {/* Edit Button - positioned in top right */}
        {hasClinic && !isEditing && (
          <button
            onClick={onEditClick}
            className="absolute top-0 right-0 inline-flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
          >
            <Edit3 className="w-4 h-4" />
            <span className="hidden sm:inline">Edit Clinic</span>
          </button>
        )}
      </div>
    </div>
  </header>

);

interface FormInputProps {
  label: ReactNode;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  rows?: number;
}
const FormInput = ({
  label,
  icon,
  value,
  onChange,
  type = "text",
  placeholder,
  rows,
}: FormInputProps) => (
  <div className="space-y-2">
    <label className="flex items-center gap-2 text-sm font-medium text-black">
      {icon}
      {label}
    </label>
    {type === "textarea" ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none placeholder-black text-black"
        rows={rows || 3}
        placeholder={placeholder}
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder-black text-black"
        placeholder={placeholder}
      />
    )}
  </div>
);

interface TagManagerProps {
  label: string;
  icon: React.ReactNode;
  items: string[];
  newItem: string;
  setNewItem: (value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  className?: string;
}
const TagManager = ({
  label,
  icon,
  items,
  newItem,
  setNewItem,
  onAdd,
  onRemove,
  className,
}: TagManagerProps) => (
  <div className={`space-y-2 ${className || ""}`}>
    <label className="flex items-center gap-2 text-sm font-medium text-black">
      {icon}
      {label}
    </label>
    <div className="flex gap-2">
      <input
        type="text"
        value={newItem}
        onChange={(e) => setNewItem(e.target.value)}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder-black text-black"
        placeholder={`Add ${label.toLowerCase()}`}
        onKeyPress={(e) => e.key === "Enter" && onAdd()}
      />
      <button
        onClick={onAdd}
        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
    <div className="flex flex-wrap gap-2">
      {items?.map((item: string, index: number) => (
        <span
          key={index}
          className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-black rounded-full text-sm"
        >
          {item}
          <button
            onClick={() => onRemove(index)}
            className="text-gray-400 hover:text-black transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
    </div>
  </div>
);

interface TreatmentManagerProps {
  label: string;
  icon: React.ReactNode;
  items: string[];
  newItem: string;
  setNewItem: (value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  availableTreatments: Treatment[];
  showCustomInput: boolean;
  setShowCustomInput: (value: boolean) => void;
  onAddFromDropdown: (treatmentName: string) => void;
}
const TreatmentManager = ({
  label,
  icon,
  items,
  newItem,
  setNewItem,
  onAdd,
  onRemove,
  availableTreatments,
  showCustomInput,
  setShowCustomInput,
  onAddFromDropdown,
}: TreatmentManagerProps) => (
  <div className="space-y-2">
    <label className="flex items-center gap-2 text-sm font-medium text-black">
      {icon}
      {label}
    </label>

    {/* Treatment Selection */}
    <div className="space-y-2">
      {!showCustomInput ? (
        <div className="relative">
          <select
            onChange={(e) => {
              if (e.target.value === "custom") {
                setShowCustomInput(true);
              } else if (e.target.value) {
                const selectedTreatment = availableTreatments.find(
                  (t: Treatment) => t._id === e.target.value
                );
                if (selectedTreatment) {
                  onAddFromDropdown(selectedTreatment.treatment_name);
                }
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
            value=""
          >
            <option value="">Select a treatment</option>
            {availableTreatments?.map((treatment: Treatment) => (
              <option key={treatment._id} value={treatment._id}>
                {treatment.treatment_name}
              </option>
            ))}
            <option value="custom">+ Add Custom Treatment</option>
          </select>
          {/* <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" /> */}
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder-black text-black"
            placeholder="Enter custom treatment name"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAdd();
              }
            }}
          />
          <button
            onClick={onAdd}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setShowCustomInput(false);
              setNewItem("");
            }}
            className="px-4 py-2 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>

    {/* Selected Treatments */}
    <div className="flex flex-wrap gap-2">
      {items?.map((item: string, index: number) => (
        <span
          key={index}
          className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-black rounded-full text-sm"
        >
          {item}
          <button
            onClick={() => onRemove(index)}
            className="text-gray-400 hover:text-black transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
    </div>
  </div>
);

interface ClinicCardProps {
  clinic: Clinic;
  onEdit: (clinic: Clinic) => void;
  getImagePath: (photoPath: string) => string;
}
const ClinicCard = ({ clinic, onEdit, getImagePath }: ClinicCardProps) => (
  <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden max-w-4xl mx-auto">

    {/* Image & Edit Section */}
    <div className="relative w-full">
      {clinic.photos?.[0] ? (
        <div className="relative w-full group">
          <Image
            src={getImagePath(clinic.photos[0])}
            className="w-full h-auto max-h-96 object-contain rounded-t-xl transition-transform duration-300"
            alt={clinic.name}
            width={400}
            height={200}
            unoptimized={true}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent rounded-t-xl pointer-events-none"></div>
        </div>
      ) : (
        <div className="w-full flex items-center justify-center bg-gradient-to-tr from-slate-200 to-indigo-100 rounded-t-xl" style={{ height: '16rem' }}>
          <span className="text-gray-400 text-lg font-semibold">Please Upload Clinic Photo</span>
        </div>
      )}

      <button
        onClick={() => onEdit(clinic)}
        className="absolute top-4 right-4 bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
      >
        <Edit3 className="w-5 h-5" />
      </button>
    </div>

    {/* Content Section */}
    <div className="p-8 bg-white rounded-b-xl">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-indigo-700 mb-1 tracking-tight">{clinic.name}</h2>
        <div className="flex items-center gap-2 text-gray-500">
          <MapPin className="w-5 h-5 text-indigo-400" />
          <span className="text-base">{clinic.address}</span>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-indigo-50 shadow">
          <span className="bg-indigo-200 rounded-full p-2">
            <svg
              className="w-5 h-5 text-indigo-600"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <text
                x="2"
                y="16"
                fontSize="23"
                fontWeight="bold"
                fill="currentColor"
              >
                د.إ
              </text>
            </svg>
          </span>

          <div>
            <div className="text-sm font-semibold text-gray-700">Consultation Fee</div>
            <div className="text-black">{clinic.pricing || <span className="text-gray-400">Contact for pricing</span>}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg bg-indigo-50 shadow">
          <span className="bg-indigo-200 rounded-full p-2"><Clock className="w-5 h-5 text-indigo-600" /></span>
          <div>
            <div className="text-sm font-semibold text-gray-800">Timings</div>
            <div className="text-black">{clinic.timings || <span className="text-gray-400">Contact for timings</span>}</div>
          </div>
        </div>
      </div>

      {/* Services */}
      {clinic.servicesName?.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm font-medium text-indigo-700 mb-3">
            <Leaf className="w-5 h-5 text-green-400" />
            Services
          </div>
          <div className="flex flex-wrap gap-2">
            {clinic.servicesName.map((service, idx) => (
              <span key={idx} className="px-3 py-1 bg-green-50 text-green-800 rounded-full shadow-sm text-sm">{service}</span>
            ))}
          </div>
        </div>
      )}

      {/* Treatments */}
      {clinic.treatments?.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm font-medium text-rose-700 mb-3">
            <Heart className="w-5 h-5 text-rose-400" />
            Treatments
          </div>
          <div className="flex flex-wrap gap-2">
            {clinic.treatments.map((treatment, idx) => (
              <span key={idx} className="px-3 py-1 bg-rose-50 text-rose-800 rounded-full shadow-sm text-sm">{treatment}</span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pt-6 mt-2 border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="bg-indigo-50 rounded-full p-1 mr-1">
            <Calendar className="w-4 h-4 text-indigo-400" />
          </span>
          <span>
            <span className="italic">Established</span>{" "}
            {new Date(clinic.createdAt).toLocaleDateString("en-US", {
              year: "numeric", month: "long"
            })}
          </span>
        </div>
      </div>
    </div>
  </div>


);

function ClinicManagementDashboard() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingClinicId, setEditingClinicId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Clinic>>({});
  const [newService, setNewService] = useState("");
  const [newTreatment, setNewTreatment] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [updating, setUpdating] = useState(false);
  const [availableTreatments, setAvailableTreatments] = useState<Treatment[]>(
    []
  );
  const [showCustomTreatmentInput, setShowCustomTreatmentInput] =
    useState(false);
  const [geocodingStatus, setGeocodingStatus] = useState<string>("");
  const addressDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const [photoError, setPhotoError] = useState("");

  const getImagePath = (photoPath: string): string => {
    if (!photoPath) return "/placeholder-clinic.jpg";
    if (photoPath.startsWith("/")) return photoPath;
    if (photoPath.includes("uploads/clinic/")) {
      const filename = photoPath.split("uploads/clinic/").pop();
      return `/uploads/clinic/${filename}`;
    }
    return `/uploads/clinic/${photoPath}`;
  };

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const token = localStorage.getItem("clinicToken");
        const res = await axios.get("/api/clinics/myallClinic", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClinics(
          Array.isArray(res.data.clinics) ? res.data.clinics : [res.data.clinic]
        );
      } catch (err) {
        console.error("Error fetching clinics:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchTreatments = async () => {
      try {
        const res = await axios.get("/api/doctor/getTreatment");
        setAvailableTreatments(res.data.treatments || []);
      } catch (err) {
        console.error("Error fetching treatments:", err);
      }
    };

    fetchClinics();
    fetchTreatments();
  }, []);

  const handleEdit = (clinic: unknown) => {
    setIsEditing(true);
    setEditingClinicId((clinic as Clinic)._id);
    setEditForm({
      ...(clinic as Clinic),
      treatments: (clinic as Clinic).treatments || [],
      servicesName: (clinic as Clinic).servicesName || [],
    });
  };

  const handleEditFromHeader = () => {
    if (clinics.length > 0) {
      handleEdit(clinics[0]); // Edit the first clinic if available
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingClinicId(null);
    setEditForm({});
    setSelectedFile(null);
    setNewService("");
    setNewTreatment("");
    setShowCustomTreatmentInput(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const addService = () => {
    if (newService.trim() && editForm.servicesName) {
      setEditForm((prev) => ({
        ...prev,
        servicesName: [...(prev.servicesName || []), newService.trim()],
      }));
      setNewService("");
    }
  };

  const removeService = (index: number) => {
    setEditForm((prev) => ({
      ...prev,
      servicesName: prev.servicesName?.filter((_, i) => i !== index) || [],
    }));
  };

  const addTreatment = () => {
    const trimmed = newTreatment.trim();
    console.log("Adding custom treatment:", trimmed);
    console.log("Current treatments:", editForm.treatments);
    if (trimmed && !editForm.treatments?.includes(trimmed)) {
      setEditForm((prev) => {
        const newTreatments = [...(prev.treatments || []), trimmed];
        console.log("New treatments array after adding custom:", newTreatments);
        return {
          ...prev,
          treatments: newTreatments,
        };
      });
    } else {
      console.log("Treatment not added - empty or duplicate:", trimmed);
    }
    setNewTreatment("");
    setShowCustomTreatmentInput(false);
  };

  const addTreatmentFromDropdown = (treatmentName: string) => {
    console.log("Adding treatment from dropdown:", treatmentName);
    console.log("Current treatments:", editForm.treatments);
    if (treatmentName && !editForm.treatments?.includes(treatmentName)) {
      setEditForm((prev) => {
        const newTreatments = [...(prev.treatments || []), treatmentName];
        console.log("New treatments array:", newTreatments);
        return {
          ...prev,
          treatments: newTreatments,
        };
      });
    }
  };

  const removeTreatment = (index: number) => {
    setEditForm((prev) => ({
      ...prev,
      treatments: prev.treatments?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleUpdate = async () => {
    if (!editingClinicId) return;

    setUpdating(true);
    try {
      const token = localStorage.getItem("clinicToken");
      const formData = new FormData();

      // Debug: Log the editForm data
      console.log("EditForm data:", editForm);
      console.log("Treatments to be sent:", editForm.treatments);

      Object.keys(editForm).forEach((key) => {
        if (
          key === "servicesName" ||
          key === "treatments" ||
          key === "location"
        ) {
          formData.append(key, JSON.stringify(editForm[key as keyof Clinic]));
        } else if (editForm[key as keyof Clinic] !== undefined) {
          formData.append(key, String(editForm[key as keyof Clinic]));
        }
      });

      if (selectedFile) formData.append("photo", selectedFile);

      // Debug: Log the FormData contents
      for (const [key, value] of Object.entries(formData.entries())) {
        console.log(`FormData ${key}:`, value);
      }

      const response = await axios.put(
        `/api/clinics/${editingClinicId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        setClinics((prev) =>
          prev.map((clinic) =>
            clinic._id === editingClinicId ? response.data.clinic : clinic
          )
        );
        toast.success("Clinic updated successfully!");
        handleCancel();
      }
    } catch {
      // console.error("Error updating clinic:", error);
      toast.error("Error updating clinic. Please try again.");
      // alert("Error updating clinic. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  // Geocode address and update coordinates in editForm
  const geocodeAddress = async (address: string) => {
    if (!address.trim()) return;
    setGeocodingStatus("Locating address...");
    try {
      const res = await axios.get("/api/clinics/geocode", {
        params: { place: address },
      });
      if (
        res.data &&
        typeof res.data.lat === "number" &&
        typeof res.data.lng === "number"
      ) {
        setEditForm((prev) => ({
          ...prev,
          location: {
            type: "Point",
            coordinates: [res.data.lng, res.data.lat],
          },
        }));
        setGeocodingStatus("Address located on map!");
        setTimeout(() => setGeocodingStatus(""), 2000);
      } else {
        setGeocodingStatus(
          "Could not locate address. Please check the address."
        );
        setTimeout(() => setGeocodingStatus(""), 4000);
      }
    } catch {
      setGeocodingStatus("Geocoding failed. Please check the address.");
      setTimeout(() => setGeocodingStatus(""), 4000);
    }
  };

  // Enhanced address change handler with debounce and geocoding
  const handleAddressChangeWithGeocode = (value: string) => {
    handleInputChange("address", value);
    if (addressDebounceTimer.current)
      clearTimeout(addressDebounceTimer.current);
    if (value.trim().length > 10) {
      addressDebounceTimer.current = setTimeout(() => {
        geocodeAddress(value);
      }, 1000);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <Header
        onEditClick={handleEditFromHeader}
        hasClinic={clinics.length > 0}
        isEditing={isEditing}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isEditing ? (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                    <Edit3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-black">
                      Edit Clinic
                    </h2>
                    <p className="text-black text-sm">
                      Update clinic information
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCancel}
                  className="p-2 text-gray-400 hover:text-black transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  <FormInput
                    label="Clinic Name"
                    icon={<Building2 className="w-4 h-4" />}
                    value={editForm.name || ""}
                    onChange={(value: string) =>
                      handleInputChange("name", value)
                    }
                    placeholder="Enter clinic name"
                  />

                  <FormInput
                    label={
                      <span>
                        Address{" "}
                        {geocodingStatus && (
                          <span className="text-green-600 text-xs ml-2">
                            {geocodingStatus}
                          </span>
                        )}
                      </span>
                    }
                    icon={<MapPin className="w-4 h-4" />}
                    value={editForm.address || ""}
                    onChange={handleAddressChangeWithGeocode}
                    type="textarea"
                    placeholder="Enter complete address with state,city and place"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput
                      label="Consultation Fee"
                      icon={
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <text
                            x="2"
                            y="16"
                            fontSize="23"
                            fontWeight="bold"
                            fill="currentColor"
                          >
                            د.إ
                          </text>
                        </svg>
                      }

                      value={editForm.pricing || ""}
                      onChange={(value: string) =>
                        handleInputChange("pricing", value)
                      }
                      placeholder="₹500 - ₹2000"
                    />
                    <FormInput
                      label="Timings"
                      icon={<Clock className="w-4 h-4" />}
                      value={editForm.timings || ""}
                      onChange={(value: string) =>
                        handleInputChange("timings", value)
                      }
                      placeholder="9:00 AM - 8:00 PM"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <TagManager
                    label="Services"
                    icon={<Leaf className="w-4 h-4" />}
                    items={editForm.servicesName ?? []}
                    newItem={newService}
                    setNewItem={setNewService}
                    onAdd={addService}
                    onRemove={removeService}
                    className="hidden"
                  />

                  <TreatmentManager
                    label="Treatments"
                    icon={<Heart className="w-4 h-4" />}
                    items={editForm.treatments ?? []}
                    newItem={newTreatment}
                    setNewItem={setNewTreatment}
                    onAdd={addTreatment}
                    onRemove={removeTreatment}
                    availableTreatments={availableTreatments}
                    showCustomInput={showCustomTreatmentInput}
                    setShowCustomInput={setShowCustomTreatmentInput}
                    onAddFromDropdown={addTreatmentFromDropdown}
                  />

                  {/* Photo Upload */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-black">
                      <Camera className="w-4 h-4" />
                      Clinic Photo
                    </label>
                    <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            // Check file type
                            if (
                              file.type !== "image/png" &&
                              file.type !== "image/jpeg" &&
                              file.type !== "image/jpg"
                            ) {
                              setPhotoError("Please upload a PNG or JPG file");
                              setSelectedFile(null);
                            } else if (file.size > 1024 * 1024) {
                              setPhotoError("File is too large and you have to upload file less than 1MB");
                              setSelectedFile(null);
                            } else {
                              setSelectedFile(file);
                              setPhotoError("");
                            }
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-black font-medium">
                        Click to upload photo
                      </p>
                      <p className="text-gray-500 text-sm">
                        PNG, JPG up to 1MB
                      </p>
                      {selectedFile && (
                        <p className="text-black text-sm mt-2 font-medium">
                          {selectedFile.name}
                        </p>
                      )}
                      {photoError && (
                        <p className="text-red-600 text-sm mt-2 font-medium">{photoError}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-6 border-t border-gray-200">
                <button
                  onClick={handleUpdate}
                  disabled={updating}
                  className="flex-1 sm:flex-none px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {updating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Updating...
                    </>
                  ) : (
                    "Update Clinic"
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 sm:flex-none px-6 py-2 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            {clinics.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-black mb-2">
                    No Clinics Found
                  </h3>
                  <p className="text-black">
                    Start by adding your first clinic
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full">
                {clinics.map((clinic) => (
                  <ClinicCard
                    key={clinic._id}
                    clinic={clinic}
                    onEdit={handleEdit}
                    getImagePath={getImagePath}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

ClinicManagementDashboard.getLayout = function PageLayout(
  page: React.ReactNode
) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

// ✅ Apply HOC and assign correct type
const ProtectedDashboard: NextPageWithLayout = withAdminAuth(
  ClinicManagementDashboard
);

// ✅ Reassign layout (TS-safe now)
ProtectedDashboard.getLayout = ClinicManagementDashboard.getLayout;

export default ProtectedDashboard;