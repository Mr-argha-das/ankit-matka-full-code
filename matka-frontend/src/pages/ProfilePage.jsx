import React, { useEffect, useState } from "react";
import axios from "axios";
import { ArrowLeft, DollarSign, HistoryIcon, Pencil, Save } from "lucide-react";
import { API_URL } from "../config";
import UpiPayment from "../components/layout/upi";

const API_BASE = `${API_URL}/user`;

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  console.log(user);
  const [username, setUsername] = useState("");
  const [mobile, setMobile] = useState("");

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const token = localStorage.getItem("accessToken");

  function parseJwt(token) {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch (e) {
      return null;
    }
  }
  const [userId, setUserId] = useState(null);
  const decoded = parseJwt(token);
  console.log("userId", userId);
  useEffect(() => {
    setUserId(decoded?.sub);
  }, [decoded]);

  const authHeader = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // ---------------------------
  // GET PROFILE
  // ---------------------------

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_BASE}/profile2`, authHeader);

      setUser(res?.data);
      setUsername(res?.data?.username || "");
      setMobile(res?.data?.mobile || "");
    } catch (err) {
      console.log("Profile load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const updateProfile = async () => {
    setMsg("");

    if (!username.trim() || !mobile.trim()) {
      setMsg("All fields are required!");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("mobile", mobile);

      await axios.put(`${API_BASE}/profile`, formData, authHeader);

      setMsg("Profile Updated Successfully ✔");
      setEditMode(false);

      fetchProfile();
    } catch (err) {
      setMsg("Update failed!");
      console.log(err);
    }
  };

  if (loading) {
    return (
      <div className="text-white min-h-screen flex justify-center items-center">
        Loading Profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen mx-auto max-w-md flex flex-col items-center">
      {/* Header */}
      <div className="w-full relative bg-gradient-to-b from-black to-black/0 py-2 flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="p-2 pl-4 z-10 rounded-full hover:bg-white/10 transition"
        >
          <ArrowLeft size={22} />
        </button>

        <h2 className="text-md z-0 w-full absolute   justify-between font-bold bg-gradient-to-b from-black to-black/0 px-4 py-2  flex justify-center items-center gap-2">
          <span className="flex gap-2 text-md items-center">My Profile</span>
        </h2>

        <a className="z-10">{/* <HistoryIcon /> */}</a>
      </div>

      {/* Profile Card */}
      <div className="w-[90%]  bg-white/10 shadow-xl max-w-md mt-6 rounded-2xl p-6 relative">
        {/* Edit Button */}

        <button
          onClick={() => (editMode ? updateProfile() : setEditMode(true))}
          className="absolute top-4 right-4 flex items-center text-sm text-gray-200 hover:text-purple-500"
        >
          {editMode ? (
            <>
              <Save size={16} className="mr-1" /> Save
            </>
          ) : (
            <>
              <Pencil size={16} className="mr-1" /> Edit Profile
            </>
          )}
        </button>

        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 bg-purple-600 border text-white flex items-center justify-center text-4xl font-bold rounded-full shadow-md mb-4">
            {user.username.charAt(0).toUpperCase()}
          </div>
        </div>

        {msg && (
          <p className="text-center text-green-400 font-medium mb-3">{msg}</p>
        )}

        <div className="space-y-4 mt-4">
          {/* Username */}
          <div>
            <label className="block text-gray-200 text-sm font-medium mb-1">
              Username
            </label>

            {editMode ? (
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 bg-black/40 text-white rounded-md border outline-none"
              />
            ) : (
              <p className="text-gray-200 font-semibold border-b pb-1">
                {user.username}
              </p>
            )}
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-gray-200 text-sm font-medium mb-1">
              Mobile
            </label>

            {editMode ? (
              <input
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full p-2 bg-black/40 text-white rounded-md border outline-none"
              />
            ) : (
              <p className="text-gray-200 font-semibold border-b pb-1">
                {user.mobile}
              </p>
            )}
          </div>

          {/* Created At */}
          <div>
            <label className="block text-gray-200 text-sm font-medium mb-1">
              Joined On
            </label>
            <p className="text-gray-200 font-semibold border-b pb-1">
              {new Date(user.created_at?.$date ?? user.created_at)
                .toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
                .replace(",", "")}
            </p>
          </div>
        </div>
      </div>

      {/* <UpiPayment /> */}
    </div>
  );
}
