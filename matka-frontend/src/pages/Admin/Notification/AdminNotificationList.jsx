import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../../config";
import { Trash } from "lucide-react";

export default function AdminNotificationList() {
  const API_BASE = API_URL;

  const [list, setList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");

  // Fetch list
  const loadNotifications = async () => {
    const res = await axios.get(`${API_BASE}/notifications/all`);
    setList(res.data);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Add Notification
  const handleAdd = async () => {
    if (!title.trim()) return alert("Enter a notification title");

    await axios.post(`${API_BASE}/notifications/add`, { title });
    setTitle("");
    setShowModal(false);
    loadNotifications();
  };

  // Delete Notification
  const handleDelete = async (id) => {
    if (!confirm("Delete this notification?")) return;
    await axios.delete(`${API_BASE}/notifications/delete/${id}`);
    loadNotifications();
  };

  // Format date
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6  shadow rounded">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Notification List</h1>

        <button
          className="px-3 py-1.5 border text-white rounded-full"
          onClick={() => setShowModal(true)}
        >
          Add Notification
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white/5 rounded-xl shadow backdrop-blur overflow-x-auto">
        <table className="min-w-full text-sm text-gray-200">
          <thead>
            <tr className="bg-white/10 text-gray-300  border-gray-700">
              <th className=" p-2 w-12">SNo.</th>
              <th className=" p-2 text-left">Title</th>
              <th className=" p-2 w-40">Date & Time</th>
              <th className=" p-2 w-24">Action</th>
            </tr>
          </thead>

          <tbody>
            {list.map((n, index) => (
              <tr key={n.id} className="">
                <td className=" p-2 text-center">{index + 1}</td>
                <td className=" p-2 whitespace-pre-line">{n.title}</td>

                <td className=" p-2 text-center space-x-5 w-50 text-sm">
                  {formatDate(n.created_at) + "   " + formatTime(n.created_at)}
                </td>

                <td className=" p-2 text-center">
                  <button
                    className="borde rounded-sm px-2 py-0.5 bg-red-600 "
                    onClick={() => handleDelete(n.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ADD MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 bg-opacity-40 flex items-center justify-center">
          <div className="bg-white/80 backdrop-blur-2xl p-6 rounded shadow w-[400px]">
            <h2 className="text-lg font-semibold mb-3 text-black">
              Add Notification
            </h2>

            <textarea
              rows={6}
              className="border w-full p-2 rounded text-black"
              placeholder="Enter notification text..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-red-500  rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
