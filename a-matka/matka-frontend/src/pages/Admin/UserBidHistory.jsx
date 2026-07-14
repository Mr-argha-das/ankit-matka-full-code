import React, { useState } from "react";

export default function UserBidHistory() {
  const [form, setForm] = useState({
    date: "9 Nov 2025",
    gameName: "ALL Game",
    gameType: "All Games",
    session: "All",
  });

  const [search, setSearch] = useState("");
  const bids = []; // Replace this with your bid data array

  return (
    <div className="p-4 bg-[#f7f8fc] min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-700">BID HISTORY REPORT</h2>
        <p className="text-sm text-gray-500">
          Dashboards /{" "}
          <span className="font-medium text-gray-700">Bid History</span>
        </p>
      </div>

      {/* Bid History Report Form */}
      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Bid History Report
        </h3>
        
        <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Date Field */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Date</label>
            <input
              type="text"
              value={form.date}
              className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              readOnly
            />
          </div>

          {/* Game Name */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Game Name
            </label>
            <select
              value={form.gameName}
              onChange={(e) => setForm({ ...form, gameName: e.target.value })}
              className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>ALL Game</option>
              <option>DESAWAR</option>
              <option>FARIDABAD</option>
              <option>GHAZIABAD</option>
              <option>GALI</option>
            </select>
          </div>

          {/* Game Type */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Game Type
            </label>
            <select
              value={form.gameType}
              onChange={(e) => setForm({ ...form, gameType: e.target.value })}
              className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>All Games</option>
              <option>Single</option>
              <option>Jodi</option>
              <option>Panna</option>
            </select>
          </div>

          {/* Session */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Session</label>
            <select
              value={form.session}
              onChange={(e) => setForm({ ...form, session: e.target.value })}
              className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>All</option>
              <option>Open</option>
              <option>Close</option>
            </select>
          </div>
        </form>

        <div className="mt-5">
          <button className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm hover:bg-blue-700">
            Submit
          </button>
        </div>
      </div>

      {/* Bid History List */}
      <div className="bg-white rounded-xl shadow p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Bid History List
          </h3>
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm text-gray-700">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="p-3 border text-left">Name</th>
                <th className="p-3 border text-left">Mobile</th>
                <th className="p-3 border text-left">Bid Date</th>
                <th className="p-3 border text-left">Bid Time</th>
                <th className="p-3 border text-left">Game Name</th>
                <th className="p-3 border text-left">Game Type</th>
              </tr>
            </thead>
            <tbody>
              {bids.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center text-gray-500 py-5 border"
                  >
                    No Bid History Found
                  </td>
                </tr>
              ) : (
                bids
                  .filter((b) =>
                    b.name.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((bid, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 transition border-b"
                    >
                      <td className="p-3 border">{bid.name}</td>
                      <td className="p-3 border">{bid.mobile}</td>
                      <td className="p-3 border">{bid.date}</td>
                      <td className="p-3 border">{bid.time}</td>
                      <td className="p-3 border">{bid.gameName}</td>
                      <td className="p-3 border">{bid.gameType}</td>
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
