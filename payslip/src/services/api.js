import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/";

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export const getCompanyProfile = () => api.get("company/");

export const registerUser = (data) => api.post("auth/register/", data);
export const loginUser = (data) => api.post("auth/login/", data);
export const logoutUser = () => api.post("auth/logout/");
export const getCurrentUser = () => api.get("auth/user/");

export const getPayslips = () => api.get("payslips/");
export const createPayslip = (data) => api.post("payslips/", data);
export const updatePayslip = (id, data) => api.put(`payslips/${id}/`, data);
export const deletePayslip = (id) => api.delete(`payslips/${id}/`);

export const downloadPDF = async (id) => {
  const response = await api.get(`payslips/${id}/pdf/`, { responseType: "blob" });
  const file = new Blob([response.data], { type: "application/pdf" });
  const fileURL = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = fileURL;
  link.download = `payslip_${id}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(fileURL);
};

export default api;
