import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { SnackbarProvider } from 'notistack'
import { FilterOptionsProvider } from './contexts/FilterOptionsContext'

import './index.css'
import './utils/toast.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        autoHideDuration={3000}
      >
        <FilterOptionsProvider>
          <App />
        </FilterOptionsProvider>
      </SnackbarProvider>
    </BrowserRouter>
  </StrictMode>
)