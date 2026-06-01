import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Calendar,
  ArrowLeft,
  Loader,
  Wallet,
  History,
  IndianRupee,
} from "lucide-react";
import { API_URL } from "../config";

const API_BASE = `${API_URL}/passbook/history`;

export default function Passbook() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const token = localStorage.getItem("accessToken");

  const fetchHistory = useCallback(async () => {
    setLoading(true);

    try {
      const res = await axios.get(API_BASE, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          start_date: startDate || null,
          end_date: endDate || null,
        },
      });

      setHistory(res.data.history || []);
    } catch (err) {
      console.log("Passbook error:", err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, token]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // color mapping
  const getColor = (type) => {
    switch (type) {
      case "DEPOSIT":
      case "WIN":
        return "text-green-400";
      case "WITHDRAWAL":
      case "BID":
        return "text-red-400";
      case "QR_DEPOSIT":
        return "text-yellow-300";
      default:
        return "text-gray-300";
    }
  };

  const getAmountText = (item) => {
    if (item.type === "BID") return `-${item.debit}`;
    if (item.type === "WITHDRAWAL") return `-${item.amount}`;
    return `+${item.amount}`;
  };

  const getTitle = (item) => {
    if (item.type === "DEPOSIT") return "Deposit Added";
    if (item.type === "WIN") return "Winning Amount";
    if (item.type === "WITHDRAWAL") return "Withdrawal";
    if (item.type === "BID") return `Bid Placed (${item.game_type})`;
    if (item.type === "QR_DEPOSIT") return "QR Deposit";
    return item.type;
  };

  const getDescription = (item) => {
    if (item.type === "BID")
      return `Market: ${item.market_id} | ${item.session} | Digit: ${item.digit}`;
    return item.status;
  };

  return (
    <div className="max-w-md mx-auto   text-white  pb-30 font-sans">
      {/* Header */}

      <div className="w-full relative bg-gradient-to-b from-black to-black/0 pb-2 flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="p-2 pl-4 z-10 rounded-full hover:bg-white/10 transition"
        >
          <ArrowLeft size={22} />
        </button>
        <h2 className="text-md z-0 w-full absolute   justify-between font-bold bg-gradient-to-b from-black to-black/0 px-4 py-2  flex justify-center items-center gap-2">
          <span className="flex gap-2 uppercase text-md items-center">
            Passbook
          </span>
        </h2>
        <a className="pr-4 z-10">{/* <HistoryIcon /> */}</a>
      </div>

      {/* FILTERS */}
      <div className="bg-white/10 mx-3 p-4 rounded-lg border border-white/10 mb-4">
        <div className="flex flex-col gap-3">
          <label className="text-sm text-gray-300">Start Date</label>
          <input
            type="date"
            className="p-2 rounded bg-black/30 border border-gray-700 text-white"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <label className="text-sm text-gray-300">End Date</label>
          <input
            type="date"
            className="p-2 rounded bg-black/30 border border-gray-700 text-white"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />

          <button
            onClick={fetchHistory}
            className="mt-2 bg-purple-700 hover:bg-purple-600 w-full py-2 rounded font-semibold"
          >
            Apply Filter
          </button>
        </div>
      </div>

      {/* HISTORY LIST */}
      {loading ? (
        <div className="text-center py-10">
          <Loader size={28} className="animate-spin mx-auto text-cyan-400" />
          <p className="mt-2 text-gray-400">Loading history...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-10 text-gray-400">No records found.</div>
      ) : (
        <div className="space-y-3 mx-3">
          {history.map((item, index) => (
            <div
              key={index}
              className="bg-white/5 border border-gray-800 p-4 rounded-lg flex justify-between items-center"
            >
              <div>
                <div className={`font-semibold ${getColor(item.type)}`}>
                  {getTitle(item)}
                </div>

                <div className="text-sm text-gray-300 mt-1">
                  {getDescription(item)}
                </div>

                <div className="text-xs text-gray-500 mt-1">
                  {new Date(item.created_at).toLocaleString()}
                </div>
              </div>

              <div className={`text-lg font-bold ${getColor(item.type)}`}>
                ₹{getAmountText(item)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
