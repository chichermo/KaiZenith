import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: subtitle ? 2 : 0 }}>
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 500,
              mb: subtitle ? 0.5 : 0,
              color: '#212121',
              fontSize: '1.75rem',
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action && (
          <Button
            variant="contained"
            startIcon={action.icon || <AddIcon />}
            onClick={action.onClick}
            sx={{
              borderRadius: 1,
              px: 2.5,
              py: 1,
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {action.label}
          </Button>
        )}
      </Box>
      <Box sx={{ borderBottom: '1px solid #e8eaed' }} />
    </Box>
  );
};

export default PageHeader;

