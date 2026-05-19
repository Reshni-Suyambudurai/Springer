import { useInternDataContext } from '../../../contexts/InternDataContext';
import { tokenstore } from '../../../auth/tokenstore';

export const useInternData = () => {
  const user = tokenstore.getUser();
  const { data, loading, retry } = useInternDataContext();
  return { data, loading, user, retry };
};
