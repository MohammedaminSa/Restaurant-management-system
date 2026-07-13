import { Box, Typography } from '@mui/material';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  withSidebar?: boolean;
}

export default function DashboardHeader({ title, subtitle, withSidebar = true }: DashboardHeaderProps) {
  return (
    <Box 
      sx={{ 
        position: 'fixed',
        top: 0,
        left: withSidebar ? { xs: 0, md: '260px' } : 0,
        right: 0,
        bgcolor: 'primary.main',
        p: 2.5,
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        borderBottomLeftRadius: withSidebar ? { md: 16 } : 0,
        borderBottomRightRadius: { md: 16 },
        zIndex: 100,
      }}
    >
      <Typography variant="h5" fontWeight="bold" sx={{ color: '#fff' }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}
