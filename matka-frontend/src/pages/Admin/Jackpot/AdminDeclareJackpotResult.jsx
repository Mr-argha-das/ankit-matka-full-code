import React, { useEffect, useState } from "react";
import axios from "axios";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { API_URL } from "../../../config";

const API_BASE = `${API_URL}/starline_jackpot`;

export default function AdminDeclareJackpotResult() {
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [panna, setPanna] = useState("");
  const [message, setMessage] = useState(null);

  const token = localStorage.getItem("accessToken");

  const authHeader = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // ----------------------------------------------------
  // LOAD STARLINE SLOT LIST
  // ----------------------------------------------------
  const fetchSlots = async () => {
    try {
      const res = await axios.get(`${API_BASE}/jackpot/list`, authHeader);
      setSlots(res.data);
    } catch (err) {
      console.error("Error loading slots:", err);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  // ----------------------------------------------------
  // DECLARE RESULT
  // ----------------------------------------------------
  const declareResult = async () => {
    setMessage(null);

    if (!selectedSlot || !panna) {
      setMessage({
        type: "error",
        text: "Please select slot and enter panna.",
      });
      return;
    }

    if (panna.length !== 3 || isNaN(panna)) {
      setMessage({
        type: "error",
        text: "Panna must be 3 digits (e.g., 123).",
      });
      return;
    }

    try {
      const res = await axios.post(
        `${API_BASE}/starline/result/declare`,
        {},
        {
          params: {
            slot_id: selectedSlot,
            panna: panna,
          },
          ...authHeader,
        }
      );

      setMessage({ type: "success", text: res.data.msg });
      setPanna("");
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.detail || "Failed to declare result.",
      });
    }
  };

  return (
    <div className="max-w-md mx-auto text-white min-h-screen pb-20">
      {/* HEADER */}
      <div className="flex items-center gap-3 p-4 ">
        <h1 className="text-lg font-bold">Declare Jackpot Result</h1>
      </div>

      {/* SLOT DROPDOWN */}
      <div className="p-4">
        <label className="text-sm text-gray-300">Select Slot</label>
        <select
          value={selectedSlot}
          onChange={(e) => setSelectedSlot(e.target.value)}
          className="w-full p-3 mt-1 rounded-lg  text-white outline-none border border-white"
        >
          <option value="">-- Select Jackpot Slot --</option>

          {slots.map((slot) => (
            <option key={slot.id} value={slot.id}>
              {slot.name} ({slot.start_time} - {slot.end_time})
            </option>
          ))}
        </select>
      </div>

      {/* PANNA INPUT */}
      <div className="p-4">
        <label className="text-sm text-gray-300">Enter Panna (3 digits)</label>
        <input
          type="text"
          maxLength="3"
          value={panna}
          onChange={(e) => setPanna(e.target.value)}
          placeholder="e.g., 123"
          className="w-full p-3 mt-1 rounded-lg  text-white outline-none border border-white "
        />
      </div>

      {/* SUBMIT BUTTON */}
      <div className="p-4">
        <button
          onClick={declareResult}
          className="w-full border text-white py-3 rounded-lg font-bold  border-white t"
        >
          Declare Result
        </button>
      </div>

      {/* MESSAGE */}
      {message && (
        <div className="px-4">
          <div
            className={`flex items-center gap-2 p-3 rounded-lg ${
              message.type === "success"
                ? "bg-green-700/30 text-green-400 border border-green-700"
                : "bg-red-700/30 text-red-400 border border-red-700"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle size={20} />
            ) : (
              <XCircle size={20} />
            )}
            <p>{message.text}</p>
          </div>
        </div>
      )}
    </div>
  );
}
