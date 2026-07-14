// AppHeader.jsx
import React, { useState, useEffect } from "react";
import { Menu, Wallet2Icon } from "lucide-react";
import { API_URL } from "../../config";

// IMPORTANT: Replace with your actual base URL
const API_BASE_URL = API_URL;

// Utility function to get the token (assumes JWT is stored in localStorage)
const getAuthToken = () => {
  return localStorage.getItem("accessToken");
};

export default function AppHeader({ setSidebar }) {
  const [balance, setBalance] = useState("...");
  const [loading, setLoading] = useState(true);

  // Function to fetch the wallet balance
  const fetchWalletBalance = async () => {
    setLoading(true);
    const token = getAuthToken();

    if (!token) {
      setBalance("Login");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/user/balance`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Format the balance to two decimal places
        setBalance(data.balance.toFixed(2));
      } else {
        // Handle token expiration or other API errors
        setBalance("N/A");
      }
    } catch {
      // Handle network errors
      setBalance("Error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch balance when the component mounts
  useEffect(() => {
    fetchWalletBalance();

    // Optional: Auto-refresh balance every 60 seconds
    const intervalId = setInterval(fetchWalletBalance, 60000);
    return () => clearInterval(intervalId);
  }, []); // Run only on mount and unmount

  return (
    <header className="w-full z-40">
      <div className="theme-card mx-auto flex max-w-md items-center justify-between rounded-b-[30px] border-x-0 border-t-0 px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebar(true)}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-white hover:border-red-500/40 hover:text-red-200"
          >
            <Menu size={22} />
          </button>
          {/* <img src="/logo.png" alt="Logo" className="w-8 h-8" /> */}
          <h1 className="text-white text-lg font-extrabold tracking-wide">
            Natraj777
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-950/25 px-3 py-1.5 text-sm font-bold text-white transition duration-150 hover:bg-red-900/35">
            <Wallet2Icon size={18} />
            {loading ? (
              <span className="animate-pulse">Loading...</span>
            ) : (
              `₹${balance}`
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
