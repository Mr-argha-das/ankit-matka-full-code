import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../../config";

export default function GGameRates() {
  const [form, setForm] = useState({
    // VALUE 1
    left_digit_1: 10,
    right_digit_1: 10,
    jodi_digit_1: 10,

    // MULTIPLIER
    left_digit_x: 10,
    right_digit_x: 10,
    jodi_digit_x: 10,

    // VALUE 2
    left_digit_2: 100,
    right_digit_2: 100,
    jodi_digit_2: 1000,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const token = localStorage.getItem("accessToken");
  const headers = { Authorization: `Bearer ${token}` };

  // ✅ FIXED HANDLE CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value === "" ? "" : Number(value),
    }));
  };

  const fetchRates = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/admin/Golidesawar/rate`,
        { headers }
      );
      console.log(res);
      if (res.data) setForm((prev) => ({ ...prev, ...res.data }));
    } catch (err) {
      console.log("Rate fetch error:", err);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setMessage(null);

      // optional safety: empty → 0
      const payload = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, v === "" ? 0 : v])
      );

      const res = await axios.post(
        `${API_URL}/api/admin/Golidesawar/rate/`,
        payload
      );

      console.log("res", res);

      setMessage("Updated Successfully");
    } catch (e) {
      console.log(e);
      setMessage("Error Updating");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full text-white p-3">
      <h1 className="text-xl font-bold mb-4">Game Rates</h1>

      <div className="grid grid-cols-3 gap-3">
        {/* VALUE 1 (_1) */}
        <div className="space-y-4">
          {Object.keys(form)
            .filter((key) => key.endsWith("_1"))
            .map((key) => (
              <Field
                key={key}
                name={key}
                value={form[key]}
                onChange={handleChange}
              />
            ))}
        </div>

        {/* MULTIPLIER (_x) */}
        <div className="space-y-4">
          {Object.keys(form)
            .filter((key) => key.endsWith("_x"))
            .map((key) => (
              <Field
                key={key}
                name={key}
                value={form[key]}
                onChange={handleChange}
              />
            ))}
        </div>

        {/* VALUE 2 (_2) */}
        <div className="space-y-4">
          {Object.keys(form)
            .filter((key) => key.endsWith("_2"))
            .map((key) => (
              <Field
                key={key}
                name={key}
                value={form[key]}
                onChange={handleChange}
              />
            ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-6 px-6 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
      >
        {loading ? "Saving..." : "Submit"}
      </button>

      {message && <p className="mt-3 text-sm text-green-400">{message}</p>}
    </div>
  );
}

function Field({ name, value, onChange }) {
  return (
    <div>
      <label className="block text-sm mb-1 capitalize">
        {name.replaceAll("_", " ")}
      </label>
      <input
        type="number"
        name={name}
        value={value}
        onChange={onChange}
        className="w-full p-2 rounded border border-gray-700"
      />
    </div>
  );
}
