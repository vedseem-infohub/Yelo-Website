"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Package,
  Heart,
  MapPin,
  CreditCard,
  Settings,
  LogOut,
  Edit,
} from "lucide-react";
import Link from "next/link";
import MobileBottomNav from "@/components/navigation/MobileBottomNav";
import PageWrapper from "@/components/common/PageWrapper";
import { useAuth } from "@/contexts/AuthContext";
import SetupAccountModal from "@/components/SetupAccountModal";
import LocationModal from "@/components/LocationModal";
import { orderAPI } from "@/utils/api";

const accountMenuItems = [
  { icon: Package, label: "My Orders", href: "/orders" },
  { icon: Heart, label: "Wishlist", href: "/wishlist" },
  { icon: MapPin, label: "Addresses", href: "/addresses" },
  { icon: CreditCard, label: "Payment Methods", href: "/payments" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export default function AccountPage() {
  const router = useRouter();
  const { backendUser, setBackendUser, logout, loading } = useAuth();
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Only show setup modal if profile is incomplete AND it's a new signup
  // Don't show on refresh if profile is already complete
  useEffect(() => {
    // Check if this is a new signup (user just completed OTP)
    const isNewSignup = sessionStorage.getItem("isNewSignup") === "true";
    
    if (!loading && backendUser && !backendUser.isProfileComplete && isNewSignup) {
      setShowSetupModal(true);
      // Clear the flag so it doesn't show again on refresh
      sessionStorage.removeItem("isNewSignup");
    }
  }, [backendUser, loading]);

  // Fetch recent orders (only upcoming/remaining orders, not completed)
  useEffect(() => {
    const fetchRecentOrders = async () => {
      if (!backendUser || loading) {
        setOrdersLoading(false);
        return;
      }

      try {
        setOrdersLoading(true);
        const response = await orderAPI.getRemaining();
        if (response.success) {
          // Get last 3 remaining orders (not completed)
          setRecentOrders(response.data?.slice(0, 3) || []);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchRecentOrders();
  }, [backendUser, loading]);

  // Redirect if no user
  useEffect(() => {
    if (!loading && !backendUser) {
      router.push("/");
    }
  }, [backendUser, loading, router]);

  // Show loading or while redirecting
  if (loading || !backendUser) {
    return (
      <PageWrapper>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </PageWrapper>
    );
  }


  return (
    <PageWrapper>
      <div className="min-h-screen bg-white pb-24 md:pb-8">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 md:hidden">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">My Account</h1>
            <div className="w-10"></div>
          </div>
        </div>

        {/* Profile */}
        <div className="px-4 py-6">
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-3xl p-6 mb-6 shadow-premium relative">
            <button
              onClick={() => {
                setIsEditMode(true);
                setShowSetupModal(true);
              }}
              className="absolute top-4 right-4 p-2 bg-white hover:bg-gray-50 rounded-full shadow-md transition-colors"
            >
              <Edit className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center">
                {backendUser.avatar ? (
                  <img
                    src={backendUser.avatar}
                    className="w-full h-full rounded-full object-cover"
                    alt="Profile"
                  />
                ) : (
                  <User className="w-10 h-10 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {backendUser.name || "User"}
                </h2>
                <p className="text-gray-600 text-sm">
                  {backendUser.email || "No email added"}
                </p>
                <p className="text-gray-600 text-sm">
                  {backendUser.phone}
                </p>
              </div>
            </div>
          </div>

          {/* Saved Address Section */}
          <div className="bg-white rounded-2xl p-6 mb-6 border-2 border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Saved Address</h3>
              </div>
              <button
                onClick={() => setShowLocationModal(true)}
                className="px-4 py-2 text-sm font-semibold text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
              >
                {(backendUser?.addressLine1 || backendUser?.address) ? "Edit" : "Add"}
              </button>
            </div>
            
            {backendUser?.city && backendUser?.state && backendUser?.pincode ? (
              <div className="space-y-1 text-gray-700">
                {/* Full Name */}
                {(backendUser.fullName || backendUser.name) && (
                  <p className="font-semibold text-gray-900">{backendUser.fullName || backendUser.name}</p>
                )}
                
                {/* Phone */}
                {backendUser.phone && (
                  <p className="text-sm text-gray-600">Phone: {backendUser.phone}</p>
                )}
                
                {/* Address Line 1 */}
                {backendUser.addressLine1 && (
                  <p className="text-sm text-gray-700">{backendUser.addressLine1}</p>
                )}
                
                {/* Address Line 2 */}
                {backendUser.addressLine2 && (
                  <p className="text-sm text-gray-700">{backendUser.addressLine2}</p>
                )}
                
                {/* Area and Block */}
                {(backendUser.area || backendUser.block) && (
                  <p className="text-sm text-gray-700">
                    {[backendUser.area, backendUser.block].filter(Boolean).join(', ')}
                  </p>
                )}
                
                {/* Landmark */}
                {backendUser.landmark && (
                  <p className="text-sm text-gray-600">Landmark: {backendUser.landmark}</p>
                )}
                
                {/* City, State, Pincode */}
                <p className="text-sm text-gray-700">
                  {backendUser.city}, {backendUser.state} - {backendUser.pincode}
                </p>
                
                {/* Fallback to old address format if new fields not available */}
                {!backendUser.addressLine1 && backendUser.address && (
                  <p className="text-sm text-gray-700">{backendUser.address}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No address saved yet. Click "Add" to add your address.</p>
            )}
          </div>

          {/* Recent Orders - Only show if there are upcoming orders */}
          {recentOrders.length > 0 && (
            <div className="bg-white rounded-2xl p-6 mb-6 border-2 border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Upcoming Orders</h3>
                </div>
                <Link
                  href="/orders"
                  className="text-sm font-semibold text-yellow-600 hover:text-yellow-700"
                >
                  View All
                </Link>
              </div>
              
              {ordersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => {
                    const orderDate = new Date(order.createdAt || order.dateAdded);
                    const formattedDate = orderDate.toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric'
                    });

                    return (
                      <Link
                        key={order._id || order.id}
                        href={`/orders/${order._id || order.id}`}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">
                            Order #{order._id?.toString().slice(-8) || order.id}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formattedDate} • ₹{order.totalAmount || order.total || 0}
                          </p>
                          <p className="text-xs text-gray-600 mt-1 capitalize">
                            {order.orderStatus?.toLowerCase() || 'Placed'}
                          </p>
                        </div>
                        <span className="text-gray-400">→</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Menu */}
          <div className="space-y-2">
            {accountMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-4 p-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-yellow-300 transition"
                >
                  <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-yellow-600" />
                  </div>
                  <span className="flex-1 font-semibold text-gray-900">
                    {item.label}
                  </span>
                  <span className="text-gray-400">→</span>
                </Link>
              );
            })}
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full mt-6 flex items-center justify-center gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl hover:bg-red-100"
          >
            <LogOut className="w-5 h-5 text-red-600" />
            <span className="font-semibold text-red-600">Logout</span>
          </button>
        </div>

        <MobileBottomNav />
      </div>
      
      {/* Setup Account Modal - shown when profile is incomplete or editing */}
      <SetupAccountModal 
        isOpen={showSetupModal} 
        setIsOpen={(value) => {
          setShowSetupModal(value);
          setIsEditMode(false);
        }}
        initialData={isEditMode ? backendUser : null}
        isEditMode={isEditMode}
      />
      
      {/* Location Modal for editing address */}
      <LocationModal
        isOpen={showLocationModal}
        setIsOpen={setShowLocationModal}
        onSave={async (updatedUser) => {
          // Refresh user data from backend to ensure we have latest address with all fields
          try {
            const { userAPI } = await import("@/utils/api");
            const response = await userAPI.getMe();
            if (response.success && response.user) {
              setBackendUser(response.user);
              localStorage.setItem("yelo_backend_user", JSON.stringify(response.user));
            } else if (updatedUser) {
              // Fallback to use the updated user from callback
              setBackendUser(updatedUser);
              localStorage.setItem("yelo_backend_user", JSON.stringify(updatedUser));
            }
          } catch (error) {
            console.error("Error refreshing user data:", error);
            // Fallback to use the updated user from callback
            if (updatedUser) {
              setBackendUser(updatedUser);
              localStorage.setItem("yelo_backend_user", JSON.stringify(updatedUser));
            }
          }
        }}
      />
    </PageWrapper>
  );
}
