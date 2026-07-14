import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";

export default function WithdrawPoints() {
  const [points, setPoints] = useState("");
  const [method, setMethod] = useState("");
  const [withdrawNumber, setWithdrawNumber] = useState("");
  const [currentPoints] = useState(5);

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Requesting withdrawal of ₹${points} via ${method}`);
  };

  return (
    <div className="min-h-screen max-w-md mx-auto  flex flex-col items-center">
      {/* Header */}
      <div className="w-full bg-gradient-to-b from-black to-black/0 text-white py-4 flex items-center justify-center relative  ">
        <h1 className="text-lg font-semibold">Withdraw Points</h1>
      </div>

      {/* Withdraw Card */}
      <form
        onSubmit={handleSubmit}
        className="w-[93%] max-w-md bg-white/20 rounded-2xl shadow-lg p-4 mt-2"
      >
        <p className="text-center text-sm text-gray-200 mb-1">
          You can withdraw only between{" "}
          <span className="font-medium">06:00 AM</span> to{" "}
          <span className="font-medium">11:00 AM</span>
        </p>
        <p className="text-center text-gray-200 font-semibold mb-5">
          Current point: ₹ {currentPoints}
        </p>

        {/* Withdraw Points */}
        <div className="mb-4">
          <label className="block text-gray-200 text-sm mb-1 font-medium">
            Withdraw Points
          </label>
          <input
            type="number"
            placeholder="Enter withdrawal points"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            className="w-full  text-gray-200 py-2 px-4 rounded-md border border-gray-300 focus:ring-2 focus:ring-purple-700 outline-none"
          />
        </div>

        {/* Withdraw Method */}
        <div className="mb-4">
          <label className="block text-gray-200 text-sm mb-2 font-medium">
            Withdraw Method
          </label>
          <div className="flex justify-between px-3">
            {["Paytm", "PhonePe", "Google Pay"].map((option) => (
              <label
                key={option}
                className="flex items-center gap-1 text-sm text-gray-200 cursor-pointer"
              >
                <input
                  type="radio"
                  name="method"
                  value={option}
                  checked={method === option}
                  onChange={(e) => setMethod(e.target.value)}
                  className="accent-purple-700"
                />
                {option}
              </label>
            ))}
          </div>
        </div>

        {/* Withdraw Number */}
        <div className="mb-6">
          <label className="block text-gray-200 text-sm mb-1 font-medium">
            Withdraw Number
          </label>
          <input
            type="text"
            placeholder="Enter Withdrawal Number"
            value={withdrawNumber}
            onChange={(e) => setWithdrawNumber(e.target.value)}
            className="w-full  text-gray-200 py-2 px-4 rounded-md border border-gray-300 focus:ring-2 focus:ring-purple-700 outline-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-purple-700 text-white font-semibold py-2 rounded-full hover:bg-purple-800 transition"
        >
          Submit
        </button>
      </form>

      {/* No Transaction Data */}
      {/* <div className="mt-6 bg-gray-300 text-gray-800 text-sm py-2 px-4 rounded-md shadow">
        Withdraw Transaction Data Not Available
      </div> */}
    </div>
  );
}
