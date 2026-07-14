// src/pages/AutoDepositHistory.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Loader, Search as SearchIcon } from "lucide-react";
import { API_URL } from "../../../config";
import { getUserById } from "../../../components/layout/fetchUser";

export default function AutoDepositHistory() {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const [error, setError] = useState(null);

  // Filters
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");

  const token = localStorage.getItem("accessToken") || "";
  const headers = { Authorization: `Bearer ${token}` };

  const fetchDeposits = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {};

      // Date-based filtering
      if (date) {
        params.from_date = date;
        params.to_date = date;
      }

      // Search filter (username/mobile)
      if (search.trim() !== "") {
        params.search = search.trim();
      }

      // API Call
      const res = await axios.get(
        `${API_URL}/user-deposit-withdrawal/admin/deposit/pending`,
        { headers, params }
      );

      console.log("diposite", res);

      let pending = res?.data?.pending || [];

      // Fetch mobile for each user
      const updated = await Promise.all(
        pending.map(async (item) => {
          const date = new Date(item.uploaded_at);

          // ➕ add 1 day
          date.setDate(date.getDate() + 1);

          return {
            ...item,
            uploaded_at: date.toISOString(),
          };
        })
      );
      // console.log("pending", pending);

      setList(updated);
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.detail || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Load on mount
  useEffect(() => {
    fetchDeposits();
  }, []);

  const handleReset = () => {
    setDate("");
    setSearch("");
    fetchDeposits();
  };

  return (
    <div className="lg:p-6 md:p-5 p-3 text-white">
      {/* FILTER CARD */}
      <div className="bg-white/5 border border-[rgba(255,255,255,0.04)] rounded-xl p-4 mb-5 backdrop-blur-sm">
        <h1 className="text-xl font-bold">Auto Deposit History</h1>
        <p className="text-sm text-slate-400 mt-1">
          View all automatic deposit entries.
        </p>

        {/* FILTER FORM */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchDeposits();
          }}
          className="mt-6 flex flex-wrap gap-4 items-end"
        >
          {/* Date */}
          <div className="flex-1">
            <label className="text-sm text-slate-300 mb-2 block">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full min-w-60 bg-transparent border border-white/10 px-3 py-2 rounded text-white"
            />
          </div>

          {/* Search */}
          <div className="flex-1">
            <label className="text-sm text-slate-300 mb-2 block">Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name / mobile"
              className="w-full min-w-60 bg-transparent border border-white/10 px-3 py-2 rounded text-white"
            />
          </div>
        </form>
      </div>

      {/* TABLE WRAPPER */}
      <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-4 flex-wrap gap-3 py-3 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Deposit History List</h2>
        </div>

        {/* TABLE */}
        <div>
          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader className="animate-spin" />
            </div>
          ) : error ? (
            <div className="p-5 text-red-400">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead>
                  <tr className="text-slate-300 bg-white/10 border-b border-white/10">
                    <th className="py-3 px-3">#</th>
                    <th className="py-3 px-3">User Name</th>
                    <th className="py-3 px-3">Mobile</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {list
                    .filter((item) => {
                      // 💬 Search filter (username + mobile)
                      const s = search.toLowerCase();
                      const matchSearch =
                        item.username?.toLowerCase().includes(s) ||
                        item.mobile?.toLowerCase().includes(s);

                      // 📅 Date filter (uploaded_at)
                      const itemDate = item.uploaded_at?.slice(0, 10); // YYYY-MM-DD
                      const matchDate = date ? itemDate === date : true;

                      return matchSearch && matchDate;
                    })
                    .map((item, idx) => (
                      <tr
                        key={idx}
                        className={
                          idx % 2 === 0 ? "bg-transparent" : "bg-white/5"
                        }
                      >
                        <td className="py-3 px-3">{idx + 1}</td>

                        <td className="py-3 px-3 text-sky-300">
                          {item.username}
                        </td>

                        <td className="py-3 px-3">{item.mobile}</td>

                        <td className="py-3 px-3 font-semibold text-slate-100">
                          {item.amount}
                        </td>

                        <td className="py-3 px-3">
                          {new Date(item.uploaded_at).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </td>

                        <td className="py-3 px-3">
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-900 text-xs rounded-full">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
