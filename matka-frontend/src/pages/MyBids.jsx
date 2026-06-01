import React from "react";
import {
  ArrowLeft,
  Wallet,
  Gamepad2,
  Ticket,
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronRight,
} from "lucide-react";

export default function MyBids() {
  const bidOptions = [
    {
      id: 1,
      link: "/bid-history",
      title: "Bid History",
      desc: "you can add funds to your wallet",
      color: "bg-purple-600",
      icon: <Wallet size={22} className="text-white" />,
    },
    {
      id: 2,
      link: "/win-history",
      title: "Game Results",
      desc: "you can view market result history.",
      color: "bg-green-500",
      icon: <Gamepad2 size={22} className="text-white" />,
    },
    {
      id: 3,
      link: "/bid-history",
      title: "Starline Bid History",
      desc: "you can starline history.",
      color: "bg-purple-400",
      icon: <Ticket size={22} className="text-white" />,
    },
    {
      id: 4,
      link: "/win-history",
      title: "Starline Result History",
      desc: "You can view starline result",
      color: "bg-red-500",
      icon: <ArrowDownCircle size={22} className="text-white" />,
    },
    {
      id: 5,
      link: "/king-bids-history",
      title: "Galidesawar Bid History",
      desc: "You can view your Galidesawar history",
      color: "bg-cyan-500",
      icon: <ArrowUpCircle size={22} className="text-white" />,
    },
    {
      id: 6,
      link: "/king-win-history",
      title: "Galidesawar Result History",
      desc: "You can view your Galidesawar result",
      color: "bg-green-500",
      icon: <ArrowUpCircle size={22} className="text-white" />,
    },
  ];

  return (
    <div className="max-w-md mx-auto pb-20 flex flex-col">
      {/* Header */}
      <div className="w-full relative bg-gradient-to-b from-black to-black/0 py-2 flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="p-2 pl-4 z-10 rounded-full hover:bg-white/10 transition"
        >
          <ArrowLeft size={22} />
        </button>

        <h2 className="text-md z-0 w-full absolute   justify-between font-bold bg-gradient-to-b from-black to-black/0 px-4 py-2  flex justify-center items-center gap-2">
          <span className="flex gap-2 text-md items-center">My Bids</span>
        </h2>

        <a className="z-10">{/* <HistoryIcon /> */}</a>
      </div>

      {/* Bids Options */}
      <div className="mt-3 pb-10 w-[94%] max-w-md mx-auto space-y-4">
        {bidOptions.map((item) => (
          <a
            href={item?.link}
            key={item.id}
            className="flex items-center justify-between bg-white/5 rounded-xl shadow p-4 hover:shadow-md transition"
            // className="flex items-center  bg-white rounded-xl shadow p-4 hover:shadow-md transition"
          >
            <div className="flex items-center">
              {/* Icon Box */}
              <div
                className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center shadow`}
              >
                {item.icon}
              </div>

              {/* Text Section */}
              <div className="ml-4 flex flex-col">
                <h3 className="text-sm font-bold text-gray-200">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-300">{item.desc}</p>
              </div>
            </div>

            {/* Arrow */}
            <ChevronRight size={20} className="text-white" />
          </a>
        ))}
      </div>
    </div>
  );
}
