import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../../../config";
import { X } from "lucide-react";

export default function EditGameModal({ data, onClose, refresh }) {
  const token = localStorage.getItem("accessToken");
  const headers = { Authorization: `Bearer ${token}` };

  const [form, setForm] = useState({
    name: "",
    hindi: "",
    marketType: "Market",
    open_time: "",
    close_time: "",
    is_active: true,
  });

  // Convert 24h → 12h format
  const to12Hour = (time) => {
    if (!time) return "";
    if (/am|pm/i.test(time)) return time;

    const [hhStr, mm] = time.split(":");
    let hh = parseInt(hhStr, 10);

    const ampm = hh >= 12 ? "PM" : "AM";
    hh = hh % 12 || 12;

    return `${String(hh).padStart(2, "0")}:${mm} ${ampm}`;
  };

  // Convert 12h → 24h format
  const to24Hour = (time) => {
    if (!time) return "";
    if (!/am|pm/i.test(time)) return time;

    let [t, period] = time.split(" ");
    let [hh, mm] = t.split(":");

    hh = parseInt(hh);

    if (period.toUpperCase() === "PM" && hh !== 12) hh += 12;
    if (period.toUpperCase() === "AM" && hh === 12) hh = 0;

    return `${String(hh).padStart(2, "0")}:${mm}`;
  };

  // Load initial values
  useEffect(() => {
    if (data) {
      setForm({
        name: data.name || "",
        hindi: data.hindi || "",
        marketType: data.marketType || "Market",
        open_time: to24Hour(data.open_time || ""),
        close_time: to24Hour(data.close_time || ""),
        is_active: data.is_active ?? true,
      });
    }
  }, [data]);

  const handleSubmit = async () => {
    if (!form.name || !form.hindi || !form.open_time || !form.close_time) {
      alert("Please fill all required fields!");
      return;
    }

    const openTimeFormatted = to12Hour(form.open_time);
    const closeTimeFormatted = to12Hour(form.close_time);

    try {
      await axios.put(
        `${API_URL}/api/admin/market/${data._id.$oid}`,
        {
          name: form.name,
          hindi: form.hindi,
          open_time: openTimeFormatted,
          close_time: closeTimeFormatted,
          marketType: form.marketType,
          is_active: form.is_active,
        },
        { headers }
      );

      refresh();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error updating game");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 mt-16 flex justify-center items-center z-30">
      <div className="backdrop-blur-2xl w-full lg:max-w-2xl md:max-w-2xl lg:h-auto md:h-auto h-full  lg:rounded-xl md:rounded-xl p-4 shadow-xl">
        <div className="flex justify-between items-center mb-5 lg:mt-0 md:mt-0 ">
          <h2 className="text-xl font-bold">Edit Game</h2>
          <button onClick={onClose} className="text-xl font-bold">
            <X />
          </button>
        </div>

        {/* FORM */}
        <div className="space-y-5 ">
          {/* Name */}
          <div>
            <label className="font-semibold">Game Name</label>
            <input
              type="text"
              className="w-full p-3 border rounded-lg mt-1"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* Hindi */}
          <div>
            <label className="font-semibold">Game Name Hindi</label>
            <input
              type="text"
              className="w-full p-3 border rounded-lg mt-1"
              value={form.hindi}
              onChange={(e) => setForm({ ...form, hindi: e.target.value })}
            />
          </div>

          {/* Market Type */}
          <div className="flex gap-10">
            {["Market", "Starline"].map((type) => (
              <label key={type} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="marketType"
                  checked={form.marketType === type}
                  onChange={() => setForm({ ...form, marketType: type })}
                />
                {type}
              </label>
            ))}
          </div>

          {/* is_active checkbox */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={() => setForm({ ...form, is_active: !form.is_active })}
            />
            Is Active
          </label>

          {/* Times */}
          <div className="grid lg:grid-cols-2 md:grid-cols-2  gap-6">
            <div>
              <label className="font-semibold">Open Time</label>
              <input
                type="time"
                className="w-full p-3 border rounded-lg mt-1"
                value={form.open_time}
                onChange={(e) =>
                  setForm({ ...form, open_time: e.target.value })
                }
              />
            </div>

            <div>
              <label className="font-semibold">Close Time</label>
              <input
                type="time"
                className="w-full p-3 border rounded-lg mt-1"
                value={form.close_time}
                onChange={(e) =>
                  setForm({ ...form, close_time: e.target.value })
                }
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 mt-5">
            <button
              onClick={handleSubmit}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg"
            >
              Update
            </button>

            <button
              className="bg-red-500 text-white px-6 py-2 rounded-lg"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
