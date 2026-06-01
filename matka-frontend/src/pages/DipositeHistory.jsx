import React, { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  DollarSign,
  Info,
  Image as ImageIcon,
  ArrowLeft,
} from "lucide-react";
import { API_URL } from "../config";
import axios from "axios";

const API_BASE_URL = API_URL;

const getAuthToken = () => localStorage.getItem("accessToken");

export default function DepositHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status UI
  const getStatusDisplay = (status) => {
    const base =
      "flex items-center gap-1 font-semibold text-sm px-2 py-1 rounded-full";

    switch (status) {
      case "SUCCESS":
        return (
          <span className={`${base} bg-green-600/20 text-green-400`}>
            <CheckCircle size={14} /> Success
          </span>
        );

      case "FAILED":
        return (
          <span className={`${base} bg-red-600/20 text-red-400`}>
            <XCircle size={14} /> Failed
          </span>
        );

      default:
        return (
          <span className={`${base} bg-yellow-600/20 text-yellow-400`}>
            <Clock size={14} /> Pending
          </span>
        );
    }
  };

  const formatTime = (iso) => {
    if (!iso) return "N/A";
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Fetch History
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = getAuthToken();

        const res = await axios.get(`${API_BASE_URL}/deposit-qr/history`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("API Response:", res.data);

        // AXIOS: data comes in res.data
        const data = res.data;

        setHistory(data.history || []);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch deposit history.");
      }

      setLoading(false);
    };

    fetchHistory();
  }, []);

  return (
    <div className="max-w-md mx-auto font-sans pb-20 text-white">
      {/* HEADER */}

      <div className="w-full relative bg-gradient-to-b from-black to-black/0 py-2 flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="p-2 pl-4 z-10 rounded-full hover:bg-white/10 transition"
        >
          <ArrowLeft size={22} />
        </button>
        <h2 className="text-md z-0 w-full absolute   justify-between font-bold bg-gradient-to-b from-black to-black/0 px-4 py-2  flex justify-center items-center gap-2">
          <span className="flex gap-2 text-md items-center">
            {" "}
            My Deposit History
          </span>
        </h2>
        <a className="pr-4 z-10">{/* <HistoryIcon /> */}</a>
      </div>

      {/* LOADING */}
      {loading && (
        <p className="text-center py-8 text-gray-400 flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading history...
        </p>
      )}

      {/* ERROR */}
      {error && (
        <p className="text-center py-6 text-red-400 bg-red-900/20 rounded-lg">
          <Info className="inline mr-2" size={18} />
          {error}
        </p>
      )}

      {/* EMPTY */}
      {!loading && !error && history.length === 0 && (
        <p className="text-center py-8 text-gray-400">
          No deposit records found.
        </p>
      )}

      {/* TABLE */}
      {!loading && history.length > 0 && (
        <div className="overflow-x-auto m-3  bg-gray-800 rounded-lg shadow-xl">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase">
                  Screenshot
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase">
                  Uploaded
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-700">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-gray-700 transition">
                  <td className="px-4 py-3">
                    {item.image_url ? (
                      <a
                        href={`${API_URL}${item.image_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={`${API_URL}${item.image_url}`}
                          alt="Screenshot"
                          className="w-12 h-12 rounded-md object-cover border border-gray-600"
                        />
                      </a>
                    ) : (
                      <ImageIcon className="text-gray-500" size={20} />
                    )}
                  </td>

                  <td className="px-4 py-3 text-green-400 text-sm font-bold">
                    ₹{item.amount?.toFixed(2) || 0}
                  </td>

                  <td className="px-4 py-3 text-sm">
                    {getStatusDisplay(item.status)}
                  </td>

                  <td className="px-4 py-3 text-xs min-w-45 text-gray-400">
                    {formatTime(item.uploaded_at)}
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
