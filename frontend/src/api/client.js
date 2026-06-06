import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

// Axios instance configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api', // Vite proxy will map this to http://localhost:5000/api in dev. Use VITE_API_URL for production.
  headers: {
    'Content-Type': 'application/json',
  },
});

// API Calls
export const getStats = async () => {
  const { data } = await api.get('/stats');
  return data;
};

export const getSearch = async ({ q, collection, grade, page = 1, limit = 20 }) => {
  const { data } = await api.get('/search', {
    params: { q, collection, grade, page, limit }
  });
  return data;
};

export const getCollections = async () => {
  const { data } = await api.get('/collections');
  return data;
};

export const getCollectionDetail = async ({ slug, book, chapter, grade, narrator, page = 1, limit = 20 }) => {
  const { data } = await api.get(`/collections/${slug}`, {
    params: { book, chapter, grade, narrator, page, limit }
  });
  return data;
};

export const getHadithDetail = async ({ collection, number }) => {
  const { data } = await api.get(`/hadith/${collection}/${number}`);
  return data;
};

export const getRelatedHadiths = async (id) => {
  const { data } = await api.get(`/hadith/related/${id}`);
  return data;
};

export const getNarrators = async ({ page = 1, limit = 50, search = '' }) => {
  const { data } = await api.get('/narrators', {
    params: { page, limit, search }
  });
  return data;
};

export const getNarratorDetail = async ({ name, page = 1, limit = 20 }) => {
  const { data } = await api.get(`/narrators/${encodeURIComponent(name)}`, {
    params: { page, limit }
  });
  return data;
};

// React Query Hooks
export const useStats = () => {
  return useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

export const useHadithSearch = (params) => {
  return useQuery({
    queryKey: ['search', params],
    queryFn: () => getSearch(params),
    placeholderData: (previousData) => previousData, // Smooth pagination transitions
    enabled: true,
  });
};

export const useCollections = () => {
  return useQuery({
    queryKey: ['collections'],
    queryFn: getCollections,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });
};

export const useCollectionDetail = (params) => {
  return useQuery({
    queryKey: ['collection', params.slug, params],
    queryFn: () => getCollectionDetail(params),
    placeholderData: (previousData) => previousData,
    enabled: !!params.slug,
  });
};

export const useHadithDetail = ({ collection, number }) => {
  return useQuery({
    queryKey: ['hadith', collection, number],
    queryFn: () => getHadithDetail({ collection, number }),
    enabled: !!collection && !!number,
  });
};

export const useRelatedHadiths = (id) => {
  return useQuery({
    queryKey: ['related', id],
    queryFn: () => getRelatedHadiths(id),
    enabled: !!id,
  });
};

export const useNarratorsList = (params) => {
  return useQuery({
    queryKey: ['narrators', params],
    queryFn: () => getNarrators(params),
    placeholderData: (previousData) => previousData,
  });
};

export const useNarratorDetail = (params) => {
  return useQuery({
    queryKey: ['narrator', params.name, params],
    queryFn: () => getNarratorDetail(params),
    placeholderData: (previousData) => previousData,
    enabled: !!params.name,
  });
};
