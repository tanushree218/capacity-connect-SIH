import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

if (!BACKEND_URL) {
  throw new Error("REACT_APP_BACKEND_URL must be configured before the app can load.");
}

export const API = `${BACKEND_URL.replace(/\/$/, "")}/api`;

const client = axios.create({ baseURL: API });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("cc_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
