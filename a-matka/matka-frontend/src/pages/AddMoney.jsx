// src/pages/AddMoney.jsx
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, HistoryIcon, MessageCircle } from "lucide-react";
import AddMoneyQrTab from "./Admin/Qr/AddMoneyQrTab";
import axios from "axios";
import DepositeByOwn from "./DepositeByOwn";
import { API_URL } from "../config";

export default function AddMoney() {
  const [activeTab, setActiveTab] = useState("auto");

  const [showAutoNotice, setShowAutoNotice] = useState(false);
  const qrRef = useRef(null);

  const [settings, setSettings] = useState(null);

  console.log(settings);

  async function load() {
    try {
      const res = await axios.get(`${API_URL}/settings/get`);

      console.log("siteed", res);
      setSettings(res?.data);
    } catch (error) {
      console.log("Settings API Error:", error);
    }
  }

  useEffect(() => {
    // if (activeTab === "auto") {
    load();
    // }
  }, [activeTab]);

  const goToQrSection = () => {
    setActiveTab("qr");
    setTimeout(() => {
      qrRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  };

  // Trigger 3-sec notification
  const triggerAutoNotice = () => {
    setShowAutoNotice(true);
    goToQrSection();
    setTimeout(() => setShowAutoNotice(false), 3000);
  };

  return (
    <div className="max-w-md pb-22 mx-auto flex flex-col items-center font-sans">
      <div className="w-full relative bg-gradient-to-b from-black to-black/0 py-2 flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="p-2 pl-4 z-10 rounded-full hover:bg-white/10 transition"
        >
          <ArrowLeft size={22} />
        </button>
        <h2 className="text-md z-0 w-full absolute   justify-between font-bold bg-gradient-to-b from-black to-black/0 px-4 py-2  flex justify-center items-center gap-2">
          <span className="flex gap-2 text-md items-center">Add Points</span>
        </h2>
        <a href="/deposit-history" className="pr-4 z-10">
          <HistoryIcon />
        </a>{" "}
      </div>

      {/* Tabs */}
      <div className="flex w-[93%] max-w-md mt-2 border-b border-gray-50/10">
        <button
          onClick={() => setActiveTab("auto")}
          className={`flex-1 text-sm text-center py-2 font-semibold ${
            activeTab === "auto"
              ? "text-[#b00fdc] border-b-1 border-[#b00fdc]"
              : "text-gray-500"
          }`}
        >
          PAY BY AUTO DEPOSIT
        </button>

        <button
          onClick={() => setActiveTab("qr")}
          className={`flex-1 text-sm text-center py-2 font-semibold ${
            activeTab === "qr"
              ? "text-[#b00fdc] border-b-1 border-[#b00fdc]"
              : "text-gray-500"
          }`}
        >
          PAY BY QR CODE
        </button>
      </div>

      {/* Auto Tab */}
      {activeTab === "auto" && (
        <DepositeByOwn
          settings={settings}
          onRequestCreated={triggerAutoNotice}
        />
      )}

      {/* QR Code Tab */}
      <div ref={qrRef} className="w-full">
        {activeTab === "qr" && <AddMoneyQrTab settings={settings} />}
      </div>

      {/* SLIDE-UP notification */}
      {showAutoNotice && (
        <div className="fixed bottom-40 left-1/2 text-sm font-medium  animate-fadeIn -translate-x-1/2 bg-green-700 text-white px-4 py-2 rounded-full shadow-lg">
          Pay And Upload Screenshot
        </div>
      )}
    </div>
  );
}
