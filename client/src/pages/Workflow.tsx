import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent,
  Alert,
  Snackbar,
  Tooltip,
  Tabs,
  Tab,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  History as HistoryIcon,
  Description as DocumentIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../utils/api';

interface ApprovalRecord {
  id: number;
  document_type: string;
  document_id: number;
  level: number;
  approver_id: number;
  approver_name: string;
  approver_role: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  approved_at?: string;
  created_at: string;
}

interface WorkflowConfig {
  document_type: string;
  requires_approval: boolean;
  approval_levels: Array<{
    level: number;
    role: string;
    min_amount?: number;
    max_amount?: number;
  }>;
  auto_approve_limit?: number;
}

interface DocumentHistory {
  id: number;
  document_type: string;
  document_id: number;
  user_id: number;
  user_name: string;
  action: string;
  changes?: any;
  comments?: string;
  created_at: string;
}

const Workflow: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRecord[]>([]);
  const [allApprovals, setAllApprovals] = useState<ApprovalRecord[]>([]);
  const [configs, setConfigs] = useState<WorkflowConfig[]>([]);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRecord | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<DocumentHistory[]>([]);
  const [openApprovalDialog, setOpenApprovalDialog] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPendingApprovals();
    fetchAllApprovals();
    fetchConfigs();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      const response = await apiFetch('/workflow/pending', {

      if (response.ok) {
        const data = await response.json();
        setPendingApprovals(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    }
  };

  const fetchAllApprovals = async () => {
    try {
      // En producción, esto vendría de un endpoint que traiga todas las aprobaciones
      setAllApprovals([]);
    } catch (error) {
      console.error('Error fetching approvals:', error);
    }
  };

  const fetchConfigs = async () => {
    try {
      const types = ['quotation', 'purchase_order', 'invoice', 'expense', 'payment'];
      const configPromises = types.map(type =>
        apiFetch(`/workflow/config/${type}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).then(res => res.ok ? res.json() : null)
      );

      const results = await Promise.all(configPromises);
      setConfigs(results.filter(r => r !== null).map(r => r.data));
    } catch (error) {
      console.error('Error fetching configs:', error);
    }
  };

  const fetchDocumentHistory = async (documentType: string, documentId: number) => {
    try {
      const response = await apiFetch(`/workflow/history/${documentType}/${documentId}`, {

      if (response.ok) {
        const data = await response.json();
        setSelectedHistory(data.data || []);
        setOpenHistoryDialog(true);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleApprove = async (approval: ApprovalRecord, actionType: 'approve' | 'reject') => {
    setSelectedApproval(approval);
    setAction(actionType);
    setComments('');
    setOpenApprovalDialog(true);
  };

  const handleSubmitApproval = async () => {
    if (!selectedApproval) return;

    try {
      setLoading(true);
      const response = await apiFetch(`/workflow/approval/${selectedApproval.id}/action`, {
        method: 'POST',
        body: JSON.stringify({
          action,
          comments
        })
      });

      if (response.ok) {
        setSuccess(`Documento ${action === 'approve' ? 'aprobado' : 'rechazado'} exitosamente`);
        setOpenApprovalDialog(false);
        fetchPendingApprovals();
        fetchAllApprovals();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al procesar aprobación');
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      setError('Error al procesar aprobación');
    } finally {
      setLoading(false);
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'quotation': 'Cotización',
      'purchase_order': 'Orden de Compra',
      'invoice': 'Factura',
      'expense': 'Gasto',
      'payment': 'Pago'
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 'bold' }}>
        Workflow y Aprobaciones
      </Typography>

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Pendientes de Aprobación" />
        <Tab label="Todas las Aprobaciones" />
        <Tab label="Configuración" />
      </Tabs>

      {/* Tab Pendientes */}
      {activeTab === 0 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Documentos Pendientes de Aprobación
              </Typography>
              {pendingApprovals.length === 0 ? (
                <Alert severity="info">No hay documentos pendientes de aprobación</Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Tipo</TableCell>
                        <TableCell>ID Documento</TableCell>
                        <TableCell>Nivel</TableCell>
                        <TableCell>Rol Requerido</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pendingApprovals.map((approval) => (
                        <TableRow key={approval.id}>
                          <TableCell>{getDocumentTypeLabel(approval.document_type)}</TableCell>
                          <TableCell>{approval.document_id}</TableCell>
                          <TableCell>
                            <Chip label={`Nivel ${approval.level}`} size="small" />
                          </TableCell>
                          <TableCell>{approval.approver_role}</TableCell>
                          <TableCell>
                            <Chip
                              label={approval.status === 'pending' ? 'Pendiente' : approval.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                              color={getStatusColor(approval.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{new Date(approval.created_at).toLocaleDateString('es-CL')}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="Aprobar">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleApprove(approval, 'approve')}
                                >
                                  <ApproveIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Rechazar">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleApprove(approval, 'reject')}
                                >
                                  <RejectIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Ver Historial">
                                <IconButton
                                  size="small"
                                  onClick={() => fetchDocumentHistory(approval.document_type, approval.document_id)}
                                >
                                  <HistoryIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Tab Configuración */}
      {activeTab === 2 && (
        <Box>
          <Grid container spacing={3}>
            {configs.map((config) => (
              <Grid item xs={12} md={6} key={config.document_type}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {getDocumentTypeLabel(config.document_type)}
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={config.requires_approval ? 'Requiere Aprobación' : 'No Requiere Aprobación'}
                        color={config.requires_approval ? 'primary' : 'default'}
                        sx={{ mb: 1 }}
                      />
                      {config.auto_approve_limit && (
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                          Auto-aprobación hasta: ${config.auto_approve_limit.toLocaleString('es-CL')}
                        </Typography>
                      )}
                    </Box>
                    {config.approval_levels.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Niveles de Aprobación:
                        </Typography>
                        {config.approval_levels.map((level, index) => (
                          <Box key={index} sx={{ mb: 1, pl: 2 }}>
                            <Typography variant="body2">
                              Nivel {level.level}: {level.role}
                              {level.min_amount && ` (desde $${level.min_amount.toLocaleString('es-CL')})`}
                              {level.max_amount && ` (hasta $${level.max_amount.toLocaleString('es-CL')})`}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Dialog de Aprobación/Rechazo */}
      <Dialog open={openApprovalDialog} onClose={() => setOpenApprovalDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {action === 'approve' ? 'Aprobar Documento' : 'Rechazar Documento'}
        </DialogTitle>
        <DialogContent>
          {selectedApproval && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Tipo: {getDocumentTypeLabel(selectedApproval.document_type)}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                ID: {selectedApproval.document_id}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Comentarios"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                sx={{ mt: 2 }}
                placeholder={action === 'approve' ? 'Ingresa comentarios sobre la aprobación...' : 'Ingresa el motivo del rechazo...'}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenApprovalDialog(false)}>Cancelar</Button>
          <Button
            onClick={handleSubmitApproval}
            variant="contained"
            color={action === 'approve' ? 'success' : 'error'}
            disabled={loading}
          >
            {action === 'approve' ? 'Aprobar' : 'Rechazar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Historial */}
      <Dialog open={openHistoryDialog} onClose={() => setOpenHistoryDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Historial de Documento</DialogTitle>
        <DialogContent>
          <Timeline>
            {selectedHistory.map((entry, index) => (
              <TimelineItem key={index}>
                <TimelineSeparator>
                  <TimelineDot color="primary">
                    {entry.action === 'created' && <DocumentIcon />}
                    {entry.action === 'approved' && <ApproveIcon />}
                    {entry.action === 'rejected' && <RejectIcon />}
                    {entry.action === 'status_changed' && <ScheduleIcon />}
                  </TimelineDot>
                  {index < selectedHistory.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <Typography variant="subtitle2">
                    {entry.user_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {entry.action === 'created' && 'Creó el documento'}
                    {entry.action === 'approved' && 'Aprobó el documento'}
                    {entry.action === 'rejected' && 'Rechazó el documento'}
                    {entry.action === 'status_changed' && `Cambió el estado${entry.changes ? ` de ${entry.changes.old_status} a ${entry.changes.new_status}` : ''}`}
                    {entry.action === 'updated' && 'Actualizó el documento'}
                  </Typography>
                  {entry.comments && (
                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                      "{entry.comments}"
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {new Date(entry.created_at).toLocaleString('es-CL')}
                  </Typography>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHistoryDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Workflow;


