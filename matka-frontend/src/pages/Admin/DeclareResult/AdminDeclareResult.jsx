import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { API_URL } from "../../../config";

const API_RESULT = `${API_URL}/admin/result/declare`;
const API_MARKET = `${API_URL}/market`;

export default function AdminDeclareResult() {
  const { marketId } = useParams();
  const [marketName, setMarketName] = useState("Loading...");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [openDigit, setOpenDigit] = useState("");
  const [closeDigit, setCloseDigit] = useState("");
  const [openPanna, setOpenPanna] = useState("");
  const [closePanna, setClosePanna] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("accessToken");

  // GET MARKET NAME
  const fetchMarket = async () => {
    try {
      const res = await axios.get(`${API_MARKET}/${marketId}`);
      setMarketName(res.data.name);
    } catch (err) {
      setMarketName("Unknown Market");
    }
  };

  useEffect(() => {
    fetchMarket();
  }, [marketId]);

  // VALIDATION
  const validate = () => {
    if (openDigit && openDigit.length !== 1)
      return "Open digit must be 1 digit.";

    if (closeDigit && closeDigit.length !== 1)
      return "Close digit must be 1 digit.";

    if (openPanna && openPanna.length !== 3)
      return "Open panna must be 3 digits.";

    if (closePanna && closePanna.length !== 3)
      return "Close panna must be 3 digits.";

    return null;
  };

  // SUBMIT RESULT
  const declareResult = async () => {
    setMsg(null);
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    const payload = {
      market_id: marketId,
      date,
      open_digit: openDigit || "-",
      close_digit: closeDigit || "-",
      open_panna: openPanna || "-",
      close_panna: closePanna || "-",
    };

    try {
      const res = await axios.post(API_RESULT, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      setMsg("Result declared successfully ✔ Settlement done!");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to declare result.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen p-4 text-white bg-[#0b0f1e]">
      <h2 className="text-xl text-center font-bold mb-4">Declare Result</h2>

      <div className="max-w-xl mx-auto bg-white/10 p-5 rounded-xl shadow-xl backdrop-blur-md">
        <p className="text-center text-purple-300 text-sm mb-4">
          Market: <span className="font-semibold text-white">{marketName}</span>
        </p>

        {msg && (
          <div className="mb-3 p-3 rounded-lg flex items-center gap-2 bg-green-600/20 border border-green-500 text-green-300">
            <CheckCircle /> {msg}
          </div>
        )}

        {error && (
          <div className="mb-3 p-3 rounded-lg flex items-center gap-2 bg-red-600/20 border border-red-500 text-red-300">
            <XCircle /> {error}
          </div>
        )}

        {/* DATE */}
        <label className="text-sm">Date</label>
        <input
          type="date"
          className="w-full py-2 px-3 bg-black/30 border border-gray-700 rounded-lg text-white mb-4"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        {/* OPEN DIGIT */}
        <label className="text-sm">Open Digit</label>
        <input
          maxLength={1}
          className="w-full py-2 px-3 bg-black/30 border border-gray-700 rounded-lg text-white mb-4"
          value={openDigit}
          onChange={(e) => setOpenDigit(e.target.value.replace(/\D/g, ""))}
        />

        {/* CLOSE DIGIT */}
        <label className="text-sm">Close Digit</label>
        <input
          maxLength={1}
          className="w-full py-2 px-3 bg-black/30 border border-gray-700 rounded-lg text-white mb-4"
          value={closeDigit}
          onChange={(e) => setCloseDigit(e.target.value.replace(/\D/g, ""))}
        />

        {/* OPEN PANNA */}
        <label className="text-sm">Open Panna</label>
        <input
          maxLength={3}
          className="w-full py-2 px-3 bg-black/30 border border-gray-700 rounded-lg text-white mb-4"
          value={openPanna}
          onChange={(e) => setOpenPanna(e.target.value.replace(/\D/g, ""))}
        />

        {/* CLOSE PANNA */}
        <label className="text-sm">Close Panna</label>
        <input
          maxLength={3}
          className="w-full py-2 px-3 bg-black/30 border border-gray-700 rounded-lg text-white mb-5"
          value={closePanna}
          onChange={(e) => setClosePanna(e.target.value.replace(/\D/g, ""))}
        />

        <button
          onClick={declareResult}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> Processing…
            </>
          ) : (
            "Declare Result"
          )}
        </button>
      </div>
    </div>
  );
}
