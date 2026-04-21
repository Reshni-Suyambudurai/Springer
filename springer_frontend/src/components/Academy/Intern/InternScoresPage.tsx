import { Box, CircularProgress, Typography } from '@mui/material';
import { useInternData } from './useInternData';
import InternScores from './InternScores';

const InternScoresPage = () => {
  const { data, loading } = useInternData();
  if (loading) return <Box sx={{ display:'flex', justifyContent:'center', p:6 }}><CircularProgress size={32} sx={{ color:'var(--color-primary)' }} /></Box>;
  if (!data)   return <Box sx={{ p:4, textAlign:'center' }}><Typography color="textSecondary">No data found.</Typography></Box>;
  return <InternScores data={data} />;
};

export default InternScoresPage;
