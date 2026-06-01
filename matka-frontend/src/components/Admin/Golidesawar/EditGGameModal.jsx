// src/components/Admin/GGame/EditGGameModal.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../../config";
import { X } from "lucide-react";

function parse12To24(t) {
  // expects "hh:mm AM" or "hh:mm PM" or "h:mm AM" — returns "HH:MM"
  if (!t) return "";
  try {
    const parts = t.trim().split(" ");
    if (parts.length === 2) {
      const [timePart, ampm] = parts;
      let [h, m] = timePart.split(":").map(Number);
      const mer = ampm.toUpperCase();
      if (mer === "PM" && h !== 12) h += 12;
      if (mer === "AM" && h === 12) h = 0;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
    // maybe already 24h "HH:MM"
    if (t.indexOf(":") !== -1) {
      const [hh, mm] = t.split(":");
      if (hh.length === 1) return `0${hh}:${mm}`;
      return t;
    }
    return "";
  } catch {
    return "";
  }
}

const to12Hour = (time) => {
  if (!time) return "";
  const [hhStr, mmStr] = time.split(":");
  let hh = parseInt(hhStr, 10);
  const mm = mmStr || "00";
  const ampm = hh >= 12 ? "PM" : "AM";
  hh = hh % 12 || 12;
  return `${String(hh).padStart(2, "0")}:${mm} ${ampm}`;
};

export default function EditGGameModal({ data, onClose, refresh }) {
  const token = localStorage.getItem("accessToken");
  const headers = { Authorization: `Bearer ${token}` };

  // Convert incoming times to 24h if needed
  const initialOpen = parse12To24(data.open_time || "");
  const initialClose = parse12To24(data.close_time || "");

  const [form, setForm] = useState({
    name: data.name || "",
    hindi: data.hindi || "",
    marketType: data.marketType || "Golidesawar",
    open_time: initialOpen,
    close_time: initialClose,
    is_active: data.is_active ?? true,
    status: data.status ?? true,
  });

  useEffect(() => {
    setForm({
      name: data.name || "",
      hindi: data.hindi || "",
      marketType: data.marketType || "Golidesawar",
      open_time: parse12To24(data.open_time || ""),
      close_time: parse12To24(data.close_time || ""),
      is_active: data.is_active ?? true,
      status: data.status ?? true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const handleSave = async () => {
    if (!form.name || !form.hindi || !form.open_time || !form.close_time) {
      alert("Please fill all fields");
      return;
    }

    const openFmt = to12Hour(form.open_time);
    const closeFmt = to12Hour(form.close_time);

    try {
      const marketId = data._id?.$oid || data._id || data.id;

      await axios.put(
        `${API_URL}/api/admin/Golidesawar/market/${marketId}`,
        {
          name: form.name,
          hindi: form.hindi,
          marketType: form.marketType,
          open_time: openFmt,
          close_time: closeFmt,
          is_active: form.is_active,
          status: form.status,
        },
        { headers }
      );

      refresh();
      onClose();
    } catch (err) {
      console.error("Update error:", err);
      alert(err.response?.data?.detail || "Update failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 mt-16 flex justify-center items-start z-30 p-4 overflow-auto">
      <div className="backdrop-blur-2xl w-full lg:max-w-2xl md:max-w-2xl rounded-xl p-5 bg-white/5 border border-white/10 shadow-xl mt-8">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-white">Edit Game</h2>
          <button onClick={onClose} className="text-white">
            <X />
          </button>
        </div>

        <div className="space-y-5 text-white">
          <div>
            <label className="font-semibold text-slate-300">Game Name</label>
            <input
              type="text"
              className="w-full p-3 border border-white/10 rounded-lg mt-1 bg-transparent text-white"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="font-semibold text-slate-300">
              Game Name Hindi
            </label>
            <input
              type="text"
              className="w-full p-3 border border-white/10 rounded-lg mt-1 bg-transparent text-white"
              value={form.hindi}
              onChange={(e) => setForm({ ...form, hindi: e.target.value })}
            />
          </div>

          <label className="flex items-center gap-2 text-slate-200">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={() => setForm({ ...form, is_active: !form.is_active })}
            />
            Is Active
          </label>

          <div className="grid lg:grid-cols-2 md:grid-cols-2 gap-6">
            <div>
              <label className="font-semibold text-slate-300">Open Time</label>
              <input
                type="time"
                value={form.open_time}
                onChange={(e) =>
                  setForm({ ...form, open_time: e.target.value })
                }
                className="w-full p-3 border border-white/10 rounded-lg mt-1 bg-transparent text-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-300">Close Time</label>
              <input
                type="time"
                value={form.close_time}
                onChange={(e) =>
                  setForm({ ...form, close_time: e.target.value })
                }
                className="w-full p-3 border border-white/10 rounded-lg mt-1 bg-transparent text-white"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-5">
            <button
              onClick={handleSave}
              className="bg-sky-600 px-6 py-2 rounded-lg text-white"
            >
              Save
            </button>

            <button
              onClick={() =>
                setForm({
                  name: data.name || "",
                  hindi: data.hindi || "",
                  marketType: data.marketType || "Market",
                  open_time: parse12To24(data.open_time || ""),
                  close_time: parse12To24(data.close_time || ""),
                  is_active: data.is_active ?? true,
                  status: data.status ?? true,
                })
              }
              className="bg-white/5 px-6 py-2 rounded-lg text-white"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
