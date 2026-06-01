import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../../../config";

export default function GWinningHistory() {
  const getToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0"); // months are 0-indexed
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [filters, setFilters] = useState({
    date: getToday(),
    market: "",
    session: "ALL",
    type: "ALL",
    search: "",
  });

  const [list, setList] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("accessToken");

  // Load markets for dropdown
  const loadMarkets = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/Golidesawar/market`);
      setMarkets(res.data.data || []);
    } catch (e) {
      console.log("Market Fetch Error:", e);
    }
  };

  // Load winning report
  const loadData = async () => {
    if (!filters.date) return; // date is required

    try {
      setLoading(true);

      let query = [`date=${filters.date}`];
      if (filters.market) query.push(`market_id=${filters.market}`);
      if (filters.session !== "ALL") query.push(`session=${filters.session}`);
      if (filters.type !== "ALL") query.push(`game_type=${filters.type}`);

      const url = `${API_URL}/api/admin/Golidesawar/winning-report?${query.join(
        "&"
      )}`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("res", res);

      setList(res.data.data || []);
    } catch (e) {
      console.log("API Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarkets();
  }, []);

  useEffect(() => {
    loadData();
  }, [filters.date, filters.market, filters.session, filters.type]);

  // Frontend search filter
  const filteredList = list.filter((item) =>
    filters.search === ""
      ? true
      : Object.values(item)
          .join(" ")
          .toLowerCase()
          .includes(filters.search.toLowerCase())
  );

  return (
    <div className="lg:p-6 md:p-5 p-3 w-full">
      <h1 className="text-xl font-bold mb-4 text-gray-200">Winning History</h1>

      {/* FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white/5 p-3 rounded-lg shadow">
        {/* Date */}
        <div>
          <label className="text-gray-300 font-semibold">Date</label>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            className="w-full border border-white/10 p-2 rounded mt-1"
          />
        </div>

        {/* Market */}
        <div>
          <label className="text-gray-300 font-semibold">Market</label>
          <select
            value={filters.market}
            onChange={(e) => setFilters({ ...filters, market: e.target.value })}
            className="w-full border p-2 border-gray-50/15 rounded mt-1"
          >
            <option value="">All Markets</option>
            {markets.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Session */}
        <div>
          <label className="text-gray-300 font-semibold">Session</label>
          <select
            value={filters.session}
            onChange={(e) =>
              setFilters({ ...filters, session: e.target.value })
            }
            className="w-full border p-2 border-gray-50/15 rounded mt-1"
          >
            <option value="ALL">All</option>
            <option value="open">Open</option>
            <option value="close">Close</option>
          </select>
        </div>

        {/* Game Type */}
        <div>
          <label className="text-gray-300 font-semibold">Game Type</label>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="w-full border p-2 border-gray-50/15 rounded mt-1"
          >
            <option value="ALL">All Types</option>
            <option value="single">Single</option>
            <option value="jodi">Jodi</option>
          </select>
        </div>
      </div>

      {/* Search */}
      <div className="mt-4">
        <input
          type="text"
          placeholder="Search"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="w-full border border-gray-50/15 p-2 rounded mb-4"
        />
      </div>

      {/* Loading */}
      {loading && <p className="text-gray-300 text-center my-5">Loading...</p>}

      {/* TABLE */}
      <div className="bg-white/5 rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-300 rounded-xl">
            <thead>
              <tr className="border-b bg-white/10 text-gray-200">
                <th className="p-2">S.No</th>
                <th className="p-2">Date</th>
                <th className="p-2">User</th>
                <th className="p-2">Mobile</th>
                <th className="p-2">Market</th>
                <th className="p-2">Game Type</th>
                <th className="p-2">Session</th>
                <th className="p-2">Open Digit</th>
                <th className="p-2">Close Digit</th>
                <th className="p-2">Open Panna</th>
                <th className="p-2">Close Panna</th>
                <th className="p-2">Points</th>
                <th className="p-2">Won Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td className="p-4 text-center text-gray-400" colSpan={13}>
                    No Data Found
                  </td>
                </tr>
              ) : (
                filteredList.map((item, i) => (
                  <tr key={i} className="border-b border-gray-50/5">
                    <td className="p-2">{i + 1}</td>
                    <td className="p-2">{item.date}</td>
                    <td className="p-2 capitalize">{item.user}</td>
                    <td className="p-2">{item.mobile}</td>
                    <td className="p-2">{item.market_name}</td>
                    <td className="p-2">{item.game_type}</td>
                    <td className="p-2">{item.session}</td>
                    <td className="p-2">{item.open_digit || "-"}</td>
                    <td className="p-2">{item.close_digit || "-"}</td>
                    <td className="p-2">{item.open_panna || "-"}</td>
                    <td className="p-2">{item.close_panna || "-"}</td>
                    <td className="p-2">{item.points}</td>
                    <td className="p-2 text-green-400">{item.win_amount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
