import axios from "axios";
import { API_URL } from "../../config";

export const getUserById = async (userId) => {
  const token = localStorage.getItem("accessToken");

  try {
    const response = await axios.get(`${API_URL}/user/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(response)

    // return ONLY backend JSON
    return { data: response.data, error: null };
  } catch (err) {
    return {
      data: null,
      error: err,
    };
  }
};
