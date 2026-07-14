import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import MarketForm from "./MarketForm";
import { Plus } from "lucide-react";
import { API_URL } from "../../../config";

const API_BASE = `${API_URL}/market`;

const MarketList = () => {
  const [markets, setMarkets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [marketToEdit, setMarketToEdit] = useState(null);

  // Extract MongoDB ID
  const getMarketId = (m) => m._id?.$oid;

  const fetchMarkets = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await axios.get(`${API_BASE}/`);
      setMarkets(res.data.markets || []);
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.detail || "Failed to load markets");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  // -----------------------------
  // DELETE MARKET
  // -----------------------------
  const handleDelete = async (marketId, marketName) => {
    if (!window.confirm(`Delete market "${marketName}"?`)) return;

    try {
      await axios.delete(`${API_BASE}/delete/${marketId}`);
      fetchMarkets();
    } catch (err) {
      setError(err.response?.data?.detail || "Delete failed");
    }
  };

  return (
    <div className="mx-auto p-3 font-sans text-white min-h-screen">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-3 border-b pb-2 border-white">
        💰 Market Management
      </h2>

      <button
        className="flex gap-2 items-center border text-sm text-white font-bold py-1.5 px-3 rounded mb-4"
        onClick={() => {
          setMarketToEdit(null);
          setIsFormOpen(true);
        }}
      >
        <Plus size={18} /> Create New Market
      </button>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 mb-4 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {isLoading && <p className="text-blue-400 text-lg">Loading markets...</p>}

      {!isLoading && markets.length === 0 && !error && (
        <p className="text-lg text-gray-400">No markets available.</p>
      )}

      {/* TABLE */}
      <div className="shadow max-h-96 overflow-y-auto overflow-x-auto border border-gray-600 rounded-lg">
        <table className="min-w-full divide-y divide-gray-600">
          <thead className="bg-white/20 backdrop-blur text-gray-200 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-xs uppercase text-left">Name</th>
              <th className="px-6 py-3 text-xs uppercase text-left">
                Open Time
              </th>
              <th className="px-6 py-3 text-xs uppercase text-left">
                Close Time
              </th>
              <th className="px-6 py-3 text-xs uppercase text-left">Key</th>
              <th className="px-6 py-3 text-xs uppercase text-left">Status</th>
              <th className="px-6 py-3 text-xs uppercase text-left">Declare</th>
              <th className="px-6 py-3 text-xs uppercase text-left">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-700 text-gray-200">
            {markets.map((m) => (
              <tr key={getMarketId(m)} className="hover:bg-gray-700/40">
                <td className="px-6 py-3">{m.name}</td>
                <td className="px-6 py-3">{m.open_time}</td>
                <td className="px-6 py-3">{m.close_time}</td>
                <td className="px-6 py-3">{m.final_result}</td>
                <td className="px-6 py-3">
                  <a
                    href={`/admin/declare-result/${m.id}`}
                    className="underline text-green-500"
                  >
                    Declare Result
                  </a>
                </td>

                <td className="px-6 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      m.status === "Market Running"
                        ? "bg-green-600 text-white"
                        : "bg-red-600 text-white"
                    }`}
                  >
                    {m.status}
                  </span>
                </td>

                <td className="px-6 py-3">
                  <button
                    onClick={() => handleDelete(m?.id)}
                    className="text-red-400 hover:text-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FORM MODAL */}
      {isFormOpen && (
        <MarketForm
          market={marketToEdit}
          onClose={() => setIsFormOpen(false)}
          onSave={fetchMarkets}
        />
      )}
    </div>
  );
};

export default MarketList;
