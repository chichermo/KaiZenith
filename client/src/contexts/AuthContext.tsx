import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'accountant';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configurar axios para incluir el token en todas las peticiones
axios.defaults.baseURL = API_URL;

// Interceptor para agregar el token a las peticiones
// Usar un flag para evitar registrar múltiples interceptores
if (!(axios.interceptors.request as any).__tokenInterceptorRegistered) {
  axios.interceptors.request.use((config) => {
    // LOGIN DESACTIVADO: Siempre usar token temporal, ignorar localStorage
    const token = 'test-token-temporary';
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  (axios.interceptors.request as any).__tokenInterceptorRegistered = true;
}

// Interceptor para manejar errores de autenticación (DESACTIVADO TEMPORALMENTE)
// También suprime errores 404 para endpoints que pueden no estar disponibles aún
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Suprimir errores 404 para endpoints que pueden no estar disponibles aún
    if (error.response?.status === 404) {
      const url = error.config?.url || '';
      // Endpoints que pueden no estar disponibles y no deben mostrar error en consola
      const silent404Endpoints = ['/inventory/movements'];
      if (silent404Endpoints.some(endpoint => url.includes(endpoint))) {
        // Retornar una respuesta simulada para que el código maneje el 404 silenciosamente
        return Promise.resolve({
          data: { success: false, data: [] },
          status: 404,
          statusText: 'Not Found',
          headers: {},
          config: error.config
        });
      }
    }
    
    // Login desactivado temporalmente - no redirigir al login
    // if (error.response?.status === 401 || error.response?.status === 403) {
    //   localStorage.removeItem('token');
    //   localStorage.removeItem('user');
    //   if (window.location.pathname !== '/login') {
    //     window.location.href = '/login';
    //   }
    // }
    return Promise.reject(error);
  }
);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // LOGIN DESACTIVADO TEMPORALMENTE - Usuario de prueba automático
    // Limpiar tokens antiguos del localStorage para evitar conflictos
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    const defaultUser: User = {
      id: 1,
      email: 'admin@patolin.cl',
      name: 'Usuario Administrador',
      role: 'admin',
    };
    
    // Establecer usuario por defecto automáticamente
    setUser(defaultUser);
    setToken('test-token-temporary');
    setLoading(false);
    
    // Código original comentado para reactivar más tarde:
    // const storedToken = localStorage.getItem('token');
    // const userData = localStorage.getItem('user');
    // 
    // if (storedToken && userData) {
    //   try {
    //     const parsedUser = JSON.parse(userData);
    //     setUser(parsedUser);
    //     setToken(storedToken);
    //   } catch (error) {
    //     localStorage.removeItem('token');
    //     localStorage.removeItem('user');
    //   }
    // }
    // setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data.data;
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setToken(newToken);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Error al iniciar sesión');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
