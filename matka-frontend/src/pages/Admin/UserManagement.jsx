import React, { useState, useEffect } from "react";
import axios from "axios";
import { Search, Eye, PhoneCall } from "lucide-react";
import { API_URL } from "../../config";

export default function UserManagement() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const limit = 30;
  const token = localStorage.getItem("accessToken");

  // Fetch Users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/v1/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const formatted = res.data.users.map((u) => ({
        id: u._id.$oid,
        username: u.username,
        mobile: u.mobile,
        role: u.role,
        status: u.status,
        is_bet: u.is_bet,
        date: new Date(u.created_at.$date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      }));

      setUsers(formatted);
    } catch (err) {
      console.log("Fetch Users Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Status Toggle
  const toggleStatus = async (id, current) => {
    try {
      await axios.put(
        `${API_URL}/api/v1/admin/users/${id}/status`,
        { status: !current },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
    } catch (err) {
      console.log(err);
    }
  };

  // Betting Permission Toggle
  const toggleBet = async (id, current) => {
    try {
      await axios.put(
        `${API_URL}/api/v1/admin/users/${id}/is-bet`,
        { is_bet: !current },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
    } catch (err) {
      console.log(err);
    }
  };

  // Search Filter
  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.mobile.includes(search)
  );

  const totalPages = Math.ceil(filteredUsers.length / limit);
  const pageUsers = filteredUsers.slice((page - 1) * limit, page * limit);

  return (
    <div className="lg:p-7 p-4 min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">USER LIST</h2>
      </div>

      {/* Search */}
      <div className="bg-white/5 rounded-xl p-4 mb-6 backdrop-blur">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <input
            type="text"
            placeholder="Search By Name or Mobile"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="border bg-black/30 text-white border-gray-600 rounded-md px-3 py-2 w-full sm:w-1/3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 rounded-xl shadow backdrop-blur overflow-x-auto">
        <table className="min-w-full text-sm text-gray-200">
          <thead>
            <tr className="bg-white/10 text-gray-300 border-b border-gray-700">
              <th className="p-3 text-left">SNo.</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Mobile</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Betting</th>
              <th className="p-3 text-left min-w-30">Date</th>
              <th className="p-3 text-left ">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-6">
                  Loading...
                </td>
              </tr>
            ) : pageUsers.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-6">
                  No users found
                </td>
              </tr>
            ) : (
              pageUsers.map((u, i) => (
                <tr
                  key={u.id}
                  className="border-b border-gray-700 hover:bg-white/10 transition"
                >
                  <td className="p-3">{(page - 1) * limit + (i + 1)}</td>

                  <td className="p-3 text-blue-400">{u.username}</td>

                  <td className="p-3 flex items-center gap-2">
                    <a
                      href={`https://wa.me/91${u.mobile}`}
                      target="_blank"
                      className="text-gray-200 underline"
                    >
                      {u.mobile}
                    </a>
                    <PhoneCall size={16} className="text-green-500" />
                  </td>

                  {/* Status */}
                  <td className="p-3">
                    <button
                      onClick={() => toggleStatus(u.id, u.status)}
                      className={`px-2 py-1 rounded text-xs ${
                        u.status
                          ? "bg-green-600/40 text-green-300"
                          : "bg-red-600/40 text-red-300"
                      }`}
                    >
                      {u.status ? "Active" : "Inactive"}
                    </button>
                  </td>

                  {/* Betting */}
                  <td className="p-3">
                    <button
                      onClick={() => toggleBet(u.id, u.is_bet)}
                      className={`px-2 py-1 rounded text-xs ${
                        u.is_bet
                          ? "bg-blue-600/40 text-blue-300"
                          : "bg-yellow-600/40 text-yellow-300"
                      }`}
                    >
                      {u.is_bet ? "Allowed" : "Blocked"}
                    </button>
                  </td>

                  <td className="p-3">{u.date}</td>

                  <td className="p-3 flex items-center justify-center ">
                    <a
                      href={`/admin/details/${u.id}`}
                      className="text-blue-400  hover:text-blue-500"
                    >
                      <Eye size={18} />
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 mt-6">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1 border rounded"
        >
          Prev
        </button>

        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i + 1)}
            className={`px-3 py-1 border rounded ${
              page === i + 1 ? "bg-blue-600/40 text-white" : ""
            }`}
          >
            {i + 1}
          </button>
        ))}

        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-3 py-1 border rounded"
        >
          Next
        </button>
      </div>
    </div>
  );
}
