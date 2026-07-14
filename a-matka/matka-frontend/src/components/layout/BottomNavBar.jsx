import React from "react";
import {
  Home,
  TrendingUp,
  CalendarDays,
  DollarSign,
  Send,
  User,
} from "lucide-react";
import { IoHammerOutline } from "react-icons/io5";
import { FaBook } from "react-icons/fa";
import { IoMdBook } from "react-icons/io";
import { MdOutlineCurrencyRupee } from "react-icons/md";

export default function BottomNavBar() {
  return (
    <div className="fixed -bottom-3 left-0 z-40 flex w-full items-center justify-center">
      <div className="relative flex w-[100%] max-w-md items-center justify-between overflow-hidden rounded-t-[30px] border border-red-500/20 bg-[#080101]/95 text-gray-400 shadow-[0_-18px_45px_rgba(0,0,0,0.48)] backdrop-blur-3xl">
        {/* Left icons */}
        <div className="mr-18 mt-1 flex w-full items-center space-x-8 rounded-tl-[26px] rounded-tr-[34px] bg-[#1e1111] p-3">
          <a href="/bid-history" className="w-full min-w-11 text-center hover:text-red-200">
            <IoHammerOutline
              size={22}
              className="w-full cursor-pointer transition"
            />
            <span className="text-xs"> My Bids</span>
          </a>

          <a href="/passbook" className="w-full text-center hover:text-red-200">
            <IoMdBook
              size={24}
              className="w-full cursor-pointer transition"
            />
            <span className="text-xs"> Passbook</span>
          </a>
        </div>

        {/* Floating Home Button */}

        <span className="absolute top-0 left-1/2 h-19 w-18 -translate-x-1/2 transform rounded-t-full bg-[#1e1111]"></span>
        <span className="absolute -top-10 left-1/2 h-19 w-18 -translate-x-1/2 transform rounded-full bg-[#080101]"></span>

        {/* Right icons */}
        <div className="-ml-[14px] mt-1 grid w-full grid-cols-2 items-center space-x-8 rounded-tl-[34px] rounded-tr-[26px] bg-[#1e1111] p-3">
          <a href="/withdrawal-request" className="w-full text-center hover:text-red-200">
            <MdOutlineCurrencyRupee
              size={24}
              className="w-full cursor-pointer transition"
            />
            <span className="text-xs"> Withdrawal</span>
          </a>
          <a href="/profile" className="w-full text-center hover:text-red-200">
            <User
              size={22}
              className="w-full cursor-pointer transition"
            />
            <span className="text-xs"> Profile</span>
          </a>
        </div>
      </div>
      <a
        href="/"
        className="absolute -top-6 left-1/2 -translate-x-1/2 transform"
      >
        <div className="cursor-pointer rounded-full bg-gradient-to-b from-[#ff1d16] to-[#bd0000] p-4 shadow-[0_10px_30px_rgba(242,10,10,0.38)] transition hover:scale-105">
          <Home size={22} className="text-white" />
        </div>
      </a>
    </div>
  );
}
