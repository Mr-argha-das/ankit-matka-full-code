import React, { useState, useEffect } from "react";
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
} from "lucide-react";
import axios from "axios";
import { API_URL } from "../../config";

const getToken = () => localStorage.getItem("accessToken");

export default function AdminWithdrawalRequests() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  console.log(data);
  const fetchWithdrawals = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await axios.get(
        `${API_URL}/user-deposit-withdrawal/admin/withdraw`,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );
      const withdrawals = res.data || [];
      setData(withdrawals);
    } catch (err) {
      console.log(err);
      setError("Failed to load withdrawal requests");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  // APPROVE
  const handleApprove = async (id) => {
    setProcessingId(id);

    const fd = new FormData();
    fd.append("wd_id", id);

    try {
      await axios.post(
        `${API_URL}/user-deposit-withdrawal/admin/withdraw/approve`,
        fd,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      fetchWithdrawals();
    } catch (err) {
      alert(err.response?.data?.detail || "Approve failed");
    }

    setProcessingId(null);
  };

  // REJECT
  const handleReject = async (id) => {
    setProcessingId(id);

    const fd = new FormData();
    fd.append("wd_id", id);

    try {
      await axios.post(
        `${API_URL}/user-deposit-withdrawal/admin/withdraw/reject`,
        fd,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      fetchWithdrawals();
    } catch (err) {
      alert(err.response?.data?.detail || "Reject failed");
    }

    setProcessingId(null);
  };

  const formatTime = (t) => new Date(t).toLocaleString();

  // LOADING
  if (loading) {
    return (
      <div className="p-8 text-center text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
        Loading withdrawal requests...
      </div>
    );
  }

  return (
    <div className="p-4 text-white">
      <h2 className="text-xl font-bold mb-4">Withdrawal Requests</h2>

      {error && (
        <div className="bg-red-700/20 text-red-300 p-3 rounded mb-4 flex gap-2">
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {data.length === 0 ? (
        <div className="text-center p-10 text-gray-400 border border-gray-700 rounded">
          🎉 No withdrawal requests found
        </div>
      ) : (
        <div className="overflow-x-auto bg-white/5 rounded-xl shadow">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-white/5">
              <tr>
                <th className="px-3 py-2 text-left text-xs">User</th>
                <th className="px-3 py-2 text-left text-xs">Amount</th>
                <th className="px-3 py-2 text-left text-xs">Method</th>
                <th className="px-3 py-2 text-left text-xs">Requested At</th>
                <th className="px-3 py-2 text-left text-xs">Status</th>
                <th className="px-3 py-2 text-center text-xs">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-800">
              {data.map((wd) => {
                return (
                  <tr key={wd.wd_id} className="hover:bg-white/5">
                    <td className="px-4 py-2 text-sm">
                      <div>
                        <p className="font-semibold capitalize flex items-center gap-1">
                          <User size={14} className=" text-purple-400" />
                          {wd.username}
                        </p>
                        <p className="text-xs text-gray-400">
                          {wd.mobileNumber}
                        </p>
                      </div>
                    </td>

                    {/* AMOUNT */}
                    <td className="px-4 py-2 font-bold text-red-400">
                      -₹{wd.amount}
                    </td>

                    {/* METHOD */}
                    <td className="px-4 py-2 min-w-40 text-sm">
                      <p className="font-semibold text-purple-300">
                        {wd.method}
                      </p>

                      <p className="text-xs text-gray-400">{wd.number}</p>
                      <p className="text-xs text-gray-400 capitalize">
                        {wd.account_holder_name}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">
                        {wd.account_no}
                      </p>
                      <p className="text-xs text-gray-400 uppercase">
                        {wd.ifc_code}
                      </p>
                    </td>

                    {/* TIME */}
                    <td className="px-4 py-2 text-xs min-w-44 text-gray-400">
                      {formatTime(wd.created_at)}
                    </td>

                    {/* STATUS */}
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          wd.status === "pending"
                            ? "bg-yellow-600/40 text-yellow-300"
                            : wd.status === "success"
                            ? "bg-green-600/40 text-green-300"
                            : "bg-red-600/40 text-red-300"
                        }`}
                      >
                        {wd.status}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="px-4 py-2 text-center">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => handleApprove(wd.wd_id)}
                          disabled={processingId === wd.wd_id}
                          className="p-2 bg-green-600 hover:bg-green-700 rounded-full"
                        >
                          <CheckCircle size={18} />
                        </button>

                        <button
                          onClick={() => handleReject(wd.wd_id)}
                          disabled={processingId === wd.wd_id}
                          className="p-2 bg-red-600 hover:bg-red-700 rounded-full"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
