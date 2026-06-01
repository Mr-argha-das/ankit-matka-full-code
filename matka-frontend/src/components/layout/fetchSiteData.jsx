import axios from "axios";
import { API_URL } from "../../config";

export async function fetchSiteData() {
  const token = localStorage.getItem("accessToken") || "";
  const headers = { Authorization: `Bearer ${token}` };

  try {
    const res = await axios.get(`${API_URL}/sitedata/get`, { headers });
    return res.data; // FULL CLEAN SITE DATA OBJECT
  } catch (err) {
    console.error("Site Data Load Error:", err);
    return null;
  }
}
