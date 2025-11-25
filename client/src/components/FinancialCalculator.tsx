import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Calculate as CalculateIcon,
} from '@mui/icons-material';

interface FinancialCalculatorProps {
  open: boolean;
  onClose: () => void;
}

const FinancialCalculator: React.FC<FinancialCalculatorProps> = ({ open, onClose }) => {
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [periods, setPeriods] = useState('');
  const [result, setResult] = useState<{
    simpleInterest: number;
    compoundInterest: number;
    monthlyPayment: number;
    totalPayment: number;
  } | null>(null);

  const calculate = () => {
    const p = parseFloat(principal) || 0;
    const r = (parseFloat(rate) || 0) / 100;
    const n = parseFloat(periods) || 0;

    if (p <= 0 || n <= 0) {
      setResult(null);
      return;
    }

    // Interés simple
    const simpleInterest = p * r * n;

    // Interés compuesto
    const compoundInterest = p * Math.pow(1 + r, n) - p;

    // Cuota mensual (amortización)
    let monthlyPayment = 0;
    let totalPayment = 0;
    if (r > 0) {
      monthlyPayment = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      totalPayment = monthlyPayment * n;
    } else {
      monthlyPayment = p / n;
      totalPayment = p;
    }

    setResult({
      simpleInterest,
      compoundInterest,
      monthlyPayment,
      totalPayment,
    });
  };

  const clear = () => {
    setPrincipal('');
    setRate('');
    setPeriods('');
    setResult(null);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalculateIcon />
            <Typography variant="h6">Calculadora Financiera</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Capital Principal"
              type="number"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Tasa de Interés Anual (%)"
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              InputProps={{
                endAdornment: <Typography sx={{ ml: 1 }}>%</Typography>,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Período (meses)"
              type="number"
              value={periods}
              onChange={(e) => setPeriods(e.target.value)}
            />
          </Grid>

          {result && (
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    Resultados
                  </Typography>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      Interés Simple
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      ${result.simpleInterest.toLocaleString('es-CL')}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1.5 }} />
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      Interés Compuesto
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      ${result.compoundInterest.toLocaleString('es-CL')}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1.5 }} />
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      Cuota Mensual
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      ${result.monthlyPayment.toLocaleString('es-CL')}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1.5 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total a Pagar
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      ${result.totalPayment.toLocaleString('es-CL')}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={clear}>Limpiar</Button>
        <Button onClick={calculate} variant="contained">
          Calcular
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FinancialCalculator;

