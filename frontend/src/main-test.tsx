import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Box, Typography, Button } from '@mui/material'
import { ThemeProvider, CssBaseline } from '@mui/material'
import theme from './theme.ts'

function TestApp() {
  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h3" gutterBottom>
        ✅ Frontend is Working!
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        If you can see this, React and MUI are working correctly.
      </Typography>
      <Button variant="contained" color="primary" size="large">
        Test Button
      </Button>
    </Box>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <TestApp />
    </ThemeProvider>
  </StrictMode>,
)
