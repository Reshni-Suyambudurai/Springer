import type { ReactNode } from "react";

export interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export interface MenuItem {
  name: string;
  path: string;
  icon: ReactNode;
}
