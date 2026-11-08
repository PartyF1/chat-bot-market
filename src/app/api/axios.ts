import axios from "axios";
import {
  getAuthToken,
  deleteCookie,
  AUTH_COOKIE_NAME,
} from "@shared/utils/cookie";
import { resolveApiUrl } from "@shared/config/apiUrl";

const API_URL = resolveApiUrl();

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      deleteCookie(AUTH_COOKIE_NAME);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
