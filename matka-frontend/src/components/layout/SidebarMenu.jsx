import React, { useCallback, useEffect, useState } from "react";
import {
  User,
  Bell,
  Wallet,
  PlusCircle,
  PlayCircle,
  Gift,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  Trophy,
  Gamepad2,
  Phone,
  Lock,
  LogOut,
  X,
  DollarSign,
  Star,
  Play, // Replaced BiMoney with DollarSign from lucide-react
} from "lucide-react";
import axios from "axios";
import { API_URL } from "../../config";
import { SiMarketo } from "react-icons/si";

const API_BASE = `${API_URL}/user`;

export default function SidebarMenu({ sidebar, setSidebar }) {
  const [notifications, setNotifications] = useState(true);
  const [accessToken, setAccessToken] = useState(null); // Track authentication state
  const [username, setUsername] = useState("");
  const [mobile, setMobile] = useState("");

  const token = localStorage.getItem("accessToken");

  // ---------------------------
  // GET PROFILE
  // ---------------------------
  const fetchProfile = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsername(res.data.username || "");
      setMobile(res.data.mobile || "");
    } catch (err) {
      console.log("Profile load error:", err);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // 1. Check for token on initial load
  useEffect(() => {
    const storedToken = localStorage.getItem("accessToken");
    if (storedToken) {
      setAccessToken(storedToken);
    }
  }, []);

  // 2. Corrected handleLogout function
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userId");
    setAccessToken(null);
    window.location.href = "/login";
  };

  const menuItems = [
    { icon: <User size={18} />, label: "My Profile", link: "/profile" },
    // { icon: <Bell size={18} />, label: "Notification", toggle: true },
    { icon: <Wallet size={18} />, label: "Wallet", link: "/wallet" },

    // { icon: <PlusCircle size={18} />, label: "Add Points" ,link: "/add-points"},
    { icon: <Clock size={18} />, label: "My Bids", link: "/my-bids" },
    {
      icon: <DollarSign size={18} />,
      label: "Add Points",
      link: "/add-points",
    },

    { icon: <Star size={18} />, label: "Starline", link: "/starline" },
    {
      icon: <SiMarketo size={18} />,
      label: "Galidesawar",
      link: "/golidesawar",
    },
    {
      icon: <ArrowDownCircle size={18} />,
      label: "Withdrawal Funds",
      link: "/withdrawal-request",
    },
    // { icon: <ArrowUpCircle size={18} />, label: "Transfer Points" },
    { icon: <Clock size={18} />, label: "Bid History", link: "/bid-history" },
    { icon: <Trophy size={18} />, label: "Win History", link: "/win-history" },
    { icon: <Gamepad2 size={18} />, label: "Game Rate", link: "/game-rate" },
    { icon: <Phone size={18} />, label: "Contact Us", link: "/contact-us" },
    { icon: <Gift size={18} />, label: "Reffer & Earn", link: "/referrals" },
    {
      icon: <Lock size={18} />,
      label: "Change Password",
      link: "/change-password",
    },
    {
      icon: <Play size={18} />,
      label: "How To Play",
      link: "/how-to-play",
    },
    // Only include onClick for the logout action
    {
      icon: <LogOut size={18} />,
      label: "Logout",
      onClick: handleLogout,
      isLogout: true, // Custom flag to identify the logout item
    },
  ];

  return (
    <>
      {/* Overlay when sidebar open */}
      {sidebar && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setSidebar(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 z-40 h-full w-72 transform border-r border-red-500/20 bg-[#070101] shadow-[24px_0_60px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-in-out
        ${sidebar ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header */}
        <div className="relative z-10 flex flex-col items-center rounded-b-[30px] border-b border-red-500/20 bg-gradient-to-b from-[#120202] via-[#210303] to-[#590606] px-4 py-5 text-white">
          <button
            onClick={() => setSidebar(false)}
            className="absolute right-4 top-4 text-white hover:text-gray-200"
          >
            <X size={22} />
          </button>

          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-red-500/50 bg-black/30 text-2xl font-bold capitalize text-white shadow-[0_0_24px_rgba(242,10,10,0.22)]">
            {username?.[0]}
          </div>
          <h3 className="mt-2 text-lg font-semibold capitalize">{username}</h3>
          <p className="text-sm opacity-80">{mobile}</p>
        </div>

        {/* Menu */}
        <div className="-mt-4 flex h-[calc(100%-136px)] flex-col space-y-2 overflow-y-auto bg-[#070101] p-4 pt-7 text-white">
          {menuItems
            // 3. Filter the Logout item if the user is not authenticated
            .filter((item) => !item.isLogout || accessToken)
            .map((item, index) => {
              // Determine if the item is a link or an action (like Logout)
              const Component = item.link ? "a" : "div";
              const props = item.link
                ? { href: item.link }
                : { onClick: item.onClick };

              const iconColor = item.isLogout ? "text-red-400" : "text-red-500";

              return (
                <div
                  key={index}
                  className="flex cursor-pointer items-center justify-between rounded-[18px] border border-white/8 bg-white/[0.03] transition hover:border-red-500/30 hover:bg-red-950/20"
                >
                  <Component
                    {...props}
                    className="flex w-full items-center gap-3 px-3 py-3"
                  >
                    <div className={iconColor}>{item.icon}</div>
                    <span className="text-sm font-semibold text-white">
                      {item.label}
                    </span>
                  </Component>

                  {/* Toggle logic is handled separately for items with toggle property */}
                  {item.toggle && (
                    <label className="relative inline-flex items-center cursor-pointer pr-3">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notifications}
                        onChange={() => setNotifications(!notifications)}
                      />
                      <div className="peer h-5 w-10 rounded-full bg-gray-300 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:border after:bg-white after:transition-all after:content-[''] peer-checked:bg-red-700 peer-checked:after:translate-x-5 peer-focus:ring-2 peer-focus:ring-red-600 peer-focus:outline-none"></div>
                    </label>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </>
  );
}
