"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "@/firebase/config";
import { useLanguage } from "@/contexts/LanguageContext";
import EnhancedDropdown from "./EnhancedDropdown";
import ThirdPartyAutocompleteDropdown from "./ThirdPartyAutocompleteDropdown";
import SelectDropdown from "./SelectDropdown";

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
const getCategoryOptions = (t: (key: string) => string) => [
  { value: "Electrical", label: t("electrical"), icon: "💡" },
  { value: "Plumbing", label: t("plumbing"), icon: "🚰" },
  { value: "Cleaning", label: t("cleaning"), icon: "🧹" },
  { value: "Internet", label: t("internet"), icon: "🌐" },
  { value: "Security", label: t("security"), icon: "🔒" },
  { value: "Other", label: t("other"), icon: "❓" },
];

export default function ComplaintForm() {
  const { t, language } = useLanguage();
  // Import roomStore.json data
  const [roomData, setRoomData] = useState<RoomData[]>([]);
  const datePickerRef = useRef<HTMLInputElement>(null);
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

  // Get category options with translation, memoized to update on language change
  const categoryOptions = useMemo(() => getCategoryOptions(t), [t]);

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
    validateField("building", value);
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
        const response = await fetch("/ROOMSTORE.JSON");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: RoomData[] = await response.json();
        setRoomData(data);
      } catch {
        console.error("Error fetching room data");
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
    validateField("category", value);
  };

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    title: "",
    email: "",
    building: "",
    category: "",
    preferredDate: "",
    preferredTime: "",
    description: "",
  });
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"error" | "success">("error");

  const validateField = (name: string, value: string) => {
    const error = ""; // ✅ FIX: use const not let
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    validateField(name, value);
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

      // Validate all required fields
      const errors: Partial<typeof fieldErrors> = {};
      if (!formData.title) errors.title = "Please fill all fields before submitting.";
      if (!user.email) errors.email = "Please fill all fields before submitting.";
      if (!formData.building) errors.building = "Please fill all fields before submitting.";
      if (!formData.category) errors.category = "Please fill all fields before submitting.";
      if (!formData.preferredDate) errors.preferredDate = "Please fill all fields before submitting.";
      if (!formData.preferredTime) errors.preferredTime = "Please fill all fields before submitting.";
      if (!formData.description) errors.description = "Please fill all fields before submitting.";

      if (Object.keys(errors).length > 0) {
        setFieldErrors((prev) => ({ ...prev, ...errors }));
        setIsSubmitting(false);
        return;
      }

      // Check Firestore for existing complaint with same date and timeSlot
      const { query, where, getDocs } = await import("firebase/firestore");
      const q = query(
        collection(db, "complaints"),
        where("preferredDate", "==", formData.preferredDate),
        where("preferredTime", "==", formData.preferredTime)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setModalMessage("⚠️ Sorry, this time slot has already been booked. Please select another one.");
        setModalType("error");
        setShowModal(true);
        setIsSubmitting(false);
        return;
      }

      let imageUrl = "";
      if (selectedFile) {
        const imageRef = ref(storage, `complaints/${user.uid}/${Date.now()}_${selectedFile.name}`);
        await uploadBytes(imageRef, selectedFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      // Add complaint to Firestore
      const complaintRef = await addDoc(collection(db, "complaints"), {
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

      // Create notifications for all admins
      const { query: query2, where: where2, getDocs: getDocs2 } = await import("firebase/firestore");
      const adminQuery = query2(collection(db, "users"), where2("role", "==", "admin"));
      const adminsSnapshot = await getDocs2(adminQuery);
      adminsSnapshot.forEach(async (doc) => {
        await addDoc(collection(db, "notifications"), {
          userId: doc.id,
          message: `New complaint submitted: "${formData.title}" (${formData.category})`,
          complaintId: complaintRef.id,
          complaintTitle: formData.title,
          category: formData.category,
          createdAt: serverTimestamp(),
          read: false,
          updatedBy: "student",
        });
      });

      // Create notifications for all supervisors
      const supervisorQuery = query2(collection(db, "users"), where2("role", "==", "supervisor"));
      const supervisorsSnapshot = await getDocs2(supervisorQuery);
      supervisorsSnapshot.forEach(async (doc) => {
        await addDoc(collection(db, "notifications"), {
          userId: doc.id,
          message: `New complaint submitted: "${formData.title}" (${formData.category})`,
          complaintId: complaintRef.id,
          complaintTitle: formData.title,
          category: formData.category,
          createdAt: serverTimestamp(),
          read: false,
          updatedBy: "student",
        });
      });

      setModalMessage("✅ Complaint submitted successfully.");
      setModalType("success");
      setShowModal(true);
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
    } catch (error) {
      console.error("Error submitting complaint:", error);
      setSubmitMessage("Error submitting complaint. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-full md:max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">{t("submitComplaint")}</h2>
        <p className="text-gray-600 mb-6">
          {t("complaintDescription")}
        </p>
        {showModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-xl p-5 shadow-xl w-[350px] text-center" onClick={(e) => e.stopPropagation()}>
              <h2 className={`font-semibold text-lg mb-2 ${modalType === "success" ? "text-green-600" : "text-red-600"}`}>
                {modalType === "success" ? "Success" : "Error"}
              </h2>
              <p className="text-gray-700 mb-4">{modalMessage}</p>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-all duration-200"
              >
                OK
              </button>
            </div>
          </div>
        )}
        {submitMessage && (
          <div
            className={`mb-4 p-3 rounded-lg ${submitMessage.includes("successfully")
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
              }`}
          >
            {submitMessage}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("complaintTitle")} *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder={t("complaintTitlePlaceholder")}
              required
              className="w-full p-3 border border-gray-300 rounded-lg placeholder-gray-500 placeholder-opacity-100 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {fieldErrors.title && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.title}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("building")} *
            </label>
            <EnhancedDropdown
              value={formData.building}
              onChange={handleBuildingChange}
              options={buildingOptions}
              placeholder={t("selectBuilding")}
              required
              name="building"
            />
            {fieldErrors.building && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.building}</p>
            )}
          </div>
          {formData.building && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("room")} *
              </label>
              {roomOptions.length > 0 ? (
                <EnhancedDropdown
                  value={formData.room}
                  onChange={handleRoomChange}
                  options={roomOptions}
                  placeholder={t("selectRoom")}
                  required
                  name="room"
                />
              ) : (
                <p className="text-gray-500 text-sm italic">{t("noRoomsAvailable")}</p>
              )}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("detailedDescription")} *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder={t("descriptionPlaceholder")}
              rows={4}
              required
              className="w-full p-3 border border-gray-300 rounded-lg placeholder-gray-500 placeholder-opacity-100 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {fieldErrors.description && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("category")} *
            </label>
            <ThirdPartyAutocompleteDropdown
              value={formData.category}
              onChange={handleCategoryChange}
              options={categoryOptions}
              placeholder={t("selectCategory")}
              required
              name="category"
              language={language}
            />
            {fieldErrors.category && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.category}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("preferredDate")}
              </label>
              <div className="relative">
                <input
                  ref={datePickerRef}
                  type="date"
                  name="preferredDate"
                  value={formData.preferredDate}
                  onChange={handleInputChange}
                  onKeyDown={(e) => e.preventDefault()}
                  className="w-full p-3 pr-10 border border-gray-300 rounded-lg placeholder-gray-700 placeholder-opacity-100 text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                />
                <div
                  className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                  onClick={() => datePickerRef.current?.showPicker?.() || datePickerRef.current?.focus()}
                >
                  <svg
                    className="h-5 w-5 text-gray-400 hover:text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
              {fieldErrors.preferredDate && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.preferredDate}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("preferredTime")}
              </label>
              <SelectDropdown
                name="preferredTime"
                value={formData.preferredTime}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, preferredTime: value }))
                }
                options={[
                  { value: "09:00 AM - 10:00 AM", label: "09:00 AM - 10:00 AM" },
                  { value: "10:00 AM - 11:00 AM", label: "10:00 AM - 11:00 AM" },
                  { value: "11:00 AM - 12:00 PM", label: "11:00 AM - 12:00 PM" },
                  { value: "12:00 PM - 01:00 PM", label: "12:00 PM - 01:00 PM" },
                  { value: "01:00 PM - 02:00 PM", label: "01:00 PM - 02:00 PM" },
                  { value: "02:00 PM - 03:00 PM", label: "02:00 PM - 03:00 PM" },
                  { value: "03:00 PM - 04:00 PM", label: "03:00 PM - 04:00 PM" },
                  { value: "04:00 PM - 05:00 PM", label: "04:00 PM - 05:00 PM" },
                  { value: "05:00 PM - 06:00 PM", label: "05:00 PM - 06:00 PM" },
                ]}
                placeholder={t("selectTimeSlot")}
                required={false}
              />
              {fieldErrors.preferredTime && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.preferredTime}</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("uploadImage")}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full p-3 border border-gray-300 rounded-lg placeholder-gray-700 placeholder-opacity-100 text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-600">
                {t("selectedFile")}: {selectedFile.name}
              </p>
            )}
          </div>
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-6 rounded-lg text-white font-semibold transition-colors ${isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
                }`}
            >
              {isSubmitting ? t("submitting") : t("submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
