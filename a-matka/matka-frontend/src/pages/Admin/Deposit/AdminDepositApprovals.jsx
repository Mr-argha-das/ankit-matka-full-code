import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../../config";

// Backend Route Prefix => /user
// Routes:
// GET    /user/deposit-requiest-normal
// POST   /user/approve-deposit-normal
// POST   /user/failed-deposit-normal   <-- Reject API

const API_BASE = `${API_URL}/user`;
const getAuthToken = () => localStorage.getItem("accessToken");

export default function AdminDepositApprovals() {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState(0);

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const [rejectMode, setRejectMode] = useState(false); // NEW STATE

  useEffect(() => {
    fetchDeposits();
  }, []);

  // ================================
  // Fetch Deposit List
  // ================================
  async function fetchDeposits() {
    setLoading(true);
    setError(null);

    try {
      const res = await axios.get(`${API_BASE}/deposit-requiest-normal`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });

      setDeposits(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load deposits");
    } finally {
      setLoading(false);
    }
  }

  // ================================
  // Open Approve / Reject Modal
  // ================================
  function openApprove(deposit) {
    setRejectMode(false); // approve mode
    setSelected(deposit);
    setAmount(deposit.amount || 0);
  }

  function openReject(deposit) {
    setRejectMode(true); // reject mode
    setSelected(deposit);
    setAmount(deposit.amount || 0);
  }

  // Close Modal
  function closeModal() {
    setSelected(null);
    setAmount(0);
    setProcessing(false);
    setError(null);
    setRejectMode(false);
  }

  // ================================
  // Approve Deposit
  // ================================
  async function approve() {
    if (!selected) return;

    setProcessing(true);
    setError(null);

    try {
      const form = new FormData();
      form.append("tx_id", selected.tx_id);
      form.append("amount", String(amount));

      await axios.post(`${API_BASE}/approve-deposit-normal`, form, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });

      setDeposits((prev) => prev.filter((d) => d.tx_id !== selected.tx_id));
      closeModal();
    } catch (err) {
      console.error(err.response || err);
      setError(err?.response?.data?.detail || "Approval failed");
    } finally {
      setProcessing(false);
    }
  }

  // ================================
  // ❌ REJECT Deposit (FAILED)
  // ================================
  async function rejectDeposit() {
    if (!selected) return;

    setProcessing(true);
    setError(null);

    try {
      const form = new FormData();
      form.append("tx_id", selected.tx_id);
      form.append("amount", String(amount));

      await axios.post(`${API_BASE}/failed-deposit-normal`, form, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });

      setDeposits((prev) => prev.filter((d) => d.tx_id !== selected.tx_id));
      closeModal();
    } catch (err) {
      console.error(err.response || err);
      setError(err?.response?.data?.detail || "Rejection failed");
    } finally {
      setProcessing(false);
    }
  }

  // ===========================================================
  // UI
  // ===========================================================
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6 text-gray-900 dark:text-gray-100">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Deposit Requests</h1>
          <button
            onClick={fetchDeposits}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500"
          >
            Refresh
          </button>
        </div>

        {/* Loading */}
        {loading && <div className="text-center py-6">Loading...</div>}

        {/* Error */}
        {error && <div className="text-red-400 mb-4">{error}</div>}

        {/* No Data */}
        {!loading && deposits.length === 0 && (
          <div className="text-center text-gray-500 py-10">
            No pending deposits.
          </div>
        )}

        {/* Deposit Cards */}
        <div className="grid gap-4">
          {deposits.map((d) => (
            <div
              key={d.tx_id}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex flex-col md:flex-row justify-between"
            >
              {/* Left */}
              <div className="flex gap-4 flex-1">
                <div className="w-12 h-12 rounded-full bg-indigo-200 dark:bg-indigo-900 flex items-center justify-center font-bold">
                  {d.user?.name?.[0] || d.user?.email?.[0] || "U"}
                </div>

                <div>
                  <p className="text-sm text-gray-400">TX ID</p>
                  <p className="font-medium">{d.tx_id}</p>

                  <p className="text-sm text-gray-400 mt-1">
                    Method: {d.payment_method}
                  </p>

                  <p className="text-sm text-gray-400">
                    {new Date(d.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Middle */}
              <div className="mt-3 md:mt-0 grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                <div>
                  <p className="text-sm text-gray-400">User</p>
                  <p className="font-medium">
                    {d.user?.name || d.user?.email || "Unknown"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">Amount</p>
                  <p className="font-medium">{d.amount}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">Screenshot</p>
                  {d.screenshot ? (
                    <img
                      src={d.screenshot}
                      alt="Screenshot"
                      className="w-36 h-20 rounded object-cover mt-1"
                    />
                  ) : (
                    <p className="text-sm text-gray-500">No screenshot</p>
                  )}
                </div>
              </div>

              {/* Right Buttons */}
              <div className="flex items-center gap-2 mt-3 md:mt-0">
                <button
                  onClick={() => openApprove(d)}
                  className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-500"
                >
                  Approve
                </button>

                <button
                  onClick={() => openReject(d)}
                  className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-500"
                >
                  Reject
                </button>

                <button
                  onClick={() => navigator.clipboard.writeText(d.tx_id)}
                  className="px-3 py-2 border rounded-md"
                >
                  Copy TX
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Approve/Reject Modal */}
        {selected && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md relative">
              <h2 className="text-lg font-semibold mb-3">
                {rejectMode ? "Reject Deposit" : "Approve Deposit"}
              </h2>

              <p className="text-sm text-gray-400">TX ID</p>
              <p className="font-mono text-sm break-all mb-2">
                {selected.tx_id}
              </p>

              <p className="text-sm text-gray-400">User</p>
              <p className="font-medium mb-2">
                {selected.user?.name || selected.user?.email}
              </p>

              <label className="text-sm text-gray-400">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded mt-1 mb-3 bg-gray-50 dark:bg-gray-900"
              />

              {selected.screenshot && (
                <>
                  <p className="text-sm text-gray-400">Screenshot</p>
                  <img
                    src={selected.screenshot}
                    className="w-48 h-32 object-cover rounded mb-3"
                  />
                </>
              )}

              {error && <p className="text-red-400 mb-3">{error}</p>}

              <div className="flex justify-end gap-2">
                <button
                  onClick={closeModal}
                  className="px-3 py-2 border rounded-md"
                >
                  Cancel
                </button>

                {!rejectMode ? (
                  <button
                    onClick={approve}
                    disabled={processing}
                    className="px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50"
                  >
                    {processing ? "Processing..." : "Approve & Credit"}
                  </button>
                ) : (
                  <button
                    onClick={rejectDeposit}
                    disabled={processing}
                    className="px-4 py-2 bg-red-600 text-white rounded-md disabled:opacity-50"
                  >
                    {processing ? "Processing..." : "Reject & Refund"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
