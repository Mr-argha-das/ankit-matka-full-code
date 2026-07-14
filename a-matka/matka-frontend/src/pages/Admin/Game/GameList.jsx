import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../../config";
import EditGameModal from "../../../components/Admin/Game/EditGameModel";
import AddGameModal from "../../../components/Admin/Game/AddGameModal";

export default function GameList() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState(null);
  console.log(games);
  const token = localStorage.getItem("accessToken");
  const headers = { Authorization: `Bearer ${token}` };

  // safe helper to extract ID from API response
  const extractId = (obj) => {
    if (!obj) return null;
    if (typeof obj === "string") return obj;
    if (obj.$oid) return obj.$oid;
    if (obj._id && obj._id.$oid) return obj._id.$oid;
    return obj._id || obj.id || null;
  };

  const fetchGames = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/market`, { headers });

      console.log(res);
      // API returns { data: [ {...}, ... ] }
      const list = (res.data?.data || []).map((g) => {
        const id = g._id?.$oid || g._id || g.id;

        return {
          id: String(id),
          name: g.name ?? "-",
          hindi: g.hindi ?? "-",
          marketType: g.marketType ?? "-",

          openResult: g.open_result ?? "-",
          closeResult: g.close_result ?? "-",

          openTime: g.open_time ?? "-",
          closeTime: g.close_time ?? "-",

          is_active: g.is_active ?? false,
          status: g.status ?? false,

          raw: g,
        };
      });

      setGames(list);
    } catch (err) {
      console.log("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const toggleStatus = async (id, current) => {
    try {
      // the backend endpoint expects market id (objectid string) and query param 'status'
      await axios.patch(
        `${API_URL}/api/admin/market/${id}/status?status=${!current}`,
        {},
        { headers }
      );
      await fetchGames();
    } catch (err) {
      console.error("Error updating status:", err?.response?.data || err);
      alert("Error updating status");
    }
  };

  const deleteGame = async (id) => {
    try {
      if (!confirm("Delete this game?")) return;
      await axios.delete(`${API_URL}/api/admin/market/${id}`, { headers });
      await fetchGames();
    } catch (err) {
      console.error("Delete failed:", err?.response?.data || err);
      alert("Delete failed");
    }
  };

  const displayPanna = (val) => {
    return !val || val === "-" ? "xxx" : val;
  };

  const displayDigit = (val) => {
    return !val || val === "-" ? "x" : val;
  };

  const openEdit = async (id) => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/market/${id}`, {
        headers,
      });
      // server returns { data: { ...market... } }
      const data = res.data?.data;
      if (!data) {
        alert("Failed to load game data");
        return;
      }
      setEditData(data);
    } catch (err) {
      console.error("Error loading game:", err?.response?.data || err);
      alert("Error loading game");
    }
  };

  return (
    <div className="lg:p-6 md:p-5 p-3">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-semibold">Game Name List</h2>

        <button
          onClick={() => setOpenModal(true)}
          className="border text-white px-4 py-1.5 rounded-lg"
        >
          Add Game
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white/10 shadow rounded-xl overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-white/20 text-left border-b">
              <th className="p-3">#</th>
              <th className="p-3 min-w-40">Game Name</th>
              <th className="p-3  min-w-full">Hindi</th>
              <th className="p-3 min-w-25">Type</th>
              <th className="p-3 min-w-28">Open Result</th>
              <th className="p-3 min-w-28">Close Result</th>
              <th className="p-3 min-w-28">Open Time</th>
              <th className="p-3 min-w-28">Close Time</th>
              <th className="p-3">Active</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {games.map((g, i) => (
              <tr key={g.id} className="border-b hover:bg-gray-50/5">
                <td className="p-3">{i + 1}</td>

                <td className="p-3">{g.name}</td>
                <td className="p-3">{g.hindi}</td>

                <td className="p-3">{g.marketType}</td>

                <td className="p-3">
                  {displayPanna(g.raw?.today_result?.open_panna)} -{" "}
                  {displayDigit(g.raw?.today_result?.open_digit)}
                </td>

                <td className="p-3">
                  {displayDigit(g.raw?.today_result?.close_digit)} -{" "}
                  {displayPanna(g.raw?.today_result?.close_panna)}
                </td>
                <td className="p-3">{g.openTime}</td>
                <td className="p-3">{g.closeTime}</td>

                {/* is_active */}
                <td className="p-3">
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      g.is_active
                        ? "bg-green-200 text-green-700"
                        : "bg-red-200 text-red-700"
                    }`}
                  >
                    {g.is_active ? "Active" : "Inactive"}
                  </span>
                </td>

                {/* status (market open/close) */}
                <td className="p-3">
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      g.status == true
                        ? "bg-blue-200 text-blue-700"
                        : "bg-gray-300 text-gray-700"
                    }`}
                  >
                    {g.status === true ? "Open" : "Closed"}
                  </span>
                </td>

                {/* Action */}
                <td className="p-3 flex gap-2">
                  <button
                    onClick={() => openEdit(g.id)}
                    className="px-3 py-1 border rounded text-blue-500"
                  >
                    Edit
                  </button>

                  <button
                    className="px-3 py-1 border rounded text-red-500"
                    onClick={() => deleteGame(g.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {openModal && (
        <AddGameModal
          onClose={() => setOpenModal(false)}
          refresh={fetchGames}
        />
      )}

      {editData && (
        <EditGameModal
          data={editData}
          onClose={() => setEditData(null)}
          refresh={fetchGames}
        />
      )}
    </div>
  );
}
