// import React, { useState } from "react";
// import { Loader2 } from "lucide-react";
// import { API_URL } from "../config";

// const API_BASE = API_URL;
// const getToken = () => localStorage.getItem("accessToken");

// export default function WinHistory() {
//   const today = new Date().toISOString().slice(0, 10);

//   const [startDate, setStartDate] = useState(today);
//   const [endDate, setEndDate] = useState(today);
//   const [loading, setLoading] = useState(false);
//   const [wins, setWins] = useState([]);
//   const [error, setError] = useState(null);

//   // Fetch Win History
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);

//     const token = getToken();
//     if (!token) {
//       setError("Please login again.");
//       setLoading(false);
//       return;
//     }

//     try {
//       const url = `${API_BASE}/user/winning_history?start_date=${startDate}&end_date=${endDate}`;

//       const response = await fetch(url, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       const data = await response.json();

//       if (!response.ok || data.error) {
//         setError(data.error || "Failed to load data.");
//         setWins([]);
//       } else {
//         setWins(data.wins || []);
//       }
//     } catch (err) {
//       setError("Network error while fetching history.");
//     }

//     setLoading(false);
//   };

//   return (
//     <div className="max-w-md mx-auto flex flex-col items-center font-sans text-white">
//       {/* Header */}
//       <div className="w-full bg-gradient-to-b from-black to-black/0 text-white py-4 text-center">
//         <h1 className="text-lg font-semibold">Win History</h1>
//       </div>

//       {/* Form Section */}
//       <form
//         onSubmit={handleSubmit}
//         className="w-[93%] max-w-md bg-white/20 rounded-2xl shadow-lg p-3 mt-3"
//       >
//         {/* Start Date */}
//         <div className="mb-4">
//           <label className="block text-gray-200 text-sm mb-1 font-medium">
//             Start Date
//           </label>
//           <input
//             type="date"
//             value={startDate}
//             onChange={(e) => setStartDate(e.target.value)}
//             className="w-full border text-gray-900 py-2 px-4 rounded-md  border-gray-300 focus:ring-2 focus:ring-purple-700 outline-none"
//           />
//         </div>

//         {/* End Date */}
//         <div className="mb-6">
//           <label className="block text-gray-200 text-sm mb-1 font-medium">
//             To Date
//           </label>
//           <input
//             type="date"
//             value={endDate}
//             onChange={(e) => setEndDate(e.target.value)}
//             className="w-full border text-gray-900 py-2 px-4 rounded-md border-gray-300 focus:ring-2 focus:ring-purple-700 outline-none"
//           />
//         </div>

//         {/* Submit */}
//         <button
//           type="submit"
//           className="w-full bg-purple-700 text-white font-semibold py-2 rounded-full hover:bg-purple-800 transition flex items-center justify-center"
//         >
//           {loading ? <Loader2 className="animate-spin" /> : "Submit"}
//         </button>
//       </form>

//       {/* Error */}
//       {error && (
//         <p className="text-red-400 mt-4 bg-red-900/20 px-4 py-2 rounded">
//           {error}
//         </p>
//       )}

//       {/* No Data */}
//       {!loading && wins.length === 0 && !error && (
//         <div className="flex flex-col items-center mt-10">
//           <img
//             src="https://cdni.iconscout.com/illustration/premium/thumb/no-data-found-illustration-download-in-svg-png-gif-file-formats--empty-result-search-error-pack-people-illustrations-4571557.png?f=webp"
//             alt="No Data"
//             className="w-48 mb-6"
//           />
//           <div className="bg-white px-5 py-2 rounded-full shadow-md">
//             <p className="text-gray-700 text-sm font-medium">
//               Winning History Data Not Available
//             </p>
//           </div>
//         </div>
//       )}

//       {/* Show Win Table */}
//       {wins.length > 0 && (
//         <div className="w-[93%] mt-6 bg-gray-900 rounded-lg shadow-xl p-3">
//           <h3 className="text-gray-200 mb-2 font-semibold">Winning Records</h3>

//           <table className="w-full text-left text-sm">
//             <thead className="text-gray-400 border-b border-gray-700">
//               <tr>
//                 <th className="py-2">TX ID</th>
//                 <th className="py-2">Amount</th>
//                 <th className="py-2">Date</th>
//               </tr>
//             </thead>

//             <tbody>
//               {wins.map((w) => (
//                 <tr key={w.tx_id} className="border-b border-gray-800">
//                   <td className="py-2 text-gray-300">
//                     {w.tx_id.slice(0, 6)}...
//                   </td>
//                   <td className="py-2 text-green-400 font-bold">₹{w.amount}</td>
//                   <td className="py-2 text-gray-400">
//                     {new Date(w.date).toLocaleString()}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }

