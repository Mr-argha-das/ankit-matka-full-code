import React, { useState, useEffect } from "react";
import {
  Loader2,
  DollarSign,
  User2,
  History,
  DollarSignIcon,
  ArrowLeft,
  HistoryIcon,
  Phone,
} from "lucide-react";
import { API_URL } from "../config";
import axios from "axios";
import { getUserById } from "../components/layout/fetchUser";

const API_BASE_URL = API_URL; // Replace with your actual base URL

const getAuthToken = () => localStorage.getItem("accessToken");

// Utility function to get user ID from a basic JWT structure (header.payload.signature)
const getUserIdFromToken = () => {
  const token = getAuthToken();
  if (token) {
    try {
      // Decode the payload (second part of the JWT)
      const payloadBase64 = token.split(".")[1];
      // atob is used for base64 decoding in the browser
      const decodedPayload = JSON.parse(atob(payloadBase64));
      // Assuming 'sub' (subject) or 'id' holds the user ID
      return decodedPayload.sub || decodedPayload.id || "User ID Not Found";
    } catch (e) {
      // console.error("Failed to decode token:", e);
      return "Not Logged In";
    }
  }
  return "Not Logged In";
};

export default function WithdrawRequest() {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Paytm");
  const [number, setNumber] = useState("");
  const [bankholderName, setBankholderName] = useState("");
  const [account, setAccount] = useState("");
  const [ifsc, setIfsc] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [currentBalance, setCurrentBalance] = useState(null);
  const [minWithdraw, setMinWithdraw] = useState(200);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [siteData, setSiteData] = useState(null);

  useEffect(() => {
    const load = async () => {
      const res = await axios.get(`${API_URL}/sitedata/get`);

      console.log(res?.data);
      setSiteData(res.data);
    };

    load();
  }, []);

  const [settings, setSettings] = useState(null);

  useEffect(() => {
    async function load() {
      const res = await axios.get(`${API_URL}/settings/get`);

      // console.log(res);
      setSettings(res?.data);
      if (error) {
        console.log("Settings API Error:", error);
      } else {
        setSettings(data);
      }
    }

    load();
  }, []);

  // --- Fetch Current Balance and User ID ---

  const fetchBalance = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/user/balance`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setCurrentBalance(data.balance);
      }
    } catch (error) {
      console.log("Balance fetch error:", error);
    }
  };

  useEffect(() => {
    setCurrentUserId(getUserIdFromToken());
    fetchBalance();
  }, []);

  const userId = localStorage.getItem("userId");
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  // console.log(user);
  useEffect(() => {
    async function fetchUser() {
      const { data, error } = await getUserById(userId);

      if (error) {
        setError(error);
      } else {
        setUser(data);
      }
    }

    fetchUser();
  }, [userId]);

  // --- Handle Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    const token = getAuthToken();

    if (!token) {
      setMessage({ type: "error", text: "Please log in to submit a request." });
      return;
    }

    const withdrawAmount = parseFloat(amount);

    if (withdrawAmount <= minWithdraw) {
      setMessage({
        type: "error",
        text: `Minimum withdrawal is ₹${minWithdraw}.`,
      });
      return;
    }

    if (withdrawAmount > currentBalance) {
      setMessage({ type: "error", text: "Insufficient balance." });
      return;
    }

    setLoading(true);

    // Prepare form data for FastAPI endpoint (uses x-www-form-urlencoded)
    const formData = new URLSearchParams();
    formData.append("amount", withdrawAmount);
    formData.append("method", method);
    formData.append("number", number);

    let payload;

    if (method === "Bank Transfer") {
      payload = {
        amount: withdrawAmount,
        method: method,
        account_holder_name: bankholderName,
        account_no: account,
        ifc_code: ifsc,
      };
    } else {
      payload = {
        amount: withdrawAmount,
        method: method,
        number: number,
      };
    }

    try {
      const response = await axios.post(
        `${API_URL}/user-deposit-withdrawal/withdraw/request`,
        new URLSearchParams(payload),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const data = response.data;
      if (data.message === "Withdrawal request submitted") {
        fetchBalance();
      }
      // console.log(data);
      setMessage({
        type: "success",
        text:
          data.message +
          `. ID: ${data.withdrawal_id.substring(
            0,
            8
          )}... Your request is now pending review.`,
      });

      setAmount("");
      setNumber("");
      setCurrentBalance((cb) => cb - withdrawAmount);
    } catch (error) {
      if (error.response) {
        // Server responded
        const errText =
          error.response.data?.detail ||
          "Request failed. Check balance and withdrawal limits.";

        setMessage({ type: "error", text: errText });
      } else {
        // Network error
        setMessage({
          type: "error",
          text: "Network error. Could not connect to server.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = ["Paytm", "Google Pay", "PhonePe", "Bank Transfer"];

  return (
    <div className="max-w-md mx-auto pb-60 font-sans text-white">
      <div className="w-full relative bg-gradient-to-b from-black to-black/0 py-2 flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="p-2 pl-4 z-10 rounded-full hover:bg-white/10 transition"
        >
          <ArrowLeft size={22} />
        </button>
        <h2 className="text-md z-0 w-full absolute   justify-between font-bold bg-gradient-to-b from-black to-black/0 px-4 py-2  flex justify-center items-center gap-2">
          <span className="flex gap-2 text-md items-center">
            Withdraw Funds
          </span>
        </h2>
        <a href="/withdrawal-history" className="pr-4 z-10">
          <History />
        </a>
      </div>

      {/* Balance Info */}
      <div className="bg-white/10 p-4 mx-3 rounded-lg mb-4 shadow-md">
        <p className="text-sm capitalize text-gray-300 flex items-center gap-2">
          <User2 size={16} /> {user?.username}
        </p>

        <p className="text-sm text-gray-300 mt-2">Your Current Balance:</p>
        <p className="text-3xl font-extrabold text-green-400">
          {currentBalance?.toFixed(2)}
        </p>
        <p className="text-xs mt-1 text-gray-400">
          Minimum Withdrawal: ₹{settings?.min_withdraw}
        </p>
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`p-3 mx-3 rounded-md text-sm mb-4 ${
            message.type === "success"
              ? "bg-green-600/20 text-green-300"
              : "bg-red-600/20 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Withdrawal Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 mx-3 bg-white/10  p-6 rounded-xl shadow-2xl"
      >
        {/* Amount Input */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium mb-1">
            Amount (₹)
          </label>
          <input
            type="number"
            id="amount"
            placeholder={`Min ₹${settings?.min_withdraw}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-3 rounded-lg  border border-gray-700 text-white focus:ring-purple-500 focus:border-purple-500"
            min={minWithdraw}
            disabled={loading}
          />
        </div>

        {/* Payment Method Selection */}
        <div>
          <label htmlFor="method" className="block text-sm font-medium mb-1">
            Payment Method
          </label>
          <select
            id="method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full p-3 rounded-lg  border border-gray-700 text-white focus:ring-purple-500 focus:border-purple-500"
            disabled={loading}
          >
            {paymentMethods.map((m) => (
              <option key={m} value={m} className="">
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Number/ID Input */}
        {/* Payment Number / UPI ID OR Bank Fields */}
        {method !== "Bank Transfer" ? (
          // ---------- UPI / Wallet Section ----------
          <div>
            <label htmlFor="number" className="block text-sm font-medium mb-1">
              {method} Number / UPI ID
            </label>
            <input
              type="text"
              id="number"
              placeholder={`Enter your ${method} number or UPI ID`}
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-700 text-white focus:ring-purple-500 focus:border-purple-500"
              required
              disabled={loading}
            />
          </div>
        ) : (
          // ---------- BANK TRANSFER SECTION ----------
          <>
            {/* Holder Name */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Bank Holder Name
              </label>
              <input
                type="text"
                placeholder="Enter account holder name"
                value={bankholderName}
                onChange={(e) => setBankholderName(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-700 text-white focus:ring-purple-500 focus:border-purple-500"
                required
                disabled={loading}
              />
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Account Number
              </label>
              <input
                type="text"
                placeholder="Enter bank account number"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-700 text-white focus:ring-purple-500 focus:border-purple-500"
                required
                disabled={loading}
              />
            </div>

            {/* IFSC Code */}
            <div>
              <label className="block text-sm font-medium mb-1">
                IFSC Code
              </label>
              <input
                type="text"
                placeholder="Enter IFSC code"
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-700 text-white focus:ring-purple-500 focus:border-purple-500"
                required
                disabled={loading}
              />
            </div>
          </>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={
            loading ||
            amount < settings?.min_withdraw ||
            amount > currentBalance ||
            (method !== "Bank Transfer"
              ? !number
              : !bankholderName || !account || !ifsc) // Bank Transfer validation
          }
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            "Submit Withdrawal Request"
          )}
        </button>
      </form>

      <div className="mx-3 mt-4">
        {siteData?.withdraw_terms_html ? (
          <div
            className="text-gray-200  text-sm"
            dangerouslySetInnerHTML={{
              __html: siteData?.withdraw_terms_html,
            }}
          />
        ) : (
          <span>
            <p>
              <b>Withdrawal Rules:</b>
            </p>
            <ul class="list-disc pl-5">
              <li>Withdrawal time: 9 AM to 6 PM</li>
              <li>All withdrawals will be processed within 30 minutes</li>
              <li>UPI ID must be correct and verified</li>
            </ul>
          </span>
        )}
      </div>
    </div>
  );
}
