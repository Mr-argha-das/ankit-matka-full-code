// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { Play, Info, ArrowLeft } from "lucide-react";
// import { FaChartLine } from "react-icons/fa6";
// import { API_URL } from "../../config";

// export default function StarlineMarket() {
//   const token = localStorage.getItem("accessToken");
//   const headers = { Authorization: `Bearer ${token}` };

//   const [markets, setMarkets] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [gameRates, setGameRates] = useState({});
//   const displayDigit = (v) => (!v || v === "-" ? "X" : v);
//   const displayPanna = (v) => (!v || v === "-" ? "XXX" : v);

//   const fetchRates = async () => {
//     try {
//       const res = await axios.get(`${API_URL}/api/admin/rate/`, { headers });
//       const data = res.data;
//       console.log("data", data);
//       setGameRates(data);
//     } catch (err) {
//       console.log("Rate fetch error:", err);
//     }
//   };

//   useEffect(() => {
//     fetchRates();
//   }, []);

//   const fetchMarkets = async () => {
//     try {
//       const res = await axios.get(`${API_URL}/api/admin/user/starline`, {
//         headers,
//       });

//       console.log(res?.data?.data);
//       const list = res.data.data.map((m) => {
//         const today = m.today_result || {};

//         return {
//           id: m._id?.$oid,
//           name: m.name,
//           is_active: m.is_active,
//           hindi: m.hindi,
//           openTime: m.open_time,
//           closeTime: m.close_time,
//           status: m.status,
//           marketType: m.marketType,
//           today_result: {
//             open_digit: displayDigit(today.open_digit),
//             close_digit: displayDigit(today.close_digit),
//             open_panna: displayPanna(today.open_panna),
//             close_panna: displayPanna(today.close_panna),
//           },
//         };
//       });

//       console.log("List ", list);

//       setMarkets(list);
//     } catch (err) {
//       console.error("Starline load error:", err);
//     }

//     setLoading(false);
//   };

//   useEffect(() => {
//     fetchMarkets();
//   }, []);

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-[60vh] text-white">
//         Loading Starline Markets…
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-3 mx-auto max-w-md font-sans pb-20">
//       {/* Header */}
//       <div className="w-full relative bg-gradient-to-b from-black to-black/0 py-2 flex items-center justify-between">
//         <button
//           onClick={() => window.history.back()}
//           className="p-2 pl-4 z-10 rounded-full hover:bg-white/10 transition"
//         >
//           <ArrowLeft size={22} />
//         </button>

//         <h2 className="text-md z-0 w-full absolute flex justify-center font-bold uppercase">
//           StarLine
//         </h2>

//         <span className="pr-4 z-10"></span>
//       </div>

//       {/* Types Info */}
//       <div className="px-3">
//         <div className="w-full bg-white/5 p-4 border border-gray-50/5 rounded-xl space-y-2">
//           <div className="flex justify-between text-[13px] text-gray-100">
//             <span className="font-semibold">Single Digit</span>
//             <span className="font-semibold">
//               {gameRates?.single_digit_1}–{gameRates?.single_digit_2}
//             </span>
//           </div>
//           <div className="flex justify-between text-[13px] text-gray-100">
//             <span className="font-semibold">Single Pana</span>
//             <span className="font-semibold">
//               {" "}
//               {gameRates?.single_pana_1}–{gameRates?.single_pana_2}
//             </span>
//           </div>
//           <div className="flex justify-between text-[13px] text-gray-100">
//             <span className="font-semibold">Double Pana</span>
//             <span className="font-semibold">
//               {gameRates?.double_pana_1}–{gameRates?.double_pana_2}
//             </span>
//           </div>
//           <div className="flex justify-between text-[13px] text-gray-100">
//             <span className="font-semibold">Triple Pana</span>
//             <span className="font-semibold">
//               {gameRates?.tripple_pana_1}–{gameRates?.tripple_pana_2}
//             </span>
//           </div>
//         </div>
//       </div>

