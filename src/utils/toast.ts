import { enqueueSnackbar } from "notistack"
import "./toast.css";

type ToastType = "success" | "error"

export const showToast = (message: string, type: ToastType = "success") => {
  enqueueSnackbar(message, {
    variant: type
  })
}