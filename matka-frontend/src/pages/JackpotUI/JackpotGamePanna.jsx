import {
  ArrowLeft,
  CardSim,
  Diamond,
  DiamondIcon,
  Dice1,
  Dice2,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../config";

export default function JackpotDigitSelect() {
  const { marketId } = useParams();
  const token = localStorage.getItem("accessToken");
  const headers = { Authorization: `Bearer ${token}` };

  console.log(marketId);

  const [market, setMarket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMarketData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${API_URL}/api/admin/Golidesawar/market/${marketId}`,
        {
          headers,
        }
      );

      console.log(response);

      // const formattedData = {
      //   id: data.id,
      //   name: data.name || data.start_time,
      //   open_time: data.start_time,
      //   close_time: data.end_time || "—",
      //   is_active: data.is_active ?? true,
      // };

      setMarket(response?.data?.data);
    } catch (err) {
      console.log("Error fetching market:", err);
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
      name: "Open Digit",
      icon: <Dice1 size={30} className="text-yellow-500" />,
    },
    {
      name: "Close Digit",
      icon: <Dice2 size={30} className="text-yellow-500" />,
    },
    {
      name: "Jodi",
      icon: <DiamondIcon size={30} className="text-yellow-500" />,
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

  console.log(market);
  return (
    <div className="max-w-md mx-auto flex flex-col font-sans pb-20">
      {/* MARKET HEADER */}
      <div className="w-full relative bg-gradient-to-b from-black to-black/0 pb-2  flex items-center justify-between">
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
      {/* MARKET DETAILS */}

      <p className="text-xs bg-white/5 flex justify-between px-4 py-3 rounded-b-lg text-gray-300 mb-4">
        <span className="flex flex-col">
          <strong>Open Time :</strong> <span>{market.open_time}</span>
        </span>
        <span className="flex flex-col">
          <strong>Close Time :</strong>

          <span>{market.close_time}</span>
        </span>
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

      {/* GAME GRID */}
      <div className="flex flex-col items-center p-3 gap-4">
        {/* TOP TWO ROW ITEMS */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          {allGames.slice(0, 2).map((game, index) => (
            <a
              key={index}
              href={`/jackpot/${marketId}/${createSlug(game.name)}`}
              className="flex flex-col justify-center items-center backdrop-blur-2xl rounded-xl py-6 shadow-2xl hover:bg-gray-50/5 transition-all duration-200 hover:scale-[1.03] border border-gray-50/15 "
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

        {/* SINGLE CENTER ITEM */}
        <div className="mt-2">
          {allGames.slice(2, 3).map((game, index) => (
            <a
              key={index}
              href={`/jackpot/${marketId}/${createSlug(game.name)}`}
              className="flex flex-col w-40  justify-center items-center backdrop-blur-2xl rounded-xl py-6 shadow-2xl hover:bg-gray-50/5 transition-all duration-200 hover:scale-[1.03] border border-gray-50/15 "
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
    </div>
  );
}
