import axios from "axios";
import { API_URL } from "../../../config";

// src/api.js
const API_BASE_URL = `${API_URL}/market`;

export const getAllMarkets = async () => {
  const response = await axios.get(API_BASE_URL);
  console.log(response);
  if (!response.ok) {
    throw new Error("Failed to fetch markets");
  }
  const data = await response.json();
  return data.markets;
};

export const getMarketById = async (marketId) => {
  const response = await fetch(`${API_BASE_URL}/${marketId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch market");
  }
  return response.json();
};

export const createMarket = async (marketData) => {
  const params = new URLSearchParams(marketData).toString();
  const response = await fetch(`${API_BASE_URL}/create?${params}`, {
    method: "POST",
  });
  if (!response.ok) {
    // You might want to get more detailed error from the response body
    const errorText = await response.json();
    throw new Error(errorText.detail || "Failed to create market");
  }
  return response.json();
};

export const updateMarket = async (marketId, marketData) => {
  const params = new URLSearchParams(marketData).toString();
  const response = await fetch(`${API_BASE_URL}/update/${marketId}?${params}`, {
    method: "PUT",
  });
  if (!response.ok) {
    const errorText = await response.json();
    throw new Error(errorText.detail || "Failed to update market");
  }
  return response.json();
};

export const deleteMarket = async (marketId) => {
  const response = await fetch(`${API_BASE_URL}/delete/${marketId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const errorText = await response.json();
    throw new Error(errorText.detail || "Failed to delete market");
  }
  return response.json();
};
