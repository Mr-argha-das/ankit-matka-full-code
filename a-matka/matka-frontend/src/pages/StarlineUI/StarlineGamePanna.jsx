import { CardSim, Diamond, Dice1 } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../config";

const API_BASE = `${API_URL}/starline_jackpot`;

export default function StarlineGames() {
  const { marketId } = useParams();

  console.log(marketId);

  const [market, setMarket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMarketData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE}/starline/${marketId}`);

      const data = response.data;

      const formattedData = {
        id: data.id,
        name: data.name || data.start_time,
        open_time: data.start_time,
        close_time: data.end_time || "—",
        is_active: data.is_active ?? true,
      };

      setMarket(formattedData);
    } catch (err) {
      console.error("Error fetching market:", err);
      setError("Failed to load market. Please check server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
  }, [marketId]);

  const createSlug = (name) => name.toLowerCase().replace(/\s+/g, "-");

  const allGames = [
    {
      name: "Single Digit",
      icon: <Dice1 size={30} className="text-yellow-500" />,
    },
    {
      name: "Single Panna",
      icon: <CardSim size={30} className="text-yellow-500" />,
    },
    {
      name: "Double Panna",
      icon: <CardSim size={30} className="text-yellow-500" />,
    },
    {
      name: "Triple Panna",
      icon: <Diamond size={30} className="text-yellow-500" />,
    },
  ];

  if (loading) {
    return (
      <div className="text-white text-center py-10 min-h-screen bg-gray-900">
        <h1 className="text-xl font-semibold animate-pulse">
          Loading Market...
        </h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 min-h-screen bg-red-900/40 text-red-300">
        <h1 className="text-xl font-semibold mb-2">Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="text-white text-center py-10 min-h-screen bg-gray-900">
        <h1 className="text-xl font-semibold">Market Not Found.</h1>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto flex flex-col font-sans pb-20">
      {/* MARKET HEADER */}
      <div className="w-full bg-black text-white py-4 flex items-center justify-center">
        <h1 className="text-lg font-semibold uppercase tracking-widest">
          {market.name}
        </h1>
      </div>

      {/* MARKET DETAILS */}
      <div className="bg-[#5a0572] text-xs py-2 px-4 flex justify-around text-gray-200 mb-4 border-b-2 border-[#5a0572]">
        <p>
          Open: <span className="text-white">{market.open_time}</span>
        </p>
        <p>
          Close: <span className="text-white">{market.close_time}</span>
        </p>
        <span
          className={`font-bold px-2 py-0.5 rounded-full ${
            market.is_active ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {market.is_active ? "LIVE" : "CLOSED"}
        </span>
      </div>

      {/* GAME GRID */}
      <div className="grid grid-cols-2 gap-4 p-3">
        {allGames.map((game, index) => (
          <a
            key={index}
            href={`/starline/${marketId}/${createSlug(game.name)}`}
            className="flex flex-col justify-center items-center bg-gray-800 rounded-xl py-6 border border-gray-700 hover:border-cyan-500 hover:bg-cyan-700/40 transition-all hover:scale-[1.04]"
          >
            <div className="bg-[#5a0572] rounded-full p-4 mb-2 shadow-lg">
              {game.icon}
            </div>
            <p className="text-white text-sm font-bold text-center">
              {game.name}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
