// src/components/shared/useBackoffFetch.js

export const fetchWithBackoff = async (url, options, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((res) => setTimeout(res, Math.pow(2, i) * 1000));
    }
  }
};
