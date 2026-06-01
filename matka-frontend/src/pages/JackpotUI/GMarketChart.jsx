import React, { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { ArrowLeft } from "lucide-react";
import { useMediaQuery } from "react-responsive";
import { API_URL } from "../../config";
import { useParams } from "react-router-dom";

export default function GMarketChart() {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noData, setNoData] = useState(false);
  const { marketId } = useParams();

  const smallest = useMediaQuery({ maxWidth: 374 });
  const small = useMediaQuery({ minWidth: 375 });
  const mid = useMediaQuery({ minWidth: 424 });
  const large = useMediaQuery({ minWidth: 454 });

  useEffect(() => {
    const fetchCharts = async () => {
      try {
        setLoading(true);
        setNoData(false);

        const url = marketId
          ? `${API_URL}/api/admin/Golidesawar/market-chart?market_id=${marketId}`
          : `${API_URL}/api/admin/Golidesawar/market-chart`;

        const res = await axios.get(url);
        const data = res?.data?.data || [];

        if (!data.length) {
          setNoData(true);
          setMarkets([]);
        } else {
          setMarkets(data);
        }
      } catch (err) {
        console.error(err);
        setNoData(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCharts();
  }, [marketId]);

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
        <button onClick={() => window.history.back()} className="p-2 pl-4 z-10">
          <ArrowLeft size={22} />
        </button>

        <h2 className="absolute w-full text-center font-bold text-md">
          MARKET RESULT CHART
        </h2>
      </div>

      {/* Market Wise Charts */}
      <div className="max-w-md mx-auto px-4 mt-4 space-y-6">
        {/* {markets.map((market) => {
          const rows = [];
          for (let i = 0; i < market.results.length; i += 7) {
            rows.push(market.results.slice(i, i + 7));
          }

          return (
            <div key={market.market_id}>
              <h3 className="text-center text-sky-400 font-bold mb-2">
                {market.market_name.trim().toUpperCase()}
              </h3>

              {rows.map((week, idx) => (
                <div key={idx} className="w-full overflow-x-auto mb-3">
                  <div
                    className={`grid 
                      ${smallest ? "grid-cols-2" : ""}
                      ${small || mid || large ? "grid-cols-3" : ""}
                    `}
                  >
                    {week.map((item, i) => (
                      <div
                        key={`${item.date}-${i}`}
                        className="bg-white/5 border border-gray-50/5 text-white p-2"
                        style={{ minWidth: 110 }}
                      >
                        <div className="text-center mb-1">
                          <div className="text-[11px] font-semibold text-sky-400">
                            {getDayLabel(item.date)}
                          </div>
                          <div className="text-[11px] text-slate-300">
                            {formatDate(item.date)}
                          </div>
                        </div>

                        <div className="text-center text-[18px] font-extrabold text-lime-400">
                          {item.open_digit}
                        </div>

                        <div className="h-px bg-slate-600 my-1" />

                        <div className="text-center text-[18px] font-extrabold text-yellow-300">
                          {item.close_digit}
                        </div>

                        <div
                          className={`text-center text-[11px] mt-1 font-semibold ${
                            item.status === "closed"
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {item.status.toUpperCase()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })} */}
        {markets.map((market) => {
          // 1️⃣ reverse results safely (latest first)
          const reversedResults = [...market.results].reverse();

          // 2️⃣ chunk into weeks
          const rows = [];
          for (let i = 0; i < reversedResults.length; i += 7) {
            rows.push(reversedResults.slice(i, i + 7));
          }

          return (
            <div key={market.market_id}>
              <h3 className="text-center text-sky-400 font-bold mb-2">
                {market.market_name.trim().toUpperCase()}
              </h3>

              {/* 3️⃣ render weeks (already newest first) */}
              {rows.map((week, idx) => (
                <div key={idx} className="w-full overflow-x-auto mb-3">
                  <div
                    className={`grid 
              ${smallest ? "grid-cols-2" : ""}
              ${small || mid || large ? "grid-cols-3" : ""}
            `}
                  >
                    {week.map((item, i) => (
                      <div
                        key={`${item.date}-${i}`}
                        className="bg-white/5 border border-gray-50/5 text-white p-2"
                        style={{ minWidth: 110 }}
                      >
                        {/* Date */}
                        <div className="text-center mb-1">
                          <div className="text-[11px] font-semibold text-sky-400">
                            {getDayLabel(item.date)}
                          </div>
                          <div className="text-[11px] text-slate-300">
                            {formatDate(item.date)}
                          </div>
                        </div>

                        {/* Open Digit */}
                        <div className="text-center text-[18px] font-extrabold text-lime-400">
                          {item.open_digit}
                        </div>

                        <div className="h-px bg-slate-600 my-1" />

                        {/* Close Digit */}
                        <div className="text-center text-[18px] font-extrabold text-yellow-300">
                          {item.close_digit}
                        </div>

                        {/* Status */}
                        <div
                          className={`text-center text-[11px] mt-1 font-semibold ${
                            item.status === "closed"
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {item.status.toUpperCase()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-slate-400 text-sm">
        © 2025 — Market Result Chart
      </div>
    </div>
  );
}
