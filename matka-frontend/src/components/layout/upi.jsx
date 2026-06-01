import React, { useState } from "react";

export default function UpiPayment() {
  const [method, setMethod] = useState("paytm"); // default

  const links = {
    paytm:
      "paytmmp://pay?pa=rahul@upi&pn=Rahul%20Kumar&am=100&cu=INR&tn=Ride%20Payment",
    phonepe:
      "phonepe://pay?pa=rahul@upi&pn=Rahul%20Kumar&am=100&cu=INR&tn=Ride%20Payment",
  };

  const handlePayment = () => {
    const link = links[method];
    window.location.href = link;
  };

  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <h3>Select UPI App</h3>

      {/* Dropdown */}
      <select
        value={method}
        onChange={(e) => setMethod(e.target.value)}
        style={{
          padding: "10px 14px",
          marginBottom: "20px",
          borderRadius: "8px",
          fontSize: "16px",
        }}
      >
        <option value="paytm">Paytm</option>
        <option value="phonepe">PhonePe</option>
      </select>

      {/* Pay Button */}
      <br />
      <button
        onClick={handlePayment}
        style={{
          padding: "12px 24px",
          backgroundColor: "#0b8c68",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "18px",
        }}
      >
        Pay Now
      </button>
    </div>
  );
}
