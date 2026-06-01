import React, { useEffect, useState } from "react";
import { ArrowLeft, Phone, Mail } from "lucide-react";
import { FaW, FaWhatsapp } from "react-icons/fa6";
import { FaTelegram, FaTelegramPlane } from "react-icons/fa";
import { fetchSiteData } from "../components/layout/fetchSiteData";

export default function ContactUs() {
  const [site, setSite] = useState(null);

  useEffect(() => {
    (async () => {
      const data = await fetchSiteData();
      console.log("data ======", data);
      setSite(data);
    })();
  }, []);

  return (
    <div className="max-w-md mx-auto min-h-screen font-sans">
      {/* HEADER */}

      <div className="w-full relative bg-gradient-to-b from-black to-black/0 py-2 flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="p-2 pl-4 z-10 rounded-full hover:bg-white/10 transition"
        >
          <ArrowLeft size={22} />
        </button>

        <h2 className="text-xl z-0 w-full absolute font-bold px-4 py-2 flex justify-center items-center gap-2">
          <span className="flex gap-2 text-md items-center uppercase">
            Contact Us
          </span>
        </h2>

        <div className="pr-4 z-10"></div>
      </div>

      {/* CONTENT */}
      <div className="p-3 space-y-3 text-sm">
        <a
          href={`https://wa.me/${site?.whatsapp_number}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white/5  rounded-xl p-3 shadow flex items-center gap-4"
        >
          <FaWhatsapp size={30} color="#25D366" />
          <div>
            <p className="text-gray-200 font-semibold">Chat Us:</p>
            <p className="text-gray-200">{site?.whatsapp_number}</p>
          </div>
        </a>

        {/* Email */}

        <a
          href={`https://t.me/+${site?.telegram_link}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white/5 rounded-xl p-3 shadow flex items-center gap-4"
        >
          <FaTelegramPlane size={30} className="text-blue-500" />

          <div>
            <p className="text-gray-200 font-semibold">Telegram:</p>
            <p className="text-gray-200"> {site?.telegram_link}</p>
          </div>
        </a>
      </div>
    </div>
  );
}
