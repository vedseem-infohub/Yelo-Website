"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
} from "firebase/auth";
import { auth } from "@/utils/firebase";
import { getApiUrl } from "@/utils/config";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [backendUser, setBackendUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const verifierRef = useRef(null);

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
            
            // Verify token is still valid by checking Firebase auth state
            // Firebase auth state will be set by onAuthStateChanged below
          } catch (e) {
            localStorage.removeItem("yelo_token");
            localStorage.removeItem("yelo_backend_user");
          }
        }
      } catch (error) {
      }
    };
    
    restoreSession();
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      
      // If Firebase user exists and we have a token, verify backend session
      if (user && localStorage.getItem("yelo_token")) {
        try {
          // Try to get user data from backend to verify token
          const apiUrl = getApiUrl();
          const token = localStorage.getItem("yelo_token");
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
        } catch (error) {
          console.error("Error verifying session:", error);
          // Keep existing user if verification fails (network error, etc.)
        }
      } else if (!user) {
        // No Firebase user, clear backend user
        setBackendUser(null);
        localStorage.removeItem("yelo_token");
        localStorage.removeItem("yelo_backend_user");
      }
      
      setLoading(false);
    });
    return unsub;
  }, []);

  // ✅ Create reCAPTCHA verifier on-demand (not in useEffect)
  const sendOtp = async (phoneNumber) => {
    // Clean up any existing verifier first
    if (verifierRef.current) {
      try {
        verifierRef.current.clear();
      } catch (e) {
        // Ignore cleanup errors
      }
      verifierRef.current = null;
    }

    // Ensure container exists and is properly set up
    let container = document.getElementById("recaptcha-container");
    if (!container) {
      // Create container if it doesn't exist
      container = document.createElement("div");
      container.id = "recaptcha-container";
      document.body.appendChild(container);
    }

    // Make container invisible but functional for reCAPTCHA
    // Keep it hidden from view but allow Firebase to use it
    container.style.position = "fixed";
    container.style.bottom = "-9999px";
    container.style.left = "-9999px";
    container.style.transform = "none";
    container.style.zIndex = "-1";
    container.style.minWidth = "304px";
    container.style.minHeight = "78px";
    container.style.background = "transparent";
    container.style.borderRadius = "0";
    container.style.boxShadow = "none";
    container.style.visibility = "hidden";
    container.style.display = "block";
    container.style.opacity = "0";
    container.style.pointerEvents = "none";
    
    // Clear any existing content
    container.innerHTML = "";

    // Log Firebase config for debugging
    console.log("Firebase Config:", {
      projectId: auth.app.options.projectId,
      apiKey: auth.app.options.apiKey?.substring(0, 15) + "...",
      authDomain: auth.app.options.authDomain,
    });

    // Create new verifier for each OTP request
    // Use "invisible" size - Firebase will show visible challenge if needed
    try {
      console.log("Creating RecaptchaVerifier...");
      
      const verifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible", // Use invisible - Firebase handles fallback automatically
          callback: () => {
            console.log("✅ reCAPTCHA verified successfully");
          },
          "expired-callback": () => {
            console.log("⚠️ reCAPTCHA expired");
            if (verifierRef.current) {
              try {
                verifierRef.current.clear();
              } catch (e) {
                // Ignore cleanup errors
              }
              verifierRef.current = null;
            }
          },
        }
      );

      verifierRef.current = verifier;
      console.log("RecaptchaVerifier created");

      // Wait for reCAPTCHA widget to render (with timeout)
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max
      let widgetRendered = false;
      
      while (attempts < maxAttempts) {
        const iframe = container.querySelector("iframe");
        if (iframe && iframe.offsetWidth > 0 && iframe.offsetHeight > 0) {
          console.log("✅ reCAPTCHA widget rendered");
          widgetRendered = true;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      if (!widgetRendered) {
        console.warn("⚠️ reCAPTCHA widget not fully rendered, but proceeding...");
      }

      // Additional wait to ensure reCAPTCHA is fully ready
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log("Attempting to send OTP to:", phoneNumber);
      
      // Add timeout to prevent infinite waiting
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("OTP request timed out. Please try again."));
        }, 60000); // 60 second timeout
      });

      const result = await Promise.race([
        signInWithPhoneNumber(auth, phoneNumber, verifier),
        timeoutPromise
      ]);
      
      console.log("✅ OTP sent successfully");
      
      // Hide container after successful OTP send
      container.style.display = "none";
      container.style.visibility = "hidden";
      
      return result;
    } catch (error) {
      console.error("❌ OTP send error:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      
      // Hide container on error
      if (container) {
        container.style.display = "none";
        container.style.visibility = "hidden";
        container.innerHTML = "";
      }
      
      // Provide helpful error message for common issues
      if (error.code === "auth/invalid-app-credential") {
        console.error(`
🔴 Firebase Configuration Error:
The API key or reCAPTCHA Enterprise is not properly configured.

CRITICAL: Even though reCAPTCHA v2 callback fires, Firebase still rejects the request.
This means the API key restrictions or service account permissions are incorrect.

Please verify:
1. Google Cloud Console → APIs & Services → Credentials
   - API Key: ${auth.app.options.apiKey?.substring(0, 15)}...
   - Under "API restrictions": Must have BOTH:
     ✅ reCAPTCHA Enterprise API
     ✅ Identity Toolkit API
   - Under "Application restrictions": Must allow your domains
   
2. Google Cloud Console → IAM & Admin → IAM
   - Service account: firebase-adminsdk-fbsvc@yeah-lo-fe541.iam.gserviceaccount.com
   - Must have BOTH roles:
     ✅ reCAPTCHA Enterprise Agent (roles/recaptchaenterprise.agent)
     ✅ Identity Toolkit Admin (roles/identitytoolkit.admin)
   
3. Google Cloud Console → APIs & Services → Library
   - Both APIs must show "Enabled":
     ✅ reCAPTCHA Enterprise API
     ✅ Identity Toolkit API

4. Firebase Console → Authentication → Settings → reCAPTCHA Enterprise
   - Web site key must be "Protected" (not "Incomplete")
   - Authorized domains must include: localhost, vercel.app
   
5. Wait 10-15 minutes after making changes for full propagation
        `);
      }
      
      // Clean up on error
      if (verifierRef.current) {
        try {
          verifierRef.current.clear();
        } catch (e) {
          // Ignore cleanup errors
        }
        verifierRef.current = null;
      }
      
      throw error;
    }
  };

  /* Backend login - checks if user exists in database */
  const loginWithBackend = async () => {
    if (!auth.currentUser) {
      throw new Error("No authenticated user");
    }

    const idToken = await auth.currentUser.getIdToken();

    const apiUrl = getApiUrl();
    const res = await fetch(
      `${apiUrl}/auth/firebase-login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );

    // Check if response has content before parsing JSON
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      throw new Error(text || `Server error: ${res.status} ${res.statusText}`);
    }

    // Get response text first to check if it's empty
    const text = await res.text();
    if (!text || text.trim() === "") {
      throw new Error(`Empty response from server: ${res.status} ${res.statusText}`);
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
    }

    if (!res.ok || !data.success) {
      throw new Error(data.message || `Request failed: ${res.status}`);
    }

    localStorage.setItem("yelo_token", data.token);
    setBackendUser(data.user);

    return data; // Returns { token, user, isProfileComplete }
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem("yelo_token");
    setBackendUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        backendUser,
        setBackendUser,
        loading,
        sendOtp,
        loginWithBackend,
        logout,
      }}
    >
      {children}
      {/* MUST exist before sendOtp runs - Container for reCAPTCHA */}
      {/* Container is hidden but functional for Firebase auth */}
      <div 
        id="recaptcha-container" 
        style={{ 
          position: "fixed",
          bottom: "-9999px",
          left: "-9999px",
          zIndex: -1,
          display: "block",
          visibility: "hidden",
          opacity: 0,
          pointerEvents: "none"
        }} 
      />
    </AuthContext.Provider>
  );
};



// "use client";

// import {
//   createContext,
//   useContext,
//   useEffect,
//   useRef,
//   useState,
// } from "react";
// import {
//   onAuthStateChanged,
//   RecaptchaVerifier,
//   signInWithPhoneNumber,
//   signOut,
// } from "firebase/auth";
// import { auth } from "@/utils/firebase";

// const AuthContext = createContext(null);
// export const useAuth = () => useContext(AuthContext);

// export const AuthProvider = ({ children }) => {
//   const [firebaseUser, setFirebaseUser] = useState(null);
//   const [backendUser, setBackendUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const recaptchaRef = useRef(null);

//   /* Firebase auth listener */
//   useEffect(() => {
//     const unsub = onAuthStateChanged(auth, (user) => {
//       setFirebaseUser(user);
//       setLoading(false);
//     });
//     return unsub;
//   }, []);

//   /* Helper function to load reCAPTCHA script */
//   const loadRecaptchaScript = () => {
//     return new Promise((resolve, reject) => {
//       // Check if already loaded
//       if (window.grecaptcha) {
//         resolve();
//         return;
//       }

//       // Check if script is already being loaded
//       const existingScript = document.querySelector('script[src*="recaptcha"]');
//       if (existingScript) {
//         // Wait for it to load
//         existingScript.onload = () => resolve();
//         existingScript.onerror = () => reject(new Error("reCAPTCHA script failed to load"));
//         return;
//       }

//       // Load the script manually
//       // Use the Firebase-compatible reCAPTCHA script
//       const script = document.createElement("script");
//       script.src = "https://www.google.com/recaptcha/api.js";
//       script.async = true;
//       script.defer = true;
//       script.onload = () => {
//         console.log("reCAPTCHA script loaded manually");
//         // Wait for grecaptcha to be available
//         const checkGrecaptcha = setInterval(() => {
//           if (window.grecaptcha) {
//             clearInterval(checkGrecaptcha);
//             resolve();
//           }
//         }, 100);

//         // Timeout after 10 seconds
//         setTimeout(() => {
//           clearInterval(checkGrecaptcha);
//           if (!window.grecaptcha) {
//             reject(new Error("grecaptcha not available after script load"));
//           }
//         }, 10000);
//       };
//       script.onerror = () => {
//         reject(new Error("Failed to load reCAPTCHA script"));
//       };
//       document.head.appendChild(script);
//     });
//   };

//   /* ✅ Send OTP - Create reCAPTCHA verifier on-demand */
//   const sendOtp = async (phoneNumber) => {
//     // Clean up any existing verifier first
//     if (recaptchaRef.current) {
//       try {
//         recaptchaRef.current.clear();
//       } catch (e) {
//         // Ignore cleanup errors
//       }
//       recaptchaRef.current = null;
//     }

//     // Ensure container exists and is visible to reCAPTCHA
//     const container = document.getElementById("recaptcha-container");
//     if (!container) {
//       throw new Error("reCAPTCHA container not found");
//     }

//     // Store original style to restore later
//     const originalStyle = container.style.cssText;
    
//     // Make container visible and properly sized for reCAPTCHA
//     // Container must be visible for Firebase to inject the script
//     container.style.cssText = "position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); width: 304px; min-height: 78px; z-index: 9999; background: white; border-radius: 4px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); visibility: visible; display: block;";

//     // Ensure container is in DOM and visible
//     if (!container.isConnected) {
//       document.body.appendChild(container);
//     }
    
//     // Clear any existing content
//     container.innerHTML = "";

//     // Create new verifier for each OTP request
//     // Let Firebase's RecaptchaVerifier handle script loading with correct site key
//     try {
//       console.log("Creating RecaptchaVerifier...");
      
//       // Use a promise to track when reCAPTCHA is verified
//       let recaptchaVerified = false;
//       let recaptchaVerifyResolve = null;
//       const recaptchaVerifyPromise = new Promise((resolve) => {
//         recaptchaVerifyResolve = resolve;
//       });

//       // Use "invisible" size - Firebase will automatically show visible if needed
//       // Firebase's RecaptchaVerifier will use the correct site key from your project
//       const verifier = new RecaptchaVerifier(
//         auth,
//         "recaptcha-container",
//         {
//           size: "invisible", // Firebase handles fallback to visible automatically
//           callback: () => {
//             // reCAPTCHA solved - this will be called automatically
//             console.log("reCAPTCHA callback triggered - verification successful");
//             recaptchaVerified = true;
//             if (recaptchaVerifyResolve) {
//               recaptchaVerifyResolve();
//             }
//           },
//           "expired-callback": () => {
//             // reCAPTCHA expired
//             console.log("reCAPTCHA expired");
//             recaptchaVerified = false;
//             if (recaptchaRef.current) {
//               recaptchaRef.current.clear();
//               recaptchaRef.current = null;
//             }
//           },
//         }
//       );
      
//       // Log verifier details for debugging
//       console.log("RecaptchaVerifier created");
//       console.log("Firebase project ID:", auth.app.options.projectId);
//       console.log("Firebase API Key:", auth.app.options.apiKey?.substring(0, 10) + "...");
//       console.log("Expected Web site key: 6LeugDYsAAAAAOsgB0gy5c3IzI_Dxj_K3JBYKYRI");
      
//       // Check if we can see the site key being used after script loads
//       // Firebase's RecaptchaVerifier should automatically use the Web key
//       console.log("Waiting for reCAPTCHA to initialize with Firebase site key...");

//       recaptchaRef.current = verifier;
//       console.log("RecaptchaVerifier created");

//       // Wait for Firebase to inject and load the reCAPTCHA script
//       // Firebase will use the correct site key from your project
//       console.log("Waiting for Firebase to load reCAPTCHA script...");
//       let scriptAttempts = 0;
//       const maxScriptAttempts = 150; // 15 seconds - give Firebase more time
      
//       while (scriptAttempts < maxScriptAttempts) {
//         // Check if script tag was injected
//         const scriptTag = document.querySelector('script[src*="recaptcha"]');
//         if (scriptTag) {
//           console.log("reCAPTCHA script tag found in DOM");
//         }
        
//         if (window.grecaptcha && typeof window.grecaptcha !== "undefined") {
//           console.log("grecaptcha loaded by Firebase");
//           break;
//         }
        
//         // Log progress every 2 seconds
//         if (scriptAttempts % 20 === 0 && scriptAttempts > 0) {
//           console.log(`Still waiting for Firebase to load script... (${scriptAttempts / 10}s)`);
//         }
        
//         await new Promise((resolve) => setTimeout(resolve, 100));
//         scriptAttempts++;
//       }

//       if (!window.grecaptcha) {
//         console.error("grecaptcha not loaded by Firebase after 15 seconds");
//         console.error("This might indicate a CSP issue or network problem");
//         console.error("However, Firebase may handle reCAPTCHA internally, so proceeding...");
//         // Firebase's RecaptchaVerifier might handle script loading internally
//         // Even if grecaptcha isn't in window, Firebase might still work
//       } else if (window.grecaptcha.ready) {
//         // Wait for grecaptcha to be ready
//         await new Promise((resolve) => {
//           window.grecaptcha.ready(() => {
//             console.log("grecaptcha ready");
//             resolve();
//           });
//         });
//       }
      
//       // Additional wait to ensure Firebase has initialized everything
//       console.log("Waiting additional time for Firebase reCAPTCHA initialization...");
//       await new Promise((resolve) => setTimeout(resolve, 1000));

//       // Wait for reCAPTCHA widget to render
//       console.log("Waiting for reCAPTCHA widget to render...");
//       let attempts = 0;
//       const maxAttempts = 50; // 5 seconds max wait
//       let recaptchaReady = false;
      
//       while (attempts < maxAttempts && !recaptchaReady) {
//         // Check if the container has reCAPTCHA iframe (indicates it's rendered)
//         const iframe = container.querySelector("iframe");
//         const recaptchaDiv = container.querySelector('[data-callback]');
        
//         if (iframe || recaptchaDiv) {
//           console.log("reCAPTCHA widget rendered");
//           recaptchaReady = true;
//           break;
//         }
        
//         await new Promise((resolve) => setTimeout(resolve, 100));
//         attempts++;
//       }

//       if (!recaptchaReady) {
//         console.warn("reCAPTCHA widget not found, but proceeding...");
//       }

//       // Additional delay to ensure reCAPTCHA is ready
//       await new Promise((resolve) => setTimeout(resolve, 500));

//       // Log reCAPTCHA state before sending OTP
//       console.log("reCAPTCHA verifier ready, attempting to send OTP...");
//       console.log("Container iframe:", container.querySelector("iframe") ? "Found" : "Not found");
//       console.log("grecaptcha available:", typeof window.grecaptcha !== "undefined");
      
//       // Try to find the site key in the DOM or script
//       const recaptchaScript = document.querySelector('script[src*="recaptcha"]');
//       if (recaptchaScript) {
//         console.log("reCAPTCHA script URL:", recaptchaScript.src);
//         // Check if the script URL contains a site key parameter
//         const urlParams = new URLSearchParams(recaptchaScript.src.split('?')[1] || '');
//         if (urlParams.has('render')) {
//           console.log("reCAPTCHA render parameter:", urlParams.get('render'));
//         }
//         if (urlParams.has('sitekey')) {
//           console.log("reCAPTCHA site key from URL:", urlParams.get('sitekey'));
//         }
//       } else {
//         console.warn("No reCAPTCHA script tag found - Firebase may be using internal reCAPTCHA");
//       }
      
//       // Check if we can see widget ID or site key in the container
//       const recaptchaWidget = container.querySelector('[data-sitekey]');
//       if (recaptchaWidget) {
//         const widgetSiteKey = recaptchaWidget.getAttribute('data-sitekey');
//         console.log("reCAPTCHA site key from widget:", widgetSiteKey);
//         if (widgetSiteKey !== "6LeugDYsAAAAAOsgB0gy5c3IzI_Dxj_K3JBYKYRI") {
//           console.error("⚠️ Site key mismatch! Expected: 6LeugDYsAAAAAOsgB0gy5c3IzI_Dxj_K3JBYKYRI, Got:", widgetSiteKey);
//         }
//       }
      
//       // Check all iframes for reCAPTCHA
//       const allIframes = container.querySelectorAll('iframe');
//       console.log("Number of iframes in container:", allIframes.length);
//       allIframes.forEach((iframe, index) => {
//         console.log(`Iframe ${index} src:`, iframe.src);
//       });

//       try {
//         // Call signInWithPhoneNumber - this will trigger reCAPTCHA automatically
//         // If invisible reCAPTCHA fails, Firebase will automatically show visible reCAPTCHA
//         // The promise will resolve once reCAPTCHA is verified and OTP is sent
//         console.log("Calling signInWithPhoneNumber...");
//         console.log("Note: If reCAPTCHA challenge appears, please complete it");
        
//         const result = await signInWithPhoneNumber(auth, phoneNumber, verifier);
//         console.log("OTP sent successfully");
        
//         // Restore original container style after successful OTP send
//         container.style.cssText = originalStyle;
        
//         return result;
//       } catch (signInError) {
//         console.error("signInWithPhoneNumber error:", signInError);
//         console.error("Error code:", signInError.code);
//         console.error("Error message:", signInError.message);
        
//         // Handle specific error cases
//         if (signInError.code === "auth/too-many-requests") {
//           const customError = new Error(
//             "Too many requests. Please wait 15-30 minutes before trying again, or try with a different phone number."
//           );
//           customError.code = signInError.code;
//           throw customError;
//         }
        
//         throw signInError;
//       }
//     } catch (error) {
//       // Restore original container style on error
//       container.style.cssText = originalStyle;

//       // Clean up on error
//       if (recaptchaRef.current) {
//         try {
//           recaptchaRef.current.clear();
//         } catch (e) {
//           // Ignore cleanup errors
//         }
//         recaptchaRef.current = null;
//       }

//       // Log detailed error for debugging
//       console.error("OTP send error:", error);
//       console.error("Error code:", error.code);
//       console.error("Error message:", error.message);
//       console.error("Error details:", error);
//       throw error;
//     }
//   };

//   /* Backend login */
//   const loginWithBackend = async () => {
//     const idToken = await auth.currentUser.getIdToken();

//     const res = await fetch(
//       `${process.env.NEXT_PUBLIC_API_URL}/auth/firebase-login`,
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ idToken }),
//       }
//     );

//     const data = await res.json();
//     if (!data.success) throw new Error(data.message);

//     localStorage.setItem("yelo_token", data.token);
//     setBackendUser(data.user);

//     return data;
//   };

//   /* Logout */
//   const logout = async () => {
//     await signOut(auth);
//     localStorage.removeItem("yelo_token");
//     setBackendUser(null);
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         firebaseUser,
//         backendUser,
//         loading,
//         sendOtp,
//         loginWithBackend,
//         logout,
//       }}
//     >
//       {children}

//       {/* 🔥 MUST ALWAYS EXIST - Container for invisible reCAPTCHA */}
//       {/* Container must be visible (but hidden) for reCAPTCHA script to load */}
//       <div
//         id="recaptcha-container"
//         style={{
//           position: "fixed",
//           bottom: "0",
//           left: "0",
//           width: "1px",
//           height: "1px",
//           opacity: "0",
//           pointerEvents: "none",
//           zIndex: "-1",
//         }}
//       ></div>
//     </AuthContext.Provider>
//   );
// };
