import React, { useEffect, useState } from "react";
import logo from "../assets/logo.png";
export default function SplashScreen() {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setFadeOut(true), 1500); // start fade
    const timer2 = setTimeout(() => {
      const elem = document.getElementById("splash-screen");
      if (elem) elem.style.display = "none";
    }, 2200); // hide completely

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div
      id="splash-screen"
      className={`fixed inset-0 flex items-center justify-center bg-black transition-opacity duration-700 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      style={{ zIndex: 9999 }}
    >
      <img src={logo} alt="Splash Logo" className="w-32 h-32" />
    </div>
  );
}
