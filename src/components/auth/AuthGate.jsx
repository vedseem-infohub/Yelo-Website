// components/auth/AuthGate.jsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import LoginModal from "@/components/LoginModal";

export default function AuthGate() {
  const { backendUser, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // Check localStorage immediately on mount (before auth loads)
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const token = localStorage.getItem("yelo_token");
    const savedUser = localStorage.getItem("yelo_backend_user");
    
    // If we have saved login data, don't show login modal
    if (token && savedUser) {
      setShowLogin(false);
      setHasChecked(true);
    }
  }, []);

  // 60-second countdown timer before showing login modal
  useEffect(() => {
    // Wait for auth context to finish initializing
    if (loading) return;
    
    // Check localStorage on client side only
    if (typeof window === "undefined") return;
    
    // Check if user is logged in (either from context or localStorage)
    const token = localStorage.getItem("yelo_token");
    const savedUser = localStorage.getItem("yelo_backend_user");
    
    // If user logs in during countdown, stop countdown and hide modal
    if (backendUser || (token && savedUser)) {
      setShowLogin(false);
      setHasChecked(true);
      setCountdown(60); // Reset countdown
      return;
    }
    
    // If already checked and user is not logged in, don't restart timer
    if (hasChecked) return;
    
    // User is not logged in - start 60-second countdown
    setHasChecked(true);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        // Check again if user logged in during countdown
        const currentToken = localStorage.getItem("yelo_token");
        const currentSavedUser = localStorage.getItem("yelo_backend_user");
        if (backendUser || (currentToken && currentSavedUser)) {
          clearInterval(timer);
          setShowLogin(false);
          return 60;
        }
        
        if (prev <= 1) {
          clearInterval(timer);
          setShowLogin(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, backendUser, hasChecked]);

  // Don't render if user is logged in (check both context and localStorage)
  if (backendUser) {
    return null;
  }

  // Check localStorage as final fallback before rendering
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("yelo_token");
    const savedUser = localStorage.getItem("yelo_backend_user");
    if (token && savedUser) {
      return null;
    }
  }

  // Only show login modal if we've checked, countdown finished, and user is definitely not logged in
  return (
    <>
      {hasChecked && !backendUser && countdown > 0 && (
        <div className="fixed bottom-4 right-4 z-40 bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg shadow-lg font-semibold text-sm">
          Login prompt in {countdown}s
        </div>
      )}
      <LoginModal
        isOpen={showLogin && hasChecked && countdown === 0}
        setIsOpen={setShowLogin}
      />
    </>
  );
}
