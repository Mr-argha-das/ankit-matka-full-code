import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../../config"; // adjust path if needed

export default function TodayResultMarketHistory({ refreshFlag }) {
  const token = localStorage.getItem("accessToken");
  const headers = { Authorization: `Bearer ${token}` };

  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchResults(date);
  }, [refreshFlag]);

  useEffect(() => {
    fetchResults(date);
  }, [date]);

  const normalizeResult = (r) => {
    const rawId =
      r._id?.$oid ?? r._id ?? r.id ?? r.result_id ?? r._id_str ?? null;
    const id = rawId ? String(rawId) : null;

    const gameName =
      r.game_name ??
      r.game?.name ??
      r.market_name ??
      r.name ??
      r.market_name ??
      "-";

    const resDate = r.date ?? r.result_date ?? r.created_at ?? "-";

    const openPanna = r.open_panna ?? r.openPanna ?? r.open_panna_value ?? "-";
    const openDigit = r.open_digit ?? r.openDigit ?? r.open_digit_value ?? "-";

    const closePanna =
      r.close_panna ?? r.closePanna ?? r.close_panna_value ?? "-";
    const closeDigit =
      r.close_digit ?? r.closeDigit ?? r.close_digit_value ?? "-";

    // declared times (may be ISO string or mongo $date)
    const openDeclared =
      r.open_declared_at ??
      r.open_declared_time ??
      r.open_created_at ??
      r.open_time ??
      null;
    const closeDeclared =
      r.close_declared_at ??
      r.close_declared_time ??
      r.close_created_at ??
      r.close_time ??
      null;

    return {
      raw: r,
      id,
      gameName,
      date: resDate,
      open_panna: openPanna,
      open_digit: openDigit,
      close_panna: closePanna,
      close_digit: closeDigit,
      open_declared_at: openDeclared,
      close_declared_at: closeDeclared,
    };
  };

  const formatDateTime = (val) => {
    if (!val) return "-";
    try {
      // Some responses are already formatted strings (e.g. "23 Nov 2025 03:43 AM")
      // If value looks like ISO / timestamp, convert to local string
      if (typeof val === "string") {
        const d = new Date(val);
        if (!isNaN(d.getTime())) return d.toLocaleString();
        return val; // return as-is if not parseable
      }
      // Handle mongo style { $date: "..." }
      if (typeof val === "object" && val?.$date) {
        const d = new Date(val.$date);
        return isNaN(d.getTime()) ? String(val.$date) : d.toLocaleString();
      }
      return String(val);
    } catch {
      return String(val);
    }
  };

  const fetchResults = async (forDate = date) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `${API_URL}/api/admin/results?date=${forDate}`,
        { headers }
      );

      // Expecting shape { data: [ ... ] } from your backend, but handle other shapes gracefully
      const listRaw = res.data?.data ?? res.data ?? [];
      const normalized = (Array.isArray(listRaw) ? listRaw : []).map(
        normalizeResult
      );
      setResults(normalized);
    } catch (err) {
      console.error("Fetch history error:", err);
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to load results. Check API."
      );
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = () => {
    fetchResults(date);
  };

  const handleDelete = async (id) => {
    if (!id) return alert("Invalid id");
    if (!confirm("Are you sure you want to delete this result?")) return;

    setDeletingId(id);
    try {
      await axios.delete(`${API_URL}/api/admin/result/${id}`, { headers });
      // after deletion refetch
      await fetchResults(date);
      alert("Deleted successfully");
    } catch (err) {
      console.error("Delete error:", err);
      alert(err?.response?.data?.detail || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const displayPanna = (val) => {
    return !val || val === "-" ? "xxx" : val;
  };

  const displayDigit = (val) => {
    return !val || val === "-" ? "x" : val;
  };

  return (
    <div className=" mt-5 bg-white/10  rounded-xl lg:p-5 md:p-5 p-4 ">
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-medium mb-2">
              Result Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-1.5 border rounded"
            />
          </div>

          {/* <div className="w-full md:w-auto self-end">
            <button
              onClick={handleFilter}
              className="bg-indigo-600 text-white px-4 py-2 rounded shadow"
            >
              Filter
            </button>
          </div> */}
        </div>
      </div>

      <div
        className="
      "
      >
        <h3 className="text-lg font-semibold mb-4">Today Result History</h3>

        {error && (
          <div className="mb-4 text-red-600 bg-red-50 p-1.5 rounded">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-white/20 text-left">
                <th className="p-1.5">#</th>
                <th className="p-1.5 min-w-32">Game Name</th>
                <th className="p-1.5  min-w-32">Result Date</th>
                <th className="p-1.5  min-w-40">Open Declare Time</th>
                <th className="p-1.5  min-w-40">Close Declare Time</th>
                <th className="p-1.5  min-w-32">Open Number</th>
                <th className="p-1.5  min-w-32">Close Number</th>
                <th className="p-1.5  min-w-32">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-6 text-center" colSpan={8}>
                    Loading...
                  </td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td className="p-6 text-center text-gray-500" colSpan={8}>
                    No results found
                  </td>
                </tr>
              ) : (
                results.map((r, idx) => (
                  <tr
                    key={r.id ?? idx}
                    className="border-b border-gray-50/15 hover:bg-gray-50/5"
                  >
                    <td className="p-1.5">{idx + 1}</td>
                    <td className="p-1.5 font-medium">{r.gameName}</td>
                    {/* <td className="p-1.5">{r.date ?? date}</td> */}
                    <td className="p-1.5">
                      {new Date(
                        new Date(r.date).getTime() + (5 * 60 + 30) * 60 * 1000
                      ).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="p-1.5">
                      {formatDateTime(r.open_declared_at)}
                    </td>
                    <td className="p-1.5">
                      {formatDateTime(r.close_declared_at)}
                    </td>
                    <td className="p-1.5">
                      {displayPanna(r.open_panna)} -{" "}
                      {displayDigit(r.open_digit)}
                    </td>
                    <td className="p-1.5">
                      {displayDigit(r.close_digit)} -{" "}
                      {displayPanna(r.close_panna)}
                    </td>
                    <td className="p-1.5">
                      <button
                        onClick={() => handleDelete(r.id)}
                        disabled={deletingId === r.id}
                        className="bg-red-500 text-white px-3 py- rounded"
                      >
                        {deletingId === r.id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
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
