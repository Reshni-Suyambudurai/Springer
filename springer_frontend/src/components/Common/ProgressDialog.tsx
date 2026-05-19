import { Dialog, DialogTitle, DialogContent, Box, Typography, LinearProgress } from '@mui/material';

interface ProgressDialogProps {
  open: boolean;
  title: string;
  current: number;
  total: number;
  currentItem?: string;
}

const ProgressDialog = ({ open, title, current, total, currentItem }: ProgressDialogProps) => {
  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <Dialog open={open} maxWidth="xs" fullWidth disableEscapeKeyDown>
      <DialogTitle sx={{ fontSize: 'var(--text-base)', fontWeight: 600, pb: 1 }}>
        {title}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography sx={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
              Progress: {current} / {total}
            </Typography>
            <Typography sx={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-primary)' }}>
              {Math.round(progress)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'var(--color-border)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: 'var(--color-primary)',
                borderRadius: 4,
              },
            }}
          />
          {currentItem && (
            <Box sx={{ mt: 2, p: 1.5, backgroundColor: 'var(--color-background)', borderRadius: 1 }}>
              <Typography sx={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', mb: 0.5 }}>
                Currently processing:
              </Typography>
              <Typography sx={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                {currentItem}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ProgressDialog;
