"use client";

import { useState, useRef } from "react";
import { X, Phone, Shield, ArrowRight } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import SetupAccountModal_mail from "./SetupAccountModal_mail";
import LocationModal from "./LocationModal";

export default function LoginModal({ isOpen, setIsOpen }) {
  const router = useRouter();
  const { sendOtp, verifyOtp, backendUser, setBackendUser } = useAuth();


  const [step, setStep] = useState("PHONE");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const otpLock = useRef(false);

  // Allow closing modal
  const handleClose = () => {
    setIsOpen(false);
  };


  if (!isOpen) return null;

  /* SEND OTP */
  const handleSendOtp = async () => {
    if (loading || otpLock.current) return;

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      toast.error("Enter valid 10-digit mobile number");
      return;
    }

    try {
      otpLock.current = true;
      setLoading(true);

      const formattedPhone = `+91${cleanPhone}`;
      setPhone(formattedPhone);

      // Show initial feedback
      toast.loading("Sending OTP... Please complete reCAPTCHA if shown.", {
        id: "sending-otp",
        duration: 10000,
      });

      await sendOtp(formattedPhone);


      // Dismiss loading toast and show success
      toast.dismiss("sending-otp");
      toast.success("OTP sent successfully! Check your messages.");
      setStep("OTP");
    } catch (err) {
      console.error(err);
      
      // Dismiss loading toast
      toast.dismiss("sending-otp");
      
      // Show specific error messages
      if (err.code === "auth/too-many-requests") {
        toast.error("Too many requests. Please wait 15-30 minutes or try a different number.");
      } else if (err.code === "auth/invalid-app-credential") {
        toast.error("Configuration error. Please contact support.");
      } else if (err.message?.includes("timed out")) {
        toast.error("Request timed out. Please try again.");
      } else {
        toast.error(err.message || "Failed to send OTP. Please try again.");
      }
      
      otpLock.current = false;
    } finally {
      setLoading(false);
    }
  };

  /* VERIFY OTP */
  const handleVerifyOtp = async () => {
    if (loading) return;

    if (otp.length !== 6) {
      toast.error("Enter valid 6-digit OTP");
      return;
    }

    try {
      setLoading(true);

      // Verify OTP with Backend (Twilio)
      const data = await verifyOtp(phone, otp);

      toast.success("Login successful!");

      // Check if user has address
      const hasAddress = data.user?.address && data.user?.city && data.user?.state && data.user?.pincode;

      // If profile is complete
      if (data.isProfileComplete) {
        setIsOpen(false);
        // If no address, show location modal first
        if (!hasAddress) {
          setShowLocationModal(true);
        } else {
          router.push("/account");
        }
      } else {
        // If profile incomplete, mark as new signup and show setup modal immediately
        sessionStorage.setItem("isNewSignup", "true");
        setIsOpen(false);
        setShowSetupModal(true);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl relative animate-slide-up">
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>


        {/* Header */}
        <div className="px-6 pt-8 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {step === "PHONE" ? "Welcome Back" : "Verify OTP"}
              </h2>
              <p className="text-sm text-gray-500">
                {step === "PHONE"
                  ? "Enter your phone number to continue"
                  : `OTP sent to ${phone}`}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-8">
          {step === "PHONE" && (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-500 font-medium">+91</span>
                  </div>
                  <input
                    type="tel"
                    placeholder="Enter 10-digit number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 pl-20 py-3.5 text-black focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 transition-all"
                    maxLength={10}
                  />
                </div>
              </div>

              <button
                onClick={handleSendOtp}
                disabled={loading || phone.length !== 10}
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-semibold py-3.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Send OTP</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                By continuing, you agree to our Terms & Conditions
              </p>
            </>
          )}

          {step === "OTP" && (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter 6-digit OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 text-center text-2xl tracking-widest text-black focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 transition-all"
                  placeholder="000000"
                  autoFocus
                />
                <p className="text-xs text-gray-500 text-center mt-2">
                  Didn't receive? Check your messages
                </p>
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-semibold py-3.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify OTP</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setStep("PHONE");
                  setOtp("");
                  otpLock.current = false;
                }}
                className="w-full text-sm text-gray-600 mt-4 hover:text-gray-900 transition-colors"
              >
                ← Change phone number
              </button>
            </>
          )}
        </div>
      </div>
      </div>
      
      {/* Setup Account Modal (email+phone flow) */}
      <SetupAccountModal_mail 
        isOpen={showSetupModal} 
        setIsOpen={setShowSetupModal} 
      />
      
      {/* Location Modal - shown after login if no address */}
      <LocationModal
        isOpen={showLocationModal}
        setIsOpen={(value) => {
          setShowLocationModal(value);
          if (!value) {
            // If modal closed and address was saved, redirect to account
            router.push("/account");
          }
        }}
        onSave={(user) => {
          // After saving address, redirect to account page
          setTimeout(() => {
            router.push("/account");
          }, 500);
        }}
      />
    </>
  );
}
