import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Loader2Icon } from "lucide-react";
import { API_URL } from "../config";

export default function DepositeByOwn({ onRequestCreated }) {
  const [loading, setLoading] = useState(false);
  const [siteData, setSiteData] = useState(null);
  const [settings, setSettings] = useState(null);
  const [pendingTx, setPendingTx] = useState(null);

  const [amount, setAmount] = useState(
    () => localStorage.getItem("add_amount") || ""
  );

  useEffect(() => {
    localStorage.setItem("add_amount", amount);
  }, [amount]);

  const showPopup = (_type, message) => {
    alert(message);
  };

  const normalizeUpiResult = (result) => {
    if (!result) return { status: "FAILED", raw_response: result };

    if (typeof result === "string") {
      const parsed = {};
      result.split("&").forEach((part) => {
        const [key, value] = part.split("=");
        if (key) parsed[key.trim().toLowerCase()] = decodeURIComponent(value || "");
      });

      return {
        status: parsed.status || parsed.txnstatus || parsed.responsecode,
        upi_txn_id: parsed.txnid || parsed.txnref || parsed.transactionid,
        approval_ref_no: parsed.approvalrefno || parsed.approvalref || parsed.rrn,
        raw_response: result,
      };
    }

    return {
      status:
        result.status ||
        result.Status ||
        result.txnStatus ||
        result.responseCode ||
        "FAILED",
      upi_txn_id:
        result.txnId ||
        result.txnid ||
        result.transactionId ||
        result.txnRef ||
        null,
      approval_ref_no:
        result.ApprovalRefNo ||
        result.approvalRefNo ||
        result.approval_ref_no ||
        result.rrn ||
        null,
      raw_response: result,
    };
  };

  const confirmPayment = useCallback(async (txId, result) => {
    const token = localStorage.getItem("accessToken");
    const normalized = normalizeUpiResult(result);

    const res = await axios.post(
      `${API_URL}/payment/confirm-upi`,
      {
        tx_id: txId,
        status: normalized.status,
        upi_txn_id: normalized.upi_txn_id,
        approval_ref_no: normalized.approval_ref_no,
        raw_response: normalized.raw_response,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    localStorage.removeItem("pending_upi_tx_id");
    setPendingTx(null);

    if (res.data.status === "SUCCESS") {
      showPopup("success", "Payment successful. Wallet credited.");
    } else if (res.data.status === "PENDING") {
      showPopup("info", "Payment submitted. Status is pending.");
    } else {
      showPopup("error", "Payment failed.");
    }
  }, []);

  useEffect(() => {
    window.handleUpiPaymentResult = async (result) => {
      const txId = pendingTx || localStorage.getItem("pending_upi_tx_id");
      if (!txId) return;

      try {
        await confirmPayment(txId, result);
      } catch (error) {
        console.log("UPI confirm error:", error);
        showPopup("error", error.response?.data?.detail || "Payment status update failed");
      }
    };

    return () => {
      delete window.handleUpiPaymentResult;
    };
  }, [confirmPayment, pendingTx]);

  const openUpiApp = async (paymentData) => {
    const payload = {
      txn_id: paymentData.tx_id,
      amount: paymentData.amount,
      upi_id: paymentData.upi_id,
      upi_link: paymentData.upi_link,
    };

    if (window.flutter_inappwebview?.callHandler) {
      return window.flutter_inappwebview.callHandler("startUpiPayment", payload);
    }

    if (window.StartUpiPayment?.postMessage) {
      window.StartUpiPayment.postMessage(JSON.stringify(payload));
      return null;
    }

    window.location.href = paymentData.upi_link;
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || Number(amount) < settings?.min_deposit) {
      showPopup("error", `Minimum deposit is Rs ${settings?.min_deposit}`);
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("accessToken");

      const res = await axios.post(
        `${API_URL}/payment/create-order`,
        {
          amount: parseFloat(amount),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      localStorage.setItem("pending_upi_tx_id", res.data.tx_id);
      setPendingTx(res.data.tx_id);

      const upiResult = await openUpiApp(res.data);
      if (upiResult) {
        await confirmPayment(res.data.tx_id, upiResult);
      } else {
        showPopup(
          "info",
          "UPI app opened. Complete payment and wait for status update."
        );
      }

      setAmount("");
      onRequestCreated?.();
    } catch (error) {
      console.log(error);
      showPopup("error", error.response?.data?.detail || "Something went wrong!");
    }

    setLoading(false);
  };

  useEffect(() => {

    async function load() {

      try {

        const res = await axios.get(`${API_URL}/settings/get`);
        const sited = await axios.get(`${API_URL}/sitedata/get`);

        setSiteData(sited?.data);
        setSettings(res?.data);

      } catch (error) {

        console.log("Settings API Error:", error);

      }

    }

    load();

  }, []);

  return (

    <div className="w-full">

      <form
        onSubmit={handleSubmit}
        className="theme-panel mx-auto mt-4 w-[93%] rounded-[24px] p-4"
      >

        <h2 className="text-sm font-semibold text-gray-200 mb-2">
          ADD POINTS
        </h2>

        <input
          type="number"
          placeholder={`Add amount (Min Rs ${settings?.min_deposit})`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="theme-input mb-3 w-full px-4 py-3 text-gray-200"
        />

        <div className="grid grid-cols-3 gap-3 mb-4">

          {[300, 500, 1000, 2000, 5000].map((amt) => (

            <button
              key={amt}
              type="button"
              onClick={() => setAmount(amt)}
              className="rounded-[18px] border border-red-500/20 bg-red-950/15 py-2 font-semibold text-white transition hover:bg-red-900/30"
            >

              {amt}

            </button>

          ))}

        </div>

        <button
          disabled={
            loading ||
            !settings?.min_deposit ||
            amount < settings?.min_deposit
          }
          className={`w-full bg-gradient-to-tl
            text-white font-semibold py-3 rounded-[20px] flex items-center justify-center transition
            ${
              loading || amount < settings?.min_deposit
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-purple-800"
            }`}
        >

          {loading ? <Loader2Icon className="animate-spin" /> : "Proceed"}

        </button>

      </form>

      {siteData?.add_money_html ? (

        <div
          className="text-gray-200 mt-5 text-sm mx-5"
          dangerouslySetInnerHTML={{
            __html: siteData?.add_money_html,
          }}
        />

      ) : (

        <div className="mt-4 mx-5 text max-w-md text-sm text-gray-200 leading-6"></div>

      )}

    </div>

  );
}
