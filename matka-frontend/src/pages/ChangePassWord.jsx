import React, { useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { Lock, Save, Eye, EyeOff, ArrowLeft } from "lucide-react";

const API_BASE = `${API_URL}/user`;

export default function UpdatePasswordPage() {
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("accessToken");

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const handleSubmit = async () => {
    setMsg("");

    if (!oldPass || !newPass) {
      setMsg("All fields are required!");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("old_password", oldPass);
      formData.append("new_password", newPass);

      const res = await axios.post(
        `${API_BASE}/update-password`,
        formData,
        authHeader
      );

      console.log(res);

      setMsg("Password Updated Successfully ✔");
      setOldPass("");
      setNewPass("");
    } catch (err) {
      console.log(err);
      const errorMsg =
        err.response?.data?.detail || "Failed to update password!";
      setMsg(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto text-white">
      {/* Header */}

      <div className="w-full relative bg-gradient-to-b from-black to-black/0 py-2 flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="p-2 pl-4 z-10 rounded-full hover:bg-white/10 transition"
        >
          <ArrowLeft size={22} />
        </button>
        <h2 className="text-md z-0 w-full absolute   justify-between font-bold bg-gradient-to-b from-black to-black/0 px-4 py-2  flex justify-center items-center gap-2">
          <span className="flex gap-2 text-md items-center uppercase">
            Change Password
          </span>
        </h2>
        <a className="pr-4 z-10"></a>
      </div>

      <div className="bg-white/5 mx-3 pt-7 rounded-2xl p-4 mt-4 shadow-xl">
        <div className="flex justify-center mb-4">
          <Lock size={38} className="text-purple-400" />
        </div>

        {msg && (
          <p
            className={`text-center font-semibold mb-3 ${
              msg.includes("✔") ? "text-green-400" : "text-red-400"
            }`}
          >
            {msg}
          </p>
        )}

        {/* Old Password */}
        <div className="mb-4 relative">
          <label className="text-sm text-gray-200">Old Password</label>
          <input
            type={showOld ? "text" : "password"}
            value={oldPass}
            onChange={(e) => setOldPass(e.target.value)}
            className="w-full p-2 mt-1 border border-gray-50/15 rounded-md text-white outline-none"
          />

          <button
            type="button"
            onClick={() => setShowOld(!showOld)}
            className="absolute right-3 top-[40px] text-gray-300"
          >
            {showOld ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* New Password */}
        <div className="mb-6 relative">
          <label className="text-sm text-gray-200">New Password</label>
          <input
            type={showNew ? "text" : "password"}
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            className="w-full p-2 mt-1 border border-gray-50/15 rounded-md text-white outline-none"
          />

          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute right-3 top-[40px] text-gray-300"
          >
            {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-gradient-to-bl from-[#212b61] to-[#79049a] py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2"
        >
          <Save size={16} />
          {loading ? "Updating..." : "Update Password"}
        </button>
      </div>
    </div>
  );
}
