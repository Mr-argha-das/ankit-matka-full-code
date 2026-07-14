import React, { useState } from "react";
import axios from "axios";
import {
  User,
  Smartphone,
  Lock,
  LogIn,
  Power,
  ShieldAlert,
  CheckCircle,
  Ticket,
} from "lucide-react";
import { API_URL } from "../config";
import logo from "../assets/logo.png";
import { useSearchParams } from "react-router-dom";

export default function SignupPage() {
  const [searchParams] = useSearchParams();
  const ref = searchParams.get("ref");

  console.log(ref);

  const [username, setUsername] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [referral_code, setReferralCode] = useState(ref || "");

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [shake, setShake] = useState(false);

  const triggerError = (text) => {
    setMessage({ type: "error", text });
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const handleSignup = async () => {
    if (!username || !mobile || mobile.length !== 10 || !password) {
      triggerError("All fields required. Mobile must be 10 digits.");
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const res = await axios.post(
        `${API_URL}/auth/register`,
        {
          username,
          mobile,
          password,
          referral_code: referral_code || null,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("REGISTER RESPONSE:", res.data);

      // ------------------------------------
      // AUTO LOGIN AFTER REGISTER SUCCESS
      // ------------------------------------
      localStorage.setItem("accessToken", res.data.access_token);
      localStorage.setItem("userId", res.data.user.id);
      setTimeout(() => {
        window.location.reload();
      }, 1200);

      setMessage({
        type: "success",
        text: "Registration successful! Redirecting...",
      });

      // REDIRECT BY ROLE
      // setTimeout(() => {
      //   if (res.data.user.role === "admin") {
      //     window.location.href = "/admin";
      //   } else {
      //     window.location.href = "/";
      //   }
      // }, 900);
    } catch (err) {
      console.log("SIGNUP ERROR:", err);

      if (err.response?.data?.detail) {
        triggerError(err.response.data.detail);
      } else {
        triggerError("Server error. Try again.");
      }
    }
    setIsLoading(false);
  };

  const Message = ({ type, text }) => {
    if (!text) return null;

    let bg = "theme-alert-info";
    let Icon = ShieldAlert;

    if (type === "error") {
      bg = "theme-alert-error";
      Icon = Power;
    }
    if (type === "success") {
      bg = "theme-alert-success";
      Icon = CheckCircle;
    }

    return (
      <div
        className={`p-4 mt-7 rounded-md flex items-center gap-3 text-sm font-semibold ${bg} ${
          type === "error" && shake ? "animate-shake" : ""
        }`}
      >
        <Icon className="w-5 h-5" />
        <span>{text}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="theme-card w-full max-w-md rounded-[32px] px-8 py-10 backdrop-blur">
        <div className="flex items-center justify-center">
          <img
            src={logo}
            className="h-24 w-24 rounded-full place-items-center mb-7 shadow-[0_0_28px_rgba(242,10,10,0.18)]"
          />
        </div>

        <p className="text-center text-gray-300 text-sm tracking-[0.18em] uppercase">
          Create your new account
        </p>

        {message && <Message type={message.type} text={message.text} />}

        {/* Username */}
        <label className="theme-label block mt-7 mb-2">
          Username
        </label>
        <div className="relative">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            className="theme-input px-12 py-4"
          />
          <User className="theme-icon absolute left-4 top-1/2 -translate-y-1/2" />
        </div>

        {/* Mobile */}
        <label className="theme-label block mt-5 mb-2">
          Mobile Number
        </label>
        <div className="relative">
          <input
            type="text"
            maxLength={10}
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
            placeholder="Enter 10 digit mobile"
            className="theme-input px-12 py-4"
          />
          <Smartphone className="theme-icon absolute left-4 top-1/2 -translate-y-1/2" />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded bg-red-950/40 px-2 py-1 text-xs text-gray-400">
            {mobile.length}/10
          </span>
        </div>

        {/* Password */}
        <label className="theme-label block mt-5 mb-2">
          Create Password
        </label>
        <div className="relative">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create password"
            className="theme-input px-12 py-4"
          />
          <Lock className="theme-icon absolute left-4 top-1/2 -translate-y-1/2" />
        </div>

        {/* Referral Code */}
        <label className="theme-label block mt-5 mb-2">
          Referral Code (Optional)
        </label>
        <div className="relative">
          <input
            type="text"
            value={referral_code}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            placeholder="Enter referral code"
            className="theme-input px-12 py-4"
          />
          <Ticket className="theme-icon absolute left-4 top-1/2 -translate-y-1/2" />
        </div>

        {/* Register Button */}
        <button
          onClick={handleSignup}
          disabled={isLoading}
          className="theme-button mt-6 w-full flex items-center justify-center gap-2 py-4 font-bold"
        >
          {isLoading ? (
            <>
              <LogIn className="animate-spin" /> Creating...
            </>
          ) : (
            <>
              Create Account <LogIn size={19} />
            </>
          )}
        </button>

        <div className="h-px bg-white/8 mt-9" />

        <p className="text-center text-gray-400 text-sm mt-6">
          Already have an account?{" "}
          <a href="/login" className="theme-link">
            Login here
          </a>
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          50% { transform: translateX(4px); }
          75% { transform: translateX(-4px); }
        }
        .animate-shake { animation: shake 0.3s; }
      `}</style>
    </div>
  );
}
