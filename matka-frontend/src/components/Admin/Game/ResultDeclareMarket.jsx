import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../../config";
import TodayResultMarketHistory from "./TodayMarketResultHistory";

export default function ResultDeclareMarket() {
  const token = localStorage.getItem("accessToken");
  const headers = { Authorization: `Bearer ${token}` };

  const [refreshHistoryFlag, setRefreshHistoryFlag] = useState(0);
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const [games, setGames] = useState([]);
  const [history, setHistory] = useState([]);

  const [selectedGameId, setSelectedGameId] = useState("");
  const [session, setSession] = useState("Open");

  const [openPanna, setOpenPanna] = useState("");
  const [openDigit, setOpenDigit] = useState("");

  const [closePanna, setClosePanna] = useState("");
  const [closeDigit, setCloseDigit] = useState("");

  const [loadingGames, setLoadingGames] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ⚡ FIX: Safe ID extractor
  const getId = (obj) => {
    if (!obj) return null;
    if (typeof obj === "string") return obj;
    if (obj.$oid) return obj.$oid;
    return obj;
  };

  // ⚡ FIX: Check declared or not
  const isDeclared = (v) => {
    return v !== null && v !== undefined && v !== "" && v !== "-";
  };

  // Load Games
  const fetchGames = async () => {
    setLoadingGames(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/market`, { headers });
      const list = (res.data?.data || []).map((g) => ({
        id: getId(g._id),
        name: g.name,
        open_time: g.open_time,
        close_time: g.close_time,
      }));
      setGames(list);
    } catch (err) {
      console.error("Markets load error:", err);
    }
    setLoadingGames(false);
  };

  // Load History
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/results?date=${date}`, {
        headers,
      });
      setHistory(res.data?.data || []);
    } catch (err) {
      console.error("History error:", err);
    }
    setLoadingHistory(false);
  };

  useEffect(() => {
    fetchGames();
    fetchHistory();
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [date]);

  // Auto digit from panna
  const calcDigit = (panna) => {
    if (!panna || panna.length !== 3) return "";
    return (
      panna
        .split("")
        .map(Number)
        .reduce((a, b) => a + b, 0) % 10
    ).toString();
  };

  // Declare Result
  const handleDeclare = async () => {
    if (!selectedGameId) return alert("Select game first");

    if (session === "Open" && !openPanna && !openDigit)
      return alert("Enter Open Panna or Digit");

    if (session === "Close" && !closePanna && !closeDigit)
      return alert("Enter Close Panna or Digit");

    const payload = {
      date,
      game_id: selectedGameId,
      session: session.toLowerCase(),
      open_panna: session === "Open" ? openPanna : undefined,
      open_digit: session === "Open" ? openDigit : undefined,
      close_panna: session === "Close" ? closePanna : undefined,
      close_digit: session === "Close" ? closeDigit : undefined,
    };

    setSubmitting(true);

    try {
      const res = await axios.post(
        `${API_URL}/api/admin/result/declare`,
        payload,
        { headers }
      );

      alert(res.data?.message || "Result Declared");
      setRefreshHistoryFlag((prev) => prev + 1);
      fetchHistory();
    } catch (err) {
      alert(err.response?.data?.detail || "Error declaring result");
    }

    setSubmitting(false);
  };

  return (
    <div className="lg:p-6 md:p-5 p-3">
      {/* TOP SECTION */}
      <section className="bg-white/5 p-4 rounded-xl">
        <h3 className="text-lg font-bold mb-4">Declare Result</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* DATE */}
          <div>
            <label className="text-sm">Date</label>
            <input
              type="date"
              className="p-2 border w-full rounded"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* GAME DROPDOWN with FIXED FILTER */}
          <div>
            <label className="text-sm">Game</label>
            <select
              className="w-full p-2 border rounded"
              value={selectedGameId}
              onChange={(e) => setSelectedGameId(e.target.value)}
            >
              <option value="">Select Game</option>

              {games
                .filter((g) => {
                  const r = history.find(
                    (h) => getId(h.market_id) === getId(g.id)
                  );

                  // no result yet → allow always
                  if (!r) return true;

                  const openDone =
                    isDeclared(r.open_panna) && isDeclared(r.open_digit);

                  const closeDone =
                    isDeclared(r.close_panna) && isDeclared(r.close_digit);

                  // ⭐ OPEN session → show if OPEN is NOT done
                  if (session === "Open") return !openDone;

                  // ⭐ CLOSE session → show if CLOSE is NOT done
                  if (session === "Close") return !closeDone;

                  return true;
                })
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.open_time}-{g.close_time})
                  </option>
                ))}
            </select>
          </div>

          {/* SESSION */}
          <div>
            <label className="text-sm">Session</label>
            <select
              className="w-full p-2 border rounded"
              value={session}
              onChange={(e) => setSession(e.target.value)}
            >
              <option>Open</option>
              <option>Close</option>
            </select>
          </div>
        </div>

        {/* INPUTS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 items-end">
          {session === "Open" ? (
            <>
              <div>
                <label className="text-sm">Open Panna</label>
                <input
                  className="w-full p-2 border rounded"
                  value={openPanna}
                  onChange={(e) => {
                    const v = e.target.value;
                    setOpenPanna(v);
                    setOpenDigit(v.length === 3 ? calcDigit(v) : "");
                  }}
                />
              </div>

              <div>
                <label className="text-sm">Open Digit</label>
                <input
                  className="w-full p-2 border rounded"
                  value={openDigit}
                  readOnly
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-sm">Close Panna</label>
                <input
                  className="w-full p-2 border rounded"
                  value={closePanna}
                  onChange={(e) => {
                    const v = e.target.value;
                    setClosePanna(v);
                    setCloseDigit(v.length === 3 ? calcDigit(v) : "");
                  }}
                />
              </div>

              <div>
                <label className="text-sm">Close Digit</label>
                <input
                  className="w-full p-2 border rounded"
                  value={closeDigit}
                  readOnly
                />
              </div>
            </>
          )}

          <div>
            <button
              onClick={handleDeclare}
              disabled={submitting}
              className="bg-green-600 text-white px-5 py-2 rounded w-full"
            >
              {submitting ? "Declaring..." : "DECLARE"}
            </button>
          </div>
        </div>
      </section>

      <TodayResultMarketHistory refreshFlag={refreshHistoryFlag} />
    </div>
  );
}
