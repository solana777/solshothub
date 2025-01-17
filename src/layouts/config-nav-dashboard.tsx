import { paths } from 'src/routes/paths';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export const navData = [
  /**
   * Overview
   */
  {
    subheader: 'Home',
    items: [
      { title: 'Home', path: paths.home.root, icon: <Iconify icon="mdi:home" /> },
      {
        title: 'Create Token',
        path: paths.home.create,
        icon: <Iconify icon="ri:token-swap-fill" />,
        disabled: true,
        info: <Label color="info">Coming Soon</Label>,
      },
    ],
  },
  /**
   * Management
   */
];
