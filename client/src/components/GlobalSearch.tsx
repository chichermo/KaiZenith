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
              <SearchIcon sx={{ color: '#78909c' }} />
            </InputAdornment>
          ),
          endAdornment: query && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={handleClose}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#f5f7fa',
            '&:hover': {
              backgroundColor: '#ffffff',
            },
            '&.Mui-focused': {
              backgroundColor: '#ffffff',
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
              border: '1px solid #e0e0e0',
            }}
          >
            {loading ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Buscando...
                </Typography>
              </Box>
            ) : results.length === 0 && query.length >= 2 ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No se encontraron resultados
                </Typography>
              </Box>
            ) : results.length > 0 ? (
              <>
                <Box sx={{ p: 1.5, borderBottom: '1px solid #e0e0e0' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
                <List sx={{ p: 0 }}>
                  {results.map((result, index) => (
                    <React.Fragment key={`${result.type}-${result.id}`}>
                      <ListItem disablePadding>
                        <ListItemButton onClick={() => handleResultClick(result)}>
                          <ListItemIcon sx={{ minWidth: 40, color: '#546e7a' }}>
                            {result.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {result.title}
                                </Typography>
                                <Chip
                                  label={getTypeLabel(result.type)}
                                  size="small"
                                  sx={{ height: 20, fontSize: '0.65rem' }}
                                />
                              </Box>
                            }
                            secondary={result.subtitle}
                          />
                        </ListItemButton>
                      </ListItem>
                      {index < results.length - 1 && <Divider />}
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

