import { createContext, useContext, useState, ReactNode } from 'react';

interface NavbarAction {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
}

interface NavbarActionContextType {
  action: NavbarAction | null;
  setAction: (action: NavbarAction | null) => void;
}

const NavbarActionContext = createContext<NavbarActionContextType>({
  action: null,
  setAction: () => {},
});

export const NavbarActionProvider = ({ children }: { children: ReactNode }) => {
  const [action, setAction] = useState<NavbarAction | null>(null);
  return (
    <NavbarActionContext.Provider value={{ action, setAction }}>
      {children}
    </NavbarActionContext.Provider>
  );
};

export const useNavbarAction = () => useContext(NavbarActionContext);
