import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
// Fuente Roboto ya viene con Material-UI, más profesional para aplicaciones financieras
import App from './App';

// Crear cliente de React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Tema moderno inspirado en Bootstrap Super Admin
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#5e72e4', // Azul moderno vibrante
      light: '#7889e8',
      dark: '#4c63d2',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#8898aa', // Gris azulado moderno
      light: '#a8b5c1',
      dark: '#6b7a8a',
      contrastText: '#ffffff',
    },
    success: {
      main: '#2dce89', // Verde moderno
      light: '#56d9a3',
      dark: '#1aae6e',
    },
    warning: {
      main: '#fb6340', // Naranja moderno
      light: '#fc8266',
      dark: '#e04a2a',
    },
    error: {
      main: '#f5365c', // Rojo moderno
      light: '#f75d7d',
      dark: '#d91e44',
    },
    info: {
      main: '#11cdef', // Cyan moderno
      light: '#3dd5f3',
      dark: '#0da5c0',
    },
    background: {
      default: '#172b4d', // Fondo oscuro como el menú
      paper: '#1a2742',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
    divider: '#e9ecef',
    grey: {
      50: '#f8f9fa',
      100: '#e9ecef',
      200: '#dee2e6',
      300: '#ced4da',
      400: '#adb5bd',
      500: '#8898aa',
      600: '#6b7a8a',
      700: '#525f7f',
      800: '#32325d',
      900: '#212529',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica Neue", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.2,
      letterSpacing: '-0.015em',
      color: '#32325d',
    },
    h2: {
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
      color: '#32325d',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
      letterSpacing: '-0.005em',
      color: '#32325d',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.5,
      color: '#32325d',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.5,
      color: '#32325d',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.5,
      color: '#32325d',
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: '0.938rem',
      lineHeight: 1.5,
      color: '#32325d',
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: '#525f7f',
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      color: '#525f7f',
    },
    body2: {
      fontSize: '0.813rem',
      lineHeight: 1.6,
      color: '#525f7f',
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
      letterSpacing: '0.01em',
      fontSize: '0.875rem',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
      color: '#8898aa',
    },
    overline: {
      fontSize: '0.688rem',
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: '#8898aa',
    },
  },
  shape: {
    borderRadius: 4, // Bordes más cuadrados, estilo corporativo
  },
  shadows: [
    'none',
    '0px 1px 3px rgba(0,0,0,0.12), 0px 1px 2px rgba(0,0,0,0.24)',
    '0px 2px 4px rgba(0,0,0,0.12), 0px 1px 3px rgba(0,0,0,0.20)',
    '0px 3px 6px rgba(0,0,0,0.16), 0px 2px 4px rgba(0,0,0,0.23)',
    '0px 4px 8px rgba(0,0,0,0.16), 0px 2px 5px rgba(0,0,0,0.22)',
    '0px 5px 10px rgba(0,0,0,0.16), 0px 3px 6px rgba(0,0,0,0.23)',
    '0px 6px 12px rgba(0,0,0,0.16), 0px 3px 7px rgba(0,0,0,0.23)',
    '0px 7px 14px rgba(0,0,0,0.16), 0px 4px 8px rgba(0,0,0,0.23)',
    '0px 8px 16px rgba(0,0,0,0.16), 0px 4px 9px rgba(0,0,0,0.23)',
    '0px 9px 18px rgba(0,0,0,0.16), 0px 5px 10px rgba(0,0,0,0.22)',
    '0px 10px 20px rgba(0,0,0,0.16), 0px 5px 11px rgba(0,0,0,0.22)',
    '0px 11px 22px rgba(0,0,0,0.16), 0px 6px 12px rgba(0,0,0,0.22)',
    '0px 12px 24px rgba(0,0,0,0.16), 0px 6px 13px rgba(0,0,0,0.22)',
    '0px 13px 26px rgba(0,0,0,0.16), 0px 7px 14px rgba(0,0,0,0.22)',
    '0px 14px 28px rgba(0,0,0,0.16), 0px 7px 15px rgba(0,0,0,0.22)',
    '0px 15px 30px rgba(0,0,0,0.16), 0px 8px 16px rgba(0,0,0,0.22)',
    '0px 16px 32px rgba(0,0,0,0.16), 0px 8px 17px rgba(0,0,0,0.22)',
    '0px 17px 34px rgba(0,0,0,0.16), 0px 9px 18px rgba(0,0,0,0.22)',
    '0px 18px 36px rgba(0,0,0,0.16), 0px 9px 19px rgba(0,0,0,0.22)',
    '0px 19px 38px rgba(0,0,0,0.16), 0px 10px 20px rgba(0,0,0,0.22)',
    '0px 20px 40px rgba(0,0,0,0.16), 0px 10px 21px rgba(0,0,0,0.22)',
    '0px 21px 42px rgba(0,0,0,0.16), 0px 11px 22px rgba(0,0,0,0.22)',
    '0px 22px 44px rgba(0,0,0,0.16), 0px 11px 23px rgba(0,0,0,0.22)',
    '0px 23px 46px rgba(0,0,0,0.16), 0px 12px 24px rgba(0,0,0,0.22)',
    '0px 24px 48px rgba(0,0,0,0.16), 0px 12px 25px rgba(0,0,0,0.22)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 4,
          padding: '8px 20px',
          fontWeight: 500,
          fontSize: '0.875rem',
          boxShadow: 'none',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: 'none',
          },
          '&.Mui-disabled': {
            opacity: 0.5,
          },
        },
        contained: {
          backgroundColor: '#5e72e4',
          color: '#ffffff',
          background: 'linear-gradient(87deg, #5e72e4 0, #825ee4 100%)',
          '&:hover': {
            background: 'linear-gradient(87deg, #4c63d2 0, #6d4cd2 100%)',
            boxShadow: '0 7px 14px rgba(94, 114, 228, 0.4)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          borderColor: '#5e72e4',
          color: '#5e72e4',
          '&:hover': {
            borderWidth: '1.5px',
            borderColor: '#4c63d2',
            backgroundColor: 'rgba(94, 114, 228, 0.08)',
          },
        },
        text: {
          color: '#5e72e4',
          '&:hover': {
            backgroundColor: 'rgba(94, 114, 228, 0.08)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: 'none',
          boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          backgroundColor: '#1a2742',
          background: 'linear-gradient(135deg, #1a2742 0%, #172b4d 100%)',
          overflow: 'hidden',
          position: 'relative',
          '&:hover': {
            boxShadow: '0 1rem 2rem rgba(94, 114, 228, 0.5)',
            transform: 'translateY(-4px)',
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(87deg, #5e72e4 0, #825ee4 100%)',
            opacity: 1,
            transition: 'opacity 0.3s ease',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          border: 'none',
          backgroundColor: '#1a2742',
          background: 'linear-gradient(135deg, #1a2742 0%, #172b4d 100%)',
        },
        elevation0: {
          boxShadow: 'none',
        },
        elevation1: {
          boxShadow: '0px 1px 3px rgba(0,0,0,0.12), 0px 1px 2px rgba(0,0,0,0.24)',
        },
        elevation2: {
          boxShadow: '0px 2px 4px rgba(0,0,0,0.12), 0px 1px 3px rgba(0,0,0,0.20)',
        },
        elevation3: {
          boxShadow: '0px 3px 6px rgba(0,0,0,0.16), 0px 2px 4px rgba(0,0,0,0.23)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 4,
            fontSize: '0.875rem',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            transition: 'all 0.2s ease',
            color: 'rgba(255, 255, 255, 0.9)',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
              borderWidth: '1px',
            },
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              '& fieldset': {
                borderColor: '#5e72e4',
                borderWidth: '1px',
              },
            },
            '&.Mui-focused': {
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              '& fieldset': {
                borderColor: '#5e72e4',
                borderWidth: '1.5px',
              },
            },
            '&.Mui-error': {
              '& fieldset': {
                borderColor: '#f5365c',
              },
            },
          },
          '& .MuiInputLabel-root': {
            fontSize: '0.875rem',
            color: 'rgba(255, 255, 255, 0.7)',
            '&.Mui-focused': {
              color: '#5e72e4',
            },
          },
          '& .MuiInputBase-input': {
            padding: '12px 14px',
            color: 'rgba(255, 255, 255, 0.9)',
            '&::placeholder': {
              color: 'rgba(255, 255, 255, 0.5)',
              opacity: 1,
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e9ecef',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid #e9ecef',
          backgroundColor: '#172b4d',
          background: 'linear-gradient(180deg, #172b4d 0%, #1a2742 100%)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontWeight: 500,
          height: 24,
          fontSize: '0.75rem',
          border: '1px solid transparent',
        },
        colorSuccess: {
          backgroundColor: '#e8f5e9',
          color: '#2e7d32',
          borderColor: '#c8e6c9',
        },
        colorWarning: {
          backgroundColor: '#fff3e0',
          color: '#f57c00',
          borderColor: '#ffe0b2',
        },
        colorError: {
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderColor: '#ffcdd2',
        },
        colorInfo: {
          backgroundColor: '#d1ecf1',
          color: '#11cdef',
          borderColor: '#bee5eb',
        },
        colorPrimary: {
          backgroundColor: '#e7edff',
          color: '#5e72e4',
          borderColor: '#d1d9ff',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
          minHeight: 48,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
            padding: '14px 16px',
            whiteSpace: 'nowrap',
            '@media (max-width:600px)': {
              fontSize: '0.688rem',
              padding: '10px 12px',
              whiteSpace: 'normal',
            },
            '@media (min-width:600px) and (max-width:960px)': {
              padding: '12px 14px',
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
          padding: '14px 16px',
          fontSize: '0.875rem',
          color: 'rgba(255, 255, 255, 0.9)',
          '@media (max-width:600px)': {
            padding: '10px 12px',
            fontSize: '0.813rem',
            wordBreak: 'break-word',
          },
          '@media (min-width:600px) and (max-width:960px)': {
            padding: '12px 14px',
          },
          '&.MuiTableCell-body': {
            '&:hover': {
              background: 'linear-gradient(135deg, rgba(94, 114, 228, 0.2) 0%, rgba(130, 94, 228, 0.2) 100%)',
            },
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'all 0.15s ease',
          '&:hover': {
            background: 'linear-gradient(135deg, rgba(94, 114, 228, 0.15) 0%, rgba(130, 94, 228, 0.15) 100%)',
          },
          '&:last-child td': {
            borderBottom: 'none',
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          '&::-webkit-scrollbar': {
            height: '8px',
            '@media (max-width:600px)': {
              height: '4px',
            },
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          margin: '2px 8px',
          padding: '8px 12px',
          minHeight: 40,
          '&.Mui-selected': {
            background: 'linear-gradient(87deg, #5e72e4 0, #825ee4 100%)',
            color: '#ffffff',
            '&:hover': {
              background: 'linear-gradient(87deg, #4c63d2 0, #6d4cd2 100%)',
            },
            '& .MuiListItemIcon-root': {
              color: '#ffffff',
            },
          },
          '&:hover': {
            background: 'linear-gradient(135deg, rgba(94, 114, 228, 0.15) 0%, rgba(130, 94, 228, 0.15) 100%)',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 4,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'linear-gradient(135deg, #1a2742 0%, #172b4d 100%)',
          boxShadow: '0px 8px 24px rgba(0,0,0,0.5)',
          margin: '32px',
          maxWidth: '600px',
          maxHeight: 'calc(100% - 64px)',
          '@media (max-width:600px)': {
            margin: '16px',
            maxWidth: 'calc(100% - 32px)',
            maxHeight: 'calc(100% - 32px)',
          },
        },
        paperWidthSm: {
          maxWidth: '600px',
          '@media (max-width:600px)': {
            maxWidth: 'calc(100% - 32px)',
          },
        },
        paperWidthMd: {
          maxWidth: '900px',
          '@media (max-width:600px)': {
            maxWidth: 'calc(100% - 32px)',
          },
        },
        paperWidthLg: {
          maxWidth: '1200px',
          '@media (max-width:600px)': {
            maxWidth: 'calc(100% - 32px)',
          },
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: '#1a2742',
          background: 'linear-gradient(135deg, #1a2742 0%, #172b4d 100%)',
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: '1.125rem',
          '@media (max-width:600px)': {
            padding: '16px 20px',
            fontSize: '1rem',
          },
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '24px',
          overflowY: 'auto',
          backgroundColor: '#1a2742',
          background: 'linear-gradient(135deg, #1a2742 0%, #172b4d 100%)',
          color: 'rgba(255, 255, 255, 0.9)',
          '@media (max-width:600px)': {
            padding: '16px 20px',
          },
          '@media (min-width:600px) and (max-width:960px)': {
            padding: '20px',
          },
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: '#1a2742',
          background: 'linear-gradient(135deg, #1a2742 0%, #172b4d 100%)',
          gap: '8px',
          flexWrap: 'nowrap',
          '@media (max-width:600px)': {
            padding: '12px 16px',
            flexWrap: 'wrap',
            '& > button': {
              flex: '1 1 auto',
              minWidth: 'calc(50% - 4px)',
            },
          },
          '@media (min-width:600px) and (max-width:960px)': {
            padding: '16px 20px',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          padding: '8px',
          transition: 'all 0.2s ease',
          '&:hover': {
            background: 'linear-gradient(135deg, rgba(94, 114, 228, 0.2) 0%, rgba(130, 94, 228, 0.2) 100%)',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#dee2e6',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#5e72e4',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#5e72e4',
            borderWidth: '1.5px',
          },
        },
      },
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
