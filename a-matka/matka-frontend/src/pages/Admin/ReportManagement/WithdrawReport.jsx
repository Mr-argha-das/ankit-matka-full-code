// src/pages/WithdrawReport.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Loader, CheckCircle, XCircle } from "lucide-react";
import { API_URL } from "../../../config";

export default function WithdrawReport() {
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState([]);
  const [error, setError] = useState(null);

  // date string in input (YYYY-MM-DD). We'll show DD/MM/YYYY in UI where needed.
  const [filterDate, setFilterDate] = useState("");

  // token from localStorage
  const token = localStorage.getItem("accessToken") || "";
  const authHeader = { Authorization: `Bearer ${token}` };

  // fetch data
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    axios
      .get(`${API_URL}/admin/withdrawal/report`, { headers: authHeader })
      .then((res) => {
        if (!mounted) return;
        // API response shape:
        // { message, count, data: [ { wd_id, user_id, username, mobile, amount, method, number, status, created_at, confirmed_at } ] }
        const data = res.data?.data || [];
        // normalize created_at to JS Date (if returned as string)
        const normalized = data.map((w) => ({
          ...w,
          created_at: w.created_at ? new Date(w.created_at) : null,
          confirmed_at: w.confirmed_at ? new Date(w.confirmed_at) : null,
        }));
        setWithdrawals(normalized);
      })
      .catch((err) => {
        console.error(err);
        setError(
          err.response?.data?.detail || err.message || "Failed to load data"
        );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [token]);

  // Filtered list (by selected filterDate). If no date selected -> show all
  const filtered = useMemo(() => {
    if (!filterDate) return withdrawals;

    const [y, m, d] = filterDate.split("-").map(Number);
    // filter by local date
    return withdrawals.filter((w) => {
      if (!w.created_at) return false;
      const dt = new Date(w.created_at);
      return (
        dt.getFullYear() === y && dt.getMonth() + 1 === m && dt.getDate() === d
      );
    });
  }, [withdrawals, filterDate]);

  // total amount for filtered rows
  const totalAmount = useMemo(() => {
    return filtered.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  }, [filtered]);

  // helper formatting
  const formatDate = (d) => {
    if (!d) return "-";
    const dt = new Date(d);
    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = dt.toLocaleString(undefined, { month: "short" }); // e.g., "Nov"
    const yyyy = dt.getFullYear();
    return `${dd} ${mm} ${yyyy}`;
  };

  const formatTime = (d) => {
    if (!d) return "-";
    const dt = new Date(d);
    return dt.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Action handler (visual). Replace with server call if you have an endpoint to update status.
  const handleAction = async (row) => {
    const updated = withdrawals.map((w) =>
      w.wd_id === row.wd_id
        ? { ...w, status: "SUCCESS", confirmed_at: new Date() }
        : w
    );
    setWithdrawals(updated);
  };

  return (
    <div className=" lg:p-6 md:p-5 p-3">
      <div className="">
        {/* Header + small illustration */}
        <div className="bg-white/10 rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-white">
                Withdraw Report
              </h2>
              <p className="text-sm text-gray-300 mt-1">
                View and manage all withdrawal requests.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  // no server call, filter is client-side; leaving to preserve UI semantics
                }}
                className="mt-6 flex items-end  flex-wrap gap-4"
              >
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-white">Date</label>

                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="rounded border px-2 py-1 text-white"
                  />
                </div>

                <button
                  type="submit"
                  className=" bg-blue-600 hover:bg-indigo-700 text-white px-6 py-1.5 rounded shadow"
                >
                  Submit
                </button>

                <button
                  type="button"
                  onClick={() => setFilterDate("")}
                  className=" bg-white border text-slate-700 px-4 py-1.5 rounded"
                >
                  Reset
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Table container */}
        <div className="bg-white/10 rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50/10 bg-white/15">
            <h3 className="text-sm font-medium text-white">
              Withdraw Request List
            </h3>
          </div>

          {loading ? (
            <div className="p-10 flex items-center justify-center">
              <Loader className="animate-spin" /> Loading...
            </div>
          ) : error ? (
            <div className="p-6 text-red-500">{error}</div>
          ) : (
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                  <thead>
                    <tr className="text-white">
                      <th className="py-3 px-4 border-b border-gray-50/10">
                        #
                      </th>
                      <th className="py-3 px-4 border-b border-gray-50/10">
                        Name
                      </th>
                      <th className="py-3 px-4 border-b border-gray-50/10">
                        Mobile
                      </th>
                      <th className="py-3 px-4 border-b border-gray-50/10">
                        Amount
                      </th>
                      <th className="py-3 px-4 border-b border-gray-50/10">
                        Date
                      </th>
                      <th className="py-3 px-4 border-b border-gray-50/10">
                        Remark
                      </th>
                      <th className="py-3 px-4 border-b border-gray-50/10">
                        Status
                      </th>
                      {/* <th className="py-3 px-4 border-b border-gray-50/10">
                        Action
                      </th> */}
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-white">
                          No withdrawals found for selected date.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((w, idx) => (
                        <tr key={w.wd_id || idx} className="">
                          <td className="py-3 px-4 border-b border-gray-50/10  align-top">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 border-b min-w-40 border-gray-50/10 align-top">
                            <a className="text-white hover:underline">
                              {w.username || "-"}
                            </a>
                          </td>
                          <td className="py-3 px-4 border-b min-w-23 border-gray-50/10 align-top">
                            {w.mobile || "-"}
                          </td>
                          <td className="py-3 px-4 border-b min-w-25 border-gray-50/10 font-semibold align-top">
                            {Number(w.amount || 0)}
                          </td>
                          <td className="py-3 px-4 min-w-34 border-b border-gray-50/10 align-top">
                            <div>{formatDate(w.created_at)}</div>
                            <div className="text-xs text-slate-400">
                              {formatTime(w.created_at)}
                            </div>
                          </td>
                          <td className="py-3 px-4 border-b min-w-70 border-gray-50/10 align-top">
                            <div className="text-sm">
                              Withdraw Amount From
                              <span className="font-medium">
                                {" "}
                                ({w.method || "-"})
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                              {w.number || ""}
                            </div>
                          </td>
                          <td className="py-3 px-4 border-b border-gray-50/10 align-top">
                            {w.status?.toLowerCase?.() === "success" ||
                            w.status?.toLowerCase?.() === "completed" ||
                            w.status?.toLowerCase?.() === "done" ? (
                              <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium">
                                <CheckCircle size={14} /> success
                              </span>
                            ) : w.status?.toLowerCase?.() === "pending" ? (
                              <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">
                                <Loader size={12} className="animate-spin" />{" "}
                                pending
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium">
                                <XCircle size={14} /> {w.status || "unknown"}
                              </span>
                            )}
                          </td>

                          {/* <td className="py-3 px-4 border-b border-gray-50/10 align-top">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleAction(w)}
                                className="bg-emerald-300 hover:bg-emerald-400 text-white rounded px-4 py-2 text-sm font-medium"
                              >
                                Success
                              </button>
                            </div>
                          </td> */}
                        </tr>
                      ))
                    )}

                    {/* Total row */}
                    {filtered.length > 0 && (
                      <tr>
                        <td className="py-4  border-b border-gray-50/10">
                          Total:
                        </td>
                        <td className="py-4 px-4 border-b border-gray-50/10" />
                        <td className="py-4 px-4 border-b border-gray-50/10 font-semibold"></td>
                        <td className="py-4 px-4 border-b border-gray-50/10 font-semibold">
                          {totalAmount}
                        </td>
                        <td className="py-4 px-4 border-b border-gray-50/10" />
                        <td className="py-4 px-4 border-b border-gray-50/10" />
                        <td className="py-4 px-4 border-b border-gray-50/10" />
                        <td className="py-4 px-4 border-b border-gray-50/10" />
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