//       {/* History buttons */}
//       <div className="w-full flex gap-3 px-3">
//         <a
//           href="/bid-history"
//           className="bg-white/10 flex items-center justify-center font-medium rounded-xl border border-gray-50/5 py-2 w-full"
//         >
//           Bids History
//         </a>
//         <a
//           href="/win-history"
//           className="bg-white/10 flex items-center justify-center font-medium rounded-xl border border-gray-50/5 py-2 w-full"
//         >
//           Win History
//         </a>
//       </div>

//       {/* Markets */}
//       <div className="px-3">
//         {markets.map((mkt) => {
//           const r = mkt.today_result;
//           return (
//             <div
//               key={mkt.id}
//               className="w-full rounded-xl shadow-lg backdrop-blur-2xl border border-white/10 mb-3"
//             >
//               <div className="rounded-xl p-3 text-white">
//                 {/* Top Row */}
//                 <div className="flex justify-between items-center mb-2">
//                   <div className="flex items-center gap-1">
//                     <h2 className="text-base font-semibold uppercase">
//                       {mkt.name}
//                     </h2>
//                     <Info
//                       size={18}
//                       className="bg-gray-300 text-black rounded-full"
//                     />
//                   </div>

//                   <span
//                     className={`text-xs font-semibold ${
//                       mkt.status === true ? "text-green-400" : "text-red-400"
//                     }`}
//                   >
//                     {mkt.status === true ? "Market Running" : "Market Closed"}
//                   </span>
//                 </div>

//                 <div className="border-b border-dashed border-cyan-400/25 mb-2"></div>

//                 {/* Results */}
//                 <div className="flex justify-between items-center text-xs text-gray-300">
//                   <div>
//                     <h3 className="text-2xl mb-1 font-semibold text-[#c21af0] tracking-wider">
//                       {r.open_panna}-{r.open_digit}
//                       {/* {r.close_digit}-{r.close_panna} */}
//                     </h3>

//                     <div className="flex gap-7 text-gray-400">
//                       <p>
//                         {/* Open Time: */}
//                         <span className="block text-white font-medium">
//                           {mkt.openTime}
//                         </span>
//                       </p>
//                       {/* <p>
//                         Close Time:
//                         <span className="block text-white font-medium">
//                           {mkt.closeTime}
//                         </span>
//                       </p> */}
//                     </div>
//                   </div>

//                   <a href={`/charts/${mkt.id}`}>
//                     <FaChartLine size={26} />
//                   </a>

//                   <div className="flex flex-col items-center">
//                     <a
//                       href={mkt.status === true ? `/play/${mkt.id}` : ""}
//                       className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
//                         mkt.status === true
//                           ? "border-white"
//                           : "border-red-400 cursor-not-allowed"
//                       }`}
//                     >
//                       <Play
//                         size={18}
//                         className={
//                           mkt.status === true
//                             ? "text-green-500"
//                             : "text-red-400"
//                         }
//                       />
//                     </a>
//                     <span className="text-[14px] font-semibold">Play</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Play, Info, ArrowLeft } from "lucide-react";
import { FaChartLine } from "react-icons/fa6";
import { API_URL } from "../../config";

