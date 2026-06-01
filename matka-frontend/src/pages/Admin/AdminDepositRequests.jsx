import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  User,
} from "lucide-react";
import { API_URL } from "../../config";

const API_BASE = `${API_URL}`;
const getToken = () => localStorage.getItem("accessToken");

export default function AdminDepositRequests() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState(null);

  // FETCH PENDING LIST
  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_URL}/user-deposit-withdrawal/admin/deposit/pending`,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );
      console.log(res);

      setPending(res.data.pending || []);
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPending();
  }, []);

  // VIEW SCREENSHOT
  // const viewScreenshot = (path) => {
  //   window.open(API_URL + path, "_blank");
  // };

  const [openImage, setOpenImage] = useState(null);
  const [zoom, setZoom] = useState(1);

  const viewScreenshot = (url) => {
    console.log(API_URL + url);
    setZoom(1);
    setOpenImage(url);
  };

  const closeModal = () => {
    setOpenImage(null);
    setZoom(1);
  };

  // APPROVE
  const handleApprove = async (request_id) => {
    const amount = prompt("Enter amount to credit:");
    if (!amount) return;

    setProcessingId(request_id);

    console.log(request_id);

    const fd = new FormData();
    fd.append("request_id", request_id);
    fd.append("amount", amount);

    try {
      const res = await axios.post(
        `${API_URL}/user-deposit-withdrawal/admin/deposit/approve`,
        fd,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );

      console.log(res);

      alert("Deposit Approved!");
      fetchPending();
    } catch (err) {
      console.log(err);
      alert(err?.response?.data?.detail);
    }

    setProcessingId(null);
  };

  // REJECT
  const handleReject = async (request_id) => {
    if (!window.confirm("Reject this deposit?")) return;

    setProcessingId(request_id);

    const fd = new FormData();
    fd.append("request_id", request_id);

    try {
      await axios.post(
        `${API_URL}/user-deposit-withdrawal/admin/deposit/reject`,
        fd,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );

      alert("Deposit Rejected!");
      fetchPending();
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.detail || "Failed to reject request");
    }

    setProcessingId(null);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        Loading pending deposit requests...
      </div>
    );
  }

  return (
    <div className="p-4 text-white">
      <h2 className="text-xl font-bold mb-6">Pending Deposit Requests</h2>

      {error && (
        <div className="bg-red-700/40 text-red-300 p-3 mb-4 rounded">
          {error}
        </div>
      )}

      {pending.length === 0 ? (
        <div className="text-center text-gray-400 p-10 border border-gray-700 rounded">
          🎉 No pending deposits!
        </div>
      ) : (
        <div className="overflow-x-auto bg-white/10 rounded-xl">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs">User</th>
                <th className="px-4 py-3 text-left text-xs">Method</th>
                <th className="px-4 py-3 text-left text-xs">Amount</th>
                <th className="px-4 py-3 text-left text-xs">Status</th>
                <th className="px-4 py-3 text-left text-xs">Screenshot</th>
                <th className="px-4 py-3 text-left text-xs">Uploaded At</th>
                <th className="px-4 py-3 text-center text-xs">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-800">
              {pending.map((p) => (
                <tr key={p.id} className="hover:bg-white/5">
                  {/* USER */}
                  <td className="px-4 py-4 text-sm min-w-40">
                    <span className="flex gap-1 items-center">
                      <User size={15} />
                      <p className="font-semibold capitalize">{p.username}</p>
                    </span>
                    <p className="text-xs text-gray-400">{p.mobile}</p>
                  </td>

                  {/* METHOD */}
                  <td className="px-4 py-4 text-sm text-gray-300">
                    {p.method || "—"}
                  </td>

                  {/* AMOUNT */}
                  <td className="px-4 min-w-26 py-4 text-sm font-bold text-green-400">
                    ₹ {p.amount || 0}
                  </td>

                  {/* STATUS */}
                  <td className="px-4 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        p.status === "PENDING"
                          ? "bg-yellow-600/40 text-yellow-300"
                          : p.status === "SUCCESS"
                          ? "bg-green-600/40 text-green-300"
                          : "bg-red-600/40 text-red-300"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>

                  {/* SCREENSHOT */}

                  {p.method === "googlepay" || "paytm" || "phonepay" ? (
                    // <td className="px-4 py-4">
                    //   <button
                    //     onClick={() => viewScreenshot(p.image_url)}
                    //     className="text-blue-400 flex items-center gap-2 hover:text-blue-300"
                    //   >
                    //     <ImageIcon size={18} /> View
                    //   </button>a
                    // </td>ççç
                    <td className="px-4 py-4">
                      <button
                        onClick={() => viewScreenshot(p.image_url)}
                        className="text-blue-400 flex items-center gap-2 hover:text-blue-300"
                      >
                        <ImageIcon size={18} /> View
                      </button>
                    </td>
                  ) : (
                    <td className="px-4 py-4">
                      <button
                        onClick={() => viewScreenshot(p.image_url)}
                        className="text-blue-400 flex items-center gap-2 hover:text-blue-300"
                      >
                        AUTO
                      </button>
                    </td>
                  )}

                  {/* DATE */}
                  <td className="px-4 py-4 text-xs min-w-50 text-gray-400">
                    {new Date(p.uploaded_at).toLocaleString()}
                  </td>

                  {/* ACTIONS */}
                  {p.status === "PENDING" ? (
                    <td className="px-4 py-4 flex gap-1 text-center">
                      {processingId === p.id ? (
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                      ) : (
                        <>
                          <button
                            onClick={() => handleApprove(p.id)}
                            className="p-2 bg-green-600 hover:bg-green-700 rounded-full"
                          >
                            <CheckCircle size={18} />
                          </button>

                          <button
                            onClick={() => handleReject(p.id)}
                            className="p-2 bg-red-600 hover:bg-red-700 rounded-full"
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                    </td>
                  ) : p.status === "FAILED" ? (
                    <td className="px-4 py-4 text-red-500 text-center">
                      Rejected
                    </td>
                  ) : (
                    <td className="px-4 py-4 text-green-500 text-center">
                      Deposited
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {openImage && (
            <div
              className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
              onClick={closeModal}
            >
              <div
                className="relative bg-black rounded-lg p-3 max-w-4xl w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close */}
                <button
                  onClick={closeModal}
                  className="absolute top-2 right-2 text-white bg-black/60 rounded-full px-3 py-1"
                >
                  ✕
                </button>

                {/* Zoom Controls */}
                <div className="flex justify-center gap-3 mb-3">
                  <button
                    onClick={() => setZoom((z) => Math.min(z + 0.2, 3))}
                    className="px-3 py-1 bg-gray-700 text-white rounded"
                  >
                    +
                  </button>
                  <button
                    onClick={() => setZoom((z) => Math.max(z - 0.2, 1))}
                    className="px-3 py-1 bg-gray-700 text-white rounded"
                  >
                    −
                  </button>
                </div>

                {/* Image */}
                <div className="overflow-auto max-h-[75vh] flex justify-center">
                  <img
                    src={API_URL + openImage}
                    alt="Screenshot"
                    style={{ transform: `scale(${zoom})` }}
                    className="transition-transform duration-200 origin-center"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
