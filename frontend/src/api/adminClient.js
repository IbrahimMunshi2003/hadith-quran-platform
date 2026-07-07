import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const clearAdminToken = () => {};

const adminApi = axios.create({
  baseURL: `${API_URL}/admin`,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Extremely important for sending/receiving httpOnly cookies
});

export const adminLogin = async ({ username, password }) => {
  const { data } = await adminApi.post('/auth/login', { username, password });
  return data;
};

export const adminLogout = async () => {
  const { data } = await adminApi.post('/auth/logout');
  clearAdminToken();
  return data;
};

export const adminGetMe = async () => {
  const { data } = await adminApi.get('/auth/me');
  return data;
};

export const adminChangePassword = async (payload) => {
  const { data } = await adminApi.post('/auth/change-password', payload);
  return data;
};

export const adminChangeUsername = async (payload) => {
  const { data } = await adminApi.post('/auth/change-username', payload);
  return data;
};

export const adminListHadiths = async (params) => {
  const { data } = await adminApi.get('/hadiths', { params });
  return data;
};

export const adminGetHadith = async (id) => {
  const { data } = await adminApi.get(`/hadiths/${id}`);
  return data;
};

export const adminCreateHadith = async (payload) => {
  const { data } = await adminApi.post('/hadiths', payload);
  return data;
};

export const adminUpdateHadith = async ({ id, payload }) => {
  const { data } = await adminApi.put(`/hadiths/${id}`, payload);
  return data;
};

export const adminDeleteHadith = async (id) => {
  const { data } = await adminApi.delete(`/hadiths/${id}`);
  return data;
};

export const adminGetHistory = async (id) => {
  const { data } = await adminApi.get(`/hadiths/${id}/history`);
  return data;
};

export const adminRestoreHistory = async ({ id, historyId }) => {
  const { data } = await adminApi.post(`/hadiths/${id}/history/${historyId}/restore`);
  return data;
};

export const adminBulkAction = async (payload) => {
  const { data } = await adminApi.post('/hadiths/bulk/action', payload);
  return data;
};

export const adminUploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  const { data } = await adminApi.post('/hadiths/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
};
