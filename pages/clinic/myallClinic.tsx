"use client";
import { useEffect, useState, useRef, ReactNode } from "react";
import axios from "axios";
import withClinicAuth from "../../components/withClinicAuth";
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
import Image from "next/image";
import { Toaster, toast } from "react-hot-toast";

interface Clinic {
  _id: string;
  name: string;
  address: string;
  treatments: Array<{
    mainTreatment: string;
    mainTreatmentSlug: string;
    subTreatments: Array<{
      name: string;
      slug: string;
      price?: number;
    }>;
  }>;
  servicesName: string[];
  pricing: string;
  timings: string;
  photos: string[];
  location: { coordinates: [number, number] };
  createdAt: string;
}

interface Treatment {
  _id: string;
  name: string;
  slug: string;
  subcategories: Array<{
    name: string;
    slug: string;
    price?: number;
  }>;
}

const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
      <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-black mx-auto mb-4"></div>
      <p className="text-black text-center">Loading Health Centers...</p>
    </div>
  </div>
);

// Lightweight inline placeholder to avoid 404 loops
const PLACEHOLDER_DATA_URI =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="320" viewBox="0 0 800 320">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-size="20" font-family="Arial, sans-serif">No image available</text>
    </svg>`
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
  <header className="bg-white border-b border-gray-100">
    <div className="max-w-6xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between">
        {/* Left side - Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#2D9AA5] rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Health Center Management
            </h1>
            <p className="text-sm text-gray-500">
              Manage your Health Center with ease
            </p>
          </div>
        </div>

        {/* Right side - Edit Button */}
        {hasClinic && !isEditing && (
          <button
            onClick={onEditClick}
            className="flex items-center gap-2 px-4 py-2 bg-[#2D9AA5] text-white rounded-lg hover:bg-[#247a83] transition-colors font-medium"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit</span>
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
  items: Array<{
    mainTreatment: string;
    mainTreatmentSlug: string;
    subTreatments: Array<{
      name: string;
      slug: string;
      price?: number;
    }>;
  }>;
  newItem: string;
  setNewItem: (value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  availableTreatments: Treatment[];
  showCustomInput: boolean;
  setShowCustomInput: (value: boolean) => void;
  onAddFromDropdown: (treatmentName: string) => void;
  onUpdateTreatment: (index: number, treatment: {
    mainTreatment: string;
    mainTreatmentSlug: string;
    subTreatments: Array<{
      name: string;
      slug: string;
      price?: number;
    }>;
  }) => void;
  // Add this missing prop
  setAvailableTreatments: (treatments: Treatment[]) => void;
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
  onUpdateTreatment,
  setAvailableTreatments, // Now properly typed and available
}: TreatmentManagerProps) => {
  const [customSubTreatment, setCustomSubTreatment] = useState<string>("");
  const [customSubTreatmentPrice, setCustomSubTreatmentPrice] =
    useState<string>("");
  const [showSubTreatmentInput, setShowSubTreatmentInput] = useState<
    number | null
  >(null);
  const [showCustomSubTreatmentInput, setShowCustomSubTreatmentInput] =
    useState<number | null>(null);

  const handleAddSubTreatment = async (mainTreatmentIndex: number) => {
    if (customSubTreatment.trim()) {
      const currentTreatment = items[mainTreatmentIndex];
      const newSubTreatment = {
        name: customSubTreatment.trim(),
        slug: customSubTreatment.trim().toLowerCase().replace(/\s+/g, "-"),
        price: Number(customSubTreatmentPrice) || 0,
      };

      // Try to save to database
      try {
        const token = localStorage.getItem("clinicToken");
        await axios.post(
          "/api/doctor/add-custom-treatment",
          {
            mainTreatment: currentTreatment.mainTreatment,
            subTreatments: [newSubTreatment],
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Refresh available treatments
        const treatmentsResponse = await axios.get("/api/doctor/getTreatment");
        setAvailableTreatments(treatmentsResponse.data.treatments || []);
      } catch (error) {
        console.error("Error adding custom sub-treatment to database:", error);
        // Continue with local addition even if database call fails
      }

      const updatedTreatment = {
        ...currentTreatment,
        subTreatments: [
          ...(currentTreatment.subTreatments || []),
          newSubTreatment,
        ],
      };

      onUpdateTreatment(mainTreatmentIndex, updatedTreatment);
      setCustomSubTreatment("");
      setCustomSubTreatmentPrice("");
      setShowSubTreatmentInput(null);
      setShowCustomSubTreatmentInput(null);
    }
  };

  const handleRemoveSubTreatment = (
    mainTreatmentIndex: number,
    subTreatmentIndex: number
  ) => {
    const currentTreatment = items[mainTreatmentIndex];
    const updatedSubTreatments = currentTreatment.subTreatments.filter(
      (_, index) => index !== subTreatmentIndex
    );

    const updatedTreatment = {
      ...currentTreatment,
      subTreatments: updatedSubTreatments,
    };

    onUpdateTreatment(mainTreatmentIndex, updatedTreatment);
  };

  const handleAddFromAvailableSubTreatments = (
    mainTreatmentIndex: number,
    subTreatmentName: string
  ) => {
    const currentTreatment = items[mainTreatmentIndex];
    const newSubTreatment = {
      name: subTreatmentName,
      slug: subTreatmentName.toLowerCase().replace(/\s+/g, "-"),
    };

    const updatedTreatment = {
      ...currentTreatment,
      subTreatments: [
        ...(currentTreatment.subTreatments || []),
        newSubTreatment,
      ],
    };

    onUpdateTreatment(mainTreatmentIndex, updatedTreatment);
  };

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-3 text-sm font-semibold text-gray-800 sm:text-base">
        {icon}
        {label}
      </label>

      {/* Treatment Selection */}
      <div className="space-y-3">
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
                    onAddFromDropdown(selectedTreatment.name);
                  }
                }
              }}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] text-gray-800 transition-all duration-200 text-sm sm:text-base"
              value=""
            >
              <option value="">Select a treatment</option>
              {availableTreatments?.map((treatment: Treatment) => (
                <option key={treatment._id} value={treatment._id}>
                  {treatment.name}
                </option>
              ))}
              <option value="custom">+ Add Custom Treatment</option>
            </select>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] placeholder-gray-400 text-gray-800 transition-all duration-200 text-sm sm:text-base"
              placeholder="Enter custom treatment name"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onAdd();
                }
              }}
            />
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={onAdd}
                className="flex-1 sm:flex-initial px-4 py-3 bg-[#2D9AA5] text-white rounded-xl hover:bg-[#238891] active:bg-[#1f7177] transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="sm:hidden">Add</span>
              </button>
              <button
                onClick={() => {
                  setShowCustomInput(false);
                  setNewItem("");
                }}
                className="flex-1 sm:flex-initial px-4 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 active:bg-gray-300 transition-all duration-200 shadow-sm flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                <span className="sm:hidden">Cancel</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Treatments */}
      <div className="space-y-4">
        {items?.map(
          (
            item: {
              mainTreatment: string;
              subTreatments?: Array<{
                name: string;
                slug: string;
                price?: number;
              }>;
            },
            index: number
          ) => {
            const selectedTreatment = availableTreatments.find(
              (t) => t.name === item.mainTreatment
            );

            return (
              <div
                key={index}
                className="bg-white border border-gray-100 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4 gap-3">
                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base leading-tight">
                    {item.mainTreatment}
                  </h3>
                  <button
                    onClick={() => onRemove(index)}
                    className="text-red-400 hover:text-red-600 active:text-red-700 transition-colors duration-200 p-1 rounded-lg hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Sub-treatment Section */}
                <div className="space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Sub-treatments
                    </span>
                    <button
                      onClick={() => setShowSubTreatmentInput(index)}
                      className="self-start sm:self-auto px-3 py-2 bg-[#2D9AA5]/10 text-[#2D9AA5] rounded-lg text-xs font-medium hover:bg-[#2D9AA5]/20 active:bg-[#2D9AA5]/30 transition-all duration-200"
                    >
                      + Add Sub-treatment
                    </button>
                  </div>

                  {/* Sub-treatment Input */}
                  {showSubTreatmentInput === index && (
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <select
                          onChange={(e) => {
                            if (e.target.value === "custom") {
                              setShowCustomSubTreatmentInput(index);
                              setCustomSubTreatment("");
                            } else if (e.target.value) {
                              handleAddFromAvailableSubTreatments(
                                index,
                                e.target.value
                              );
                            }
                          }}
                          className="text-black flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] text-sm transition-all duration-200"
                          value=""
                        >
                          <option value="">Select sub-treatment</option>
                          {selectedTreatment?.subcategories?.map((sub) => (
                            <option key={sub.slug} value={sub.name}>
                              {sub.name}
                            </option>
                          ))}
                          <option value="custom">
                            + Add Custom Sub-treatment
                          </option>
                        </select>
                      </div>

                      {showCustomSubTreatmentInput === index && (
                        <div className="flex flex-col gap-3 sm:flex-row">
                          <input
                            type="text"
                            value={customSubTreatment}
                            onChange={(e) =>
                              setCustomSubTreatment(e.target.value)
                            }
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] text-sm placeholder-gray-400 transition-all duration-200"
                            placeholder="Custom sub-treatment name"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddSubTreatment(index);
                              }
                            }}
                          />
                          <input
                            type="number"
                            min="0"
                            value={customSubTreatmentPrice}
                            onChange={(e) => {
                              setCustomSubTreatmentPrice(e.target.value);
                            }}
                            className="w-32 px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] text-sm placeholder-gray-400 transition-all duration-200"
                            placeholder="Price"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddSubTreatment(index);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleAddSubTreatment(index)}
                            className="px-4 py-2 bg-[#2D9AA5] text-white rounded-lg text-sm font-medium hover:bg-[#238891] active:bg-[#1f7177] transition-all duration-200 shadow-sm"
                          >
                            Add
                          </button>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <button
                          onClick={() => {
                            setShowSubTreatmentInput(null);
                            setShowCustomSubTreatmentInput(null);
                            setCustomSubTreatment("");
                            setCustomSubTreatmentPrice("");
                          }}
                          className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-300 active:bg-gray-400 transition-all duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Existing Sub-treatments */}
                  {item.subTreatments && item.subTreatments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {item.subTreatments.map((subTreatment, subIndex) => (
                        <span
                          key={subIndex}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-[#2D9AA5]/10 text-[#2D9AA5] text-sm rounded-full border border-[#2D9AA5]/20 hover:bg-[#2D9AA5]/20 transition-all duration-200"
                        >
                          <span className="font-medium">
                            {subTreatment.name}
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={subTreatment.price ?? 0}
                            onChange={(e) => {
                              const updatedSubTreatments =
                                item.subTreatments!.map((st, i) =>
                                  i === subIndex
                                    ? { ...st, price: Number(e.target.value) }
                                    : st
                                );
                              onUpdateTreatment(index, {
                                mainTreatment: item.mainTreatment,
                                mainTreatmentSlug: item.mainTreatment.toLowerCase().replace(/\s+/g, "-"),
                                subTreatments: updatedSubTreatments,
                              });
                            }}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-xs ml-2"
                            placeholder="Price"
                          />
                          <button
                            onClick={() =>
                              handleRemoveSubTreatment(index, subIndex)
                            }
                            className="text-[#2D9AA5]/60 hover:text-red-500 active:text-red-600 transition-colors duration-200 p-0.5 rounded-full hover:bg-white/50"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
};

interface ClinicCardProps {
  clinic: Clinic;
  onEdit: (clinic: Clinic) => void;
  getImagePath: (photoPath: string) => string;
}
const ClinicCard = ({ clinic, onEdit, getImagePath }: ClinicCardProps) => (
  <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden max-w-5xl mx-auto">
    {/* Image & Edit Section */}
    <div className="relative">
      {clinic.photos?.[0] ? (
        <Image
          src={getImagePath(clinic.photos[0])}
          className="w-full h-auto max-h-48 sm:max-h-56 object-contain bg-gray-50"
          alt={clinic.name}
          width={480}
          height={220}
          unoptimized={true}
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            (img as any).onerror = null;
            img.src = PLACEHOLDER_DATA_URI;
          }}
        />
      ) : (
        <div className="w-full h-auto min-h-40 sm:min-h-48 flex items-center justify-center bg-gray-50">
          <span className="text-gray-400 text-xs">
            Upload Health Center Photo
          </span>
        </div>
      )}

      <button
        onClick={() => onEdit(clinic)}
        className="absolute top-3 right-3 bg-[#2D9AA5] text-white p-2 rounded-lg hover:bg-[#238891]"
      >
        <Edit3 className="w-4 h-4" />
      </button>
    </div>

    {/* Content */}
    <div className="p-3 sm:p-4">
      {/* Header */}
      <div className="mb-3">
        <h2 className="text-base sm:text-lg font-semibold text-[#2D9AA5] mb-1">
          {clinic.name}
        </h2>
        <div className="flex items-center gap-1.5 text-gray-600 text-xs">
          <MapPin className="w-3.5 h-3.5" />
          <span>{clinic.address}</span>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-md">
          <div className="w-7 h-7 bg-[#2D9AA5] rounded-md flex items-center justify-center text-white text-[10px] font-bold">
            د.إ
          </div>
          <div>
            <div className="text-[11px] text-gray-500">Consultation Fee</div>
            <div className="text-xs font-medium text-gray-800">
              {clinic.pricing || "Contact for pricing"}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-md">
          <div className="w-7 h-7 bg-[#2D9AA5] rounded-md flex items-center justify-center">
            <Clock className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <div className="text-[11px] text-gray-500">Timings</div>
            <div className="text-xs font-medium text-gray-800">
              {clinic.timings || "Contact for timings"}
            </div>
          </div>
        </div>
      </div>

      {/* Services */}
      {clinic.servicesName?.length > 0 && (
        <div className="mb-3">
          <h3 className="text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Leaf className="w-3.5 h-3.5 text-green-500" />
            Services
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {clinic.servicesName.map((service, idx) => (
              <span
                key={idx}
                className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-[10px]"
              >
                {service}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Treatments */}
      {clinic.treatments?.length > 0 && (
        <div className="mb-3">
          <h3 className="text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            Treatments
          </h3>
          <div className="space-y-1.5">
            {clinic.treatments.map((treatment, idx) => (
              <div key={idx} className="border border-gray-200 rounded-md p-2.5">
                <span className="px-1.5 py-0.5 bg-[#2D9AA5] text-white rounded text-[10px] font-medium">
                  {treatment.mainTreatment}
                </span>
                {treatment.subTreatments &&
                  treatment.subTreatments.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {treatment.subTreatments.map((subTreatment, subIdx) => (
                        <span
                          key={subIdx}
                          className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]"
                        >
                          {subTreatment.name}
                          {typeof subTreatment.price === "number" &&
                            subTreatment.price > 0 && (
                              <>
                                {" "}
                                -{" "}
                                <span className="text-[#2D9AA5] font-semibold">
                                  د.إ{subTreatment.price}
                                </span>
                              </>
                            )}
                        </span>
                      ))}
                    </div>
                  )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pt-2.5 border-t border-gray-200">
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>
            Established{" "}
            {new Date(clinic.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
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
    if (!photoPath) return PLACEHOLDER_DATA_URI;
    if (photoPath.startsWith("http")) return photoPath;
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

  const addTreatment = async () => {
    const trimmed = newTreatment.trim();
    console.log("Adding custom treatment:", trimmed);
    console.log("Current treatments:", editForm.treatments);
    if (
      trimmed &&
      !editForm.treatments?.some((t) => t.mainTreatment === trimmed)
    ) {
      try {
        // Add to database if it's a custom treatment
        const token = localStorage.getItem("clinicToken");
        const response = await axios.post(
          "/api/doctor/add-custom-treatment",
          {
            mainTreatment: trimmed,
            subTreatments: [],
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.success) {
          // Refresh available treatments
          const treatmentsResponse = await axios.get(
            "/api/doctor/getTreatment"
          );
          setAvailableTreatments(treatmentsResponse.data.treatments || []);
        }
      } catch (error) {
        console.error("Error adding custom treatment to database:", error);
        // Continue with local addition even if database call fails
      }

      setEditForm((prev) => {
        const newTreatments = [
          ...(prev.treatments || []),
          {
            mainTreatment: trimmed,
            mainTreatmentSlug: trimmed.toLowerCase().replace(/\s+/g, "-"),
            subTreatments: [],
          },
        ];
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
    if (
      treatmentName &&
      !editForm.treatments?.some((t) => t.mainTreatment === treatmentName)
    ) {
      setEditForm((prev) => {
        const newTreatments = [
          ...(prev.treatments || []),
          {
            mainTreatment: treatmentName,
            mainTreatmentSlug: treatmentName.toLowerCase().replace(/\s+/g, "-"),
            subTreatments: [],
          },
        ];
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

  const handleUpdateTreatment = (
    index: number,
    updatedTreatment: {
      mainTreatment: string;
      mainTreatmentSlug: string;
      subTreatments: Array<{
        name: string;
        slug: string;
        price?: number;
      }>;
    }
  ) => {
    setEditForm((prev) => ({
      ...prev,
      treatments:
        prev.treatments?.map((treatment, i) =>
          i === index ? updatedTreatment : treatment
        ) || [],
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

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {isEditing ? (
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#2D9AA5] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Edit3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                      Edit Health Center
                    </h2>
                    <p className="text-gray-600 text-sm">
                      Update Health Center information
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCancel}
                  className="self-end sm:self-auto p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {/* Left Column */}
                <div className="space-y-4 sm:space-y-6">
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
                      <span className="flex items-center gap-2">
                        Address
                        {geocodingStatus && (
                          <span className="text-[#2D9AA5] text-xs font-medium px-2 py-1 bg-[#2D9AA5]/10 rounded">
                            {geocodingStatus}
                          </span>
                        )}
                      </span>
                    }
                    icon={<MapPin className="w-4 h-4" />}
                    value={editForm.address || ""}
                    onChange={handleAddressChangeWithGeocode}
                    type="textarea"
                    placeholder="Enter complete address with state, city and place"
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
                            fontSize="20"
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
                      placeholder="د.إ500 - د.إ2000"
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
                <div className="space-y-4 sm:space-y-6">
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
                    onUpdateTreatment={handleUpdateTreatment}
                    setAvailableTreatments={setAvailableTreatments}
                  />

                  {/* Photo Upload */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Camera className="w-4 h-4" />
                      Health Center Photo
                    </label>
                    <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-6 sm:p-8 text-center hover:border-[#2D9AA5]/50 hover:bg-[#2D9AA5]/5 transition-all">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            if (
                              file.type !== "image/png" &&
                              file.type !== "image/jpeg" &&
                              file.type !== "image/jpg"
                            ) {
                              setPhotoError("Please upload a PNG or JPG file");
                              setSelectedFile(null);
                            } else if (file.size > 1024 * 1024) {
                              setPhotoError(
                                "File is too large and you have to upload file less than 1MB"
                              );
                              setSelectedFile(null);
                            } else {
                              setSelectedFile(file);
                              setPhotoError("");
                            }
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="w-12 h-12 bg-[#2D9AA5]/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <Camera className="w-6 h-6 text-[#2D9AA5]" />
                      </div>
                      <p className="text-gray-700 font-medium mb-1">
                        Click to upload photo
                      </p>
                      <p className="text-gray-500 text-sm">
                        PNG, JPG up to 1MB
                      </p>
                      {selectedFile && (
                        <div className="mt-3 p-2 bg-[#2D9AA5]/10 rounded-lg">
                          <p className="text-[#2D9AA5] text-sm font-medium">
                            {selectedFile.name}
                          </p>
                        </div>
                      )}
                      {photoError && (
                        <div className="mt-3 p-2 bg-red-50 rounded-lg">
                          <p className="text-red-600 text-sm font-medium">
                            {photoError}
                          </p>
                        </div>
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
                  className="order-2 sm:order-1 px-6 py-3 bg-[#2D9AA5] text-white rounded-lg hover:bg-[#238891] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-colors"
                >
                  {updating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    "Update Health Center"
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  className="order-1 sm:order-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            {clinics.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-[#2D9AA5]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-[#2D9AA5]" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Clinics Found
                  </h3>
                  <p className="text-gray-600">
                    Start by adding your first clinic
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full space-y-6">
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
const ProtectedDashboard: NextPageWithLayout = withClinicAuth(
  ClinicManagementDashboard
);

// ✅ Reassign layout (TS-safe now)
ProtectedDashboard.getLayout = ClinicManagementDashboard.getLayout;

export default ProtectedDashboard;