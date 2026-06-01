import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { API_URL } from "../../../config";

// const API_URL = "https://api.kalyanratan777.com";

export default function WinHistory() {
  const token = localStorage.getItem("token");

  /* ================= STATES ================= */
  const [date, setDate] = useState(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60000);
    return local.toISOString().split("T")[0];
  });
  //
  const [marketId, setMarketId] = useState("all");
  const [gameType, setGameType] = useState("all");
  const [session, setSession] = useState("all");
  const [search, setSearch] = useState("");

  const [markets, setMarkets] = useState([]);
  const [winningData, setWinningData] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  /* ================= HELPERS ================= */
  const formatDateForAPI = (dateStr) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  /* ================= FETCH MARKETS ================= */
  const fetchMarkets = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/market`, {
        headers,
      });
      setMarkets(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error("Market fetch error", err);
    }
  };

  /* ================= FETCH WINNING ================= */
  const fetchWinning = useCallback(async () => {
    if (!date) return;

    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_URL}/admin/win/history`, {
        headers,
        params: {
          date: formatDateForAPI(date),
          market_id: marketId,
          game_type: gameType,
          session,
          search: search.trim(),
        },
      });

      console.log(res);

      setWinningData(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      setError("Failed to load winning data");
    } finally {
      setLoading(false);
    }
  }, [date, marketId, gameType, session, search]);

  /* ================= EFFECTS ================= */

  // Load markets once
  useEffect(() => {
    fetchMarkets();
  }, []);

  // SINGLE debounced effect for ALL filters
  useEffect(() => {
    const delay = setTimeout(() => {
      fetchWinning();
    }, 400);

    return () => clearTimeout(delay);
  }, [fetchWinning]);

  /* ================= RESET ================= */
  const handleReset = () => {
    const today = new Date().toISOString().split("T")[0];

    setDate(today);
    setMarketId("all");
    setGameType("all");
    setSession("all");
    setSearch("");
    setError("");
  };

  const marketss = useMemo(() => {
    const s = new Set();
    winningData.forEach((b) => b.market && s.add(b.market));
    return ["all", ...Array.from(s)];
  }, [winningData]);

  console.log(markets);

  // console.log("marketss", marketss);
  const gameTypes = useMemo(() => {
    const s = new Set();
    winningData.forEach((b) => b.game_type && s.add(b.game_type));
    return ["all", ...Array.from(s)];
  }, [winningData]);

  const formatWinAmount = (amount) => {
    if (!amount) return 0;
    return Number(amount) / 10;
  };
  /* ================= UI ================= */
  return (
    <div className="p-6 text-white">
      <h2 className="text-xl font-semibold mb-4">Winning History</h2>

      {/* ================= FILTERS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3  lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-6">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-transparent border border-white/20 px-3 py-2 rounded"
        />

        <select
          value={marketId}
          onChange={(e) => setMarketId(e.target.value)}
          className=" text-white border border-white/20 px-3 py-2 rounded"
        >
          <option value="all" className="">
            All Markets
          </option>

          {markets.map((m) => (
            <option
              key={m._id?.$oid || m._id}
              value={m._id?.$oid || m._id}
              className=""
            >
              {m.name}
            </option>
          ))}
        </select>

        <select
          value={gameType}
          onChange={(e) => setGameType(e.target.value)}
          className=" text-white border border-white/20 px-3 py-2 rounded"
        >
          {gameTypes.map((g) => (
            <option key={g} value={g}>
              {g === "all" ? "All Types" : g}
            </option>
          ))}
        </select>

        <select
          value={session}
          onChange={(e) => setSession(e.target.value)}
          className=" text-white border border-white/20 px-3 py-2 rounded"
        >
          <option value="all">All Sessions</option>
          <option value="open">Open</option>
          <option value="close">Close</option>
        </select>

        <input
          type="text"
          placeholder="Search name / mobile"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border border-white/20 px-3 py-2 rounded"
        />

        <button
          onClick={handleReset}
          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded px-4 py-2"
        >
          Remove Filters
        </button>
      </div>

      {/* ================= TABLE ================= */}
      {loading && <p className="text-gray-400">Loading...</p>}
      {error && <p className="text-red-400">{error}</p>}

      {!loading && winningData.length === 0 && (
        <p className="text-gray-400">No data found</p>
      )}

      {winningData.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border border-white/10">
            <thead className="bg-white/5">
              <tr>
                <th className="p-2">Name</th>
                <th className="p-2">Mobile</th>
                <th className="p-2">Market</th>
                <th className="p-2">Game</th>
                <th className="p-2">Digit</th>
                <th className="p-2">Session</th>
                <th className="p-2">Points</th>
                <th className="p-2 min-w-30">Win Amount</th>
                <th className="p-2">Status</th>
                <th className="p-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {winningData.map((w) => (
                <tr key={w.bid_id} className="border-t border-white/10">
                  <td className="p-2">{w.name}</td>
                  <td className="p-2">{w.mobile}</td>
                  <td className="p-2 min-w-60">{w.market}</td>
                  <td className="p-2">{w.game_type}</td>
                  <td className="p-2">{w.digit}</td>
                  <td className="p-2">{w.session}</td>
                  <td className="p-2">{w.points}</td>
                  <td className="p-2 text-green-400">
                    ₹{formatWinAmount(w.win_amount)}
                  </td>
                  <td className="p-2">{w.status}</td>
                  {/* <td className="p-2">{w.created_at}</td> */}
                  <td className="p-2 min-w-30">
                    {new Date(
                      new Date(w.created_at).getTime() +
                        (5 * 60 + 30) * 60 * 1000
                    ).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
