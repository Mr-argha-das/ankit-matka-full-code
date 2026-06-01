import React, { useEffect, useState } from "react";
import axios from "axios";
import { Loader } from "lucide-react";
import { API_URL } from "../../config";

export default function TodayBidHistory() {
  const [loading, setLoading] = useState(false);
  const [bids, setBids] = useState([]);
  const [error, setError] = useState(null);
  const [totalPoints, setTotalPoints] = useState(0);

  const token = localStorage.getItem("accessToken") || "";
  const headers = { Authorization: `Bearer ${token}` };

  const fetchTodayBids = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await axios.get(
        `${API_URL}/api/v1/admin/users/today-bid-users`,
        { headers }
      );

      console.log(res);
      setBids(res.data?.bids || []);
      setTotalPoints(res.data?.total_points || 0);
    } catch (err) {
      console.error(err);
      setError("Failed to load today's bids");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayBids();
  }, []);

  return (
    <div className="lg:p-6 md:p-5 p-3 text-white">
      {/* HEADER */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-5">
        <h1 className="text-xl font-bold">Today Bid History</h1>
        <p className="text-slate-300 mt-1 text-sm">
          Total Points Today:{" "}
          <span className="text-green-400 font-semibold">{totalPoints}</span>
        </p>
      </div>

      {/* TABLE */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10">
          <h2 className="text-lg font-semibold">Today Bids List</h2>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader className="animate-spin" />
          </div>
        ) : error ? (
          <div className="p-5 text-red-400">{error}</div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-white/10 text-left text-slate-300 border-b border-white/10">
                  <th className="py-2 px-2">#</th>
                  <th className="py-2 px-2">Name</th>
                  <th className="py-2 px-2">Mobile</th>
                  <th className="py-2 px-2">Game</th>
                  <th className="py-2 px-2">Type</th>
                  <th className="py-2 px-2">Session</th>
                  <th className="py-2 px-2">Digit</th>
                  <th className="py-2 px-2">Points</th>
                  <th className="py-2 px-2">Time</th>
                </tr>
              </thead>

              <tbody>
                {bids.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-slate-400">
                      No bids played today.
                    </td>
                  </tr>
                ) : (
                  bids.map((b, idx) => (
                    <tr
                      key={b.bid_id}
                      className={
                        idx % 2 === 0 ? "bg-transparent" : "bg-white/5"
                      }
                    >
                      <td className="py-1.5 px-2">{idx + 1}</td>

                      <td className="py-1.5 px-2 text-sky-300">
                        {b.user?.username}
                      </td>

                      <td className="py-1.5 px-2">{b.user?.mobile}</td>

                      <td className="py-1.5 px-2 uppercase min-w-40">
                        {b.market?.name}
                      </td>

                      <td className="py-1.5 px-2 capitalize">{b.game_type}</td>

                      <td className="py-1.5 px-2 capitalize">{b.session}</td>

                      <td className="py-1.5 px-2 font-semibold">
                        {b.digit || b.open_digit || b.close_digit}
                      </td>

                      <td className="py-1.5 px-2 font-bold text-green-400">
                        {b.points}
                      </td>

                      <td className="py-1.5 px-2 min-w-40">
                        {new Date(
                          new Date(b.created_at).getTime() +
                            (5 * 60 + 30) * 60 * 1000
                        ).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
