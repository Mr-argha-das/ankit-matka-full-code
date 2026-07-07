import React, { useState, useEffect, useCallback } from "react";
import { Play, Star, Wallet, WalletCards } from "lucide-react";
import { BsWhatsapp } from "react-icons/bs";
import { API_URL, normalizePhoneNumber } from "../config";
import axios from "axios";
import MarketList from "./Client/MarketList";
import { fetchSiteData } from "../components/layout/fetchSiteData";
import NotificationModal from "../components/layout/NotificationModal";
import { SiMarketo } from "react-icons/si";

export default function Dashboard() {
  const token = localStorage.getItem("accessToken");
  const [markets, setMarkets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [site, setSite] = useState(null);
  const whatsappNumber = normalizePhoneNumber(site?.whatsapp_number);
  const [error, setError] = useState(null);

  // Redirect if NOT logged in
  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
    }
  }, [token]);

  const displayDigit = (v) => (!v || v === "-" ? "X" : v);
  const displayPanna = (v) => (!v || v === "-" ? "XXX" : v);

  const fetchMarkets = useCallback(async () => {
    try {
      setIsLoading(true);

      const res = await axios.get(`${API_URL}/api/admin/user/markets`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const list = res.data.data.map((m) => {
        const today = m.today_result || {};

        return {
          id: m._id?.$oid,
          name: m.name,
          openTime: m.open_time,
          closeTime: m.close_time,

          status: m.status,
          // If backend adds final_result later
          result: m.final_result || "xxx-x-xxx",
          open_digit: displayDigit(today.open_digit),
          close_digit: displayDigit(today.close_digit),
          open_panna: displayPanna(today.open_panna),
          close_panna: displayPanna(today.close_panna),
        };
      });

      setMarkets(list);

      console.log("list", list);
    } catch (err) {
      console.error(err);
      setError("Failed to load markets");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  useEffect(() => {
    (async () => {
      const data = await fetchSiteData();
      console.log("data ======", data);
      setSite(data);
    })();
  }, []);

  const [siteData, setSiteData] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_URL}/sitedata/get`);
        setSiteData(res.data);

        const alreadyShown = localStorage.getItem("notice_shown");

        // Show modal only if notice_board_html exists and not shown before
        if (res.data.notice_board_html && !alreadyShown) {
          setShowModal(true);
        }
      } catch (err) {
        console.log(err);
      }
    };

    fetchData();
  }, []);

  const handleClose = () => {
    setShowModal(false);
    localStorage.setItem("notice_shown", "true"); // show only once
  };

  return (
    <div className="text-white font-sans">
      <div className="flex flex-col max-w-md mx-auto h-screen">
        {/* HEADER */}
        <div className="theme-card flex flex-col items-center rounded-b-[30px] border-x-0 border-t-0 px-4 py-4 text-sm">
          <div className="w-full flex justify-between items-center">
            <a
              href="/add-points"
              className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-950/20 px-3 py-2 text-sm font-semibold hover:bg-red-900/30"
            >
              <Wallet size={18} /> Add Funds
            </a>

            <a
              href="/withdrawal-request"
              className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-950/20 px-3 py-2 text-sm font-semibold hover:bg-red-900/30"
            >
              <WalletCards size={18} /> Withdraw
            </a>
          </div>

          <div
            className="mt-4 w-full overflow-hidden rounded-full border border-white/10 bg-white/[0.06] p-1 px-2 text-center backdrop-blur-2xl 
               whitespace-nowrap inline-block"
          >
            <p
              className="w-full"
              style={{
                animation: " marquee 8s linear infinite",
              }}
            >
              {site?.dashboard_notification_line}
            </p>
          </div>

          <div className="flex gap-3 w-full justify-between">
            {/* <a
              href="/how-to-play"
              className="backdrop-blur-md px-3 py-1 mt-3 bg-white/30 flex items-center gap-2 text-sm rounded-full hover:bg-gray-700"
            >
              <Play size={15} /> How to Play
            </a> */}

            <a
              href={`/starline`}
              className="mt-3 flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-sm font-semibold hover:border-red-500/40 hover:bg-red-950/20"
            >
              <Star size={18} /> Starline
            </a>

            {/* <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="backdrop-blur-md px-3 py-1 mt-3 bg-white/30 flex items-center gap-2 text-sm rounded-full hover:bg-gray-700"
            >
              <BsWhatsapp /> Whatsapp
            </a> */}
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-sm font-semibold hover:border-red-500/40 hover:bg-red-950/20"
            >
              <BsWhatsapp size={18} /> Whatsapp
            </a>
          </div>
        </div>

        {/* MARKET LIST */}
        <main className="flex-1 px-3 py-3 pb-20">
          {isLoading && (
            <p className="text-center text-cyan-400">Loading markets...</p>
          )}
          {error && (
            <div className="mt-4 rounded-[22px] border border-red-500 bg-red-800/40 p-4 text-center">
              <p className="text-red-300">{error}</p>
            </div>
          )}
          {!isLoading && !error && <MarketList markets={markets} />}
        </main>
      </div>

      {showModal && (
        <NotificationModal
          html={siteData?.notice_board_html}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
