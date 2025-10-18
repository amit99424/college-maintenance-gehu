"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { storage, db, auth } from "@/firebase/config";

interface UserData {
  name?: string;
  email?: string;
  role?: string;
  profileImage?: string;
  dob?: string;
  category?: string;
  contact?: string;
  uid?: string;
}

interface ProfileProps {
  userData: UserData;
}

export default function Profile({ userData }: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: userData?.name || "",
    dob: userData?.dob || "",
  });
  const [profileImage, setProfileImage] = useState(userData?.profileImage || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not provided";
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
  };

  const handleImageUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const imageRef = ref(storage, `profile-images/${user.uid}/${Date.now()}_${selectedFile.name}`);
      await uploadBytes(imageRef, selectedFile);
      const imageUrl = await getDownloadURL(imageRef);

      setProfileImage(imageUrl);
      setMessage("Profile image updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error uploading image:", error);
      setMessage("Error uploading image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("");
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { ...profileData, profileImage, updatedAt: new Date() });

      // Update localStorage
      const updatedUserData = { ...userData, ...profileData, profileImage };
      localStorage.setItem("userData", JSON.stringify(updatedUserData));

      setIsEditing(false);
      setMessage("Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("Error updating profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setProfileData({
      name: userData?.name || "",
      dob: userData?.dob || "",
    });
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Profile Information</h2>

        {message && (
          <div className={`mb-4 p-3 rounded-lg ${message.includes("successfully") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {message}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile Image Section */}
          <div className="md:w-1/3 text-center">
            <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt="Profile"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-4xl text-gray-500">👤</span>
              )}
            </div>

            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

            <div className="space-y-2">
              <button onClick={() => fileInputRef.current?.click()} className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                Choose Image
              </button>
              {selectedFile && (
                <button
                  onClick={handleImageUpload}
                  disabled={isUploading}
                  className={`w-full px-4 py-2 rounded-lg text-white font-medium transition-colors ${isUploading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
                >
                  {isUploading ? "Uploading..." : "Upload Image"}
                </button>
              )}
            </div>
          </div>

          {/* Profile Information Section */}
          <div className="md:w-2/3 space-y-4">
            {[
              { label: "Full Name", name: "name", value: profileData.name },
              { label: "Date of Birth", name: "dob", value: profileData.dob },
            ].map(field => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
                {isEditing ? (
                  <input
                    type={field.name === "dob" ? "date" : "text"}
                    name={field.name}
                    value={field.value}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                ) : (
                  <p className="p-3 bg-gray-50 rounded-lg text-black">
                    {field.name === "dob" ? formatDate(field.value) : (field.value || "Not provided")}
                  </p>
                )}
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <p className="p-3 bg-gray-50 rounded-lg text-gray-800">{userData?.category || "Not provided"}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <p className="p-3 bg-gray-50 rounded-lg text-gray-800">{userData?.email || "Not provided"}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <p className="p-3 bg-gray-50 rounded-lg text-gray-800 capitalize">{userData?.role || "Not provided"}</p>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex space-x-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`px-6 py-2 rounded-lg text-white font-medium transition-colors ${isSaving ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                  <button onClick={handleCancel} className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors">
                    Cancel
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditing(true)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
