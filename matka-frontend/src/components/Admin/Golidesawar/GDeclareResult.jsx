import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../../config";

function formatDateISO(d = new Date()) {
  return d.toISOString().split("T")[0];
}

function toNiceDate(d) {
  try {
    return new Date(d).toLocaleDateString("en-GB"); // DD/MM/YYYY
  } catch {
    return d;
  }
}

function getId(obj) {
  if (!obj) return null;
  if (obj._id) {
    if (typeof obj._id === "string") return obj._id;
    if (obj._id.$oid) return obj._id.$oid;
    return obj._id;
  }
  if (obj.id) return obj.id;
  return null;
}

// ADD TOKEN AUTOMATICALLY
function authHeader() {
  return {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  };
}

export default function GDeclareResultPage() {
  const [date, setDate] = useState(formatDateISO());
  const [markets, setMarkets] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedMarketId, setSelectedMarketId] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [digit, setDigit] = useState("");

  console.log(results);
  const declaredIds = results.map((r) => r.market_id);

  function formatDateISO(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // LOAD MARKETS
  const loadMarkets = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/admin/Golidesawar/market`,
        authHeader()
      );
      setMarkets(res.data?.data || []);
    } catch (err) {
      console.error(err);
      alert("Market load failed");
    }
  };

  // LOAD RESULTS
  const fetchResults = async () => {
    try {
      setFetching(true);
      const res = await axios.get(
        `${API_URL}/api/admin/Golidesawar/results?date=${date}`,
        authHeader()
      );
      setResults(res.data?.data || []);
    } catch (err) {
      console.error(err);
      alert("Result fetch failed");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadMarkets();
    fetchResults();
  }, [date]);

  // INPUT HANDLER
  const handleInput = (e) => {
    let v = e.target.value;

    // only numbers + "-" allowed
    v = v.replace(/[^0-9-]/g, "");

    // CLOSE digit case: "-X"
    if (v.startsWith("-")) {
      v = "-" + v.replace("-", "").slice(0, 1); // only 1 digit allowed
    } else {
      v = v.slice(0, 2); // jodi max 2 digits
    }
    setDigit(v);
  };

  // DECLARE RESULT LOGIC
  const handleDeclare = async () => {
    if (!selectedMarketId) return alert("Select a market first!");
    let val = digit.trim();
    if (!val) return alert("Enter valid digit!");

    let payload = {
      game_id: selectedMarketId,
      date,
      session: "close",
    };

    // CASE 1: Single digit → open digit
    if (val.length === 1 && !val.startsWith("-")) {
      payload.session = "open";
      payload.digit = val;
    }

    // CASE 2: Close digit → "-X"
    else if (val.startsWith("-")) {
      if (val.length !== 2) return alert("Close digit format must be '-X'");
      payload.session = "close";
      payload.digit = val[1];
    }

    // CASE 3: Jodi → "XY"
    else if (val.length === 2) {
      payload.session = "close";
      payload.digit = val;
    }

    try {
      setLoading(true);

      await axios.post(
        `${API_URL}/api/admin/Golidesawar/result/declare`,
        payload,
        authHeader()
      );

      alert("Result Declared Successfully");
      setSelectedMarketId("");
      setDigit("");
      fetchResults();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Error declaring result");
    } finally {
      setLoading(false);
    }
  };

  // DELETE RESULT
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this result?")) return;

    try {
      const res = await axios.delete(
        `${API_URL}/api/admin/Golidesawar/result/${id}`,
        authHeader()
      );

      console.log(res);

      fetchResults();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  return (
    <div className=" lg:p-6 p-3 text-white">
      {/* SELECT MARKET BLOCK */}
      <div className="bg-white/5 rounded-xl p-3 shadow border border-white/5">
        <h2 className="text-xl font-semibold mb-4">Declare Result</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* DATE */}
          <div>
            <label className="text-gray-300 text-sm">Result Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full p-1.5 rounded  border border-gray-50/10"
            />
          </div>

          {/* GAME SELECT */}
          <div>
            <label className="text-gray-300 text-sm">Game Name</label>
            <select
              className="mt-1 w-full p-1.5 rounded  border border-gray-50/10"
              value={selectedMarketId}
              onChange={(e) => setSelectedMarketId(e.target.value)}
            >
              <option value="">Select Game Name</option>

              {markets
                .filter((m) => {
                  const id = getId(m);
                  const res = results.find((r) => r.market_id === id);

                  // No result yet → allow market
                  if (!res) return true;

                  const openDeclared =
                    res.open_digit !== null &&
                    res.open_digit !== undefined &&
                    res.open_digit !== "" &&
                    res.open_digit !== "-";

                  const closeDeclared =
                    res.close_digit !== null &&
                    res.close_digit !== undefined &&
                    res.close_digit !== "" &&
                    res.close_digit !== "-";

                  // Allow if one or both are NOT declared
                  if (!openDeclared || !closeDeclared) return true;

                  // Hide if BOTH digits are declared (not "-")
                  return false;
                })
                .map((m) => {
                  const id = getId(m);
                  return (
                    <option key={id} value={id}>
                      {m.name} ( {m.open_time} - {m.close_time} )
                    </option>
                  );
                })}
            </select>
          </div>
        </div>

        {/* SHOW ONLY AFTER MARKET SELECTED */}
        {selectedMarketId && (
          <div className="mt-6">
            <label className="text-gray-300 text-sm mb-1 block">
              Enter Digit (Single / -X / Jodi)
            </label>

            <div className="flex flex-col md:flex-row gap-4 items-start">
              <input
                value={digit}
                onChange={handleInput}
                className=" p-1.5 rounded  border border-white/10 w-full md:w-1/3"
                placeholder="Eg: 5, -3, 24"
              />

              <button
                onClick={handleDeclare}
                disabled={loading}
                className="bg-green-600 px-6 py-1.5 text-md rounded font-bold"
              >
                DECLARE
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RESULT HISTORY */}
      <div className="mt-4 bg-white/5 p-3 rounded-xl shadow border border-gray-50/10">
        {/* FILTERS */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Result History</h3>

          <div className="flex gap-3">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="p-1.5 rounded  border border-gray-50/10"
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-300 text-sm">
                <th className="px-2 py-1.5 text-[14px] border-b border-white/10">
                  #
                </th>
                <th className="px-2 py-1.5 text-[14px] border-b border-white/10">
                  Game
                </th>
                <th className="px-2 py-1.5 text-[14px] border-b border-white/10">
                  Date
                </th>
                <th className="px-2 py-1.5 text-[14px] border-b border-white/10">
                  Open
                </th>
                <th className="px-2 py-1.5 text-[14px] border-b border-white/10">
                  Close
                </th>
                <th className="px-2 py-1.5 text-[14px] border-b border-white/10">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {fetching ? (
                <tr>
                  <td colSpan="6" className="text-center p-6 text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : results?.length ? (
                results.map((r, i) => {
                  const id = r._id || r.id || getId(r);
                  return (
                    <tr key={id} className="bg-gray-900/20">
                      <td className="px-2 py-1.5 text-[14px] border-b border-white/10">
                        {i + 1}
                      </td>
                      <td className="px-2 py-1.5 text-[14px] border-b border-white/10">
                        {r.game_name}
                      </td>
                      <td className="px-2 py-1.5 text-[14px] border-b border-white/10">
                        {toNiceDate(r.date)}
                      </td>
                      <td className="px-2 py-1.5 text-[14px] border-b border-white/10">
                        {r.open_digit}
                      </td>
                      <td className="px-2 py-1.5 text-[14px] border-b border-white/10">
                        {r.close_digit}
                      </td>
                      <td className="px-2 py-1.5 text-[14px] border-b border-white/10">
                        <button
                          onClick={() => handleDelete(id)}
                          className="bg-red-600 px-3  rounded"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center p-6 text-gray-500">
                    No results found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
