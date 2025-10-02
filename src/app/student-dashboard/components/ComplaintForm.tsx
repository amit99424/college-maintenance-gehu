"use client";

import { useState, useRef, useEffect } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "@/firebase/config";
import EnhancedDropdown from "./EnhancedDropdown";
import ThirdPartyAutocompleteDropdown from "./ThirdPartyAutocompleteDropdown";

interface RoomData {
  "Building Name"?: string;
  "Room No."?: string;
  "Room No"?: string;
  "Lab/Room Name"?: string;
  "Hostel"?: string;
  "Floor/Block"?: string;
  "Room Type"?: string;
}

// Category icons (replace with your preferred set or SVGs)
const CATEGORY_OPTIONS = [
  { value: "Electrical", label: "Electrical", icon: "💡" },
  { value: "Plumbing", label: "Plumbing", icon: "🚰" },
  { value: "Cleaning", label: "Cleaning", icon: "🧹" },
  { value: "Internet", label: "Internet", icon: "🌐" },
  { value: "Security", label: "Security", icon: "🔒" },
  { value: "Other", label: "Other", icon: "❓" },
];

// Custom Dropdown component for category selection
interface CategoryOption {
  value: string;
  label: string;
  icon: string;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: CategoryOption[];
  placeholder: string;
  required?: boolean;
}

function CustomDropdown({ value, onChange, options, placeholder, required }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOption = options.find((opt: CategoryOption) => opt.value === value);

  const toggleDropdown = () => setIsOpen((prev) => !prev);

  const handleOptionClick = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full p-3 border border-gray-300 rounded-lg text-left focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          required && !value ? "border-red-500" : ""
        }`}
      >
        {selectedOption ? (
          <span className="text-gray-700">
            <span className="mr-2">{selectedOption.icon}</span>
            {selectedOption.label}
          </span>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
      </button>
      {isOpen && (
        <ul
          tabIndex={-1}
          role="listbox"
          aria-activedescendant={value}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm border border-gray-300"
          style={{ boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}
        >
          {options.map((option) => (
            <li
              key={option.value}
              id={option.value}
              role="option"
              aria-selected={value === option.value}
              onClick={() => handleOptionClick(option.value)}
              className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-600 hover:text-white ${
                value === option.value ? "font-semibold bg-blue-600 text-white" : "text-gray-900"
              }`}
            >
              <span className="flex items-center">
                <span className="mr-2">{option.icon}</span>
                {option.label}
              </span>
            </li>
          ))}
        </ul>
      )}
      {/* Hidden input for form validation */}
      <input type="hidden" name="category" value={value} required={required} />
    </div>
  );
}

export default function ComplaintForm() {
  // Import roomStore.json data
  const [roomData, setRoomData] = useState<RoomData[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    building: "",
    room: "",
    description: "",
    category: "",
    preferredDate: "",
    preferredTime: "",
  });

  // Extract unique building names from roomData with trimming
  const buildingOptions = Array.from(
    new Set(roomData.map((item) => (item["Building Name"] || item["Hostel"] || "").trim()))
  )
    .filter((b) => b !== "")
    .map((b) => ({ value: b, label: b, icon: "🏢" }));

  // Filter rooms based on selected building or hostel with trimming
  const isHostel = roomData.some((item) => (item["Hostel"] || "").trim() === formData.building.trim());

  const filteredRooms = roomData.filter((item) =>
    isHostel
      ? (item["Hostel"] || "").trim() === formData.building.trim()
      : (item["Building Name"] || "").trim() === formData.building.trim()
  );

  const roomOptions = filteredRooms
    .filter((item) => (item["Room No."] || item["Room No"]) !== undefined)
    .map((item) => {
      const roomNo = item["Room No."] || item["Room No"] || "";
      let labelSuffix = "";
      if (isHostel) {
        labelSuffix = item["Floor/Block"] ? ` - ${item["Floor/Block"]}` : "";
      } else {
        labelSuffix = item["Lab/Room Name"] ? ` - ${item["Lab/Room Name"]}` : "";
      }
      return {
        value: roomNo,
        label: `${roomNo}${labelSuffix}`,
        icon: "🚪",
      };
    });

  const handleBuildingChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      building: value,
      room: "", // reset room when building changes
    }));
  };

  const handleRoomChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      room: value,
    }));
  };

  // Fetch roomStore.json data on component mount
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await fetch('/ROOMSTORE.JSON');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: RoomData[] = await response.json();
        setRoomData(data);
      } catch (error) {
        console.error('Error fetching room data:', error);
        setRoomData([]); // clear room data on error
      }
    };
    fetchRoomData();
  }, []);

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      category: value,
    }));
  };
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      let imageUrl = "";
      if (selectedFile) {
        const imageRef = ref(storage, `complaints/${user.uid}/${Date.now()}_${selectedFile.name}`);
        await uploadBytes(imageRef, selectedFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      // Add complaint to Firestore
      await addDoc(collection(db, "complaints"), {
        title: formData.title,
        building: formData.building,
        room: formData.room,
        description: formData.description,
        category: formData.category,
        preferredDate: formData.preferredDate,
        preferredTime: formData.preferredTime,
        userId: user.uid,
        userEmail: user.email,
        status: "pending",
        imageUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSubmitMessage("Complaint submitted successfully!");
      setFormData({
        title: "",
        building: "",
        room: "",
        description: "",
        category: "",
        preferredDate: "",
        preferredTime: "",
      });
      setSelectedFile(null);

      setTimeout(() => setSubmitMessage(""), 3000);
    } catch (error) {
      console.error("Error submitting complaint:", error);
      setSubmitMessage("Error submitting complaint. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Submit New Complaint</h2>
        <p className="text-gray-600 mb-6">
          Please provide detailed information about your maintenance request to help us assist you better.
        </p>
        {submitMessage && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              submitMessage.includes("successfully")
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {submitMessage}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Complaint Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Brief description of the issue..."
              required
              className="w-full p-3 border border-gray-300 rounded-lg placeholder-gray-500 placeholder-opacity-100 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Building *
            </label>
            <EnhancedDropdown
              value={formData.building}
              onChange={handleBuildingChange}
              options={buildingOptions}
              placeholder="Select or type a building"
              required
              name="building"
            />
          </div>
          {formData.building && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room *
              </label>
              <EnhancedDropdown
                value={formData.room}
                onChange={handleRoomChange}
                options={roomOptions}
                placeholder="Select or type a room"
                required
                name="room"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detailed Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Please provide a detailed description of the problem.."
              rows={4}
              required
              className="w-full p-3 border border-gray-300 rounded-lg placeholder-gray-500 placeholder-opacity-100 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-xs text-gray-500 mt-1 block">
              The more details you provide, the faster we can resolve your issue.
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <ThirdPartyAutocompleteDropdown
              value={formData.category}
              onChange={handleCategoryChange}
              options={CATEGORY_OPTIONS}
              placeholder="Select or type a category"
              required
              name="category"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Date
              </label>
              <input
                type="date"
                name="preferredDate"
                value={formData.preferredDate}
                onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg placeholder-gray-700 placeholder-opacity-100 text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Time
              </label>
              <input
                type="time"
                name="preferredTime"
                value={formData.preferredTime}
                onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg placeholder-gray-700 placeholder-opacity-100 text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Image (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full p-3 border border-gray-300 rounded-lg placeholder-gray-700 placeholder-opacity-100 text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {selectedFile.name}
              </p>
            )}
          </div>
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-6 rounded-lg text-white font-semibold transition-colors ${
                isSubmitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? "Submitting..." : "Submit Complaint"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
