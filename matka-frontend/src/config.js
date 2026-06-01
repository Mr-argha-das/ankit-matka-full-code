const resolveApiUrl = () => {
  const configured = import.meta.env.VITE_API_URL;
  if (configured) return configured;

  const { hostname } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://127.0.0.1:8000";
  }

  if (hostname === "10.0.2.2") {
    return "http://10.0.2.2:8000";
  }

  return "https://api.natraj777.com";
};

export const API_URL = resolveApiUrl();
// export const API_URL = "http://187.77.185.244:8000";

// export const API_URL = "https://qbwm3635-8000.inc1.devtunnels.ms";
export const EditerApiKey = "w41ovit7rts7dxeyna4n849z8cm8rj95jmerec2b4iuapro7";
// export const API_URL = "https://api.natraj777.com";
