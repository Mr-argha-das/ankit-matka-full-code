import React, { useState, useMemo } from "react";

export default function AdminWinHistory({ wins }) {
  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);

  // 🔍 SEARCH FILTER
  const filtered = useMemo(() => {
    return wins.filter((w) =>
      Object.values(w).some((val) =>
        String(val).toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [wins, search]);

  // 📄 PAGINATION
  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const pageData = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <div className="bg-white/10 text-white p-3 rounded-xl shadow mt-5">
      <div className="flex flex-wrap items-center justify-between gap-1 mb-3">
        <h2 className="text-md text-yellow-500/70 font-semibold ">
          Winning History
        </h2>

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
      {/* Top Bar */}
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
          {[5, 10, 20, 50].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span>Entries</span>
      </div>

      {/* Search */}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-white/20 text-left">
              <th className="p-2">#</th>
              <th className="p-2">Tx ID</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Status</th>
              <th className="p-2">Created Date</th>
              <th className="p-2">Created Time</th>
              {/* <th className="p-2">Confirmed At</th> */}
            </tr>
          </thead>

          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan="12" className="text-center py-5 text-gray-400">
                  No Win Records Found
                </td>
              </tr>
            ) : (
              pageData.map((w, i) => {
                const created = new Date(w.created_at?.$date ?? null);
                const confirmed = w.confirmed_at
                  ? new Date(w.confirmed_at.$date)
                  : null;

                return (
                  <tr
                    key={i}
                    className="border-b border-gray-50/10 hover:bg-gray-50/5"
                  >
                    <td className="px-3 py-2">
                      {(page - 1) * rowsPerPage + (i + 1)}
                    </td>

                    <td className="px-3 py-2">{w.tx_id}</td>

                    <td className="px-3 py-2 font-semibold text-green-400">
                      {w.amount}
                    </td>

                    <td
                      className={`px-3 py-2 ${
                        w.status === "SUCCESS"
                          ? "text-green-400"
                          : "text-yellow-300"
                      }`}
                    >
                      {w.status}
                    </td>

                    <td className="px-3 py-2  min-w-28">
                      {created ? created.toLocaleDateString("en-IN") : "-"}
                    </td>

                    <td className="px-3 py-2 min-w-28">
                      {created ? created.toLocaleTimeString("en-IN") : "-"}
                    </td>

                    {/* <td className="px-3 py-2">
                      {confirmed
                        ? confirmed.toLocaleString("en-IN")
                        : "Not Confirmed"}
                    </td> */}
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

        <div className="flex gap-2">
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
