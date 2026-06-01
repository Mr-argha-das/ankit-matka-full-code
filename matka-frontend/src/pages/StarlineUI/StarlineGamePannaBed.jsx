import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, BarChart2 } from "lucide-react";
import { API_URL } from "../../config";

const API_BASE = `${API_URL}/starline_jackpot`;

export default function StarlineGamePannaBed() {
  const { marketId, gameId } = useParams();

  console.log(gameId);
  const [market, setMarket] = useState(null);
  const [digit, setDigit] = useState("");
  const [points, setPoints] = useState("");
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);

  // --------------------------------------------
  // TOKEN CONFIG
  // --------------------------------------------
  const token = localStorage.getItem("accessToken");

  const authHeader = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // GAME NAME FORMATTER
  const formatGameName = (str) =>
    str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const gameName = formatGameName(gameId);
  const apiGameName = gameId.replace(/-/g, "_"); // required for API

  // -----------------------------
  // FETCH STARLINE SLOT DETAILS
  // -----------------------------
  const fetchMarket = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/starline/${marketId}`,
        authHeader
      );
      setMarket(res.data);
    } catch (err) {
      console.error("Error loading market:", err);
    }
  };
  const handleDigitChange = (value) => {
    // allow only numeric characters
    const clean = value.replace(/\D/g, "");

    if (gameId === "single-digit" || gameId === "single_digit") {
      if (clean.length <= 1) setDigit(clean);
    } else if (
      gameId === "single-panna" ||
      gameId === "double-panna" ||
      gameId === "triple-panna" ||
      gameId === "single_panna" ||
      gameId === "double_panna" ||
      gameId === "triple_panna"
    ) {
      if (clean.length <= 3) setDigit(clean);
    }
  };

  // -----------------------------
  // FETCH CURRENT RESULT
  // -----------------------------
  const fetchResult = async () => {
    try {
      const res = await axios.get(`${API_BASE}/starline/result/get`, {
        params: { slot_id: marketId },
        ...authHeader,
      });
      setResult(res.data);
    } catch (err) {
      console.error("Error loading result:", err);
    }
  };

  // -----------------------------
  // FETCH USER BID HISTORY
  // -----------------------------
  const fetchHistory = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/starline/bid/history`,
        authHeader
      );
      setHistory(res.data);
    } catch (err) {
      console.error("Error loading history:", err);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchMarket();
      await fetchResult();
      await fetchHistory();
      setLoading(false);
    })();
  }, [marketId]);

  // -----------------------------
  // PLACE BID API
  // -----------------------------
  const placeBid = async () => {
    setMessage("");

    if (!digit || !points) {
      setMessage("Please enter digit and points.");
      return;
    }

    try {
      const res = await axios.post(
        `${API_BASE}/starline/bid`,
        {},
        {
          params: {
            slot_id: marketId,
            game_type: apiGameName,
            digit: digit,
            points: Number(points),
          },
          ...authHeader,
        }
      );

      setMessage(res.data.msg);
      setDigit("");
      setPoints("");

      fetchHistory(); // refresh history after placing bid
    } catch (err) {
      setMessage(err.response?.data?.detail || "Error placing bid");
    }
  };

  // -----------------------------
  // LOADING SCREEN
  // -----------------------------
  if (loading) {
    return (
      <div className="text-white min-h-screen flex justify-center items-center bg-black">
        <h1 className="text-xl animate-pulse">Loading...</h1>
      </div>
    );
  }

  console.log("market", market);
  return (
    <div className="max-w-md mx-auto text-white min-h-screen pb-24">
      {/* HEADER */}

      <div className="w-full bg-gradient-to-b from-black to-black/0 text-white py-4 flex items-center justify-center relative  ">
        <h1 className="text-xl font-semibold text-white tracking-wide">
          {market.name.toUpperCase()} - {gameName}
        </h1>
      </div>

      {/* MARKET INFO */}
      <div className="p-4 flex items-center justify-between border-b border-purple-900 text-sm">
        <p>
          <span className="text-gray-300  flex flex-col gap-0 items-center">
            Open:
          </span>{" "}
          {market.start_time || "—"}
        </p>
        <p>
          <span className="text-gray-300  flex flex-col gap-0 items-center">
            Close:{" "}
          </span>{" "}
          {market.end_time || "—"}
        </p>

        <p className=" flex flex-col gap-0 items-center">
          Status:
          <span
            className={`px-2 py-0.5 font-medium rounded-lg text-sm ${
              market.status === "Market Running"
                ? "text-green-600"
                : "text-red-500"
            }`}
          >
            {market.status === "Market Running" ? "LIVE" : "CLOSED"}
          </span>
        </p>
      </div>

      {/* RESULT BOX */}
      <div className="p-4 border-b border-purple-900">
        <h2 className="font-bold text-purple-300">Latest Result</h2>

        {result?.panna ? (
          <div className="mt-2 text-center">
            <p className="text-lg font-bold text-yellow-400">{result.panna}</p>
            <p className="text-sm text-gray-400">{result.date}</p>
          </div>
        ) : (
          <p className="text-gray-500 mt-2">No result yet</p>
        )}
      </div>

      {/* BID FORM */}
      <div className="p-4">
        <h2 className="text-md font-bold mb-3">Place Your Bid</h2>

        <input
          type="text"
          inputMode="numeric"
          placeholder="Enter Digit / Panna"
          value={digit}
          disabled={market.status !== "Market Running"}
          onChange={(e) => handleDigitChange(e.target.value)}
          className="w-full p-2.5 rounded-lg border text-white mb-3 outline-none"
          maxLength={
            gameId === "single_digit" || gameId === "single-digit" ? 1 : 3
          }
        />
        <input
          type="number"
          disabled={market.status !== "Market Running"}
          placeholder="Enter Points"
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          className="w-full p-2.5 rounded-lg  border text-white mb-3 outline-none"
        />

        <button
          disabled={market.status !== "Market Running"}
          onClick={placeBid}
          className={` ${
            market.status !== "Market Running"
              ? "opacity-50 cursor-not-allowed"
              : ""
          } w-full bg-gradient-to-bl from-[#212b61] to-[#79049a] text-white py-3 rounded-lg font-bold`}
        >
          Submit Bid
        </button>

        {message && (
          <p className="mt-4 text-center font-semibold text-red-400">
            {message}
          </p>
        )}
      </div>

      {/* BID HISTORY */}
      <div className="p-4 border-t border-purple-900 mt-4">
        <h2 className="text-lg font-bold mb-3 text-white">Your Bid History</h2>

        {history.length === 0 ? (
          <p className="text-gray-500">No bidding history found.</p>
        ) : (
          <div className="space-y-3">
            {history.map((b, i) => (
              <div
                key={i}
                className="bg-white/20 border border-gray-700 p-3 rounded-lg"
              >
                <p className="text-sm">
                  <span className="text-white">Game:</span>{" "}
                  {formatGameName(b.game.replace(/_/g, " "))}
                </p>

                <p className="text-sm">
                  <span className="text-white">Digit:</span> {b.digit}
                </p>

                <p className="text-sm">
                  <span className="text-white">Points:</span> {b.points}
                </p>

                <p className="text-xs text-gray-300 mt-1">
                  {new Date(b.time).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
