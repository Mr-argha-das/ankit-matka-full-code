import React from "react";
import { ArrowLeft, BarChart2, Play } from "lucide-react";

// Mock data structures
const jackpotRates = [
  { label: "Left Digit", rate: "10 - 100" },
  { label: "Right Digit", rate: "10 - 100" },
  { label: "Jodi Digit", rate: "10 - 1000" },
];

const marketData = [
  {
    name: "DESAWAR - DS",
    result: "XX",
    status: "Market Running",
    time: "04:30 AM",
  },
  {
    name: "FARI DAABA D - FB",
    result: "XX",
    status: "Market Running",
    time: "05:30 PM",
  },
  {
    name: "GAZIYABAAD - GB",
    result: "XX",
    status: "Market Running",
    time: "09:15 PM",
  },
  {
    name: "GALI - GL",
    result: "XX",
    status: "Market Running",
    time: "11:05 PM",
  },
];

const RateCard = () => {
  // Component for a single rate row
  const RateRow = ({ label, rate }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
      <p className="text-gray-200 font-medium">{label}</p>
      <p className="text-gray-200 font-bold">{rate}</p>
    </div>
  );

  // Component for a single market card
  const MarketCard = ({ market }) => (
    <div className="flex items-center justify-between bg-white/20 rounded-xl shadow-md p-4 mb-3">
      <div className="flex flex-col">
        <h3 className="text-lg font-bold text-[#e1abf0] uppercase tracking-wider">
          {market.name}
        </h3>
        <p className="text-2xl font-extrabold text-gray-200 mt-1">
          {market.result}
        </p>
        <p className="text-[#e1abf0] font-semibold text-sm mt-1">
          {market.status}
        </p>
        <p className="text-gray-300 text-xs">{market.time}</p>
      </div>

      {/* Play Button */}
      <button
        className="w-12 h-12 flex items-center justify-center bg-green-500 rounded-full shadow-lg hover:bg-green-600 transition duration-150"
        onClick={() => console.log(`Playing market: ${market.name}`)}
        aria-label={`Play ${market.name}`}
      >
        <Play size={20} color="white" fill="white" />
      </button>
    </div>
  );

  return (
    // Main container with a light background
    <div className="max-w-md mx-auto font-sans">
      {/* 1. Header Section */}
      <div className="w-full bg-gradient-to-b from-black to-black/0 text-white py-4 flex items-center justify-center relative  ">
        <h1 className="text-xl font-semibold text-white tracking-wide">
          KING JACKPOT
        </h1>
        <button
          className="absolute right-4 p-1 rounded-full hover:bg-purple-800 transition"
          onClick={() => console.log("Chart button clicked")}
          aria-label="View charts"
        >
          <BarChart2 size={24} color="white" />
        </button>
      </div>

      {/* 2. Content Card Container (for centering and max-width) */}
      <div className="container mx-auto max-w-lg p-3 ">
        {/* 3. White Rate Card */}
        <div className="bg-white/20 rounded-xl shadow-xl p-4 space-y-6 mb-6">
          {/* Card Title */}
          <h2 className="text-xl font-extrabold text-gray-200 pb-3 text-center">
            King Jackpot
          </h2>

          {/* Rate List */}
          <div className="space-y-2">
            {jackpotRates.map((item, index) => (
              <RateRow key={index} label={item.label} rate={item.rate} />
            ))}
          </div>
        </div>

        {/* 4. History Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button className="bg-gradient-to-bl from-[#212b61] to-[#79049a] text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:bg-purple-800 transition transform hover:scale-[1.01]">
            Bid History
          </button>
          <button className="bg-gradient-to-bl from-[#212b61] to-[#79049a] text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:bg-purple-800 transition transform hover:scale-[1.01]">
            Win History
          </button>
        </div>

        {/* 5. Market Running Cards */}
        <div className="space-y-3">
          {marketData.map((market, index) => (
            <MarketCard key={index} market={market} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default RateCard;
