import React, { useState } from "react";
import SidebarMenu from "./SidebarMenu";
import { Menu, Wallet, Wallet2Icon } from "lucide-react";
import { Outlet } from "react-router-dom";
import BottomNavBar from "./BottomNavBar";
import AppHeader from "./AppHeader";

export default function Layout() {
  const [sidebar, setSidebar] = useState(false);

  return (
    <div className=" min-h-screen  overflow-y-auto relative">
      <AppHeader setSidebar={setSidebar} />

      <main className="flex-1 overflow-yauto h-[calc(100vh-100px)] ">
        <Outlet />
      </main>
      <BottomNavBar />
      <SidebarMenu sidebar={sidebar} setSidebar={setSidebar} />
    </div>
  );
}
