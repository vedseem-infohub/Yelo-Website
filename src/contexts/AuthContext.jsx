"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getApiUrl } from "@/utils/config";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [backendUser, setBackendUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore user session from localStorage on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = localStorage.getItem("yelo_token");
        const savedUser = localStorage.getItem("yelo_backend_user");
        
        if (token && savedUser) {
          try {
            const user = JSON.parse(savedUser);
            setBackendUser(user);
            
            // Verify token is still valid by checking backend
            const apiUrl = getApiUrl();
            const res = await fetch(`${apiUrl}/users/me`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            
            if (res.ok) {
              const data = await res.json();
              if (data.success && data.user) {
                setBackendUser(data.user);
                localStorage.setItem("yelo_backend_user", JSON.stringify(data.user));
              }
            } else {
              // Token invalid, clear everything
              localStorage.removeItem("yelo_token");
              localStorage.removeItem("yelo_backend_user");
              setBackendUser(null);
            }
          } catch (e) {
            localStorage.removeItem("yelo_token");
            localStorage.removeItem("yelo_backend_user");
          }
        }
      } catch (error) {
        console.error("Session restoration error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    restoreSession();
  }, []);

  const sendOtp = async (phoneNumber) => {
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/auth/request-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phoneNumber }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to send OTP");
    }
    return data;
  };

  const verifyOtp = async (phoneNumber, code) => {
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phoneNumber, code }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Invalid OTP");
    }

    localStorage.setItem("yelo_token", data.token);
    localStorage.setItem("yelo_backend_user", JSON.stringify(data.user));
    setBackendUser(data.user);

    return data; // Returns { token, user, isProfileComplete }
  };

  const logout = async () => {
    localStorage.removeItem("yelo_token");
    localStorage.removeItem("yelo_backend_user");
    setBackendUser(null);
  };

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  // Automatically open login modal on mount if not logged in
  useEffect(() => {
    if (!loading && !backendUser) {
      // Use localStorage to persist dismissal across refreshes as requested
      const hasShownInitial = localStorage.getItem("hasShownInitialLogin");
      if (!hasShownInitial) {
        openLoginModal();
        localStorage.setItem("hasShownInitialLogin", "true");
      }
    }
  }, [loading, backendUser]);

  return (
    <AuthContext.Provider
      value={{
        backendUser,
        setBackendUser,
        loading,
        sendOtp,
        verifyOtp,
        logout,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

