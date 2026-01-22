// app/test-otp/page.jsx
"use client";

import { useEffect } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "@/utils/firebase";

export default function TestOtp() {
  useEffect(() => {
    window.recaptchaVerifier = new RecaptchaVerifier(
      auth,
      "recaptcha",
      { size: "invisible" }
    );
  }, []);

  const send = async () => {
    await signInWithPhoneNumber(
      auth,
      "+91XXXXXXXXXX",
      window.recaptchaVerifier
    );
  };

  return (
    <>
      <button onClick={send}>Send OTP</button>
      <div id="recaptcha"></div>
    </>
  );
}
