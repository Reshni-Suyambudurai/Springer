import { enqueueSnackbar } from "notistack"
import "./toast.css";

type ToastType = "success" | "error" | "warning" | "info"

// Duration based on severity (in milliseconds)
const TOAST_DURATIONS: Record<ToastType, number> = {
  success: 3000,  // 3s - Quick confirmation
  info: 4000,     // 4s - Informational messages
  warning: 4500,  // 4.5s - Warnings need more attention
  error: 6000,    // 6s - Errors need to be read carefully
}

export const showToast = (message: string, type: ToastType = "success") => {
  enqueueSnackbar(message, {
    variant: type,
    autoHideDuration: TOAST_DURATIONS[type],
  })
}