import { TextField } from '@mui/material';
import type { ReactNode } from 'react';

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}

const FilterSelect = ({ label, value, onChange, children, className }: FilterSelectProps) => {
  const selectMenuProps = {
    MenuProps: {
      PaperProps: {
        sx: {
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text-primary)',
          '& .MuiMenuItem-root': {
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            '&:hover': {
              backgroundColor: 'var(--color-primary-hover-6)',
            },
            '&.Mui-selected': {
              backgroundColor: 'var(--color-primary-hover-4)',
              color: 'var(--color-primary)',
              '&:hover': {
                backgroundColor: 'var(--color-primary-hover-6)',
              },
            },
          },
          '& .cycle-item--open': {
            color: 'var(--color-success-dark)',
          },
          '& .cycle-item--closed': {
            color: 'var(--color-error-dark)',
          },
        },
      },
    },
  };

  const selectSx = {
    '& .MuiOutlinedInput-root': {
      color: 'var(--color-text-primary)',
    },
  };

  return (
    <TextField
      select
      size="small"
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className || 'institutes-select-field'}
      sx={selectSx}
      SelectProps={selectMenuProps}
    >
      {children}
    </TextField>
  );
};

export default FilterSelect;
