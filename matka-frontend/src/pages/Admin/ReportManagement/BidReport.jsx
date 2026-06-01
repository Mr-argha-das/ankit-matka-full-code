// src/pages/BidHistory.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Loader, Trash2 } from "lucide-react";
import { API_URL } from "../../../config";

export default function BidReport() {
  const [loading, setLoading] = useState(false);
  const [bids, setBids] = useState([]);
  const [error, setError] = useState(null);
  console.log(bids);
  // Filters (frontend)
  const [date, setDate] = useState("");
  const [marketId, setMarketId] = useState("all");
  const [gameType, setGameType] = useState("all");
  const [session, setSession] = useState("all");
  const [search, setSearch] = useState("");

  const token = localStorage.getItem("accessToken") || "";
  const headers = { Authorization: `Bearer ${token}` };

  const toInputDate = (bidDate) => {
    if (!bidDate) return "";

    // "17 Dec 2025"
    const [day, monthStr, year] = bidDate.trim().split(" ");

    const monthMap = {
      Jan: "01",
      Feb: "02",
      Mar: "03",
      Apr: "04",
      May: "05",
      Jun: "06",
      Jul: "07",
      Aug: "08",
      Sep: "09",
      Oct: "10",
      Nov: "11",
      Dec: "12",
    };

    const month = monthMap[monthStr];
    if (!month) return "";

    // YYYY-MM-DD (HTML date input format)
    return `${year}-${month}-${day.padStart(2, "0")}`;
  };

  // ============================
  // 🔥 FETCH ALL BIDS (NO FILTER)
  // ============================
  const fetchBids = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await axios.get(`${API_URL}/admin/bids/history`, {
        headers,
      });

      console.log("res", res);

      const list = Array.isArray(res.data?.data) ? res.data.data : res.data;

      setBids(list);
    } catch (err) {
      console.error(err);
      setError("Failed to load bids");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBids();
  }, []);

  const handleDelete = async (bid_id) => {
    if (!confirm("Delete this bid?")) return;
    try {
      await axios.delete(`${API_URL}/admin/bids/delete/${bid_id}`, {
        headers,
      });
      fetchBids();
    } catch (err) {
      console.error(err);
      alert("Failed to delete bid");
    }
  };

  // =====================================
  // 🔥 FRONTEND FILTERING FUNCTION
  // =====================================
  const filteredBids = useMemo(() => {
    return bids.filter((b) => {
      const s = search.toLowerCase();

      const matchesSearch =
        b.name?.toLowerCase().includes(s) ||
        b.mobile?.toLowerCase().includes(s);

      const bidDateFormatted = toInputDate(b.bid_date);
      const matchesDate = date ? bidDateFormatted === date : true;
      console.log(b.bid_date, "=>", toInputDate(b.bid_date), "filter:", date);

      const matchesMarket = marketId === "all" || b.market_name === marketId;

      const matchesGameType = gameType === "all" || b.game_type === gameType;

      const matchesSession =
        session === "all" || b.session?.toLowerCase() === session.toLowerCase();

      return (
        matchesSearch &&
        matchesDate &&
        matchesMarket &&
        matchesGameType &&
        matchesSession
      );
    });
  }, [bids, date, marketId, gameType, session, search]);

  // Dynamic dropdown lists
  const markets = useMemo(() => {
    const s = new Set();
    bids.forEach((b) => b.market_name && s.add(b.market_name));
    return ["all", ...Array.from(s)];
  }, [bids]);

  const gameTypes = useMemo(() => {
    const s = new Set();
    bids.forEach((b) => b.game_type && s.add(b.game_type));
    return ["all", ...Array.from(s)];
  }, [bids]);

  return (
    <div className="lg:p-6 md:p-5 p-3 text-white">
      {/* Filters Card */}
      <div className="bg-white/5 border border-white/5 rounded-xl p-4 mb-5">
        <h1 className="text-xl font-bold">Bid History Report</h1>

        {/* FILTER UI (unchanged) */}
        <form className="mt-6 flex flex-wrap gap-2 items-end">
          {/* DATE */}
          <div className="flex-1">
            <label className="text-sm text-slate-300 block mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value || "")}
              className="w-full bg-transparent border border-white/10 px-3 py-1.5 rounded text-white"
            />
          </div>

          {/* MARKET */}
          <div className="flex-1">
            <label className="text-sm text-slate-300 block mb-2">Game</label>
            <select
              value={marketId}
              onChange={(e) => setMarketId(e.target.value)}
              className="w-full bg-transparent border min-w-47 border-white/10 px-3 py-1.5 rounded text-white"
            >
              {markets.map((m) => (
                <option key={m} value={m}>
                  {m === "all" ? "All Games" : m}
                </option>
              ))}
            </select>
          </div>

          {/* GAME TYPE */}
          <div className="flex-1">
            <label className="text-sm text-slate-300 block mb-2">
              Game Type
            </label>
            <select
              value={gameType}
              onChange={(e) => setGameType(e.target.value)}
              className="w-full bg-transparent border min-w-47 border-white/10 px-3 py-1.5 rounded text-white"
            >
              {gameTypes.map((g) => (
                <option key={g} value={g}>
                  {g === "all" ? "All Types" : g}
                </option>
              ))}
            </select>
          </div>

          {/* SESSION */}
          <div className="flex-1">
            <label className="text-sm text-slate-300 block mb-2">Session</label>
            <select
              value={session}
              onChange={(e) => setSession(e.target.value)}
              className="w-full bg-transparent border min-w-47 border-white/10 px-3 py-1.5 rounded text-white"
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="close">Close</option>
            </select>
          </div>

          {/* SEARCH */}
          <div className="flex-1">
            <label className="text-sm text-slate-300 block mb-2">Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name / Mobile"
              className="w-full bg-transparent border min-w-47 border-white/10 px-3 py-1.5 rounded text-white"
            />
          </div>
        </form>
      </div>

      {/* TABLE */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10">
          <h2 className="text-lg font-semibold">Bid History List</h2>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader className="animate-spin" />
          </div>
        ) : error ? (
          <div className="p-5 text-red-400">{error}</div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-white/10 text-left text-slate-300 border-b border-white/10">
                  <th className="py-2 px-2">#</th>
                  <th className="py-2 px-2">Name</th>
                  <th className="py-2 px-2">Mobile</th>
                  <th className="py-2 px-2">Bid Date</th>
                  <th className="py-2 px-2">Bid Time</th>
                  <th className="py-2 px-2">Game</th>
                  <th className="py-2 px-2">Type</th>
                  <th className="py-2 px-2">Session</th>
                  <th className="py-2 px-2">Digit</th>
                  <th className="py-2 px-2">Points</th>
                  <th className="py-2 px-2">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredBids.length === 0 ? (
                  <tr>
                    <td
                      colSpan={11}
                      className="text-center py-8 text-slate-400"
                    >
                      No records found.
                    </td>
                  </tr>
                ) : (
                  filteredBids.map((b, idx) => (
                    <tr
                      key={idx}
                      className={
                        idx % 2 === 0 ? "bg-transparent" : "bg-white/5"
                      }
                    >
                      <td className="py-1.5 px-2">{idx + 1}</td>
                      <td className="py-1.5 px-2 text-sky-300">{b.name}</td>
                      <td className="py-1.5 px-2">{b.mobile}</td>
                      <td className="py-1.5 px-2 min-w-30">{b.bid_date}</td>
                      {/* <td className="py-1.5 px-2 min-w-30">{b.bid_time}</td> */}
                      <td className="py-1.5 px-2 min-w-30">
                        {new Date(
                          new Date(b.created_at).getTime() +
                            (5 * 60 + 30) * 60 * 1000
                        ).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="py-1.5 px-2 uppercase min-w-40">
                        {b.market_name}
                      </td>
                      <td className="py-1.5 px-2 min-w-30">
                        {b.game_type
                          ?.replace(/_/g, " ")
                          .split(" ")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          ) // capitalize
                          .join(" ")}
                      </td>
                      <td className="py-1.5 px-2">{b.session}</td>
                      <td className="py-1.5 px-2">{b.digit}</td>
                      <td className="py-1.5 px-2 font-bold">{b.points}</td>

                      <td className="py-1.5 px-2">
                        <button
                          onClick={() => handleDelete(b.bid_id)}
                          className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded text-white flex items-center gap-2"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
