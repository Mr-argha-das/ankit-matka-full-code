import { Copy } from "lucide-react";
import React, { useState } from "react";

const DetailRow = ({ label, value, onCopy }) => {
  if (!value) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
      <div className="min-w-0">
        <p className="text-[11px] uppercase text-gray-400">{label}</p>
        <p className="break-all text-sm font-semibold text-white">{value}</p>
      </div>
      <button
        type="button"
        onClick={() => onCopy(value)}
        className="shrink-0 rounded-md border border-white/10 p-2 text-gray-200 hover:bg-white/10"
        aria-label={`Copy ${label}`}
      >
        <Copy size={15} />
      </button>
    </div>
  );
};

export default function PaymentReceiveDetails({ siteData }) {
  const [copied, setCopied] = useState("");
  const hasDetails =
    siteData?.upi_id ||
    siteData?.bank_account_holder ||
    siteData?.bank_account_number ||
    siteData?.ifsc_code;

  if (!hasDetails) return null;

  const copyValue = async (value) => {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    setTimeout(() => setCopied(""), 1800);
  };

  return (
    <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-white">Payment Details</h3>
        <p className="text-xs text-gray-400">
          Deposit karne ke liye in details par payment karein.
        </p>
      </div>

      <div className="space-y-2">
        <DetailRow label="UPI ID" value={siteData?.upi_id} onCopy={copyValue} />
        <DetailRow
          label="Account Holder"
          value={siteData?.bank_account_holder}
          onCopy={copyValue}
        />
        <DetailRow
          label="Account Number"
          value={siteData?.bank_account_number}
          onCopy={copyValue}
        />
        <DetailRow label="IFSC Code" value={siteData?.ifsc_code} onCopy={copyValue} />
      </div>

      {copied && (
        <p className="mt-2 text-center text-xs font-semibold text-green-400">
          Copied!
        </p>
      )}
    </div>
  );
}
