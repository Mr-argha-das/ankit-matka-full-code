import React, { useEffect, useState } from "react";
import axios from "axios";
import { Copy, Users, Gift, ArrowLeft } from "lucide-react";
import { API_URL } from "../config";

export default function ReferralPage() {
  const [user, setUser] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [reffAmount, setReffAmount] = useState(false);

  const token = localStorage.getItem("accessToken");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  // Fetch user info
  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API_URL}/user/me`, { headers });
      console.log(res?.data);
      setUser(res.data);
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  };

  // Fetch referred users
  const fetchReferrals = async () => {
    try {
      const res = await axios.get(`${API_URL}/user/my-referrals`, { headers });
      setReferrals(res.data || []);
    } catch (err) {
      console.error("Error fetching referrals:", err);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/settings/get`);
      console.log("API REffer:", res.data);
      setReffAmount(res?.data?.referral_bonus);
    } catch (err) {
      console.error("Error fetching referrals:", err);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchReferrals();
    loadSettings();
  }, []);

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const copyLink = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!user)
    return (
      <div className="text-center text-gray-300 py-10">Loading referral...</div>
    );

  const referralLink = `${window.location.origin}/signup?ref=${user.referral_code}`;

  return (
    <div className="max-w-md mx-auto text-white min-h-screen pb-20 font-sans">
      <div className="w-full relative bg-gradient-to-b from-black to-black/0 py-2 flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="p-2 pl-4 z-10 rounded-full hover:bg-white/10 transition"
        >
          <ArrowLeft size={22} />
        </button>
        <h2 className="text-md z-0 w-full absolute   justify-between font-bold bg-gradient-to-b from-black to-black/0 px-4 py-2  flex justify-center items-center gap-2">
          <span className="flex gap-2 text-md items-center">Refer & Earn</span>
        </h2>
        <a className="pr-4 z-10"></a>
      </div>

      <div className="px-4">
        {/* Referral Code Card */}
        <div className="bg-white/5 p-4 rounded-xl mt-6 border border-white/10 shadow-lg">
          <p className="text-sm text-gray-300">Your Referral Code</p>
          <div className="flex justify-between items-center mt-1 bg-black/30 px-3 py-2 rounded-lg">
            <span className="text-lg font-bold tracking-wider">
              {user.referral_code}
            </span>
            <Copy
              className="cursor-pointer hover:opacity-70"
              onClick={() => copyText(user.referral_code)}
            />
          </div>

          {copied && <p className="text-green-400 text-xs mt-1">Copied!</p>}
        </div>

        {/* Referral Link */}
        <div className="bg-white/5 p-4 rounded-xl mt-4 border border-white/10 shadow-lg">
          <p className="text-sm text-gray-300">Your Referral Link</p>
          <div className="flex justify-between items-center mt-1 bg-black/30 px-3 py-2 rounded-lg">
            <span className="truncate text-gray-200">{referralLink}</span>
            <Copy
              className="cursor-pointer hover:opacity-70"
              onClick={() => copyLink(referralLink)}
            />
          </div>

          {copiedLink && <p className="text-green-400 text-xs mt-1">Copied!</p>}
        </div>

        {/* Invite message */}
        <div className="bg-green-600/10 border border-green-600/20 p-4 mt-4 rounded-xl">
          <p className="text-sm text-green-300">
            Invite your friends! When they signup using your code, you earn
            bonus up to {reffAmount}rs.
          </p>
        </div>
      </div>
      {/* Referred Users */}
      {/* <div className="mt-6">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
          <Users size={18} /> People You Referred
        </h3>

        {referrals.length === 0 ? (
          <p className="text-gray-400 text-sm">No referrals yet.</p>
        ) : (
          <div className="space-y-3">
            {referrals.map((ref, idx) => (
              <div
                key={idx}
                className="bg-white/5 p-3 rounded-lg border border-white/10"
              >
                <p className="font-medium">{ref.username}</p>
                <p className="text-gray-400 text-sm">{ref.mobile}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {new Date(ref.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div> */}
    </div>
  );
}
