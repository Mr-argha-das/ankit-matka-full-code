import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../../config";

const API_BASE = API_URL;

export default function AppImageManager() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch existing image
  const fetchImage = async () => {
    try {
      const res = await axios.get(`${API_BASE}/image/get`);
      setCurrentImage(API_BASE + res.data.image_url);
    } catch (err) {
      setCurrentImage(null);
    }
  };

  useEffect(() => {
    fetchImage();
  }, []);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  // Upload file
  const handleUpload = async () => {
    if (!selectedFile) return alert("Please select an image");

    setLoading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await axios.post(`${API_BASE}/image/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Image uploaded successfully!");
      fetchImage();
      setPreview(null);
      setSelectedFile(null);
    } catch (err) {
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px" }}>
      <h2>QR Image Manager</h2>

      {/* Current Image */}
      <div style={{ marginBottom: "20px" }}>
        <h4>Current Image:</h4>
        {currentImage ? (
          <img
            src={currentImage}
            style={{ width: "100%", borderRadius: "8px" }}
            alt="Current"
          />
        ) : (
          <p>No image uploaded yet</p>
        )}
      </div>

      {/* Preview */}
      {preview && (
        <img
          src={preview}
          alt="Preview"
          style={{ width: "100%", marginBottom: "10px", borderRadius: "8px" }}
        />
      )}

      {/* File Input */}
      <input type="file" accept="image/*" onChange={handleFileChange} />

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={loading}
        style={{
          marginTop: "10px",
          padding: "10px 20px",
          background: "#333",
          color: "#fff",
          borderRadius: "5px",
          border: "none",
          cursor: "pointer",
          width: "100%",
        }}
      >
        {loading ? "Uploading..." : "Upload Image"}
      </button>
    </div>
  );
}
