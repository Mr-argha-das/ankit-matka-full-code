import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";
import { ArrowLeft, CardSim, Coins, Diamond, Dice1, Dice2 } from "lucide-react";

export default function Games() {
  const { marketId } = useParams();

  const [market, setMarket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("accessToken");
  const headers = { Authorization: `Bearer ${token}` };

  // Convert name → slug
  const createSlug = (name) => name.toLowerCase().replace(/\s+/g, "-");

  // ============================
  // FETCH MARKET DETAILS
  // ============================

  const fetchMarketDetails = useCallback(async () => {
    if (!marketId) {
      setError("Market ID missing");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const res = await axios.get(`${API_URL}/api/admin/market/${marketId}`, {
        headers,
      });

      console.log(res);

      const m = res?.data?.data;

      console.log(m);

      if (!m) {
        setError("Market not found");
        return;
      }

      setMarket({
        id: m._id?.$oid,
        name: m.name,
        hindi: m.hindi,
        open_time: m.open_time,
        close_time: m.close_time,
        status: m.status,
        is_active: m.is_active,
        marketType: m.marketType,
      });
    } catch (err) {
      console.log(err);
      setError("Failed to load market details.");
    } finally {
      setIsLoading(false);
    }
  }, [marketId]);

  useEffect(() => {
    fetchMarketDetails();
  }, [fetchMarketDetails]);

  // ============================
  // GAME CARDS
  // ============================
  const allGames = [
    {
      name: "Single Digit",
      icon: <Dice1 size={30} className="text-yellow-500" />,
    },
    {
      name: "Jodi Digit",
      icon: <Dice2 size={30} className="text-yellow-500" />,
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
    {
      name: "SP, DP ,TP",
      icon: <Coins size={30} className="text-yellow-500" />,
    },
    {
      name: "Half Sangam",
      icon: (
        <img
          src="https://placehold.co/60x60/fde047/1f2937?text=H"
          className="w-14 h-14"
        />
      ),
    },
    {
      name: "Full Sangam",
      icon: (
        <img
          src="https://placehold.co/60x60/fde047/1f2937?text=F"
          className="w-14 h-14"
        />
      ),
    },
  ];

  if (isLoading)
    return (
      <div className="text-white text-center py-10 max-w-md mx-auto min-h-screen">
        <h1 className="text-xl font-semibold animate-pulse">
          Loading Market...
        </h1>
      </div>
    );

  if (error)
    return (
      <div className="text-center py-10 max-w-md mx-auto min-h-screen bg-red-800/30 text-red-300 p-4">
        <h1 className="text-xl font-semibold mb-2">Error</h1>
        <p>{error}</p>
      </div>
    );

  if (!market)
    return (
      <div className="text-white text-center py-10 max-w-md mx-auto min-h-screen">
        <h1 className="text-xl font-semibold">Market Not Found</h1>
      </div>
    );

  return (
    <div className="max-w-md mx-auto flex flex-col font-sans text-white">
      <div className="w-full relative bg-gradient-to-b from-black to-black/0 pb-2 flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="p-2 pl-4 z-10 rounded-full hover:bg-white/10 transition"
        >
          <ArrowLeft size={22} />
        </button>
        <h2 className="text-md z-0 w-full absolute   justify-between font-bold bg-gradient-to-b from-black to-black/0 px-4 py-2  flex justify-center items-center gap-2">
          <span className="flex gap-2 uppercase text-md items-center">
            {market?.name}
          </span>
        </h2>
        <a className="pr-4 z-10">{/* <HistoryIcon /> */}</a>
      </div>

      <p className="text-xs bg-white/5 flex justify-between px-4 py-3 rounded-b-lg text-gray-300 mb-4">
        <span className="flex flex-col">
          <strong>Open Time :</strong> <span>{market.open_time}</span>
        </span>
        {market.marketType !== "Starline" ? (
          <span className="flex flex-col">
            <strong>Close Time :</strong>
            <span>{market.close_time}</span>
          </span>
        ) : (
          ""
        )}
        <span className="flex flex-col">
          <strong>Status:</strong>
          <span
            className={`font-bold rounded-full text-xs ${
              market.status === true ? "text-green-600" : "text-red-600"
            }`}
          >
            {market.status === true ? "Market Running" : "Market Closed"}
          </span>
        </span>
      </p>

      <div className="grid grid-cols-2 gap-4 p-3 pb-20">
        {allGames.map((game, index) => (
          <a
            key={index}
            href={`/game/${marketId}/${createSlug(game.name)}`}
            className="flex flex-col justify-center items-center backdrop-blur-2xl rounded-xl py-6 shadow-2xl hover:bg-gray-50/5 transition-all duration-200 hover:scale-[1.03] border border-gray-50/15 "
          >
            <div className="bg-[#5a0572] rounded-full p-4 mb-3 shadow-lg shadow-[#5a0572]/50">
              {game.icon}
            </div>
            <p className="text-gray-100 text-sm font-bold text-center tracking-wider">
              {game.name}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
