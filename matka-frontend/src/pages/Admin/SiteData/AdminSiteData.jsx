import React, { useEffect, useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import axios from "axios";
import { API_URL, EditerApiKey } from "../../../config";

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

      <div className="grid grid-cols-2 gap-4 my-4 mb-8">
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
        {/* Withdraw Money */}
        <div>
          <label className="font-semibold">Add By Qr Content</label>
          <Editor
            value={siteData?.withdraw_money_html}
            onEditorChange={(v) =>
              setSiteData({ ...siteData, withdraw_money_html: v })
            }
            apiKey={EditerApiKey}
            init={{
              height: 320,
              menubar: false,
              skin: "oxide-dark",
              content_css: "dark",
              plugins: [
                "advlist autolink lists link image charmap preview anchor",
                "searchreplace visualblocks code fullscreen",
                "insertdatetime media table paste help wordcount",
              ],
              toolbar:
                "undo redo | formatselect | bold italic underline | " +
                "alignleft aligncenter alignright alignjustify | " +
                "bullist numlist outdent indent | removeformat",
            }}
          />
        </div>

        {/* Add Money */}
        <div>
          <label className="font-semibold">Add Money</label>
          <Editor
            value={siteData.add_money_html}
            onEditorChange={(v) =>
              setSiteData({ ...siteData, add_money_html: v })
            }
            apiKey={EditerApiKey}
            init={{
              height: 320,
              menubar: false,
              skin: "oxide-dark",
              content_css: "dark",
              plugins: [
                "advlist autolink lists link image charmap preview anchor",
                "searchreplace visualblocks code fullscreen",
                "insertdatetime media table paste help wordcount",
              ],
              toolbar:
                "undo redo | formatselect | bold italic underline | " +
                "alignleft aligncenter alignright alignjustify | " +
                "bullist numlist outdent indent | removeformat",
            }}
            // init={{ height: 200, menubar: false }}
          />
        </div>

        {/* Notice Board */}
        <div>
          <label className="font-semibold">Notice Board</label>
          <Editor
            value={siteData.notice_board_html}
            onEditorChange={(v) =>
              setSiteData({ ...siteData, notice_board_html: v })
            }
            apiKey={EditerApiKey}
            init={{
              height: 320,
              menubar: false,
              skin: "oxide-dark",
              content_css: "dark",
              plugins: [
                "advlist autolink lists link image charmap preview anchor",
                "searchreplace visualblocks code fullscreen",
                "insertdatetime media table paste help wordcount",
              ],
              toolbar:
                "undo redo | formatselect | bold italic underline | " +
                "alignleft aligncenter alignright alignjustify | " +
                "bullist numlist outdent indent | removeformat",
            }}
          />
        </div>

        {/* Withdraw T&C */}
        <div>
          <label className="font-semibold">Withdraw Terms & Conditions</label>
          <Editor
            value={siteData.withdraw_terms_html}
            onEditorChange={(v) =>
              setSiteData({ ...siteData, withdraw_terms_html: v })
            }
            apiKey={EditerApiKey}
            init={{
              height: 320,
              menubar: false,
              skin: "oxide-dark",
              content_css: "dark",
              plugins: [
                "advlist autolink lists link image charmap preview anchor",
                "searchreplace visualblocks code fullscreen",
                "insertdatetime media table paste help wordcount",
              ],
              toolbar:
                "undo redo | formatselect | bold italic underline | " +
                "alignleft aligncenter alignright alignjustify | " +
                "bullist numlist outdent indent | removeformat",
            }}
          />
        </div>
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
