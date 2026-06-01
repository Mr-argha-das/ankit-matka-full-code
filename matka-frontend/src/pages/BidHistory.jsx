// src/pages/BidHistory.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { ArrowLeft, Loader } from "lucide-react";

const API_BASE = `${API_URL}`;

export default function BidHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [selectedType, setSelectedType] = useState("All"); // <-- FILTER STATE
  const [marketCache, setMarketCache] = useState({}); // <-- MARKET DATA CACHE

  const token = localStorage.getItem("accessToken");

  const authHeader = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  // Fetch market details by ID
  const fetchMarketInfo = useCallback(
    async (marketId) => {
      if (!marketId) return null;

      // Already cached?
      if (marketCache[marketId]) return marketCache[marketId];

      try {
        const res = await axios.get(
          `${API_BASE}/api/admin/market/${marketId}`,
          {
            headers: authHeader,
          }
        );

        const data = res?.data?.data;
        if (data) {
          setMarketCache((prev) => ({
            ...prev,
            [marketId]: data,
          }));
          return data;
        }
      } catch (err) {
        console.log("Market fetch failed:", marketId, err);
      }
      return null;
    },
    [authHeader, marketCache]
  );

  // Fetch History
  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get(`${API_BASE}/bid/my-bids`, {
        headers: authHeader,
      });

      const rawHistory = Array.isArray(res.data)
        ? res.data
        : res.data.history || [];

      // Attach market info for each history item
      const historyWithMarket = await Promise.all(
        rawHistory.map(async (item) => {
          const market = await fetchMarketInfo(item.market_id);
          return { ...item, market };
        })
      );

      setHistory(historyWithMarket);
    } catch (err) {
      console.warn(
        "Failed to fetch history:",
        err?.response?.data || err.message
      );
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [authHeader, fetchMarketInfo]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // FILTERED HISTORY
  const filteredHistory = useMemo(() => {
    if (selectedType === "All") return history;

    return history.filter((h) => h.market?.marketType === selectedType);
  }, [history, selectedType]);

  return (
    <div className="max-w-md mx-auto pb-30 text-white font-sans min-h-screen">
      {/* Header */}
      <div className="w-full mb-2 relative bg-gradient-to-b from-black to-black/0 py-2 flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="p-2 pl-4 z-10 rounded-full hover:bg-white/10 transition"
        >
          <ArrowLeft size={22} />
        </button>

        <h2 className="text-md z-0 absolute top-2 w-full text-center font-bold">
          Bid History
        </h2>

        <div className="pr-4 z-10"></div>
      </div>

      {/* FILTER DROPDOWN */}
      <div className="px-4 mb-4">
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full bg-white/10 text-white p-2 rounded-md border border-white/20"
        >
          <option value="All">All Markets</option>
          <option value="Market">Market</option>
          <option value="Starline">Starline</option>
        </select>
      </div>

      {/* CONTENT */}
      {loadingHistory ? (
        <div className="text-center text-gray-400">
          <Loader className="animate-spin inline-block" /> Loading...
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="text-gray-500 text-center">No bids found.</div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((h) => (
            <div
              key={h.id}
              className="bg-white/5 p-3 mx-3 mt-1 rounded-lg border border-gray-50/10"
            >
              {/* MARKET NAME + TYPE */}
              <p className="text-sm font-semibold">
                {h.market?.name || "Unknown Market"}{" "}
                <span className="text-gray-400 text-xs">
                  ({h.market?.marketType})
                </span>
              </p>

              {/* BID INFO */}
              <p className="text-gray-300">
                {(h.game_type || "").replace(/_/g, " ")} — {h.session}
              </p>
              <p className="text-gray-300">Digit: {h.digit}</p>
              <p className="text-gray-300">Points: {h.points}</p>

              <p className="text-xs text-gray-500 mt-1">
                {new Date(
                  new Date(h.created_at).getTime() + 5.5 * 60 * 60 * 1000
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
      )}
    </div>
  );
}
