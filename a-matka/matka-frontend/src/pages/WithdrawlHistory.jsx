import React, { useState, useEffect } from "react";
import {
  List,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Loader2,
  Info,
  ArrowLeft,
  History,
} from "lucide-react";
import { API_URL } from "../config";

const getAuthToken = () => localStorage.getItem("accessToken");

export default function MyWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  console.log(withdrawals);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to format the status with colors/icons
  const getStatusDisplay = (status) => {
    const commonClasses =
      "flex items-center gap-1 font-semibold text-sm px-2 py-1 rounded-full";
    switch (status) {
      case "success":
        return (
          <span className={`${commonClasses} bg-green-600/20 text-green-400`}>
            <CheckCircle size={14} /> Paid
          </span>
        );
      case "rejected":
        return (
          <span className={`${commonClasses} bg-red-600/20 text-red-400`}>
            <XCircle size={14} /> Failed
          </span>
        );
      case "pending":
      default:
        return (
          <span className={`${commonClasses} bg-yellow-600/20 text-yellow-400`}>
            <Clock size={14} /> Pending
          </span>
        );
    }
  };

  // --- Fetch Withdrawal History (GET /withdraw/my) ---
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      const token = getAuthToken();

      if (!token) {
        setError("Authentication required. Please log in.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/user-deposit-withdrawal/withdraw/my`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setWithdrawals(data);
        } else {
          const errorData = await response.json();
          setError(errorData.detail || "Failed to fetch withdrawal history.");
        }
      } catch (err) {
        setError("Network error. Could not connect to fetch withdrawals.");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatTime = (isoString) => {
    if (!isoString) return "N/A";
    return new Date(isoString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-md mx-auto pb-20  font-sans text-white">
      <div className="w-full relative bg-gradient-to-b from-black to-black/0 py-2 flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="p-2 pl-4 z-10 rounded-full hover:bg-white/10 transition"
        >
          <ArrowLeft size={22} />
        </button>
        <h2 className="text-md z-0 w-full absolute   justify-between font-bold bg-gradient-to-b from-black to-black/0 px-4 py-2  flex justify-center items-center gap-2">
          <span className="flex gap-2 text-md items-center">
            My Withdrawal History
          </span>
        </h2>
        <a className="pr-4 z-10"></a>
      </div>

      {loading && (
        <p className="text-center py-8 text-gray-400 flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Fetching history...
        </p>
      )}

      {error && (
        <p className="text-center py-8 text-red-400 bg-red-900/20 rounded-lg">
          <Info size={20} className="inline mr-2" />
          {error}
        </p>
      )}

      {!loading && !error && withdrawals.length === 0 && (
        <p className="text-center py-8 text-gray-400">
          You have no withdrawal requests yet.
        </p>
      )}

      {!loading && withdrawals.length > 0 && (
        <div className="overflow-x-auto m-3 bg-gray-800 rounded-lg shadow-xl">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Details
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {withdrawals.map((w) => (
                <tr key={w.wd_id} className="hover:bg-gray-700 transition">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-green-400">
                    ₹{w.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-xs min-w-60">
                    <p className="text-gray-300 font-medium text-sm">
                      {w.method}
                    </p>
                    <p className="text-gray-500. text-sm">{w.number}</p>
                    <p className="text-xs text-gray-400 capitalize">
                      {w.account_holder_name}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">
                      {w.account_no}
                    </p>
                    <p className="text-xs text-gray-400 uppercase">
                      {w.ifc_code}
                    </p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {getStatusDisplay(w.status)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-400">
                    {formatTime(w.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
