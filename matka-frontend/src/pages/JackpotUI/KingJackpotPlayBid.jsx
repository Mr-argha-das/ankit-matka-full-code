import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../config";
import { ArrowLeft, CheckCircle, Loader, XCircle } from "lucide-react";

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export default function KingJackpotPlayBid() {
  const { marketId, gameId } = useParams();
  const token = localStorage.getItem("accessToken") || "";
  const headers = { Authorization: `Bearer ${token}` };

  const [digit, setDigit] = useState("");
  const [points, setPoints] = useState("");
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marketName, setMarketName] = useState("");
  const [market, setMarket] = useState("");
  const [msg, setMsg] = useState(null);

  const date = todayISO();

  const loadAllUserBids = async () => {
    try {
      const token = localStorage.getItem("accessToken") || "";
      const headers = { Authorization: `Bearer ${token}` };

      const res = await axios.get(`${API_URL}/api/admin/Golidesawar/bids/all`, {
        headers,
      });

      console.log("ALL BIDS:", res.data);
      return res.data.data; // array of all bids
    } catch (err) {
      console.error("Failed to load all bids", err);
      return [];
    }
  };

  // ⭐ Message Component
  const Message = ({ type, text }) => {
    if (!text) return null;

    return (
      <div
        className={`p-3 mx-3 rounded-lg mb-4 flex items-center gap-3 ${
          type === "success"
            ? "bg-green-900 text-green-200"
            : type === "error"
            ? "bg-red-900 text-red-200"
            : "bg-blue-900 text-blue-200"
        }`}
      >
        {type === "success" && <CheckCircle />}
        {type === "error" && <XCircle />}
        {type === "info" && <Loader className="animate-spin" />}
        {text}
      </div>
    );
  };

  // NORMALIZE GAME TYPE
  let selectedGame = gameId?.toLowerCase();

  const gameType =
    selectedGame === "open-digit"
      ? "open"
      : selectedGame === "close-digit"
      ? "close"
      : "jodi";

  const session = gameType; // SAME AS BACKEND

  // INPUT LIMITING
  const handleDigit = (v) => {
    const val = v.replace(/\D/g, "");
    if (gameType === "jodi") {
      if (val.length <= 2) setDigit(val);
    } else {
      if (val.length <= 1) setDigit(val);
    }
  };

  // FETCH USER BIDS
  const loadUserBids = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/Golidesawar/bids`, {
        params: { market_id: marketId, date },
        headers,
      });
      setBids(res.data?.data || []);
    } catch (e) {
      console.log("bids", e);
    }
  };

  // FETCH MARKET
  const loadMarket = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/admin/Golidesawar/market/${marketId}`,
        { headers }
      );
      setMarket(res?.data?.data || "");
      setMarketName(res.data?.data?.name || "");
    } catch (e) {
      console.log("market", e);
    }
  };

  useEffect(() => {
    (async () => {
      await loadMarket();
      await loadUserBids();
      setLoading(false);
    })();
  }, [marketId]);

  useEffect(() => {
    (async () => {
      const allBids = await loadAllUserBids();
      setBids(allBids);
    })();
  }, [marketId]);

  // ===================== SUBMIT BID =====================
  const submitBid = async () => {
    setMsg(null);

    if (!digit) return setMsg({ type: "error", text: "Enter digit first." });

    if (!points || points <= 0)
      return setMsg({ type: "error", text: "Enter valid points." });

    // if (bids.length > 0)
    //   return setMsg({ type: "error", text: "You already placed a bid today." });

    const payload = {
      market_id: marketId,
      game_type: gameType,
      digit,
      points: Number(points),
    };

    try {
      const res = await axios.post(
        `${API_URL}/api/admin/Golidesawar/bid`,
        payload,
        {
          headers,
        }
      );

      await loadUserBids();

      setMsg({ type: "success", text: "Bid placed successfully!" });

      setDigit("");
      setPoints("");
    } catch (err) {
      setMsg({
        type: "error",
        text: err.response?.data?.detail || "Error placing bid.",
      });
    }
  };

  // ===================== LOADING =====================
  if (loading)
    return (
      <div className="min-h-screen text-white flex justify-center items-center">
        Loading...
      </div>
    );

  return (
    <div className="max-w-md mx-auto text-white pb-20">
      {/* HEADER */}
      <div className="w-full relative bg-gradient-to-b from-black to-black/0 py-2 flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="p-2 pl-4 z-10 rounded-full hover:bg-white/10 transition"
        >
          <ArrowLeft size={22} />
        </button>
        <h2 className="text-xl z-0 w-full absolute font-bold px-4 py-2 flex justify-center items-center gap-2">
          <span className="uppercase">
            {marketName} – {gameType.toUpperCase()}
          </span>
        </h2>
      </div>
      <p className="text-xs bg-white/5 flex justify-between px-4 py-3 rounded-b-lg text-gray-300 mb-4">
        <span className="flex flex-col">
          <strong>Open Time :</strong> <span>{market.open_time}</span>
        </span>
        <span className="flex flex-col">
          <strong>Close Time :</strong>

          <span>{market.close_time}</span>
        </span>
        <span className="flex flex-col">
          <strong>Status:</strong>
          <span
            className={`font-bold rounded-full text-xs ${
              market.status === true ? "text-green-600" : "text-red-600"
            }`}
          >
            {market.status === true ? "Market Running" : "Market Closed"}
          </span>
        </span>
      </p>

      {/* MESSAGE */}
      <Message type={msg?.type} text={msg?.text} />

      {/* FORM BOX */}
      <div className="bg-white/5 p-4 mx-3 mt-3 rounded-xl border border-gray-50/5">
        {/* DIGIT */}
        <label className="text-sm mb-1 block">Digit :</label>
        <input
          type="text"
          value={digit}
          onChange={(e) => handleDigit(e.target.value)}
          className="w-full px-3 py-2 mt-1 rounded border border-gray-50/5 mb-4 "
          placeholder={
            gameType === "jodi"
              ? "Enter Jodi (00-99)"
              : "Enter Single Digit (0-9)"
          }
        />

        {/* POINTS */}
        <label className="text-sm mb-1 block">Points :</label>
        <input
          type="number"
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          className="w-full px-3 py-2 mt-1 rounded border border-gray-50/5 mb-4 "
          placeholder="Enter Points"
        />

        {/* SUBMIT BUTTON */}
        <button
          onClick={submitBid}
          className="w-full bg-gradient-to-tl from-[#212b61] to-[#79049a] text-white font-semibold py-3 rounded-lg hover:opacity-90 transition"
        >
          Place Bid
        </button>
      </div>

      {/* <div className="mt-5 bg-whit mx-3 rounded-xl bor border-gray-50/5">
        <h3 className="text-lg font-bold mb-2">Your Bids ({date})</h3>

        {bids.length === 0 && (
          <p className="text-gray-400 text-sm">No bids today.</p>
        )}

        {bids.map((b, i) => (
          <div
            key={i}
            className="p-3 bg-white/5 border border-gray-50/5 rounded-lg mb-3"
          >
            <p className="text-sm">
              <span className="text-gray-200">Game: </span>
              {b.game_type}
            </p>

            <p className="text-sm">
              <span className="text-gray-200">
                {b.game_type === "jodi"
                  ? "Jodi"
                  : b.session === "open"
                  ? "Open Digit"
                  : "Close Digit"}
                :
              </span>{" "}
              {b.game_type === "jodi"
                ? `${b.open_digit}${b.close_digit}`
                : b.session === "open"
                ? b.open_digit
                : b.close_digit}
            </p>
            <p className="text-sm">
              <span className="text-gray-200">Points: </span>
              {b.points}
            </p>

            <p className="text-xs text-gray-400 mt-1">
              {new Date(b.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div> */}
    </div>
  );
}
