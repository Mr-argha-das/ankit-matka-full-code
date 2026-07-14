import React, { useState } from "react";
import { createMarket, updateMarket } from "./marketapi";

// Convert "HH:MM AM" → { hour, minute, meridian }
const splitTime = (time) => {
  if (!time) return { hour: "01", minute: "00", meridian: "AM" };

  let [hm, meridian] = time.split(" ");
  let [hour, minute] = hm.split(":");

  return {
    hour: hour.padStart(2, "0"),
    minute,
    meridian,
  };
};

// Format back into "HH:MM AM"
const formatTime = (hour, minute, meridian) => `${hour}:${minute} ${meridian}`;

const MarketForm = ({ market, onClose, onSave }) => {
  const isUpdate = !!market;
  const marketId = market?.id || market?._id?.$oid;

  const open = splitTime(market?.open_time);
  const close = splitTime(market?.close_time);

  const [name, setName] = useState(market ? market.name : "");

  const [openHour, setOpenHour] = useState(open.hour);
  const [openMinute, setOpenMinute] = useState(open.minute);
  const [openMeridian, setOpenMeridian] = useState(open.meridian);

  const [closeHour, setCloseHour] = useState(close.hour);
  const [closeMinute, setCloseMinute] = useState(close.minute);
  const [closeMeridian, setCloseMeridian] = useState(close.meridian);

  // NEW FIELDS
  const [openResult, setOpenResult] = useState(market?.open_result || "-");
  const [closeResult, setCloseResult] = useState(market?.close_result || "-");

  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState(null);

  const hourOptions = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );
  const minuteOptions = ["00", "15", "30", "45"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMsg("");
    setIsLoading(true);

    const marketData = {
      name,
      open_time: formatTime(openHour, openMinute, openMeridian),
      close_time: formatTime(closeHour, closeMinute, closeMeridian),
      open_result: openResult,
      close_result: closeResult,
    };

    try {
      if (isUpdate) {
        await updateMarket(marketId, marketData);
        setMsg("Market Updated Successfully ✔");
      } else {
        await createMarket(marketData);
        setMsg("Market Created Successfully ✔");
      }

      setTimeout(() => {
        onSave();
        onClose();
      }, 800);
    } catch (err) {
      setError(err.message || "Something went wrong!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed z-20 inset-0 bg-black/60 flex justify-center items-center">
      <div className="bg-slate-900 p-6 rounded-lg shadow-xl w-96">
        <h2 className="text-2xl font-bold mb-4 text-white">
          {isUpdate ? "Update Market" : "Create New Market"}
        </h2>

        {msg && (
          <p className="text-green-600 text-sm font-semibold mb-3 text-center">
            {msg}
          </p>
        )}

        {error && (
          <p className="text-red-500 text-sm font-semibold mb-3 text-center">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          {/* Market Name */}
          <div className="mb-4">
            <label className="block text-white text-sm font-bold mb-2">
              Market Name
            </label>
            <input
              className="shadow border border-white rounded w-full py-2 px-3 text-white"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {/* OPEN TIME */}
          <div className="mb-4">
            <label className="block text-white text-sm font-bold mb-2">
              Open Time
            </label>
            <div className="flex gap-2">
              <select
                value={openHour}
                onChange={(e) => setOpenHour(e.target.value)}
                className="p-2 border rounded-md"
              >
                {hourOptions.map((hr) => (
                  <option key={hr} value={hr}>
                    {hr}
                  </option>
                ))}
              </select>

              <select
                value={openMinute}
                onChange={(e) => setOpenMinute(e.target.value)}
                className="p-2 border rounded-md"
              >
                {minuteOptions.map((min) => (
                  <option key={min} value={min}>
                    {min}
                  </option>
                ))}
              </select>

              <select
                value={openMeridian}
                onChange={(e) => setOpenMeridian(e.target.value)}
                className="p-2 border rounded-md"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>

          {/* CLOSE TIME */}
          <div className="mb-4">
            <label className="block text-white text-sm font-bold mb-2">
              Close Time
            </label>
            <div className="flex gap-2">
              <select
                value={closeHour}
                onChange={(e) => setCloseHour(e.target.value)}
                className="p-2 border rounded-md"
              >
                {hourOptions.map((hr) => (
                  <option key={hr} value={hr}>
                    {hr}
                  </option>
                ))}
              </select>

              <select
                value={closeMinute}
                onChange={(e) => setCloseMinute(e.target.value)}
                className="p-2 border rounded-md"
              >
                {minuteOptions.map((min) => (
                  <option key={min} value={min}>
                    {min}
                  </option>
                ))}
              </select>

              <select
                value={closeMeridian}
                onChange={(e) => setCloseMeridian(e.target.value)}
                className="p-2 border rounded-md"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>

          {/* NEW FIELD: OPEN RESULT */}
          <div className="mb-4">
            <label className="block text-white text-sm font-bold mb-2">
              Open Result
            </label>
            <input
              className="shadow border border-white rounded w-full py-2 px-3 text-white"
              type="text"
              value={openResult}
              onChange={(e) => setOpenResult(e.target.value)}
              placeholder="e.g. 123"
            />
          </div>

          {/* NEW FIELD: CLOSE RESULT */}
          <div className="mb-4">
            <label className="block text-white text-sm font-bold mb-2">
              Close Result
            </label>
            <input
              className="shadow border border-white rounded w-full py-2 px-3 text-white"
              type="text"
              value={closeResult}
              onChange={(e) => setCloseResult(e.target.value)}
              placeholder="e.g. 456"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? "Saving..." : isUpdate ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MarketForm;
