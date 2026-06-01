import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import SplashScreen from "./pages/SplashScreen.jsx";

const root = document.getElementById("root");

// Wrapper component for Splash + App
function RootApp() {
  const [showSplash, setShowSplash] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const alreadyShown = localStorage.getItem("splashSeen");

    if (!alreadyShown) {
      // show splash only first time
      setShowSplash(true);

      setTimeout(() => {
        localStorage.setItem("splashSeen", "yes");
        setShowSplash(false);
        setReady(true);
      }, 2000);
    } else {
      // skip splash
      setReady(true);
    }
  }, []);

  return (
    <>
      {showSplash && <SplashScreen />}

      {ready && (
        <BrowserRouter>
          <App />
        </BrowserRouter>
      )}
    </>
  );
}

createRoot(root).render(
  <StrictMode>
    <RootApp />
  </StrictMode>
);
