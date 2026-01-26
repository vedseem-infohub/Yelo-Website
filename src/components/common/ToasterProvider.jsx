'use client';

import toast, { Toaster, ToastBar } from "react-hot-toast";
import { Check, X } from "lucide-react";

export default function ToasterProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 2000, // auto close in 2 sec
        style: {
          background: "#ffffff",
          color: "#111827",
          padding: "10px 14px",
          borderRadius: "10px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
          minWidth: "320px",
          border: "1px solid rgba(0,0,0,0.05)",
        },
      }}
    >
      {(t) => (
        <ToastBar toast={t}>
          {({ message }) => (
            <div
              className={`flex items-center gap-3 w-full transition-all duration-300 ${
                t.visible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-3"
              }`}
            >
              {/* Yellow Accent Strip */}
              <div className="w-1 h-8 rounded-full bg-yellow-400" />

              {/* Success Icon */}
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-400 text-black">
                <Check size={14} strokeWidth={3} />
              </div>

              {/* Message */}
              <div className="flex-1 text-sm font-semibold leading-snug">
                {message}
              </div>

              {/* Close (Optional, subtle) */}
              {t.type !== "loading" && (
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="p-1 rounded-full hover:bg-black/5 transition"
                  aria-label="Close notification"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
}
