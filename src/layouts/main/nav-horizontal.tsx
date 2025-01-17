import type { Breakpoint } from '@mui/material/styles';
import type { NavSectionProps } from 'src/components/nav-section';

import Box from '@mui/material/Box';

import { NavSectionHorizontal } from 'src/components/nav-section';

// ----------------------------------------------------------------------

export type NavHorizontalProps = NavSectionProps & {
  layoutQuery: Breakpoint;
};

export function NavHorizontal({ data, layoutQuery, sx, ...other }: NavHorizontalProps) {
  return (
    <Box
      sx={{
        display: { xs: 'none', [layoutQuery]: 'flex' },
        alignItems: 'center',
        justifyContent: 'center',
        ...sx,
      }}
    >
      <NavSectionHorizontal
        data={data}
        {...other}
        sx={{
          '& .nav-item': {
            color: 'text.primary',
            '&:hover': {
              opacity: 0.8,
            },
          },
        }}
      />
    </Box>
  );
}
