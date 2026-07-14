import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../../config";

function HtmlEditor({ label, value, onChange }) {
  return (
    <div>
      <label className="font-semibold">{label}</label>
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        rows={12}
        spellCheck={false}
        className="mt-2 w-full rounded border border-gray-50/15 bg-[#1f2d3a] p-3 font-mono text-sm text-white outline-none focus:border-red-500"
      />
    </div>
  );
}

export default function AdminSiteData() {
  const API_BASE = API_URL;
  const [loading, setLoading] = useState(false);

  const [siteData, setSiteData] = useState({
    mobile_number: "",
    whatsapp_number: "",
    telegram_link: "",
    dashboard_notification_line: "Welcome!",
    add_fund_notification_line: "Deposit bonus!",
    upi_id: "test@upi",
    upi_gateway_merchant_id: "GATEWAY123",
    manual_upi: "manual@upi",
    bank_account_holder: "",
    bank_account_number: "",
    ifsc_code: "",
    video1: "",
    video2: "link2",
    video3: "link3",
    video4: "link4",
    auto_result: true,
    withdraw_money_html: "<p>Withdraw details</p>",
    add_money_html: "<p>Add money</p>",
    notice_board_html: "<p>Notice here</p>",
    withdraw_terms_html: "<p>Terms here</p>",
  });

  useEffect(() => {
    axios.get(`${API_BASE}/sitedata/get`).then((res) => {
      setSiteData(res.data);
    });
  }, []);

  const handleChange = (e) => {
    setSiteData({ ...siteData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    await axios.post(`${API_BASE}/sitedata/update`, siteData);
    setLoading(false);
    alert("siteData updated successfully!");
  };

  return (
    <div className="max-w-7xl mx-auto p-3 shadow rounded">
      <h1 className="text-2xl font-semibold mb-6">Update Site Data</h1>

      {/* MOBILE / WHATSAPP / TELEGRAM */}

      <label className="font-bold border-b my-4 text-white">CONTACT</label>
      <div className="grid lg:grid-cols-2 md:grid-cols-2 gap-4 my-4 mb-8">
        {/* <div>
           <label className="font-medium text-sm">Mobile Number</label>
          <input
            name="mobile_number"
            value={siteData.mobile_number}
            onChange={handleChange}
            placeholder="Mobile Number"
                        className="w-full mt-1 px-3 py-2 border border-gray-50/15 rounded"

          />
        </div> */}

        <div>
          <label className="font-medium text-sm">WhatsApp Number</label>
          <input
            name="whatsapp_number"
            value={siteData.whatsapp_number}
            onChange={handleChange}
            placeholder="WhatsApp Number"
            className="w-full mt-1 px-3 py-2 border border-gray-50/15 rounded"
          />
        </div>

        <div>
          <label className="font-medium text-sm">Telegram Link</label>
          <input
            name="telegram_link"
            value={siteData.telegram_link}
            onChange={handleChange}
            placeholder="Telegram Link"
            className="w-full mt-1 px-3 py-2 border border-gray-50/15 rounded"
          />
        </div>
      </div>

      {/* NOTIFICATION LINES */}

      <label className="font-bold  border-b my-4 text-white  ">
        NOTIFICATION
      </label>

      <div className="grid  lg:grid-cols-2 md:grid-cols-2 gap-4 my-4 mb-8">
        <div>
          <label className="font-medium text-sm">Dashboard Notification</label>
          <input
            name="dashboard_notification_line"
            value={siteData.dashboard_notification_line}
            onChange={handleChange}
            placeholder="Dashboard Notification Line"
            className="w-full mt-1 px-3 py-2 border border-gray-50/15 rounded"
          />
        </div>

        <div>
          <label className="font-medium text-sm">Add Fund Notification</label>
          <input
            name="add_fund_notification_line"
            value={siteData.add_fund_notification_line}
            onChange={handleChange}
            placeholder="Add Fund Notification Line"
            className="w-full mt-1 px-3 py-2 border border-gray-50/15 rounded"
          />
        </div>
      </div>

      {/* UPI SECTION */}
      <label className="font-bold border-b my-4 text-white">
        UPI SETTINGS - PAYMENT RECEIVE ID
      </label>

      <div className="grid lg:grid-cols-2 md:grid-cols-2 gap-4 my-4 mb-8">
        <div>
          <label className="font-medium text-sm">Deposit Receive UPI ID</label>
          <input
            name="upi_id"
            value={siteData.upi_id}
            onChange={handleChange}
            placeholder="example@upi"
            className="w-full mt-1 px-3 py-2 border border-gray-50/15 rounded"
          />
          <p className="mt-1 text-xs text-gray-400">
            Users ke Add Points payment isi UPI ID par open honge.
          </p>
        </div>

        <div>
          <label className="font-medium text-sm">Account Holder Name</label>
          <input
            name="bank_account_holder"
            value={siteData.bank_account_holder || ""}
            onChange={handleChange}
            placeholder="Account Holder Name"
            className="w-full mt-1 px-3 py-2 border border-gray-50/15 rounded"
          />
        </div>

        <div>
          <label className="font-medium text-sm">Account Number</label>
          <input
            name="bank_account_number"
            value={siteData.bank_account_number || ""}
            onChange={handleChange}
            placeholder="Account Number"
            className="w-full mt-1 px-3 py-2 border border-gray-50/15 rounded"
          />
          <p className="mt-1 text-xs text-gray-400">
            Users ko deposit page par ye account number dikhai dega.
          </p>
        </div>

        <div>
          <label className="font-medium text-sm">IFSC Code</label>
          <input
            name="ifsc_code"
            value={siteData.ifsc_code || ""}
            onChange={handleChange}
            placeholder="IFSC Code"
            className="w-full mt-1 px-3 py-2 border border-gray-50/15 rounded uppercase"
          />
        </div>

        {/* <div>
          <label className="font-medium text-sm">UPI Gateway Merchant ID</label>
          <input
            name="upi_gateway_merchant_id"
            value={siteData.upi_gateway_merchant_id}
            onChange={handleChange}
            placeholder="UPI Gateway Merchant ID"
                        className="w-full mt-1 px-3 py-2 border border-gray-50/15 rounded"

          />
        </div> */}

        {/* <div>
          <label className="font-medium text-sm">Manual UPI</label>
          <input
            name="manual_upi"
            value={siteData.manual_upi}
            onChange={handleChange}
            placeholder="Manual UPI"
                        className="w-full mt-1 px-3 py-2 border border-gray-50/15 rounded"

          />
        </div> */}
      </div>

      {/* RICH TEXT EDITORS */}
      <div className="grid lg:grid-cols-2 gap-6">
        <HtmlEditor
          label="Add By Qr Content"
          value={siteData?.withdraw_money_html}
          onChange={(v) =>
            setSiteData({ ...siteData, withdraw_money_html: v })
          }
        />

        <HtmlEditor
          label="Add Money"
          value={siteData.add_money_html}
          onChange={(v) => setSiteData({ ...siteData, add_money_html: v })}
        />

        <HtmlEditor
          label="Notice Board"
          value={siteData.notice_board_html}
          onChange={(v) =>
            setSiteData({ ...siteData, notice_board_html: v })
          }
        />

        <HtmlEditor
          label="Withdraw Terms & Conditions"
          value={siteData.withdraw_terms_html}
          onChange={(v) =>
            setSiteData({ ...siteData, withdraw_terms_html: v })
          }
        />
      </div>

      <button
        onClick={handleSubmit}
        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded"
      >
        {loading ? "Saving..." : "Submit"}
      </button>
    </div>
  );
}
