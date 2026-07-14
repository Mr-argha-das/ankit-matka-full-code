import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../../../config";

const API_BASE = `${API_URL}/starline_jackpot`;
const API_DECLARE = `${API_URL}/starline_jackpot/starline/result/declare`;

const AdminStartline = () => {
  const [slots, setSlots] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [panna, setPanna] = useState("");
  const [declaring, setDeclaring] = useState(false);
  const token = localStorage.getItem("accessToken");

  // Add Slot Form State
  const [formData, setFormData] = useState({
    name: "",
    start_hour: "01",
    start_minute: "00",
    start_meridian: "AM",
    end_hour: "01",
    end_minute: "00",
    end_meridian: "AM",
  });

  // Fetch Slots
  const fetchSlots = async () => {
    setLoadingList(true);
    try {
      const response = await axios.get(`${API_BASE}/starline/list`);
      setSlots(response.data);
    } catch (error) {
      setMessage("❌ Could not load slots.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [refreshTrigger]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const formatTime = (hour, minute, meridian) =>
    `${hour}:${minute} ${meridian}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const start_time = formatTime(
      formData.start_hour,
      formData.start_minute,
      formData.start_meridian
    );

    const end_time = formatTime(
      formData.end_hour,
      formData.end_minute,
      formData.end_meridian
    );

    const slotData = {
      name: formData.name.trim(),
      start_time,
      end_time,
    };

    try {
      await axios.post(`${API_BASE}/starline/add`, slotData);
      setMessage(`✅ Slot Added Successfully`);

      setFormData({
        name: "",
        start_hour: "01",
        start_minute: "00",
        start_meridian: "AM",
        end_hour: "01",
        end_minute: "00",
        end_meridian: "AM",
      });

      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      setMessage("❌ Failed to add slot.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // OPEN DECLARE MODAL
  const openDeclareModal = (slot) => {
    setSelectedSlot(slot);
    setPanna("");
    setShowModal(true);
  };

  // DECLARE RESULT (JSON — FIXED)
  const declareResult = async () => {
    if (!panna || panna.length !== 3) {
      alert("Panna must be exactly 3 digits!");
      return;
    }

    setDeclaring(true);

    try {
      const res = await axios.post(
        `${API_BASE}/starline/result/declare`,
        {
          slot_id: selectedSlot.id,
          panna: panna,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      alert("⭐ Starline Result Declared Successfully!");

      setShowModal(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.detail || "Error while declaring result.");
    } finally {
      setDeclaring(false);
    }
  };

  const handleRefresh = () => setRefreshTrigger((prev) => prev + 1);

  return (
    <div className="p-6 min-h-screen text-white">
      <h1 className="text-xl font-bold mb-6 border-b pb-2">
        ⭐ Starline Slot Management
      </h1>

      {message && (
        <div
          className={`p-3 mb-4 rounded-md ${
            message.startsWith("✅")
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ADD SLOT */}
        <div>
          <h2 className="text-xl mb-4">➕ Add New Slot</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-sm">Slot Name</label>
              <input
                type="text"
                name="name"
                className="w-full p-2 mt-1 border rounded-md text-white"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Times */}
            <div>
              <label className="text-sm">Start Time</label>
              <div className="flex gap-2 mt-1">
                <select
                  name="start_hour"
                  className="p-2 border rounded-md text-white"
                  value={formData.start_hour}
                  onChange={handleChange}
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const hr = String(i + 1).padStart(2, "0");
                    return <option key={hr}>{hr}</option>;
                  })}
                </select>

                <select
                  name="start_minute"
                  className="p-2 border rounded-md text-white"
                  value={formData.start_minute}
                  onChange={handleChange}
                >
                  {["00", "15", "30", "45"].map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>

                <select
                  name="start_meridian"
                  className="p-2 border rounded-md text-white"
                  value={formData.start_meridian}
                  onChange={handleChange}
                >
                  <option>AM</option>
                  <option>PM</option>
                </select>
              </div>
            </div>

            {/* END TIME */}
            <div>
              <label className="text-sm">End Time</label>
              <div className="flex gap-2 mt-1">
                <select
                  name="end_hour"
                  className="p-2 border rounded-md text-white"
                  value={formData.end_hour}
                  onChange={handleChange}
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const hr = String(i + 1).padStart(2, "0");
                    return <option key={hr}>{hr}</option>;
                  })}
                </select>

                <select
                  name="end_minute"
                  className="p-2 border rounded-md text-white"
                  value={formData.end_minute}
                  onChange={handleChange}
                >
                  {["00", "15", "30", "45"].map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>

                <select
                  name="end_meridian"
                  className="p-2 border rounded-md text-white"
                  value={formData.end_meridian}
                  onChange={handleChange}
                >
                  <option>AM</option>
                  <option>PM</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full p-2 bg-purple-800 text-white rounded-md"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Slot"}
            </button>
          </form>
        </div>

        {/* SLOT LIST */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl">📋 Existing Slots</h2>
            <button
              onClick={handleRefresh}
              disabled={loadingList}
              className="px-4 py-2 bg-green-600 text-white rounded-md"
            >
              {loadingList ? "Refreshing..." : "Refresh List"}
            </button>
          </div>

          {loadingList ? (
            <p className="text-gray-400 text-center">Loading slots...</p>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Start</th>
                    <th className="px-6 py-3">End</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-white">
                  {slots.map((slot) => (
                    <tr key={slot.id}>
                      <td className="px-6 py-3">{slot.name}</td>
                      <td className="px-6 py-3">{slot.start_time}</td>
                      <td className="px-6 py-3">{slot.end_time}</td>
                      <td
                        className={`${
                          slot.status === "Market Running"
                            ? "text-green-500"
                            : "text-red-500"
                        } px-6 py-3`}
                      >
                        {slot.status}
                      </td>

                      <td className="px-6 py-3">
                        <button
                          className="px-3 py-1 bg-purple-800 rounded-md text-white"
                          onClick={() => openDeclareModal(slot)}
                        >
                          Declare
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* DECLARE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl w-80 text-white shadow-xl border border-gray-700">
            <h2 className="text-lg font-bold text-center">
              Declare Starline Result
            </h2>
            <p className="text-center text-sm text-purple-300 mt-1">
              Slot: {selectedSlot?.name}
            </p>

            <label className="block mt-4 mb-1 text-sm">
              Enter Panna (3 digits)
            </label>
            <input
              maxLength={3}
              value={panna}
              onChange={(e) => setPanna(e.target.value.replace(/\D/g, ""))}
              className="w-full p-2 bg-black/40 border border-gray-600 rounded-md text-white"
            />

            <button
              onClick={declareResult}
              disabled={declaring}
              className="w-full mt-4 py-2 bg-purple-600 rounded-md font-semibold"
            >
              {declaring ? "Declaring..." : "Declare Result"}
            </button>

            <button
              onClick={() => setShowModal(false)}
              className="w-full mt-2 py-2 bg-red-700 rounded-md"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStartline;
