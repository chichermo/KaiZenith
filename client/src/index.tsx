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

// Tema corporativo financiero profesional
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0d47a1', // Azul corporativo oscuro
      light: '#1565c0',
      dark: '#01579b',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#37474f', // Gris azulado profesional
      light: '#546e7a',
      dark: '#263238',
      contrastText: '#ffffff',
    },
    success: {
      main: '#2e7d32', // Verde financiero
      light: '#4caf50',
      dark: '#1b5e20',
    },
    warning: {
      main: '#f57c00', // Naranja para alertas
      light: '#ff9800',
      dark: '#e65100',
    },
    error: {
      main: '#c62828',
      light: '#ef5350',
      dark: '#b71c1c',
    },
    background: {
      default: '#f5f7fa', // Gris muy claro profesional
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#546e7a',
    },
    divider: '#e0e0e0',
    grey: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica Neue", "Arial", sans-serif',
    h1: {
      fontWeight: 500,
      fontSize: '2rem',
      lineHeight: 1.2,
      letterSpacing: '-0.015em',
      color: '#212121',
    },
    h2: {
      fontWeight: 500,
      fontSize: '1.75rem',
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
      color: '#212121',
    },
    h3: {
      fontWeight: 500,
      fontSize: '1.5rem',
      lineHeight: 1.4,
      letterSpacing: '-0.005em',
      color: '#212121',
    },
    h4: {
      fontWeight: 500,
      fontSize: '1.25rem',
      lineHeight: 1.5,
      color: '#212121',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.125rem',
      lineHeight: 1.5,
      color: '#212121',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: 1.5,
      color: '#212121',
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: '0.938rem',
      lineHeight: 1.5,
      color: '#212121',
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: '#37474f',
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      color: '#546e7a',
    },
    body2: {
      fontSize: '0.813rem',
      lineHeight: 1.6,
      color: '#546e7a',
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
      color: '#78909c',
    },
    overline: {
      fontSize: '0.688rem',
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: '#78909c',
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
          backgroundColor: '#0d47a1',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#01579b',
            boxShadow: 'none',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          borderColor: '#0d47a1',
          color: '#0d47a1',
          '&:hover': {
            borderWidth: '1.5px',
            borderColor: '#01579b',
            backgroundColor: 'rgba(13, 71, 161, 0.04)',
          },
        },
        text: {
          color: '#0d47a1',
          '&:hover': {
            backgroundColor: 'rgba(13, 71, 161, 0.04)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          border: '1px solid #e8eaed',
          boxShadow: '0px 1px 2px rgba(0,0,0,0.08)',
          transition: 'all 0.2s ease',
          backgroundColor: '#ffffff',
          '&:hover': {
            boxShadow: '0px 2px 8px rgba(0,0,0,0.1)',
            borderColor: '#d0d4d9',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          border: '1px solid #e0e0e0',
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
            backgroundColor: '#ffffff',
            transition: 'all 0.2s ease',
            '& fieldset': {
              borderColor: '#d0d4d9',
              borderWidth: '1px',
            },
            '&:hover fieldset': {
              borderColor: '#0d47a1',
              borderWidth: '1px',
            },
            '&.Mui-focused': {
              backgroundColor: '#ffffff',
              '& fieldset': {
                borderColor: '#0d47a1',
                borderWidth: '1.5px',
              },
            },
            '&.Mui-error': {
              '& fieldset': {
                borderColor: '#c62828',
              },
            },
          },
          '& .MuiInputLabel-root': {
            fontSize: '0.875rem',
            color: '#546e7a',
            '&.Mui-focused': {
              color: '#0d47a1',
            },
          },
          '& .MuiInputBase-input': {
            padding: '12px 14px',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 3px rgba(0,0,0,0.12)',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e0e0e0',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid #e0e0e0',
          backgroundColor: '#fafafa',
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
          backgroundColor: '#e1f5fe',
          color: '#0277bd',
          borderColor: '#b3e5fc',
        },
        colorPrimary: {
          backgroundColor: '#e3f2fd',
          color: '#0d47a1',
          borderColor: '#bbdefb',
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
            backgroundColor: '#fafbfc',
            fontWeight: 600,
            color: '#37474f',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            borderBottom: '2px solid #e0e0e0',
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
          borderColor: '#e8eaed',
          padding: '14px 16px',
          fontSize: '0.875rem',
          color: '#212121',
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
              backgroundColor: '#fafbfc',
            },
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.15s ease',
          '&:hover': {
            backgroundColor: '#fafbfc',
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
            backgroundColor: '#e3f2fd',
            color: '#0d47a1',
            '&:hover': {
              backgroundColor: '#bbdefb',
            },
            '& .MuiListItemIcon-root': {
              color: '#0d47a1',
            },
          },
          '&:hover': {
            backgroundColor: '#f5f5f5',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 4,
          border: '1px solid #e8eaed',
          boxShadow: '0px 8px 24px rgba(0,0,0,0.12)',
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
          borderBottom: '1px solid #e8eaed',
          backgroundColor: '#fafbfc',
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
          borderTop: '1px solid #e8eaed',
          backgroundColor: '#fafbfc',
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
            backgroundColor: '#f5f5f5',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#d0d4d9',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#0d47a1',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#0d47a1',
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
