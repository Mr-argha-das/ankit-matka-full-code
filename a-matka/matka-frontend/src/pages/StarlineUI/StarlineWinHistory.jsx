import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../../config";
import { Trophy } from "lucide-react";

const API_BASE = `${API_URL}/starline_jackpot`;

const StarlineWinHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("accessToken");

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  // Format text (single_panna → Single Panna)
  const formatGameName = (str = "") =>
    str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // Fetch Win History API
  const fetchHistory = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/starline/winning/history`,
        authHeader
      );

      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log("Error loading win history:", err);
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
    <section className="max-w-md mx-auto font-sans text-white">
      {/* HEADER */}
      <div className="w-full bg-gradient-to-b from-black to-black/0 text-white py-4 flex items-center justify-center relative">
        <h1 className="text-lg font-semibold tracking-wide flex items-center gap-2">
          <Trophy size={18} className="text-yellow-400" />
          Starline Win History
        </h1>
      </div>

      {/* NO DATA */}
      {history.length === 0 ? (
        <p className="text-gray-500 text-center mt-6">
          No winning history found.
        </p>
      ) : (
        <div className="space-y-3 px-3 pt-1 pb-14">
          {history.map((w, i) => (
            <div
              key={i}
              className="bg-white/20 border border-gray-700 p-3 rounded-lg"
            >
              <p className="text-sm">
                <span className="text-white">Game:</span>{" "}
                {formatGameName(w.game)}
              </p>

              <p className="text-sm">
                <span className="text-white">Digit:</span> {w.digit}
              </p>

              <p className="text-sm">
                <span className="text-white">Points:</span> {w.points}
              </p>

              <p className="text-sm text-green-300 font-bold">
                Winning: ₹{w.winning_amount}
              </p>

              <p className="text-xs text-gray-300 mt-2">
                {new Date(w.date).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default StarlineWinHistory;