export default function StarlineMarket() {
  const token = localStorage.getItem("accessToken");
  const headers = { Authorization: `Bearer ${token}` };

  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gameRates, setGameRates] = useState({});

  const displayDigit = (v) => (!v || v === "-" ? "X" : v);
  const displayPanna = (v) => (!v || v === "-" ? "XXX" : v);

  /* ------------------ TIME CHECK FUNCTION ------------------ */
  function isMarketOpen(open_time) {
    if (!open_time) return false;

    const now = new Date();

    // ---------- OPEN TIME ----------
    // example: "4:30 PM"
    const [time, modifier] = open_time.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    // today ka open_time
    const closeDate = new Date();
    closeDate.setHours(hours, minutes, 0, 0);

    // ---------- MIDNIGHT ----------
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);

    /*
    LOGIC:
    Market OPEN if:
    now >= 12:00 AM
    AND
    now < open_time
  */

    return now >= midnight && now < closeDate;
  }

  /* ------------------ FETCH RATES ------------------ */
  const fetchRates = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/rate/`, { headers });
      setGameRates(res.data);
    } catch (err) {
      console.log("Rate fetch error:", err);
    }
  };

  /* ------------------ FETCH MARKETS ------------------ */
  const fetchMarkets = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/user/starline`, {
        headers,
      });

      const list = res.data.data.map((m) => {
        const today = m.today_result || {};

        return {
          id: m._id?.$oid,
          name: m.name,
          status: m.status,
          openTime: m.open_time,
          closeTime: m.close_time,
          today_result: {
            open_digit: displayDigit(today.open_digit),
            close_digit: displayDigit(today.close_digit),
            open_panna: displayPanna(today.open_panna),
            close_panna: displayPanna(today.close_panna),
          },
        };
      });

      setMarkets(list);
    } catch (err) {
      console.error("Starline load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    fetchMarkets();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh] text-white">
        Loading Starline Markets…
      </div>
    );
  }

  return (
    <div className="space-y-3 mx-auto max-w-md font-sans pb-20">
      {/* HEADER */}
      <div className="w-full relative bg-gradient-to-b from-black to-black/0 py-2 flex items-center">
        <button
          onClick={() => window.history.back()}
          className="p-2 pl-4 z-10 rounded-full hover:bg-white/10 transition"
        >
          <ArrowLeft size={22} />
        </button>

        <h2 className="absolute w-full text-center font-bold uppercase">
          StarLine
        </h2>
      </div>
      {/* RATES */}
      <div className="px-3">
        <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Single Digit</span>
            <span>
              {gameRates?.single_digit_1}–{gameRates?.single_digit_2}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Single Pana</span>
            <span>
              {gameRates?.single_pana_1}–{gameRates?.single_pana_2}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Double Pana</span>
            <span>
              {gameRates?.double_pana_1}–{gameRates?.double_pana_2}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Triple Pana</span>
            <span>
              {gameRates?.tripple_pana_1}–{gameRates?.tripple_pana_2}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full flex gap-3 px-3">
        <a
          href="/bid-history"
          className="bg-white/10 flex items-center justify-center font-medium rounded-xl border border-gray-50/5 py-2 w-full"
        >
          Bids History
        </a>
        <a
          href="/win-history"
          className="bg-white/10 flex items-center justify-center font-medium rounded-xl border border-gray-50/5 py-2 w-full"
        >
          Win History
        </a>
      </div>
      {/* MARKETS LIST */}
      <div className="px-3">
        {markets.map((mkt) => {
          const r = mkt.today_result;

          // ✅ HAR MARKET KA APNA STATUS
          const marketOpen = mkt.status === true && isMarketOpen(mkt.openTime);

          return (
            <div
              key={mkt.id}
              className="mb-3 rounded-xl border border-white/10 bg-black/40 p-3"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-1">
                  <h3 className="font-semibold uppercase">{mkt.name}</h3>
                  <Info
                    size={16}
                    className="bg-gray-300 text-black rounded-full"
                  />
                </div>

                <span
                  className={`text-xs font-semibold ${
                    marketOpen ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {marketOpen ? "Market Open" : "Market Closed"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-purple-400">
                    {r.open_panna}-{r.open_digit}
                  </h2>
                  <p className="text-sm text-gray-400">{mkt.openTime}</p>
                </div>

                <a href={`/charts/${mkt.id}`}>
                  <FaChartLine size={26} />
                </a>

                <div className="flex flex-col items-center">
                  <a
                    href={marketOpen ? `/play/${mkt.id}` : ""}
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                      marketOpen
                        ? "border-white"
                        : "border-red-400 cursor-not-allowed pointer-events-none"
                    }`}
                  >
                    <Play
                      size={18}
                      className={marketOpen ? "text-green-500" : "text-red-400"}
                    />
                  </a>

                  <span className="text-sm font-semibold">
                    {marketOpen ? "Play" : "Closed"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
