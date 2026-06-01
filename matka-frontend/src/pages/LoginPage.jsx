import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  LogIn,
  User,
  Power,
  Loader2,
  Smartphone,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { API_URL } from "../config";
import logo from "../assets/logo.png";
const API_BASE_URL = API_URL;
import { fetchSiteData } from "../components/layout/fetchSiteData";

// Spinner
const LoadingSpinner = () => <Loader2 className="animate-spin h-5 w-5 mr-2" />;

export default function Login() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [shake, setShake] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("accessToken");
    if (stored) {
      setMessage({ type: "info", text: "You are already logged in!" });
    }
  }, []);

  const showError = (text) => {
    setMessage({ type: "error", text });
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleLogin = async () => {
    if (!mobile || !password || mobile.length !== 10) {
      showError("Enter valid 10-digit mobile & password.");
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/token`,
        { mobile, password },
        { headers: { "Content-Type": "application/json" } }
      );

      // console.log(response);
      const data = response.data;
      localStorage.setItem("accessToken", data.access_token);
      localStorage.setItem("userId", data.userId);

      setMessage({ type: "success", text: "Login Successful!" });
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      console.log("LOGIN ERROR: ", err);

      if (err.response) {
        const detail = err.response.data.detail;

        if (typeof detail === "string") {
          showError(detail);
        } else if (Array.isArray(detail)) {
          showError(detail[0].msg || "Invalid credentials");
        } else {
          showError("Incorrect mobile or password!");
        }
      } else {
        showError("Server connection failed. Try again.");
      }
    }

    setIsLoading(false);
  };

  const Message = ({ type, text }) => {
    if (!text) return null;

    let bgColor = "theme-alert-info";
    let Icon = ShieldAlert;

    if (type === "error") {
      bgColor = "theme-alert-error";
      Icon = Power;
    }
    if (type === "success") {
      bgColor = "theme-alert-success";
      Icon = LogIn;
    }
    if (type === "info") {
      bgColor = "theme-alert-info";
      Icon = User;
    }

    return (
      <div
        className={`p-4 rounded-md flex items-center gap-3 mt-7 text-sm font-semibold ${bgColor} ${
          type === "error" && shake ? "animate-shake" : ""
        }`}
      >
        <Icon className="h-5 w-5" />
        <span>{text}</span>
      </div>
    );
  };

  const [site, setSite] = useState(null);

  useEffect(() => {
    (async () => {
      const data = await fetchSiteData();
      console.log("data ======", data);
      setSite(data);
    })();
  }, []);

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
          Login to your account
        </p>

        {message && <Message type={message.type} text={message.text} />}

        {/* MOBILE INPUT */}
        <label className="theme-label block mt-7 mb-2">
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
        </div>

        {/* PASSWORD INPUT */}
        <label className="theme-label block mt-5 mb-2">
          Password
        </label>
        <div className="relative">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="theme-input px-12 py-4"
          />
          <Lock className="theme-icon absolute left-4 top-1/2 -translate-y-1/2" />
        </div>

        {/* LOGIN BUTTON */}
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="theme-button w-full flex mt-7 items-center justify-center gap-2 font-bold py-4"
        >
          {isLoading ? (
            <>
              <LoadingSpinner />
              Authenticating...
            </>
          ) : (
            <>
              Login <LogIn size={19} />
            </>
          )}
        </button>

        <div className="h-px bg-white/8 mt-9" />

        <p className="text-center text-gray-400 text-sm mt-6">
          Register a new account?{" "}
          <a href="/signup" className="theme-link">
            SignUp
          </a>
        </p>

        <p className="text-center text-gray-400 mt-5 text-sm">
          Need help?{" "}
          <a
            href={`https://wa.me/${site?.whatsapp_number}`}
            // href="https://wa.me/917726035987"
            className="text-[#f6b64b] underline underline-offset-3"
            target="_blank"
            rel="noreferrer"
          >
            Contact Support
          </a>
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          50% { transform: translateX(4px); }
          75% { transform: translateX(-4px); }
          100% { transform: translateX(0); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
