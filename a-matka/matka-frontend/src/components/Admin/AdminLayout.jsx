import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import useMediaQuery from "../../hooks/useMediaQuery";

export default function AdminLayout() {
  // ✔ Sidebar default controlled by screen size
  const isLargeScreen = useMediaQuery("(min-width: 768px)");
  const [sidebarOpen, setSidebarOpen] = useState(isLargeScreen);

  // ✔ Auto update sidebar when screen size changes
  useEffect(() => {
    setSidebarOpen(isLargeScreen);
  }, [isLargeScreen]);

  return (
    <div className="min-h-screen relative">
      <Header setSidebarOpen={setSidebarOpen} />

      <Sidebar open={sidebarOpen} />

      {/* Main Content */}
      <main
        className={`flex-1 pt-15 overflow-y-auto transition-all duration-300 ${
          sidebarOpen ? "lg:ml-64 md:ml-64 ml-0" : "ml-0"
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
}
