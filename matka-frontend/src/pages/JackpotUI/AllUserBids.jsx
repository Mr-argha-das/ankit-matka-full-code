// src/pages/AllUserBids.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

import { ArrowLeft, Loader } from "lucide-react";
import { API_URL } from "../../config";

export default function AllUserBids() {
  const [loading, setLoading] = useState(true);
  const [bids, setBids] = useState([]);

  const token = localStorage.getItem("accessToken") || "";
  const headers = { Authorization: `Bearer ${token}` };

  // Cache to avoid extra API calls
  const marketCache = {};

  // Fetch market name using marketId
  const getMarketName = async (marketId) => {
    if (marketCache[marketId]) return marketCache[marketId];

    try {
      const res = await axios.get(
        `${API_URL}/api/admin/Golidesawar/market/${marketId}`,
        { headers }
      );

      const name = res.data?.data?.name || "Unknown Market";
      marketCache[marketId] = name;
      return name;
    } catch {
      return "Unknown Market";
    }
  };

  const loadAllUserBids = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/Golidesawar/bids/all`, {
        headers,
      });

      const list = res.data?.data || [];

      // Attach Market Name to each bid
      const finalList = await Promise.all(
        list.map(async (b) => ({
          ...b,
          market_name: await getMarketName(b.market_id),
        }))
      );

      setBids(finalList);
    } catch (err) {
      console.error("Error fetching all user bids:", err);
      setBids([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAllUserBids();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen text-white flex justify-center items-center">
        <Loader className="animate-spin" size={32} />
      </div>
    );

  return (
    <div className="max-w-md mx-auto text-white pb-20 ">
      {/* HEADER */}

      <div className="w-full relative bg-gradient-to-b from-black to-black/0 py-2 flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="p-2 pl-4 z-10 rounded-full hover:bg-white/10 transition"
        >
          <ArrowLeft size={22} />
        </button>

        <h2 className="text-md z-0 w-full absolute font-bold px-4 py-2 flex justify-center items-center gap-2">
          <span className="flex gap-2 text-md items-center uppercase">
            Golidesawar Bids
          </span>
        </h2>

        <div className="pr-4 z-10"></div>
      </div>

      {/* BIDS LIST */}
      <div className="p-3">
        {bids.length === 0 && (
          <p className="text-gray-400 text-sm">No bids found.</p>
        )}

        {bids.map((b, i) => (
          <div
            key={i}
            className="p-3 bg-black/20 border border-gray-50/5 rounded-lg mb-3"
          >
            {/* MARKET NAME */}
            <p className="text-sm">
              <span className="text-gray-200 uppercase">Market: </span>
              {b.market_name}
            </p>

            {/* GAME TYPE */}
            <p className="text-sm">
              <span className="text-gray-200">Game: </span>
              {b.game_type}
            </p>

            {/* DIGIT DISPLAY */}
            <p className="text-sm">
              <span className="text-gray-200">
                {b.game_type === "jodi"
                  ? "Jodi"
                  : b.session === "open"
                  ? "Open Digit"
                  : "Close Digit"}
                :{" "}
              </span>

              {b.game_type === "jodi"
                ? `${b.open_digit}${b.close_digit}`
                : b.session === "open"
                ? b.open_digit
                : b.close_digit}
            </p>

            {/* POINTS */}
            <p className="text-sm">
              <span className="text-gray-200">Points: </span>
              {b.points}
            </p>

            {/* TIME FORMAT IMPROVED */}
            <p className="text-xs text-gray-400 mt-1">
              {new Date(
                new Date(b.created_at).getTime() + 5.5 * 60 * 60 * 1000
              ).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
              })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
