import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../../../config";

export default function GBidHistoryReport() {
  const [filters, setFilters] = useState({
    date: "",
    session: "ALL",
    market: "", // <-- market_name
    game: "ALL",
    type: "ALL",
    search: "",
  });

  const [list, setList] = useState([]);
  const [markets, setMarkets] = useState([]); // <-- MARKET LIST
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("accessToken");

  // -------------------------------------------------
  // LOAD MARKETS FOR DROPDOWN
  // -------------------------------------------------
  const loadMarkets = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/Golidesawar/market`);

      setMarkets(res.data.data || []);
    } catch (e) {
      console.log("Market Fetch Error:", e);
    }
  };

  // -------------------------------------------------
  // LOAD FILTERED BIDS FROM API
  // -------------------------------------------------
  const loadData = async () => {
    try {
      setLoading(true);

      let query = [];

      if (filters.date) query.push(`date=${filters.date}`);
      if (filters.session !== "ALL") query.push(`session=${filters.session}`);
      if (filters.market) query.push(`market_name=${filters.market}`);

      const url = `${API_URL}/api/admin/Golidesawar/admin/bids/all${
        query.length ? "?" + query.join("&") : ""
      }`;

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

  // Load markets once
  useEffect(() => {
    loadMarkets();
  }, []);

  // Reload filtered bids on change of backend filter fields
  useEffect(() => {
    loadData();
  }, [filters.date, filters.session, filters.market]);

  // -------------------------------------------------
  // FRONTEND FILTERS (game, type, search)
  // -------------------------------------------------
  const filteredList = list.filter((item) => {
    const matchGame = filters.game === "ALL" || item.market_id == filters.game;

    const matchType = filters.type === "ALL" || item.game_type === filters.type;

    const matchSearch =
      filters.search === "" ||
      Object.values(item)
        .join(" ")
        .toLowerCase()
        .includes(filters.search.toLowerCase());

    return matchGame && matchType && matchSearch;
  });

  return (
    <div className="lg:p-6 md:p-5 p-3 w-full">
      <h1 className="text-xl font-bold mb-4 text-gray-200">
        Bid History Report
      </h1>

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

        {/* MARKET DROPDOWN (LOADED FROM API) */}
        <div>
          <label className="text-gray-300 font-semibold">Market</label>
          <select
            className="w-full border p-2  border-gray-50/15 rounded mt-1"
            value={filters.market}
            onChange={(e) => setFilters({ ...filters, market: e.target.value })}
          >
            <option value="">All Markets</option>

            {markets.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Session */}
        <div>
          <label className="text-gray-300 font-semibold">Session</label>
          <select
            className="w-full border p-2 border-gray-50/15 rounded mt-1"
            value={filters.session}
            onChange={(e) =>
              setFilters({ ...filters, session: e.target.value })
            }
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
            className="w-full border p-2 border-gray-50/15 rounded mt-1"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
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

      {/* LOADING */}
      {loading && <p className="text-gray-300 text-center my-5">Loading...</p>}

      {/* TABLE */}
      <div className=" bg-white/5  rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm  text-gray-300 rounded-xl">
            <thead>
              <tr className="border-b bg-white/10  text-gray-200">
                <th className="p-2">S.No</th>
                <th className="p-2">Name</th>
                <th className="p-2">Mobile</th>
                <th className="p-2">Date</th>
                <th className="p-2 !min-w-24">Time</th>
                <th className="p-2">Market</th>
                <th className="p-2">Type</th>
                <th className="p-2">Session</th>
                <th className="p-2">Digit</th>
                <th className="p-2">Points</th>
              </tr>
            </thead>

            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td className="p-4 text-center text-gray-400" colSpan={10}>
                    No Data Found
                  </td>
                </tr>
              ) : (
                filteredList.map((item, i) => (
                  <tr key={i} className="border-b border-gray-50/5">
                    <td className="p-2">{i + 1}</td>
                    <td className="p-2 capitalize min-w-30">{item.username}</td>
                    <td className="p-2">{item.mobile}</td>
                    <td className="p-2 min-w-25">
                      {item.created_at?.split("T")[0]}
                    </td>
                    <td className="p-2 !min-w-25">
                      {new Date(
                        new Date(item.created_at).getTime() +
                          (5 * 60 + 30) * 60 * 1000
                      ).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                      {/* {item.created_at?.split("T")[1]?.slice(0, 5)} */}
                    </td>
                    <td className="p-2 min-w-45 text-center">
                      {item.market_name}
                    </td>
                    <td className="p-2">{item.game_type}</td>
                    <td className="p-2">{item.session}</td>
                    <td className="p-2">
                      {item?.open_digit || item?.close_digit}
                    </td>
                    <td className="p-2">{item.points}</td>
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
