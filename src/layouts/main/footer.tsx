import type { Theme, SxProps } from '@mui/material';

import { Box, Link, Container } from '@mui/material';

import { Logo } from 'src/components/logo';

export type HomeFooterProps = {
  sx?: SxProps<Theme>;
};

export function HomeFooter({ sx }: HomeFooterProps) {
  return (
    <Box
      component="footer"
      sx={{
        py: 5,
        textAlign: 'center',
        position: 'relative',
        bgcolor: 'background.default',
        ...sx,
      }}
    >
      <Container>
        <Logo />
        <Box sx={{ mt: 1, typography: 'caption' }}>
          © All rights reserved.
          <br /> made by
          <Link href="https://solshothub.com/"> solshothub.com </Link>
        </Box>
      </Container>
    </Box>
  );
}
