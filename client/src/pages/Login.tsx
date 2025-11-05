import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Alert,
  Container,
  Paper,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#f5f7fa',
      }}
    >
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Paper
            elevation={1}
            sx={{
              padding: { xs: 3, sm: 4 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              borderRadius: 1,
              border: '1px solid #e0e0e0',
              backgroundColor: '#ffffff',
            }}
          >
            <Box
              component="img"
              src="/Logo.jpg"
              alt="KaiZenith Spa Logo"
              sx={{
                height: 64,
                width: 'auto',
                maxWidth: '70%',
                objectFit: 'contain',
                mb: 2.5,
              }}
            />
            <Typography 
              component="h1" 
              variant="h5" 
              sx={{ 
                mb: 0.5, 
                fontWeight: 500,
                color: '#212121',
              }}
            >
              KaiZenith Spa
            </Typography>
            <Typography 
              component="h2" 
              variant="body2" 
              sx={{ 
                mb: 3, 
                color: '#546e7a',
                fontSize: '0.813rem',
              }}
            >
              Sistema ERP Financiero
            </Typography>

            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  width: '100%', 
                  mb: 2.5,
                  borderRadius: 1,
                  fontSize: '0.813rem',
                }}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Correo Electrónico"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                sx={{
                  mb: 2,
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Contraseña"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                sx={{
                  mb: 3,
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ 
                  mb: 2, 
                  py: 1.25,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  backgroundColor: '#0d47a1',
                  '&:hover': {
                    backgroundColor: '#01579b',
                  },
                }}
                disabled={loading}
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </Box>

            <Box sx={{ mt: 3, textAlign: 'center', width: '100%' }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block', fontSize: '0.75rem' }}>
                Credenciales de prueba
              </Typography>
              <Box 
                sx={{ 
                  backgroundColor: '#fafafa',
                  borderRadius: 1,
                  p: 1.5,
                  border: '1px solid #e0e0e0',
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', fontSize: '0.75rem' }}>
                  <strong>Email:</strong> admin@patolin.cl
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  <strong>Contraseña:</strong> password
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;
