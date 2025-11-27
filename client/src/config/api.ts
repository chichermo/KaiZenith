// Configuración de la API
// En desarrollo: usa localhost:5000
// En producción: usa la variable de entorno REACT_APP_API_URL

const getApiUrl = (): string => {
  // Prioridad 1: Variable de entorno (para producción)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Prioridad 2: En desarrollo, usar localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000';
  }
  
  // Prioridad 3: En producción sin variable de entorno, intentar detectar automáticamente
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Si no es localhost, estamos en producción
    if (!hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
      // Para Vercel o producción, el backend debería estar en un subdominio o dominio separado
      // Por ejemplo: api.tudominio.com o backend.tudominio.com
      // O en el mismo dominio pero en un path diferente: tudominio.com/api
      
      // Opción 1: Si el backend está en el mismo dominio (típico en Vercel con serverless functions)
      // No funciona porque el backend está en otro servidor
      
      // Opción 2: Asumir que el backend está en un subdominio
      // Por ejemplo: si frontend es kai-zenith.vercel.app, backend podría ser api-kai-zenith.vercel.app
      // O mejor: usar una variable de entorno
      
      // Por ahora, retornar un error claro para que se configure la variable de entorno
      console.error('⚠️ REACT_APP_API_URL no está configurada. Por favor, configura la URL del backend en las variables de entorno de Vercel.');
      return 'http://localhost:5000'; // Fallback temporal
    }
  }
  
  // Último fallback
  return 'http://localhost:5000';
};

export const API_BASE_URL = getApiUrl();
export const API_URL = `${API_BASE_URL}/api`;

console.log('API URL configurada:', API_URL);

