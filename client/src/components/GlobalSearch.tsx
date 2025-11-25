import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Chip,
  InputAdornment,
  IconButton,
  Popper,
  ClickAwayListener,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  Description as DescriptionIcon,
  Store as StoreIcon,
  ShoppingCart as ShoppingCartIcon,
  AccountBalance as AccountBalanceIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface SearchResult {
  type: 'client' | 'invoice' | 'quotation' | 'supplier' | 'purchase_order' | 'purchase_invoice' | 'account';
  id: number;
  title: string;
  subtitle: string;
  path: string;
  icon: React.ReactNode;
}

const GlobalSearch: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.length >= 2) {
      performSearch(query);
    } else {
      setResults([]);
    }
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      const searchResults: SearchResult[] = [];

      // Buscar clientes
      try {
        const clientsRes = await axios.get(`/clients?limit=10`);
        const clients = clientsRes.data.data || [];
        clients
          .filter((c: any) =>
            c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.rut?.includes(searchQuery) ||
            c.email?.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 3)
          .forEach((client: any) => {
            searchResults.push({
              type: 'client',
              id: client.id,
              title: client.name,
              subtitle: `RUT: ${client.rut} | ${client.email || ''}`,
              path: `/clients`,
              icon: <PeopleIcon />,
            });
          });
      } catch (error) {
        // Silenciar errores
      }

      // Buscar facturas
      try {
        const invoicesRes = await axios.get(`/invoices?limit=10`);
        const invoices = invoicesRes.data.data || [];
        invoices
          .filter(
            (i: any) =>
              i.invoice_number?.includes(searchQuery) ||
              i.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 3)
          .forEach((invoice: any) => {
            searchResults.push({
              type: 'invoice',
              id: invoice.id,
              title: `Factura ${invoice.invoice_number}`,
              subtitle: `${invoice.client_name} - $${invoice.total?.toLocaleString('es-CL') || 0}`,
              path: `/invoices`,
              icon: <ReceiptIcon />,
            });
          });
      } catch (error) {
        // Silenciar errores
      }

      // Buscar cotizaciones
      try {
        const quotationsRes = await axios.get(`/quotations?limit=10`);
        const quotations = quotationsRes.data.data || [];
        quotations
          .filter(
            (q: any) =>
              q.quotation_number?.includes(searchQuery) ||
              q.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 3)
          .forEach((quotation: any) => {
            searchResults.push({
              type: 'quotation',
              id: quotation.id,
              title: `Cotización ${quotation.quotation_number}`,
              subtitle: `${quotation.client_name} - $${quotation.total?.toLocaleString('es-CL') || 0}`,
              path: `/quotations`,
              icon: <DescriptionIcon />,
            });
          });
      } catch (error) {
        // Silenciar errores
      }

      // Buscar proveedores
      try {
        const suppliersRes = await axios.get(`/suppliers?limit=10`);
        const suppliers = suppliersRes.data.data || [];
        suppliers
          .filter(
            (s: any) =>
              s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              s.rut?.includes(searchQuery)
          )
          .slice(0, 3)
          .forEach((supplier: any) => {
            searchResults.push({
              type: 'supplier',
              id: supplier.id,
              title: supplier.name,
              subtitle: `RUT: ${supplier.rut || 'N/A'}`,
              path: `/suppliers`,
              icon: <StoreIcon />,
            });
          });
      } catch (error) {
        // Silenciar errores
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Error en búsqueda:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.path);
    setOpen(false);
    setQuery('');
  };

  const handleClose = () => {
    setOpen(false);
    setQuery('');
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      client: 'Cliente',
      invoice: 'Factura',
      quotation: 'Cotización',
      supplier: 'Proveedor',
      purchase_order: 'Orden de Compra',
      purchase_invoice: 'Factura de Compra',
      account: 'Cuenta',
    };
    return labels[type] || type;
  };

  return (
    <Box ref={anchorRef} sx={{ position: 'relative', flexGrow: 1, maxWidth: 600, mx: 2 }}>
      <TextField
        fullWidth
        size="small"
        placeholder="Buscar clientes, facturas, cotizaciones..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => query.length >= 2 && setOpen(true)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
            </InputAdornment>
          ),
          endAdornment: query && (
            <InputAdornment position="end">
              <IconButton 
                size="small" 
                onClick={handleClose} 
                sx={{ 
                  '&:hover': { 
                    background: 'linear-gradient(135deg, rgba(94, 114, 228, 0.2) 0%, rgba(130, 94, 228, 0.2) 100%)',
                  } 
                }}
              >
                <CloseIcon fontSize="small" sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            color: 'rgba(255, 255, 255, 0.9)',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.3)',
              },
            },
            '&.Mui-focused': {
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              '& fieldset': {
                borderColor: '#5e72e4',
                borderWidth: '2px',
              },
            },
          },
          '& .MuiInputBase-input': {
            color: 'rgba(255, 255, 255, 0.9)',
            '&::placeholder': {
              color: 'rgba(255, 255, 255, 0.5)',
              opacity: 1,
            },
          },
        }}
      />

      <Popper
        open={open && (query.length >= 2 || results.length > 0)}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        style={{ width: anchorRef.current?.clientWidth, zIndex: 1300 }}
      >
        <ClickAwayListener onClickAway={handleClose}>
          <Paper
            elevation={8}
            sx={{
              mt: 1,
              maxHeight: 400,
              overflow: 'auto',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              background: 'linear-gradient(135deg, #1a2742 0%, #172b4d 100%)',
              boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.5)',
            }}
          >
            {loading ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Buscando...
                </Typography>
              </Box>
            ) : results.length === 0 && query.length >= 2 ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  No se encontraron resultados
                </Typography>
              </Box>
            ) : results.length > 0 ? (
              <>
                <Box sx={{ p: 1.5, borderBottom: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600, fontSize: '0.75rem' }}>
                    {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
                <List sx={{ p: 0 }}>
                  {results.map((result, index) => (
                    <React.Fragment key={`${result.type}-${result.id}`}>
                      <ListItem disablePadding>
                        <ListItemButton 
                          onClick={() => handleResultClick(result)}
                          sx={{
                            '&:hover': {
                              background: 'linear-gradient(135deg, rgba(94, 114, 228, 0.2) 0%, rgba(130, 94, 228, 0.2) 100%)',
                            },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40, color: '#5e72e4' }}>
                            {result.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>
                                  {result.title}
                                </Typography>
                                <Chip
                                  label={getTypeLabel(result.type)}
                                  size="small"
                                  sx={{ 
                                    height: 20, 
                                    fontSize: '0.65rem',
                                    background: 'linear-gradient(87deg, #5e72e4 0, #825ee4 100%)',
                                    color: 'white',
                                    fontWeight: 600,
                                  }}
                                />
                              </Box>
                            }
                            secondary={
                              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem' }}>
                                {result.subtitle}
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                      {index < results.length - 1 && <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />}
                    </React.Fragment>
                  ))}
                </List>
              </>
            ) : null}
          </Paper>
        </ClickAwayListener>
      </Popper>
    </Box>
  );
};

export default GlobalSearch;

