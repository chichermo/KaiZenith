// Utilidad para hacer peticiones fetch con la URL correcta del API
import { API_URL } from '../config/api';

/**
 * Obtiene la URL completa del endpoint del API
 */
export const getApiEndpoint = (endpoint: string): string => {
  // Si el endpoint ya incluye http:// o https://, devolverlo tal cual
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  
  // Si el endpoint ya incluye /api, solo agregar la base URL
  if (endpoint.startsWith('/api')) {
    return `${API_URL.replace('/api', '')}${endpoint}`;
  }
  
  // Si el endpoint no incluye /api, agregarlo
  if (!endpoint.startsWith('/')) {
    endpoint = '/' + endpoint;
  }
  
  return `${API_URL}${endpoint}`;
};

/**
 * Helper para hacer peticiones fetch con autenticación
 */
export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = getApiEndpoint(endpoint);
  
  // Obtener token del localStorage o usar token temporal
  const token = localStorage.getItem('token') || 'test-token-temporary';
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };
  
  return fetch(url, {
    ...options,
    headers,
  });
};

