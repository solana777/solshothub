import { useState } from 'react';

import {
  Fab,
  Box,
  Stack,
  Paper,
  Drawer,
  Button,
  Divider,
  Collapse,
  TextField,
  Typography,
  IconButton,
} from '@mui/material';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

interface BulkPasteDrawerProps {
  open: boolean;
  onClose: () => void;
  input: string;
  handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleAddRow: () => void;
  inputErrors: number[];
}

export default function BulkPasteDrawer({
  open,
  onClose,
  input,
  handleInputChange,
  handleAddRow,
  inputErrors,
}: BulkPasteDrawerProps) {
  const shouldShowError = input.length > 3 && inputErrors.length > 0;
  const [showGuide, setShowGuide] = useState(false);

  const handleCopyExample = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Example copied successfully!', {
        position: 'top-right',
      });
    } catch (error) {
      toast.error('Failed to copy example. Please try again.');
    }
  };

  const examples = [
    {
      title: 'Basic Format',
      description: 'Single address with default amount (1 piece)',
      code: 'FXmwqJjJ9raP2Z44ds1mfxpu7szPePatr15smEphkmNt',
    },
    {
      title: 'With Custom Amount',
      description: 'Single address with specified amount',
      code: 'FXmwqJjJ9raP2Z44ds1mfxpu7szPePatr15smEphkmNt 2.5',
    },
    {
      title: 'Multiple Addresses',
      description: 'Multiple addresses with different amounts',
      code: `FXmwqJjJ9raP2Z44ds1mfxpu7szPePatr15smEphkmNt 1
            FXmwqJjJ9raP2Z44ds1mfxpu7szPePatr15smEphkmNt 0.5
            FXmwqJjJ9raP2Z44ds1mfxpu7szPePatr15smEphkmNt 2`,
    },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="right"
      PaperProps={{
        sx: { width: { xs: 1, md: 480, xl: 618 } },
      }}
    >
      <Stack
        spacing={3}
        sx={{
          p: 3,
          height: '100%',
        }}
      >
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="h4">Bulk Paste</Typography>
          <IconButton onClick={onClose}>
            <Iconify icon="mdi:close" />
          </IconButton>
        </Stack>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Stack spacing={2}>
          <TextField
            label="Paste wallet addresses"
            placeholder="One address per line"
            variant="outlined"
            value={input}
            onChange={handleInputChange}
            multiline
            rows={12}
            error={shouldShowError}
            helperText={
              shouldShowError
                ? `Invalid wallet addresses found on lines: ${inputErrors.join(', ')}`
                : ''
            }
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.neutral',
              },
            }}
          />

          <Button
            color="inherit"
            onClick={() => setShowGuide(!showGuide)}
            endIcon={
              <Iconify
                icon={showGuide ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'}
              />
            }
            sx={{ alignSelf: 'flex-start' }}
          >
            Format Guide
          </Button>

          <Collapse in={showGuide}>
            <Paper
              variant="outlined"
              sx={{
                bgcolor: 'background.neutral',
                borderColor: 'divider',
              }}
            >
              <Stack spacing={2} sx={{ p: 2 }}>
                {examples.map((example, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      bgcolor: 'background.paper',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: 'background.default',
                        '& .copy-button': {
                          opacity: 1,
                        },
                      },
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mb: 1 }}
                    >
                      <Box>
                        <Typography variant="subtitle2">{example.title}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {example.description}
                        </Typography>
                      </Box>
                      <IconButton
                        className="copy-button"
                        size="small"
                        onClick={() => handleCopyExample(example.code)}
                        sx={{
                          opacity: 0,
                          transition: 'opacity 0.2s',
                        }}
                      >
                        <Iconify icon="solar:copy-linear" width={20} />
                      </IconButton>
                    </Stack>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        bgcolor: 'background.neutral',
                        fontFamily: 'monospace',
                        fontSize: 13,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {example.code}
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Collapse>
        </Stack>
      </Stack>

      <Stack sx={{ p: 3, mt: 'auto' }}>
        <Fab
          variant="extended"
          color="primary"
          onClick={handleAddRow}
          disabled={shouldShowError || !input.trim()}
          sx={{ width: '100%' }}
        >
          <Iconify icon="mingcute:add-line" sx={{ mr: 1 }} />
          Add Addresses
        </Fab>
      </Stack>
    </Drawer>
  );
}
