// src/pages/MatkaGame.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { CheckCircle, XCircle, Loader, ArrowLeft } from "lucide-react";
import { API_URL } from "../config";

const API_BASE = `${API_URL}`;

// ======================= HELPERS =======================
const slugToGameType = (slug = "") => {
  const s = slug.replace(/-/g, "_");

  if (["single_digit", "single"].includes(s)) return "single";
  if (["jodi_digit", "jodi"].includes(s)) return "jodi";
  if (["single_panna"].includes(s)) return "single_panna";
  if (["double_panna"].includes(s)) return "double_panna";
  if (["triple_panna"].includes(s)) return "triple_panna";
  if (["sp"].includes(s)) return "sp";
  if (["dp"].includes(s)) return "dp";
  if (["tp"].includes(s)) return "tp";
  if (["half_sangam"].includes(s)) return "half_sangam";
  if (["full_sangam"].includes(s)) return "full_sangam";

  return s;
};

const prettyName = (slug = "") =>
  slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function validateDigitFrontend(game_type, digit) {
  if (!digit) throw new Error("Digit / panna is required.");

  if (game_type === "single" && !/^\d$/.test(digit))
    throw new Error("Single must be exactly 1 digit.");

  if (game_type === "jodi" && !/^\d{2}$/.test(digit))
    throw new Error("Jodi must be exactly 2 digits.");

  if (
    ["single_panna", "double_panna", "triple_panna", "sp", "dp", "tp"].includes(
      game_type
    ) &&
    !/^\d{3}$/.test(digit)
  )
    throw new Error("Panna must be exactly 3 digits.");

  if (game_type === "half_sangam" && !/^\d{3}-\d$/.test(digit))
    throw new Error("Half Sangam must be in format 123-4");

  if (game_type === "full_sangam" && !/^\d{3}-\d{3}$/.test(digit))
    throw new Error("Full Sangam must be in format 123-456");
}

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

