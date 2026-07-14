import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../config";

const API_BASE = `${API_URL}/starline_jackpot`;

export default function StarlineResultBox({ slotId }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("accessToken");

  const authHeader = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const fetchResult = async () => {
    try {
      const res = await axios.get(`${API_BASE}/starline/result/get`, {
        params: { slot_id: slotId },
        ...authHeader,
      });
      setResult(res.data);
    } catch (err) {
      console.error("Error fetching result:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResult();
  }, [slotId]);

  if (loading) {
    return (
      <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg text-center">
        <p className="animate-pulse text-gray-400 text-sm">Loading Result...</p>
      </div>
    );
  }

  if (!result || result.msg === "No Result") {
    return (
      <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg text-center">
        <p className="text-gray-400 text-sm">No Result Declared Yet</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-900 border border-purple-700 rounded-lg text-center">
      <h2 className="text-purple-300 font-bold mb-1">Latest Result</h2>

      <p className="text-yellow-400 text-2xl font-bold">{result.panna}</p>
      <p className="text-gray-400 text-sm mt-1">{result.date}</p>
    </div>
  );
}
