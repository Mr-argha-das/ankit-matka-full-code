// src/pages/GameRatePage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { ArrowLeft, Loader } from "lucide-react";
import { API_URL } from "../config";

export default function GameRatePage() {
  const [loading, setLoading] = useState(true);
  const [chart, setChart] = useState(null);

  const token = localStorage.getItem("accessToken") || "";
  const headers = { Authorization: `Bearer ${token}` };

  const fetchRates = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/rate/`, { headers });
      setChart(res.data);
    } catch (err) {
      console.log("Rate load error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRates();
  }, []);

  if (loading || !chart)
    return (
      <div className="min-h-screen text-white flex justify-center items-center">
        <Loader size={28} className="animate-spin" />
      </div>
    );

  const rates = [
    {
      label: "Single Digit",
      rate: `${chart.single_digit_1}-${chart.single_digit_2}`,
    },
    {
      label: "Jodi Digit",
      rate: `${chart.jodi_digit_1}-${chart.jodi_digit_2}`,
    },
    {
      label: "Single Panna",
      rate: `${chart.single_pana_1}-${chart.single_pana_2}`,
    },
    {
      label: "Double Panna",
      rate: `${chart.double_pana_1}-${chart.double_pana_2}`,
    },
    {
      label: "Tripple Panna",
      rate: `${chart.tripple_pana_1}-${chart.tripple_pana_2}`,
    },
    {
      label: "Half Sangam",
      rate: `${chart.half_sangam_1}-${chart.half_sangam_2}`,
    },
    {
      label: "Full Sangam",
      rate: `${chart.full_sangam_1}-${chart.full_sangam_2}`,
    },
  ];

  return (
    <div className="max-w-md mx-auto min-h-screen font-sans text-white">
      {/* HEADER */}
      <div className="relative py-4 flex items-center bg-gradient-to-b from-black to-black/0">
        <button
          onClick={() => window.history.back()}
          className="absolute left-3 p-2 rounded-full hover:bg-white/10"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl w-full text-center font-semibold">Game Rate</h1>
      </div>

      {/* LIST */}
      <div className="mt-3 px-4 space-y-3">
        {rates.map((item, index) => (
          <div
            key={index}
            className="flex justify-between items-center bg-white/10 backdrop-blur-lg text-white p-3 rounded-lg border border-white/10 shadow"
          >
            <span className="text-md font-medium">{item.label}</span>
            <span className="text-md font-semibold">{item.rate}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
