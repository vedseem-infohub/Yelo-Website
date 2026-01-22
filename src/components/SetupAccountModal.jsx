"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, User, Image as ImageIcon, Upload } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getApiUrl } from "@/utils/config";
import { compressImage } from "@/utils/convertApiCompression";
import LocationModal from "./LocationModal";

export default function SetupAccountModal({ isOpen, setIsOpen, initialData = null, isEditMode = false }) {
  const router = useRouter();
  const { backendUser, setBackendUser } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Load initial data when modal opens in edit mode
  useEffect(() => {
    if (isOpen && initialData) {
      setName(initialData.name || "");
      setEmail(initialData.email || "");
      setAvatar(initialData.avatar || "");
      setAvatarPreview(initialData.avatar || "");
    } else if (isOpen && !initialData) {
      // Reset for new profile
      setName("");
      setEmail("");
      setAvatar("");
      setAvatarPreview("");
    }
  }, [isOpen, initialData]);

  // Handle image file selection with compression
  const handleImageSelect = useCallback(async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setIsCompressing(true);
    
    try {
      // Compress image using ConvertAPI via backend
      const compressedDataUrl = await compressImage(file, 30); // Quality 30 for high compression
      setAvatar(compressedDataUrl);
      setAvatarPreview(compressedDataUrl);
      toast.success("Image compressed successfully");
    } catch (error) {
      toast.error("Error compressing image. Using original image.");
      // Fallback: read file as data URL without compression
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        setAvatar(result);
        setAvatarPreview(result);
      };
      reader.onerror = () => {
        toast.error("Error reading image file");
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressing(false);
    }
  }, []);

  // Handle file input change
  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  // Remove avatar
  const handleRemoveAvatar = () => {
    setAvatar("");
    setAvatarPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("yelo_token");
      if (!token) {
        throw new Error("Unauthorized");
      }

      const apiUrl = getApiUrl();
      const res = await fetch(
        `${apiUrl}/users/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            email,
            avatar,
          }),
        }
      );

      // Check if response has content before parsing JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(text || `Server error: ${res.status} ${res.statusText}`);
      }

      const text = await res.text();
      if (!text || text.trim() === "") {
        throw new Error(`Empty response from server: ${res.status}`);
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
      }

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update profile");
      }

      // Update backendUser in context and localStorage
      if (setBackendUser) {
        setBackendUser(data.user);
        localStorage.setItem("yelo_backend_user", JSON.stringify(data.user));
      }

      toast.success(isEditMode ? "Profile updated successfully!" : "Profile completed successfully!");
      
      // Check if user has address
      const hasAddress = data.user?.address && data.user?.city && data.user?.state && data.user?.pincode;
      
      // Close modal
      setIsOpen(false);
      
      if (!isEditMode) {
        // If no address, show location modal; otherwise go to account page
        if (!hasAddress) {
          setShowLocationModal(true);
        } else {
          router.push("/account");
        }
      }
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl relative animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <div className="px-6 pt-8 pb-8">
          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 rounded-full bg-yellow-500 flex items-center justify-center mb-3">
              <User className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              {isEditMode ? "Edit Your Profile" : "Complete Your Profile"}
            </h1>
            <p className="text-sm text-gray-500 text-center mt-1">
              {isEditMode ? "Update your profile information" : "Just a few details to get started"}
            </p>
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Profile Image Upload - COMMENTED OUT */}
            {/* <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Profile Picture (optional)
              </label>
              
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative border-2 border-dashed rounded-2xl p-4 cursor-pointer transition-all
                  ${isDragging 
                    ? "border-yellow-400 bg-yellow-50" 
                    : "border-gray-300 hover:border-yellow-400 hover:bg-gray-50"
                  }
                `}
              >
                {avatarPreview ? (
                  <div className="relative">
                    <img
                      src={avatarPreview}
                      alt="Profile preview"
                      className="w-full h-40 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveAvatar();
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-4">
                    {isCompressing ? (
                      <>
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                          <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                        <p className="text-xs font-medium text-gray-700 mb-1">
                          Compressing image...
                        </p>
                        <p className="text-xs text-gray-500">
                          Please wait while we optimize your image
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-xs font-medium text-gray-700 mb-1">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG up to 5MB
                        </p>
                      </>
                    )}
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>

              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2 text-center">OR</p>
                <input
                  type="text"
                  value={avatar.startsWith("data:") ? "" : avatar}
                  onChange={(e) => {
                    setAvatar(e.target.value);
                    setAvatarPreview(e.target.value || "");
                  }}
                  placeholder="Enter image URL"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent placeholder-gray-400"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            */}


            {/* Name (Required) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-gray-400"
                required
              />
            </div>

            {/* Email (Optional) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-gray-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isEditMode ? "Updating..." : "Saving..."}
                </span>
              ) : (
                isEditMode ? "Update Profile" : "Continue"
              )}
            </button>
          </form>
        </div>
      </div>
      
      {/* Location Modal - shown after profile completion if no address */}
      <LocationModal
        isOpen={showLocationModal}
        setIsOpen={(value) => {
          setShowLocationModal(value);
          if (!value) {
            router.push("/account");
          }
        }}
        onSave={(user) => {
          setTimeout(() => {
            router.push("/account");
          }, 500);
        }}
      />
    </div>
  );
}
