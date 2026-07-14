import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { API_URL } from "../../../config";

const API_BASE = API_URL;

export default function DepositQRUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [currentQR, setCurrentQR] = useState(null);
  console.log("currentQR", currentQR);
  const [isReplacing, setIsReplacing] = useState(false);
  const [userId, setUserId] = useState(null);
  console.log(userId);
  const token = localStorage.getItem("accessToken");
  // Decode token once safely
  useEffect(() => {
    if (!token) {
      console.log("No token found");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setUserId(decoded?.sub || null);
    } catch (err) {
      console.error("Invalid token:", err);
    }
  }, [token]);

  // Fetch user's QR Image
  const fetchQR = async () => {
    if (!token) return;

    try {
      const res = await axios.get(`${API_BASE}/deposit-qr/image/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      setCurrentQR(res?.config?.url);
    } catch (err) {}
  };

  useEffect(() => {
    fetchQR();
  }, [token, userId]);

  // Select File
  const handleSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  // Upload QR image
  const uploadQR = async () => {
    if (!selectedFile) return alert("Please select an image");

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      await axios.post(`${API_BASE}/deposit-qr/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("QR Uploaded Successfully!");
      setSelectedFile(null);
      setPreview(null);
      setIsReplacing(false);
      fetchQR();
    } catch (err) {
      alert("Upload failed");
    }
  };

  return (
    <div>
      <h2 className="text-lg py-4 px-3 text-center font-medium  to-black/0">
        Your Deposit QR
      </h2>

      {/* 🟢 If QR exists and user is NOT replacing */}
      {currentQR && !isReplacing && (
        <div className="flex flex-col items-center justify-center">
          <img src={currentQR} className="w-72" alt="Your QR" />

          <button
            onClick={() => setIsReplacing(true)}
            style={{
              marginTop: 10,
              padding: "8px 15px",
              background: "#007bff",
              color: "#fff",
              borderRadius: 5,
              cursor: "pointer",
            }}
          >
            Replace QR
          </button>
        </div>
      )}

      {/* 🟡 If replacing OR no QR uploaded yet */}
      {(isReplacing || !currentQR) && (
        <div>
          {preview && (
            <img
              src={preview}
              width="250"
              alt="Preview"
              style={{ marginTop: 10 }}
            />
          )}

          <input type="file" accept="image/*" onChange={handleSelect} />

          <button
            onClick={uploadQR}
            style={{
              marginTop: 10,
              padding: "10px 20px",
              background: "#333",
              color: "#fff",
              borderRadius: 5,
              cursor: "pointer",
            }}
          >
            Upload
          </button>

          {/* Cancel only when QR already exists */}
          {currentQR && (
            <button
              onClick={() => {
                setIsReplacing(false);
                setPreview(null);
                setSelectedFile(null);
              }}
              style={{
                marginTop: 10,
                marginLeft: 10,
                padding: "10px 20px",
                background: "gray",
                color: "#fff",
                borderRadius: 5,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
