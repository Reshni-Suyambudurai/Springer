import { Outlet } from 'react-router-dom';
import { InternDataProvider } from '../../../contexts/InternDataContext';

const InternLayout = () => {
  return (
    <InternDataProvider>
      <Outlet />
    </InternDataProvider>
  );
};

export default InternLayout;
