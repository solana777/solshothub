import {
  Fab,
  Box,
  Stack,
  Drawer,
  Divider,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
} from '@mui/material';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

interface ChangeAmountDrawerProps {
  open: boolean;
  onClose: () => void;
  newAmount: number;
  handleChangeAmount: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveAmount: () => void;
  tokenSymbol?: string;
  tokenIcon?: string;
}

export default function ChangeAmountDrawer({
  open,
  onClose,
  newAmount,
  handleChangeAmount,
  handleSaveAmount,
  tokenSymbol = 'TOKEN',
  tokenIcon = 'cryptocurrency:token',
}: ChangeAmountDrawerProps) {
  const handleSave = () => {
    if (newAmount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }
    handleSaveAmount();
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="right"
      PaperProps={{
        sx: { width: { xs: 1, sm: 420, md: 420 } },
      }}
    >
      <Stack
        spacing={3}
        sx={{
          p: 3,
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4">Change Amount</Typography>
          <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
            <Iconify icon="mingcute:close-line" />
          </IconButton>
        </Stack>

        <Divider sx={{ borderStyle: 'dashed' }} />

        {/* Content */}
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
              New Amount
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Enter the new amount to apply to all wallet addresses
            </Typography>
          </Box>

          <TextField
            fullWidth
            type="number"
            value={newAmount}
            onChange={handleChangeAmount}
            placeholder="0.00"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Iconify icon="ri:token-swap-line" width={16} />
                  </Stack>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.neutral',
                '&:hover, &.Mui-focused': {
                  bgcolor: 'background.neutral',
                  '& fieldset': {
                    borderColor: (theme) => theme.palette.primary.main,
                  },
                },
              },
            }}
          />

          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: 'background.neutral',
              border: (theme) => `dashed 1px ${theme.palette.divider}`,
            }}
          >
            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ color: 'warning.main' }}>
                Important Notes:
              </Typography>
              <Typography variant="caption" component="div" sx={{ color: 'text.secondary' }}>
                • This will update amounts for all addresses in your list
                <br />
                • All previous amounts will be replaced with this new value
                <br />• This action can be undone by clicking Cancel
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </Stack>

      {/* Footer */}
      <Box
        sx={{
          p: 2.5,
          bottom: 0,
          position: 'sticky',
          bgcolor: 'background.neutral',
          borderTop: (theme) => `dashed 1px ${theme.palette.divider}`,
        }}
      >
        <Stack direction="row" spacing={2}>
          <Fab
            variant="extended"
            color="inherit"
            onClick={onClose}
            sx={{
              flex: 1,
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            Cancel
          </Fab>
          <Fab
            variant="extended"
            color="primary"
            onClick={handleSave}
            disabled={newAmount <= 0}
            sx={{ flex: 1 }}
          >
            <Iconify icon="solar:check-circle-bold-duotone" sx={{ mr: 1 }} />
            Apply Changes
          </Fab>
        </Stack>
      </Box>
    </Drawer>
  );
}
