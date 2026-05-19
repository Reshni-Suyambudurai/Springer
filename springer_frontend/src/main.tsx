import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { SnackbarProvider, closeSnackbar } from 'notistack'
import { ThemeProvider as MuiThemeProvider, CssBaseline, createTheme, StyledEngineProvider } from '@mui/material'
import { FilterOptionsProvider } from './contexts/FilterOptionsContext'
import { NavbarActionProvider } from './contexts/NavbarActionContext'

import './index.css'
import './css/template.css'
import './utils/toast.css'
import App from './App.tsx'

const muiTheme = createTheme({
  typography: {
    fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
  },
});

createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
      <StyledEngineProvider injectFirst>
        <MuiThemeProvider theme={muiTheme}>
          <CssBaseline />
          <SnackbarProvider
            maxSnack={3}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            autoHideDuration={3000}
            action={(snackbarId) => (
              <button
                onClick={() => closeSnackbar(snackbarId)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '4px 8px',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            )}
          >
            <FilterOptionsProvider>
              <NavbarActionProvider>
                <App />
              </NavbarActionProvider>
            </FilterOptionsProvider>
          </SnackbarProvider>
        </MuiThemeProvider>
      </StyledEngineProvider>
    </BrowserRouter>
)
