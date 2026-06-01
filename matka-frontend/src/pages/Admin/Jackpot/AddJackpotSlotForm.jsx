import axios from "axios";
import React, { useState } from "react";
import { API_URL } from "../../../config";

const API_BASE = `${API_URL}/starline_jackpot`;

const AddSlotForm = ({ onSlotAdded }) => {
  const [formData, setFormData] = useState({
    name: "",
    start_time: "",
    end_time: "",
  });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await axios.post(`${API_BASE}/jackpot/add`, {
        headers: {
          "Content-Type": "application/json",
        },
        // API uses start_time and end_time, so we map the keys
        body: JSON.stringify({
          name: formData.name,
          start_time: formData.start_time,
          end_time: formData.end_time,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(`✅ Success! Slot Added (ID: ${result.slot_id})`);
        setFormData({ name: "", start_time: "", end_time: "" }); // Reset form
        onSlotAdded(); // Trigger refresh on the main page
      } else {
        setMessage(`❌ Error: ${result.msg || "Failed to add slot."}`);
      }
    } catch (error) {
      console.error("Error adding slot:", error);
      setMessage("❌ An unexpected network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-2xl font-semibold text-indigo-600 mb-4">
        ➕ Add New Slot
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Slot Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Slot Name
          </label>
          <input
            type="text"
            name="name"
            id="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Start Time */}
        <div>
          <label
            htmlFor="start_time"
            className="block text-sm font-medium text-gray-700"
          >
            Start Time (HH:MM)
          </label>
          <input
            type="time" // Use 'time' input for browser validation/picker
            name="start_time"
            id="start_time"
            value={formData.start_time}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* End Time */}
        <div>
          <label
            htmlFor="end_time"
            className="block text-sm font-medium text-gray-700"
          >
            End Time (HH:MM)
          </label>
          <input
            type="time"
            name="end_time"
            id="end_time"
            value={formData.end_time}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? "Adding..." : "Add Starline Slot"}
        </button>
      </form>

      {message && (
        <p
          className={`mt-4 text-sm font-medium ${
            message.startsWith("✅") ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default AddSlotForm;
