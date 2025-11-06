import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

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
axios.defaults.baseURL = 'http://localhost:5000/api';

// Interceptor para agregar el token a las peticiones
axios.interceptors.request.use((config) => {
  // Usar token temporal para pruebas cuando el login está desactivado
  const token = localStorage.getItem('token') || 'test-token-temporary';
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de autenticación (DESACTIVADO TEMPORALMENTE)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
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
