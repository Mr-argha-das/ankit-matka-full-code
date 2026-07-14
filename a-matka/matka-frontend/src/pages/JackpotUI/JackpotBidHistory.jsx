import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../../config";
import { Star } from "lucide-react";

const API_BASE = `${API_URL}/starline_jackpot`;

const JackpotBidHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("accessToken");

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  // Format Game Name
  const formatGameName = (str = "") =>
    str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // Fetch Bid History API
  const fetchHistory = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/jackpot/bid/history`,
        authHeader
      );

      // FIX: match working component behavior
      const list = Array.isArray(res.data) ? res.data : res.data.history || [];

      setHistory(list);
    } catch (err) {
      console.log("Error loading history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading) {
    return <p className="text-gray-400 text-center py-6">Loading history...</p>;
  }

  return (
    <section className="max-w-md mx-auto font-sans  text-white">
      <div className="w-full bg-gradient-to-b from-black to-black/0 text-white py-4 flex items-center justify-center relative  ">
        <h1 className="text-lg font-semibold text-white tracking-wide">
          Starline Bid History
        </h1>
      </div>

      {history.length === 0 ? (
        <p className="text-gray-500 text-center">No bidding history found.</p>
      ) : (
        <div className="space-y-3 px-3 pt-1 pb-14">
          {history.map((b, i) => (
            <div
              key={i}
              className="bg-white/20 border border-gray-700 p-3 rounded-lg"
            >
              <p className="text-sm">
                <span className="text-white">Game:</span>{" "}
                {formatGameName(b.game)}
              </p>

              <p className="text-sm">
                <span className="text-white">Digit:</span> {b.digit}
              </p>

              <p className="text-sm">
                <span className="text-white">Points:</span> {b.points}
              </p>

              <p className="text-xs text-gray-300 mt-1">
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
      )}
    </section>
  );
};

export default JackpotBidHistory;