// ======================= MAIN =======================
export default function MatkaGame() {
  const { marketId, gameId } = useParams();
  const gameType = useMemo(() => slugToGameType(gameId), [gameId]);
  console.log(gameType);
  const displayGame = prettyName(gameId);

  // Market info
  const [market, setMarket] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form
  const [session, setSession] = useState("open");
  const [points, setPoints] = useState("");

  // Digit fields
  const [digit, setDigit] = useState("");
  const [openPanna, setOpenPanna] = useState("");
  const [closePanna, setClosePanna] = useState("");
  const [openDigit, setOpenDigit] = useState("");
  const [closeDigit, setCloseDigit] = useState("");

  const [msg, setMsg] = useState(null);
  const token = localStorage.getItem("accessToken");

  const authHeader = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  // ======================= FETCH MARKET =======================
  const fetchMarket = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/admin/market`, {
        headers: authHeader,
      });

      console.log(res);

      const list = res.data.data;
      const found = list.find((m) => m._id?.$oid === marketId);

      setMarket(found || null);
    } catch {
      setMarket(null);
    }
    setLoading(false);
  }, [marketId, authHeader]);

  useEffect(() => {
    fetchMarket();
  }, [fetchMarket]);

  // ======================= ASSEMBLE SANGAM =======================
  const assembledDigit = () => {
    if (gameType === "half_sangam") {
      if (openPanna && closeDigit) return `${openPanna}-${closeDigit}`;
      if (closePanna && openDigit) return `${closePanna}-${openDigit}`;
      return digit;
    }
    if (gameType === "full_sangam") {
      if (openPanna && closePanna) return `${openPanna}-${closePanna}`;
      return digit;
    }
    return digit;
  };

  function getISTISOString() {
    const now = new Date();

    // IST offset = +5:30 in minutes
    const istOffset = 5.5 * 60 * 60 * 1000;

    const istTime = new Date(now.getTime() + istOffset);

    return istTime.toISOString().replace("Z", "+05:30");
  }

  const bid_time = getISTISOString();
  // console.log(bid_time);

  // ======================= PLACE BID =======================
  const placeBid = async (e) => {
    e.preventDefault();
    setMsg(null);

    try {
      if (!points || Number(points) <= 0)
        throw new Error("Points must be greater than 0");

      const finalDigit = assembledDigit();
      validateDigitFrontend(gameType, finalDigit);

      const payload = {
        market_id: marketId,
        game_type: gameType,
        session,
        points: Number(points),
        // bid_time: getISTISOString(),
      };

      if (gameType === "full_sangam") {
        const [o, c] = finalDigit.split("-");
        payload.open_panna = o;
        payload.close_panna = c;
      } else if (gameType === "half_sangam") {
        if (openPanna && closeDigit) {
          payload.open_panna = openPanna;
          payload.close_digit = closeDigit;
        } else if (closePanna && openDigit) {
          payload.close_panna = closePanna;
          payload.open_digit = openDigit;
        } else {
          payload.digit = finalDigit;
        }
      } else {
        payload.digit = finalDigit;
      }

      const res = await axios.post(
        `${API_BASE}/user/bid/place`,
        {},
        {
          params: payload,
          headers: authHeader,
        }
      );

      console.log(res);

      setMsg({ type: "success", text: "Bid placed successfully!" });

      // setTimeout(() => {
      //   window.location.reload();
      // }, 2000);

      setDigit("");
      setOpenPanna("");
      setClosePanna("");
      setOpenDigit("");
      setCloseDigit("");
      setPoints("");
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message || "Bid failed.";
      setMsg({ type: "error", text: errMsg });
    }
  };

  // ======================= UI =======================
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <Loader className="animate-spin" /> Loading...
      </div>
    );

  if (!market)
    return <div className="text-center text-red-400 p-6">Market Not Found</div>;

  return (
    <div className="max-w-md mx-auto min-h-screen  text-white">
      <div className="w-full relative bg-gradient-to-b from-black to-black/0 py-2 flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="p-2 pl-4 z-10 rounded-full hover:bg-white/10 transition"
        >
          <ArrowLeft size={22} />
        </button>
        <h2 className="text-md z-0 w-full absolute   justify-between font-bold bg-gradient-to-b from-black to-black/0 px-4 py-2  flex justify-center items-center gap-2">
          <span className="flex gap-2  items-center uppercase">
            {market.name} — {displayGame}
          </span>
        </h2>
        <a className="pr-4 z-10"></a>
      </div>
      <p className="text-xs bg-white/5 flex justify-between px-3 py-3 rounded-b-lg text-gray-300 mb-4">
        <span className="flex flex-col">
          <strong>Open Time :</strong> <span>{market.open_time}</span>
        </span>
        {market.marketType !== "Starline" ? (
          <span className="flex flex-col">
            <strong>Close Time :</strong>

            <span>{market.close_time}</span>
          </span>
        ) : (
          ""
        )}
        <span className="flex flex-col">
          <strong>Status:</strong>
          <span
            className={`${
              market.status === true ? "text-green-400" : "text-red-400"
            }`}
          >
            {market.status === true ? "Market Running" : "Market Closed"}
          </span>
        </span>
      </p>

      <Message type={msg?.type} text={msg?.text} />

      <form
        onSubmit={placeBid}
        className="bg-white/5 p-4 mx-3 mt-3 rounded-lg border border-gray-800"
      >
        {/* SESSION */}
        <div className="mb-3 text-sm text-gray-300">
          <label className="mr-3">
            <input
              type="radio"
              value="open"
              checked={session === "open"}
              onChange={() => setSession("open")}
              className="accent-purple-600 mr-1"
            />
            Open
          </label>

          {market.marketType !== "Starline" ? (
            <label className="ml-3">
              <input
                type="radio"
                value="close"
                checked={session === "close"}
                onChange={() => setSession("close")}
                className="accent-purple-600 mr-1"
              />
              Close
            </label>
          ) : (
            ""
          )}
        </div>

        {/* DIGIT INPUTS */}
        <div className="mb-3">
          <label className="block text-sm text-gray-300 mb-1">
            Digit / Panna
          </label>

          {/* HALF SANGAM */}
          {gameType === "half_sangam" && (
            <>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  placeholder="Open Panna (123)"
                  value={openPanna}
                  onChange={(e) =>
                    setOpenPanna(e.target.value.replace(/\D/g, "").slice(0, 3))
                  }
                  className="p-2 bg-black/30 rounded border text-white"
                />
                <input
                  placeholder="Close Digit (4)"
                  value={closeDigit}
                  onChange={(e) =>
                    setCloseDigit(e.target.value.replace(/\D/g, "").slice(0, 1))
                  }
                  className="p-2 bg-black/30 rounded border text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  placeholder="Close Panna (123)"
                  value={closePanna}
                  onChange={(e) =>
                    setClosePanna(e.target.value.replace(/\D/g, "").slice(0, 3))
                  }
                  className="p-2 bg-black/30 rounded border text-white"
                />
                <input
                  placeholder="Open Digit (4)"
                  value={openDigit}
                  onChange={(e) =>
                    setOpenDigit(e.target.value.replace(/\D/g, "").slice(0, 1))
                  }
                  className="p-2 bg-black/30 rounded border text-white"
                />
              </div>

              <input
                placeholder="OR Combined (123-4)"
                value={digit}
                onChange={(e) =>
                  setDigit(e.target.value.replace(/[^\d-]/g, ""))
                }
                className="p-2 bg-black/30 rounded border w-full text-white"
              />
            </>
          )}

          {/* FULL SANGAM */}
          {gameType === "full_sangam" && (
            <>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  placeholder="Open Panna (123)"
                  value={openPanna}
                  onChange={(e) =>
                    setOpenPanna(e.target.value.replace(/\D/g, "").slice(0, 3))
                  }
                  className="p-2 bg-black/30 rounded border text-white"
                />

                <input
                  placeholder="Close Panna (456)"
                  value={closePanna}
                  onChange={(e) =>
                    setClosePanna(e.target.value.replace(/\D/g, "").slice(0, 3))
                  }
                  className="p-2 bg-black/30 rounded border text-white"
                />
              </div>

              <input
                placeholder="OR Combined (123-456)"
                value={digit}
                onChange={(e) =>
                  setDigit(e.target.value.replace(/[^\d-]/g, ""))
                }
                className="p-2 bg-black/30 rounded border w-full text-white"
              />
            </>
          )}

          {/* NORMAL GAMES */}
          {gameType !== "half_sangam" && gameType !== "full_sangam" && (
            <input
              placeholder="Enter Digit"
              value={digit}
              onChange={(e) => setDigit(e.target.value.replace(/\D/g, ""))}
              className="p-2 bg-black/30 rounded border w-full text-white"
            />
          )}
        </div>

        {/* POINTS */}
        <div className="mb-3">
          <label className="block text-sm text-gray-300 mb-1">Points</label>
          <input
            placeholder="Points"
            value={points}
            onChange={(e) => setPoints(e.target.value.replace(/\D/g, ""))}
            className="p-2 bg-black/30 rounded border w-full text-white"
          />
        </div>

        <button className="w-full bg-gradient-to-r from-purple-700 to-purple-900 py-3 rounded-lg font-semibold">
          Place Bid
        </button>
      </form>
    </div>
  );
}
