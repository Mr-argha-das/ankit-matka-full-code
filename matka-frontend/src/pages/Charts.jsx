// Updated Chats.jsx UI with clean layout and no extra images
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";
import dayjs from "dayjs";
import { ArrowLeft } from "lucide-react";
import { useMediaQuery } from "react-responsive";

export default function Chats() {
  const [marketName, setMarketName] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noData, setNoData] = useState(false);
  const { marketId } = useParams();

  const smallest = useMediaQuery({ maxWidth: 374 });
  const small = useMediaQuery({ minWidth: 375 });
  const mid = useMediaQuery({ minWidth: 424 });
  const large = useMediaQuery({ minWidth: 454 });

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setNoData(false);
      try {
        const url = marketId
          ? `${API_URL}/api/admin/market-chart?market_id=${marketId}`
          : `${API_URL}/api/admin/market-chart`;

        const res = await axios.get(url);

        console.log("charts", res);
        const data = Array.isArray(res.data)
          ? res.data
          : res.data.chart || res.data.results || [];

        if (!data.length) {
          setNoData(true);
          setItems([]);
        } else {
          const normalized = data.map((it) => ({
            ...it,
            date: it.date,
            open_panna: (it.open_panna || "000").toString().padStart(3, "0"),
            close_panna: (it.close_panna || "000").toString().padStart(3, "0"),
            open_digit: (it.open_digit || "-").toString(),
            close_digit: (it.close_digit || "-").toString(),
          }));

          normalized.sort((a, b) => (a.date > b.date ? 1 : -1));

          setItems(normalized);
          setMarketName(normalized[0]?.market_name || "Market");
        }
      } catch (err) {
        console.log(err);
        setNoData(true);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [marketId]);

  const rows = [];
  for (let i = 0; i < items.length; i += 7) rows.push(items.slice(i, i + 7));

  const getDayLabel = (d) => dayjs(d).format("ddd");
  const formatDate = (d) => dayjs(d).format("DD MMM YYYY");

  if (loading)
    return <div className="text-center text-white p-6">Loading...</div>;

  if (noData)
    return (
      <div className="text-center text-white p-6 text-lg font-semibold">
        No data available
      </div>
    );

  return (
    <div className="mx-auto">
      {/* Header */}

      <div className="w-full max-w-md mx-auto relative bg-gradient-to-b from-black to-black/0 py-2 flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="p-2 pl-4 z-10 rounded-full  transition"
        >
          <ArrowLeft size={22} />
        </button>

        <h2 className="text-md z-0 w-full absolute   justify-between font-bold bg-gradient-to-b from-black to-black/0 px-4 py-2  flex justify-center items-center gap-2">
          <span className="flex flex-wrap gap-2 text-md items-center">
            {marketName.toUpperCase()} - RESULT CHART
          </span>
        </h2>
        <a className="pr-4 z-10"></a>
      </div>

      {/* Calendar Grid */}
      <div>
        <div className=" max-w-md mx-auto  px-4 mt-4">
          {[...rows].reverse().map((week, idx) => (
            <div key={idx} className="w-full overflow-x-auto">
              <div
                className={`grid ${smallest ? "grid-cols-2" : ""} ${
                  small ? "grid-cols-3" : ""
                } 
                ${mid ? "grid-cols-3" : ""}
                ${large ? "grid-cols-3" : ""}
                `}
              >
                {[...week].reverse().map((item, i) => (
                  <div
                    key={i}
                    className="borde bg-white/5 border border-gray-50/5  p- text-white"
                    style={{ minWidth: 110 }}
                  >
                    {/* Top Date */}
                    <div className="text-center mb-1">
                      <div className="text-[11px] font-semibold text-sky-400">
                        {getDayLabel(item.date)}
                      </div>
                      <div className="text-[11px] text-slate-300">
                        {formatDate(item.date)}
                      </div>
                    </div>

                    {/* Open Panna */}
                    <div className="grid grid-cols-3 text-[12px] mb-1">
                      <span className="text-center">{item.open_panna[0]}</span>
                      <span className="text-center font-bold text-lime-400">
                        {item.open_panna}
                      </span>
                      <span className="text-center">{item.open_panna[2]}</span>
                    </div>

                    {/* Open Digit */}
                    <div className="text-center text-[18px] font-extrabold text-yellow-300">
                      {item.open_digit}
                    </div>

                    <div className="h-px bg-slate-600 my-1" />

                    {/* Close Panna */}
                    <div className="grid grid-cols-3 text-[12px] mt-1">
                      <span className="text-center">{item.close_panna[0]}</span>
                      <span className="text-center font-bold text-red-400">
                        {item.close_panna}
                      </span>
                      <span className="text-center">{item.close_panna[2]}</span>
                    </div>

                    {/* Close Digit */}
                    <div className="text-center text-[18px] font-extrabold text-yellow-300 mt-1">
                      {item.close_digit}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-slate-400 text-sm">
        © 2025 — Result Chart
      </div>
    </div>
  );
}
