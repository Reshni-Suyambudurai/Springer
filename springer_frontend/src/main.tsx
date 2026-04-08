import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { SnackbarProvider } from 'notistack'
import { ThemeProvider as MuiThemeProvider, CssBaseline, createTheme, StyledEngineProvider } from '@mui/material'
import { FilterOptionsProvider } from './contexts/FilterOptionsContext'

import './index.css'
import './css/template.css'
import './utils/toast.css'
import App from './App.tsx'

const muiTheme = createTheme({
  typography: {
    fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <StyledEngineProvider injectFirst>
        <MuiThemeProvider theme={muiTheme}>
          <CssBaseline />
          <SnackbarProvider
            maxSnack={3}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            autoHideDuration={3000}
          >
            <FilterOptionsProvider>
              <App />
            </FilterOptionsProvider>
          </SnackbarProvider>
        </MuiThemeProvider>
      </StyledEngineProvider>
    </BrowserRouter>
  </StrictMode>
)
