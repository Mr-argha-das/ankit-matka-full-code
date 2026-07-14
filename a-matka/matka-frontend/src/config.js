const resolveApiUrl = () => {
  const configured = import.meta.env.VITE_API_URL;
  if (configured) return configured;

  return "https://api.natraj777.com";
};

export const API_URL = resolveApiUrl();
export const SUPPORT_PHONE = "918585918780";
export const normalizePhoneNumber = (value, fallback = SUPPORT_PHONE) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return fallback;
  return digits.length === 10 ? `91${digits}` : digits;
};

export const getWhatsAppUrl = (phone, message = "") => {
  const number = normalizePhoneNumber(phone);
  const text = message ? `&text=${encodeURIComponent(message)}` : "";
  return `https://api.whatsapp.com/send?phone=${number}${text}`;
};

export const openWhatsApp = (phone, message = "") => {
  const number = normalizePhoneNumber(phone);
  const text = message ? `&text=${encodeURIComponent(message)}` : "";
  const fallbackUrl = getWhatsAppUrl(number, message);
  const isAndroid = /Android/i.test(navigator.userAgent);

  if (isAndroid) {
    const intentUrl =
      `intent://send?phone=${number}${text}` +
      `#Intent;scheme=whatsapp;package=com.whatsapp;` +
      `S.browser_fallback_url=${encodeURIComponent(fallbackUrl)};end`;
    window.location.href = intentUrl;

    window.setTimeout(() => {
      window.location.href = fallbackUrl;
    }, 1200);
    return;
  }

  window.location.href = fallbackUrl;
};
// export const API_URL = "http://187.77.185.244:8000";

// export const API_URL = "https://qbwm3635-8000.inc1.devtunnels.ms";
export const EditerApiKey = "w41ovit7rts7dxeyna4n849z8cm8rj95jmerec2b4iuapro7";
// export const API_URL = "https://api.natraj777.com";
