import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Alert,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import axios from 'axios';
import PageHeader from '../components/PageHeader';

interface Client {
  id: number;
  rut: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  type: 'individual' | 'company';
  status: 'active' | 'potential' | 'inactive';
  notes?: string;
  created_at: string;
  updated_at: string;
}

const Clients: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    rut: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    region: '',
    type: 'individual' as 'individual' | 'company',
    status: 'active' as 'active' | 'potential' | 'inactive',
    notes: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await axios.get('/clients?limit=100');
      setClients(response.data.data);
    } catch (error) {
      console.error('Error cargando clientes:', error);
      // Datos de ejemplo si falla la conexión
      setClients([
        {
          id: 1,
          rut: '12.345.678-9',
          name: 'Juan Pérez',
          email: 'juan.perez@email.com',
          phone: '+56 9 1234 5678',
          address: 'Av. Principal 123',
          city: 'Santiago',
          region: 'Región Metropolitana',
          type: 'individual',
          status: 'active',
          notes: 'Cliente preferencial',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 2,
          rut: '98.765.432-1',
          name: 'María González',
          email: 'maria.gonzalez@email.com',
          phone: '+56 9 8765 4321',
          address: 'Calle Secundaria 456',
          city: 'Valparaíso',
          region: 'Región de Valparaíso',
          type: 'individual',
          status: 'potential',
          notes: 'Cliente potencial',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        rut: client.rut,
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        city: client.city,
        region: client.region,
        type: client.type,
        status: client.status,
        notes: client.notes || '',
      });
    } else {
      setEditingClient(null);
      setFormData({
        rut: '',
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        region: '',
        type: 'individual',
        status: 'active',
        notes: '',
      });
    }
    setError('');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingClient(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Limpiar espacios del teléfono
      const cleanedData = {
        ...formData,
        phone: formData.phone.replace(/\s+/g, '')
      };

      if (editingClient) {
        await axios.put(`/clients/${editingClient.id}`, cleanedData);
      } else {
        await axios.post('/clients', cleanedData);
      }
      fetchClients();
      handleClose();
    } catch (error: any) {
      // Mostrar errores detallados de validación
      if (error.response?.data?.details) {
        const errorMessages = error.response.data.details.map((err: any) => 
          `${err.param}: ${err.msg}`
        ).join(', ');
        setError(`Errores de validación: ${errorMessages}`);
      } else {
        setError(error.response?.data?.error || 'Error al guardar cliente');
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      try {
        await axios.delete(`/clients/${id}`);
        fetchClients();
      } catch (error: any) {
        setError(error.response?.data?.error || 'Error al eliminar cliente');
      }
    }
  };

  const handleActivate = async (id: number) => {
    try {
      await axios.patch(`/clients/${id}/activate`);
      fetchClients();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Error al activar cliente');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'potential':
        return 'warning';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'potential':
        return 'Potencial';
      case 'inactive':
        return 'Inactivo';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Cargando clientes...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Gestión de Clientes"
        subtitle="Administra tus clientes y contactos comerciales"
        action={{
          label: 'Nuevo Cliente',
          onClick: () => handleOpen(),
          icon: <AddIcon />,
        }}
      />

      <Grid container spacing={3}>
        {clients.map((client) => (
          <Grid item xs={12} sm={6} md={4} key={client.id}>
            <Card 
              sx={{ 
                height: '100%',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0px 12px 24px rgba(0,0,0,0.15)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <Box
                      sx={{
                        backgroundColor: 'primary.main',
                        color: 'white',
                        borderRadius: 2,
                        p: 1,
                        mr: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {client.type === 'company' ? (
                        <BusinessIcon sx={{ fontSize: 20 }} />
                      ) : (
                        <PersonIcon sx={{ fontSize: 20 }} />
                      )}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700,
                          fontSize: '1.1rem',
                          mb: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {client.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {client.rut}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={getStatusText(client.status)}
                    color={getStatusColor(client.status) as any}
                    size="small"
                    sx={{ height: 24 }}
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, display: 'flex', alignItems: 'center' }}>
                    <Box component="span" sx={{ fontWeight: 600, minWidth: 80 }}>Email:</Box>
                    {client.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, display: 'flex', alignItems: 'center' }}>
                    <Box component="span" sx={{ fontWeight: 600, minWidth: 80 }}>Teléfono:</Box>
                    {client.phone}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box component="span" sx={{ fontWeight: 600, minWidth: 80 }}>Ubicación:</Box>
                    {client.city}, {client.region}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpen(client)}
                    sx={{ flex: 1 }}
                  >
                    Editar
                  </Button>
                  {client.status === 'potential' && (
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      onClick={() => handleActivate(client.id)}
                      sx={{ flex: 1 }}
                    >
                      Activar
                    </Button>
                  )}
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(client.id)}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'error.light',
                        color: 'white',
                      },
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ pb: 2, fontWeight: 700 }}>
          {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="RUT"
                  value={formData.rut}
                  onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                  required
                  placeholder="12.345.678-9"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombre"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Dirección"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Ciudad"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Región"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    label="Tipo"
                  >
                    <MenuItem value="individual">Persona Natural</MenuItem>
                    <MenuItem value="company">Empresa</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    label="Estado"
                  >
                    <MenuItem value="active">Activo</MenuItem>
                    <MenuItem value="potential">Potencial</MenuItem>
                    <MenuItem value="inactive">Inactivo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notas"
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
            <Button onClick={handleClose} sx={{ borderRadius: 2 }}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" sx={{ borderRadius: 2 }}>
              {editingClient ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Clients;
