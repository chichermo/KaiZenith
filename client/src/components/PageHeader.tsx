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
    <Box sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'flex-start' }, mb: subtitle ? { xs: 1.5, sm: 2 } : 0, gap: { xs: 2, sm: 0 } }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 500,
              mb: subtitle ? 0.5 : 0,
              background: 'linear-gradient(87deg, #ffffff 0, rgba(255, 255, 255, 0.9) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
              wordBreak: 'break-word',
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: { xs: '0.813rem', sm: '0.875rem' } }}>
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
              px: { xs: 2, sm: 2.5 },
              py: { xs: 0.875, sm: 1 },
              fontSize: { xs: '0.813rem', sm: '0.875rem' },
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            {action.label}
          </Button>
        )}
      </Box>
      <Box sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }} />
    </Box>
  );
};

export default PageHeader;