import React, { useEffect, useState } from "react";
import axios from "axios";

import { Trophy, ArrowLeft } from "lucide-react";
import { API_URL } from "../config";

// const WIN_API = `${API_URL}/admin/result/winning`;
const WIN_API = `${API_URL}/api/admin/win-history`;

export default function WinningHistory() {
  const [history, setHistory] = useState([]);
  const [totalWins, setTotalWins] = useState(0);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("accessToken");

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const formatGameName = (str = "") =>
    str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const fetchHistory = async () => {
    try {
      const res = await axios.get(WIN_API, authHeader);

      console.log(res.data);

      setHistory(Array.isArray(res.data.wins) ? res.data.wins : []);
      setTotalWins(res.data.wins?.length || 0);
    } catch (err) {
      console.log("Error fetching history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <p className="text-center text-gray-400 py-6 text-sm">
        Loading winning history…
      </p>
    );
  }

  return (
    <section className="max-w-md mx-auto text-white font-sans pb-20">
      <div className="w-full relative bg-gradient-to-b from-black to-black/0 py-2 flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="p-2 pl-4 z-10 rounded-full hover:bg-white/10 transition"
        >
          <ArrowLeft size={22} />
        </button>

        <h2 className="text-md z-0 w-full absolute font-bold px-4 py-2 flex justify-center items-center gap-2">
          <span className="flex gap-2 text-md items-center uppercase">
            Winning History
          </span>
        </h2>

        <div className="pr-4 z-10"></div>
      </div>

      {/* TOTAL WINS */}
      <p className="text-center text-purple-300 text-sm mt-1 mb-4">
        Total Wins:{" "}
        <span className="font-semibold text-white">{totalWins}</span>
      </p>

      {/* NO HISTORY */}
      {history.length === 0 ? (
        <div className="text-center text-gray-400 py-6">
          No winning history found.
        </div>
      ) : (
        <div className="space-y-3 px-4">
          {history.map((item, index) => (
            <div
              key={index}
              className="bg-white/10 border border-gray-700 p-4 rounded-xl shadow-md"
            >
              {/* MARKET NAME */}
              <p className="text-sm font-semibold text-purple-300">
                {item.market_name}
              </p>

              {/* GAME */}
              <p className="text-sm mt-1">
                <span className="text-gray-300">Game:</span>{" "}
                {formatGameName(item.game_type)}
              </p>

              {/* DIGIT */}
              {/* <p className="text-sm">
                <span className="text-gray-300">Digit:</span> {item.digit}
              </p> */}

              <p className="text-sm">
                <span className="text-gray-300">Digit:</span>{" "}
                {item.digit_or_panna}
              </p>

              {/* SESSION */}
              <p className="text-sm capitalize">
                <span className="text-gray-300">Session:</span> {item.session}
              </p>

              {/* POINTS */}
              <p className="text-sm">
                <span className="text-gray-300">Points:</span> {item.points}
              </p>

              {/* WIN AMOUNT */}
              <p className="text-sm text-green-400 font-bold">
                Winning Amount: ₹{item.win_amount}
              </p>

              {/* RESULT BOX */}
              {/* <div className="mt-3 bg-black/40 border border-gray-600 rounded-lg p-2 text-xs text-gray-300">
                <p className="font-semibold text-white">Result:</p>
                <p>Open Digit: {item.result.open_digit}</p>
                <p>Close Digit: {item.result.close_digit}</p>
                <p>Open Panna: {item.result.open_panna}</p>
                <p>Close Panna: {item.result.close_panna}</p>
              </div> */}

              <div className="mt-3 bg-black/40 border border-gray-600 rounded-lg p-2 text-xs text-gray-300">
                <p className="font-semibold text-white">Result:</p>
                <p>Open Digit: {item.declared_result?.open_digit}</p>
                <p>Close Digit: {item.declared_result?.close_digit}</p>
                <p>Open Panna: {item.declared_result?.open_panna}</p>
                <p>Close Panna: {item.declared_result?.close_panna}</p>
              </div>

              {/* DATE */}
              {/* <p className="text-[11px] text-gray-400 mt-2">
                {new Date(
                  new Date(item.created_at).getTime() + 5.5 * 60 * 60 * 1000
                ).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true,
                })}
                {new Date(item.date).toLocaleString()}
              </p> */}

              <p className="text-[11px] text-gray-400 mt-2">
                {new Date(
                  new Date(item.created_at).getTime() + 5.5 * 60 * 60 * 1000
                ).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
