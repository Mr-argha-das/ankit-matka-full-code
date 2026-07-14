import React, { useState, useMemo } from "react";

export default function DynamicBidHistory({ bids, marketMap }) {
  console.log("Bids", bids);
  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);

  // 🔍 SEARCH FILTER
  const filtered = useMemo(() => {
    return bids.filter((b) =>
      Object.values(b).some((val) =>
        String(val).toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [bids, search]);

  // 📄 PAGINATION
  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const pageData = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <div className="bg-white/10 text-white p-3 rounded-xl shadow mt-5">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-1 mb-3">
        <h2 className="text-md text-blue-500/70  font-semibold ">
          Bid History
        </h2>

        {/* Search */}
        <input
          type="text"
          placeholder="Search"
          className="border px-3 min-w-60 md:max-w-70  sm:max-w-60 w-full py-1 rounded"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* Show Entries */}
      <div className="flex text-sm items-center gap-2 mb-3">
        <span>Show</span>
        <select
          className="border-1 outline-none px-1 py-0 rounded"
          value={rowsPerPage}
          onChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setPage(1);
          }}
        >
          {[5, 10, 20, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span>Entries</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full bordercollapse text-sm">
          <thead>
            <tr className="bg-white/20 text-left">
              <th className="p-2">#</th>
              <th className="p-2">Game Type</th>
              <th className="p-2">Digit</th>
              <th className="p-2">Session</th>
              <th className="p-2">Points</th>
              <th className="p-2">Market</th>
              <th className="p-2">Date</th>
              <th className="p-2">Time</th>
            </tr>
          </thead>

          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan="12" className="text-center py-5 text-gray-500">
                  No data available in table
                </td>
              </tr>
            ) : (
              pageData.map((b, i) => {
                const dateObj = new Date(b.created_at?.$date ?? null);

                return (
                  <tr
                    key={i}
                    className="border-b border-gray-50/10 hover:bg-gray-50"
                  >
                    <td className="px-3 py-2">
                      {(page - 1) * rowsPerPage + (i + 1)}
                    </td>
                    <td className="px-3 py-2 capitalize ">{b.game_type}</td>
                    <td className="px-3 py-2 ">{b.digit || "-"}</td>
                    <td className="px-3 py-2 capitalize ">{b.session}</td>
                    <td className="px-3 py-2 ">{b.points}</td>
                    <td className="px-3 py-2 min-w-40">
                      {" "}
                      {marketMap[b.market_id] || "-"}
                    </td>

                    <td className="px-3 py-2 min-w-26">
                      {b.created_at ? dateObj.toLocaleDateString("en-IN") : "-"}
                    </td>
                    <td className="px-3 py-2 min-w-26">
                      {b.created_at ? dateObj.toLocaleTimeString("en-IN") : "-"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between text-sm items-center mt-4">
        <span>
          Showing {filtered.length === 0 ? 0 : (page - 1) * rowsPerPage + 1} to{" "}
          {Math.min(page * rowsPerPage, filtered.length)} of {filtered.length}{" "}
          entries
        </span>

        <div className="flex gap-2 ">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className={`px-3 py-[1px] border rounded ${
              page === 1 ? "opacity-50" : ""
            }`}
          >
            Previous
          </button>

          <button
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage((p) => p + 1)}
            className={`px-3 py-[1px] border rounded ${
              page === totalPages || totalPages === 0 ? "opacity-50" : ""
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
