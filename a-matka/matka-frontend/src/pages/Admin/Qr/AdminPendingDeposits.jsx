import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../../../config";

const API_BASE = `${API_URL}`;

export default function AdminPendingDeposits() {
  const [pending, setPending] = useState([]);

  const token = localStorage.getItem("admin_token");

  const loadPending = async () => {
    try {
      const res = await axios.get(`${API_BASE}/deposit-qr/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(res);

      setPending(res.data.pending);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Pending Deposit Requests</h2>

      {pending.length === 0 && <p>No pending requests</p>}

      <div style={{ display: "grid", gap: 20 }}>
        {pending.map((item) => (
          <PendingCard key={item.id} item={item} refresh={loadPending} />
        ))}
      </div>
    </div>
  );
}

function PendingCard({ item, refresh }) {
  const token = localStorage.getItem("admin_token");

  const approve = async () => {
    const amount = prompt("Enter amount to add:");
    if (!amount) return;

    const formData = new FormData();
    formData.append("request_id", item.id);
    formData.append("amount", parseFloat(amount));

    await axios.post(`${API_BASE}/deposit-qr/approve`, formData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    refresh();
  };

  const reject = async () => {
    const formData = new FormData();
    formData.append("request_id", item.id);

    await axios.post(`${API_BASE}/deposit-qr/reject`, formData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    refresh();
  };

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: 15,
        borderRadius: 10,
        maxWidth: 350,
      }}
    >
      <h4>User: {item.username}</h4>

      <img
        src={`${API_BASE}/${item.image_url}`}
        width="250"
        alt="QR"
        style={{ borderRadius: 10 }}
      />

      <div style={{ marginTop: 10 }}>
        <button
          onClick={approve}
          style={{
            background: "green",
            color: "white",
            padding: "8px 12px",
            borderRadius: 6,
            marginRight: 10,
          }}
        >
          Approve
        </button>

        <button
          onClick={reject}
          style={{
            background: "red",
            color: "white",
            padding: "8px 12px",
            borderRadius: 6,
          }}
        >
          Reject
        </button>
      </div>
    </div>
  );
}
