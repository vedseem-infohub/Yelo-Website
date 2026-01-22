"use client";

import React, { useState, useEffect } from "react";
import { X, MapPin, Navigation, Loader2 } from "lucide-react";
import { getCurrentLocation, reverseGeocode } from "@/utils/geocoding";
import { userAPI } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";

export default function LocationModal({ isOpen, setIsOpen, onSave }) {
  const { backendUser, setBackendUser } = useAuth();
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    addressLine1: "",
    addressLine2: "",
    area: "",
    block: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    latitude: null,
    longitude: null,
    // Keep old address field for backward compatibility
    address: "",
  });

  // Load existing address if editing - refresh from backend to get latest data
  useEffect(() => {
    if (!isOpen) return; // Only run when modal is open
    
    const loadUserAddress = async () => {
      try {
        // Refresh user data from backend to ensure we have latest address details
        const { userAPI } = await import("@/utils/api");
        const response = await userAPI.getMe();
        
        if (response.success && response.user) {
          const user = response.user;
          
          // Update context with fresh data
          if (setBackendUser) {
            setBackendUser(user);
            localStorage.setItem("yelo_backend_user", JSON.stringify(user));
          }
          
          // Load form data from fresh user data
          setFormData({
            addressLine1: user.addressLine1 || "",
            addressLine2: user.addressLine2 || "",
            area: user.area || "",
            block: user.block || "",
            landmark: user.landmark || "",
            city: user.city || "",
            state: user.state || "",
            pincode: user.pincode || "",
            latitude: user.latitude || null,
            longitude: user.longitude || null,
            address: user.address || "",
          });
          
        } else if (backendUser) {
          // Fallback to use existing backendUser if refresh fails
          setFormData({
            addressLine1: backendUser.addressLine1 || "",
            addressLine2: backendUser.addressLine2 || "",
            area: backendUser.area || "",
            block: backendUser.block || "",
            landmark: backendUser.landmark || "",
            city: backendUser.city || "",
            state: backendUser.state || "",
            pincode: backendUser.pincode || "",
            latitude: backendUser.latitude || null,
            longitude: backendUser.longitude || null,
            address: backendUser.address || "",
          });
        } else {
          // Reset form when opening without user data
          setFormData({
            addressLine1: "",
            addressLine2: "",
            area: "",
            block: "",
            landmark: "",
            city: "",
            state: "",
            pincode: "",
            latitude: null,
            longitude: null,
            address: "",
          });
        }
      } catch (error) {
        // Fallback to use existing backendUser if API call fails
        if (backendUser) {
          setFormData({
            addressLine1: backendUser.addressLine1 || "",
            addressLine2: backendUser.addressLine2 || "",
            area: backendUser.area || "",
            block: backendUser.block || "",
            landmark: backendUser.landmark || "",
            city: backendUser.city || "",
            state: backendUser.state || "",
            pincode: backendUser.pincode || "",
            latitude: backendUser.latitude || null,
            longitude: backendUser.longitude || null,
            address: backendUser.address || "",
          });
        }
      }
    };

    loadUserAddress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // Only depend on isOpen - backendUser and setBackendUser are accessed from context and should be stable

  const handleUseCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      // First, reset ALL fields to empty/default values
      setFormData({
        addressLine1: "",
        addressLine2: "",
        area: "",
        block: "",
        landmark: "",
        city: "",
        state: "",
        pincode: "",
        latitude: null,
        longitude: null,
        address: "",
      });

      // Get current location
      const { latitude, longitude } = await getCurrentLocation();

      // Reverse geocode to get address
      const addressData = await reverseGeocode(latitude, longitude);

      // Map fields directly from response; if optional fields are missing, derive from fullAddress
      let addressLine1 = addressData.addressLine1 || addressData.address || "";
      let addressLine2 = addressData.addressLine2 || "";
      let area = addressData.area || "";
      const block = addressData.block || "";

      // Derive addressLine2/area from fullAddress when not provided
      if ((!addressLine2 || addressLine2.length < 3 || !area || area.length < 2) && addressData.fullAddress) {
        const parts = addressData.fullAddress.split(",").map((p) => p.trim());
        if (!addressLine1) {
          addressLine1 = parts[0] || "";
        }
        // Remove the first part (house no) and the last one (country)
        const middleParts = parts.slice(1, Math.max(1, parts.length - 2));
        if ((!addressLine2 || addressLine2.length < 3) && middleParts.length > 0) {
          addressLine2 = middleParts[0];
        }
        if ((!area || area.length < 2) && middleParts.length > 0) {
          // Pick the longest middle part as area
          area = middleParts.reduce((best, curr) => (curr.length > best.length ? curr : best), middleParts[0]);
        }
      }

      const extractedData = {
        addressLine1,
        addressLine2,
        area,
        block,
        landmark: "", // user-entered
        city: addressData.city || "",
        state: addressData.state || "",
        pincode: addressData.pincode || "",
        latitude,
        longitude,
        address: addressData.address || addressLine1 || "",
      };


      // Now set all fields with new data
      setFormData(extractedData);

      toast.success("Location detected!");
    } catch (error) {
      toast.error(error.message || "Failed to get location");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.city || !formData.state || !formData.pincode) {
      toast.error("Please fill city, state, and pincode");
      return;
    }
    
    // Require address line 1 (minimum 1 character)
    if (!formData.addressLine1 || formData.addressLine1.trim().length < 1) {
      toast.error("Please enter address line 1 (House/Flat No., Building Name)");
      return;
    }
    
    // Require address line 2 for better delivery accuracy
    if (!formData.addressLine2 || formData.addressLine2.trim().length < 1) {
      toast.error("Please enter address line 2 (Street name, Locality)");
      return;
    }
    
    // Require area for better delivery accuracy
    if (!formData.area || formData.area.trim().length < 1) {
      toast.error("Please enter area/locality");
      return;
    }
    
    // Block and landmark are optional - no validation needed

    setIsSaving(true);
    try {
      // Save to backend
      const response = await userAPI.updateAddress(formData);

      if (response.success) {
        
        // Update local user state and localStorage
        if (setBackendUser && response.user) {
          setBackendUser(response.user);
          localStorage.setItem("yelo_backend_user", JSON.stringify(response.user));
        }

        // Reset all form fields so saved location vanishes
        setFormData({
          addressLine1: "",
          addressLine2: "",
          area: "",
          block: "",
          landmark: "",
          city: "",
          state: "",
          pincode: "",
          latitude: null,
          longitude: null,
          address: "",
        });

        toast.success("Address saved successfully!");
        setIsOpen(false);

        // Call onSave callback if provided
        if (onSave) {
          onSave(response.user);
        }
      } else {
        throw new Error(response.message || "Failed to save address");
      }
    } catch (error) {
      toast.error(error.message || "Failed to save address");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-yellow-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Add Address</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Use Current Location Button */}
          <button
            onClick={handleUseCurrentLocation}
            disabled={isLoadingLocation}
            className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingLocation ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Detecting location...</span>
              </>
            ) : (
              <>
                <Navigation className="w-5 h-5" />
                <span>Use My Current Location</span>
              </>
            )}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">OR</span>
            </div>
          </div>

          {/* Manual Address Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 1 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.addressLine1}
                onChange={(e) => handleInputChange("addressLine1", e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 placeholder-gray-400"
                placeholder="House/Flat No., Building Name, Floor, Street Name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 2 (Street/Locality) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.addressLine2}
                onChange={(e) => handleInputChange("addressLine2", e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 placeholder-gray-400"
                placeholder="Street Name, Locality, Sector"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area/Locality <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.area}
                  onChange={(e) => handleInputChange("area", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 placeholder-gray-400"
                  placeholder="Area, Locality, Colony"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Block (Optional)
                </label>
                <input
                  type="text"
                  value={formData.block}
                  onChange={(e) => handleInputChange("block", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 placeholder-gray-400"
                  placeholder="Block"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Landmark / Additional Directions (Optional)
              </label>
              <input
                type="text"
                value={formData.landmark}
                onChange={(e) => handleInputChange("landmark", e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 placeholder-gray-400"
                placeholder="Near hospital, Opposite park, Behind mall, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 placeholder-gray-400"
                  placeholder="City"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 placeholder-gray-400"
                  placeholder="State"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pincode <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) => handleInputChange("pincode", e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 placeholder-gray-400"
                placeholder="Pincode"
                maxLength={6}
                required
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex gap-3">
          <button
            onClick={() => setIsOpen(false)}
            className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </span>
            ) : (
              "Save Address"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

