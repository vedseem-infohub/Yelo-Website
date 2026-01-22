import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCMzis--kQh0ian1mrOUwydSOLT94tviCY",
  authDomain: "yeah-lo-fe541.firebaseapp.com",
  projectId: "yeah-lo-fe541",
  storageBucket: "yeah-lo-fe541.appspot.com", 
  messagingSenderId: "600457316351",
  appId: "1:600457316351:web:27f30db2c3c405fc3609ca",
};

// Initialize Firebase only on client side
let app;
let auth;

if (typeof window !== 'undefined') {
  // Check if app already exists to avoid re-initialization
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
} else {
  // Server-side: return null or dummy object
  app = null;
  auth = null;
}

export { auth };