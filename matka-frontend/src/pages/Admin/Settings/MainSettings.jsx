import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../../../config";

export default function MainSettings() {
  const API_BASE = API_URL;

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    min_deposit: 0,
    max_deposit: 0,
    min_withdraw: 0,
    max_withdraw: 0,
    min_transfer: 0,
    max_transfer: 0,
    min_bid: 0,
    max_bid: 0,
    welcome_bonus: 0,
    referral_bonus: 0,
    website_link: "",
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await axios.get(`${API_BASE}/settings/get`);
        console.log("API RESPONSE:", res.data);

        // HANDLE ALL POSSIBLE API FORMATS
        let data = res.data;

        // If API responds: { data: {...} }
        if (data.data) data = data.data;

        // If API responds: { settings: {...} }
        if (data.settings) data = data.settings;

        if (!data) return;

        // Fill missing fields with ""
        const cleaned = { ...formData, ...data };

        // Convert null → ""
        Object.keys(cleaned).forEach((key) => {
          cleaned[key] = cleaned[key] ?? "";
        });

        setFormData(cleaned);
      } catch (err) {
        console.log("Error loading settings", err);
      }
    };

    loadSettings();
  }, []);

  // ------------------------------------------------
  // HANDLE INPUT CHANGE
  // ------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // ------------------------------------------------
  // SAVE / UPDATE SETTINGS
  // ------------------------------------------------
  const handleSubmit = async () => {
    setLoading(true);

    try {
      await axios.post(`${API_BASE}/settings/update`, formData);
      alert("Settings updated successfully!");
    } catch (err) {
      console.log("SAVE ERROR:", err.response?.data);
      alert("Error updating settings!");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-3 shadow rounded mt-4">
      <h1 className="text-2xl font-semibold mb-6">Main Settings</h1>

      {/* FORM FIELDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Referral Bonus */}
        <div>
          <label className="font-medium text-sm">Referral Bonus</label>
          <input
            name="referral_bonus"
            value={formData.referral_bonus}
            onChange={handleChange}
            className="w-full mt-1 px-3 py-2 border border-gray-50/20 rounded"
            placeholder="Referral Bonus"
            type="number"
          />
        </div>

        {/* Minimum Deposit */}
        <div>
          <label className="font-medium text-sm">Minimum Deposit</label>
          <input
            name="min_deposit"
            value={formData.min_deposit}
            onChange={handleChange}
            className="w-full mt-1 px-3 py-2 border border-gray-50/20 rounded"
            placeholder="100"
            type="number"
          />
        </div>

        {/* Maximum Deposit */}
        <div>
          <label className="font-medium text-sm">Maximum Deposit</label>
          <input
            name="max_deposit"
            value={formData.max_deposit}
            onChange={handleChange}
            className="w-full mt-1 px-3 py-2 border border-gray-50/20 rounded"
            placeholder="100000"
            type="number"
          />
        </div>

        {/* Minimum Withdrawal */}
        <div>
          <label className="font-medium text-sm">Minimum Withdrawal</label>
          <input
            name="min_withdraw"
            value={formData.min_withdraw}
            onChange={handleChange}
            className="w-full mt-1 px-3 py-2 border border-gray-50/20 rounded"
            placeholder="1000"
            type="number"
          />
        </div>

        {/* Maximum Withdrawal */}
        <div>
          <label className="font-medium text-sm">Maximum Withdrawal</label>
          <input
            name="max_withdraw"
            value={formData.max_withdraw}
            onChange={handleChange}
            className="w-full mt-1 px-3 py-2 border border-gray-50/20 rounded"
            placeholder="500000"
            type="number"
          />
        </div>

        {/* Website Link */}
        <div>
          <label className="font-medium text-sm">Website Link</label>
          <input
            name="website_link"
            value={formData.website_link}
            onChange={handleChange}
            className="w-full mt-1 px-3 py-2 border border-gray-50/20 rounded"
            placeholder="https://example.com"
            type="text"
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {loading ? "Saving..." : "Submit"}
      </button>
    </div>
  );
}
