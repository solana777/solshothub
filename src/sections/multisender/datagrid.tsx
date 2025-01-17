import type {
  GridRowId,
  GridSlots,
  GridColDef,
  GridRowsProp,
  GridRowModel,
  GridRowModesModel,
  GridEventListener,
} from '@mui/x-data-grid';

import base58 from 'bs58';
import * as React from 'react';
import { m } from 'framer-motion';
import { useWatch, useFormContext } from 'react-hook-form';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  createTransferInstruction,
  getAssociatedTokenAddress,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';

import Box from '@mui/material/Box';
import { LoadingButton } from '@mui/lab';
import {
  Stack,
  alpha,
  Button,
  Avatar,
  MenuItem,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  DataGrid,
  GridRowModes,
  GridToolbarExport,
  GridActionsCellItem,
  GridToolbarContainer,
  GridRowEditStopReasons,
  GridToolbarFilterButton,
} from '@mui/x-data-grid';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';

import { fShortenNumber } from 'src/utils/format-number';
import { sendBundle, getTipAccounts } from 'src/utils/jito-utils';

import { addComputeBudget } from 'src/actions/priorityFeesIx';
import { checkWalletBalance } from 'src/actions/checkWalletBalance';
import useTokensByWalletAll from 'src/actions/getParsedTokenAccountsByOwner';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { varFade } from 'src/components/animate';
import { RHFSelect } from 'src/components/hook-form';

import UploadButton from './upload-button';
import BulkPasteDrawer from './components/bulk-paste-drawer';
import ChangeAmountDrawer from './components/change-amount-drawer';

// kano helpers

let nextId = 0;
const defaultAmount = 1;
const MAX_PAYLOAD_SIZE_MB = 3;

const initialRows: GridRowsProp = [];

// const isValidSolanaAddress = (address: string) => {
//   try {
//     const publicKey = new publicKey(address);
//     return PublicKey.isOnCurve(publicKey);
//   } catch (err) {
//     return false;
//   }
// };

const isValidSolanaAddress = (address: string) => address.length === 44;

// kano helpers -- end

interface EditToolbarProps {
  setRows: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
  setRowModesModel: (newModel: (oldModel: GridRowModesModel) => GridRowModesModel) => void;
}

function EditToolbar(props: EditToolbarProps) {
  const { setRows, setRowModesModel } = props;

  const handleClick = () => {
    // eslint-disable-next-line no-plusplus
    const id = nextId++;
    setRows((oldRows) => {
      const newRow = {
        id,
        walletAddress: '',
        amount: 1,
        isNew: true,
        focus: true,
      };

      // Directly enter edit mode for the new row
      setRowModesModel((oldModel) => ({
        ...oldModel,
        [id]: { mode: GridRowModes.Edit, fieldToFocus: 'walletAddress' },
      }));

      return [newRow, ...oldRows]; // Add new row without checking for duplicates yet
    });
  };

  const handleUploadSuccess = (data: any[]) => {
    const newRows = data
      .filter((item) => isValidSolanaAddress(item.walletAddress))
      .map((item) => ({
        // eslint-disable-next-line no-plusplus
        id: nextId++,
        walletAddress: item.walletAddress,
        amount: item.amount || defaultAmount,
      }));

    setRows((oldRows) => {
      const mergedRows = [...oldRows];
      newRows.forEach((newRow) => {
        const existingRow = mergedRows.find((row) => row.walletAddress === newRow.walletAddress);
        if (existingRow) {
          existingRow.amount += newRow.amount;
        } else {
          mergedRows.push(newRow);
        }
      });
      return mergedRows;
    });

    if (newRows.length > 0) {
      toast.success('Your file uploaded successfully!');
    } else {
      toast.warning('No valid addresses found in the uploaded file.');
    }
  };

  return (
    <GridToolbarContainer
      sx={{
        borderRadius: 1,
        justifyContent: 'space-between',
        direction: { sm: 'column', md: 'row' },
      }}
    >
      <Stack spacing={3} direction="row">
        <Button size="small" color="inherit" variant="text" onClick={handleClick}>
          <Iconify icon="mdi:add" width={24} />
          New Wallet Address
        </Button>
      </Stack>
      <Stack spacing={1} direction="row">
        <GridToolbarFilterButton />
        <UploadButton onUploadSuccess={handleUploadSuccess} />
        <GridToolbarExport />
      </Stack>
    </GridToolbarContainer>
  );
}

export default function MultisenderCrudGrid() {
  const [rows, setRows] = React.useState(initialRows);
  const { connected, publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const { setVisible: setModalVisible } = useWalletModal();
  const { tokens, isLoading } = useTokensByWalletAll();
  const methods = useFormContext();
  const { control, watch } = methods;
  const { setValue, handleSubmit } = useFormContext();
  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>({});
  const recipients = useWatch({ control, name: 'recipients' });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // calculating the total fees ==> Biggie
  const [totalFees, setTotalFees] = React.useState(0);
  const [totalPlatformFees, setTotalPlatformFees] = React.useState(0);
  const [totalAssociatedAccountFees, setTotalAssociatedAccountFees] = React.useState(0);
  const [additionalFee, setAdditionalFee] = React.useState(0);

  const calculateTotalFees = async () => {
    if (recipients.length < 10) return;

    const associatedAccountCreationFee = await connection.getMinimumBalanceForRentExemption(165);
    const PLATFORM_FEE_PER_WALLET = 0.001 * LAMPORTS_PER_SOL;
    // Calculate total fees
    const totalAssociatedAccountFeesCalculated = recipients.length * associatedAccountCreationFee;
    const totalPlatformFeesCalculated = recipients.length * PLATFORM_FEE_PER_WALLET;
    const numberOfBundles = Math.ceil(recipients.length / 10);
    // 0.0001 SOL per bundle + 50000 lamports for refunding the senderWallet with the already created associated accounts ==> Biggie
    const additionalFeeCalculated = numberOfBundles * (0.0001 * LAMPORTS_PER_SOL) + 50000;
    const totalFeesCalculated =
      totalAssociatedAccountFeesCalculated + totalPlatformFeesCalculated + additionalFeeCalculated;
    setTotalAssociatedAccountFees(totalAssociatedAccountFeesCalculated);
    setTotalPlatformFees(totalPlatformFeesCalculated);
    setAdditionalFee(additionalFeeCalculated);
    setTotalFees(totalFeesCalculated);
  };

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      calculateTotalFees();
    }, 1000);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipients, connection]);

  const tokenAddress = watch('tokenMintAddress');

  React.useEffect(() => {
    const selectedToken = tokens.find((token) => token.mintAddress === tokenAddress);
    if (selectedToken) {
      setValue('decimals', selectedToken.decimals);
    }
  }, [tokenAddress, tokens, setValue]);

  // kano tools
  const onSubmit = handleSubmit(async (data) => {
    try {
      setIsSubmitting(true);

      if (!publicKey || !signTransaction) {
        console.error('Wallet not connected');
        toast.error('Please connect your wallet first');
        return;
      }

      if (!data.tokenMintAddress) {
        toast.error('Please select a token first');
        return;
      }

      if (!data.recipients || data.recipients.length === 0) {
        toast.error('Please add some recipients first');
        return;
      }

      const totalTokenAmount = data.recipients.reduce(
        (total: any, recipient: { amount: any }) => total + recipient.amount,
        0
      );

      const payloadSizeInBytes = new Blob([JSON.stringify(data.recipients)]).size;
      const payloadSizeInMB = payloadSizeInBytes / (1024 * 1024);

      if (payloadSizeInMB > MAX_PAYLOAD_SIZE_MB) {
        toast.error(
          `The size of the user's input can't be more than 3 MB. Please separate your distribution into more than one operation.`
        );
        return;
      }
      // if (data.recipients.length < 10) {
      //   toast.error('At least 10 recipients are required');
      //   return;
      // }

      const hasSufficientBalance = await checkWalletBalance(publicKey, connection, totalFees);
      if (!hasSufficientBalance) {
        return;
      }

      // Split recipients into chunks of 10
      const recipientChunks = Array.from(
        { length: Math.ceil(data.recipients.length / 10) },
        (_, i) => data.recipients.slice(i * 10, (i + 1) * 10)
      );

      const tokenMintAddress = new PublicKey(data.tokenMintAddress);
      const sourceTokenAccount = await getAssociatedTokenAddress(tokenMintAddress, publicKey);

      // Process each chunk sequentially
      await recipientChunks.reduce(async (promise, chunk, chunkIndex) => {
        await promise;
        let transaction = new Transaction();

        // Add compute budget instruction
        transaction = addComputeBudget(transaction);

        // Add platform fee transfer
        const platformFeePerWallet = 0.001 * LAMPORTS_PER_SOL;
        const chunkPlatformFee = platformFeePerWallet * chunk.length;
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey('Bi66BRqgxcu8BzRq4wodonvMyDxHyv4eUqVb2qTmkenx'),
            lamports: chunkPlatformFee,
          })
        );

        // Process all recipients in the chunk
        const recipientInstructions = await Promise.all(
          chunk.map(async (recipient: any) => {
            const recipientPubkey = new PublicKey(recipient.walletAddress);
            const recipientTokenAccount = await getAssociatedTokenAddress(
              tokenMintAddress,
              recipientPubkey,
              false,
              TOKEN_PROGRAM_ID,
              ASSOCIATED_TOKEN_PROGRAM_ID
            );

            const accountInfo = await connection.getAccountInfo(recipientTokenAccount);
            const instructions = [];

            if (!accountInfo) {
              instructions.push(
                createAssociatedTokenAccountInstruction(
                  publicKey,
                  recipientTokenAccount,
                  recipientPubkey,
                  tokenMintAddress
                )
              );
            }

            instructions.push(
              createTransferInstruction(
                sourceTokenAccount,
                recipientTokenAccount,
                publicKey,
                recipient.amount * 10 ** data.decimals,
                [],
                TOKEN_PROGRAM_ID
              )
            );

            return instructions;
          })
        );

        // Add all instructions to transaction
        recipientInstructions.flat().forEach((instruction) => transaction.add(instruction));

        // Add tip account transfer
        const tipAccounts = await getTipAccounts();
        const tipAmount = LAMPORTS_PER_SOL * 0.0001;
        const randomTipAccount = tipAccounts[Math.floor(Math.random() * tipAccounts.length)];
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey(randomTipAccount),
            lamports: tipAmount,
          })
        );

        // Set fee payer and recent blockhash
        transaction.feePayer = publicKey;
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        // Sign and send transaction
        const signedTransaction = await signTransaction(transaction);
        const encodedTransaction = base58.encode(signedTransaction.serialize());
        await sendBundle([encodedTransaction]);

        toast.success(`Successfully processed chunk ${chunkIndex + 1} of ${recipientChunks.length}`);
      }, Promise.resolve());

      // Final success message
      toast.success('All transactions completed successfully!');
    } catch (error: any) {
      console.error('Transaction error:', error);
      toast.error(`Transaction failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  });

  const smUp = useResponsive('up', 'sm');
  const [input, setInput] = React.useState<string>('');
  const [inputErrors, setInputErrors] = React.useState<number[]>([]);
  const [newAmount, setNewAmount] = React.useState<number>(0);
  const dialog = useBoolean();
  const drawer = useBoolean();

  // const { connected } = useWallet();

  // const { setVisible: setModalVisible } = useWalletModal();
  // const tokenAddress = watch('tokenMintAddress');
  // listen to tokenMintAddress changes and update the decimals field in the form
  // React.useEffect(() => {
  //   const selectedToken = tokens?.find((token: TokenInfo) => token.mintAddress === tokenAddress);
  //   if (selectedToken) {
  //     setValue('decimals', selectedToken.decimals);
  //   }
  // }, [tokenAddress, tokens, setValue]);

  React.useEffect(() => {
    // Validate input whenever it changes
    const errors = validateInput(input);
    setInputErrors(errors);
  }, [input]); // Run this effect whenever 'input' changes,,

  React.useEffect(() => {
    setValue('recipients', rows);
  }, [rows, setValue]);

  const validateInput = (inp: string) => {
    const lines = inp.split('\n');
    const validationErrors: number[] = [];

    lines.forEach((line, index) => {
      const parts = line.trim().split(/[\s,]+/);
      const walletAddress = parts[0];
      const amountStr = parts[1];
      const amount = amountStr ? parseFloat(amountStr.trim()) : defaultAmount;

      if (!isValidSolanaAddress(walletAddress) || Number.isNaN(amount)) {
        validationErrors.push(index + 1);
      }
    });

    return validationErrors;
  };

  // kano tools -- end
  const handleRowEditStop: GridEventListener<'rowEditStop'> = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const handleEditClick = (id: GridRowId) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
  };

  const handleSaveClick = (id: GridRowId) => () => {
    const row = rows.find((r) => r.id === id);

    if (row && !isValidSolanaAddress(row.walletAddress)) {
      toast.error(`Invalid Solana address at row: ${row.walletAddress}`);
    } else {
      setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
    }
  };

  const handleDeleteClick = (id: GridRowId) => () => {
    setRows(rows.filter((row) => row.id !== id));
  };

  const handleCancelClick = (id: GridRowId) => () => {
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });

    const editedRow = rows.find((row) => row.id === id);
    if (editedRow!.isNew) {
      setRows(rows.filter((row) => row.id !== id));
    }
  };

  const processRowUpdate = (newRow: GridRowModel) => {
    if (!isValidSolanaAddress(newRow.walletAddress)) {
      toast.error(`Invalid Solana address: ${newRow.walletAddress}`);
      throw new Error(`Invalid Solana address: ${newRow.walletAddress}`);
    } else {
      toast.success('Row updated successfully!');
      // Check for duplicates and merge
      const existingRow = rows.find(
        (row) => row.walletAddress === newRow.walletAddress && row.id !== newRow.id
      );
      if (existingRow) {
        existingRow.amount += newRow.amount;
        setRows(rows.filter((row) => row.id !== newRow.id));
        toast.warning(`Duplicate address found. Amount added to existing row.`);
      } else {
        const updatedRow = { ...newRow, isNew: false };
        setRows(rows.map((row) => (row.id === newRow.id ? updatedRow : row)));
      }
      return newRow;
    }
  };

  const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };

  // kano
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };
  const handleAddRow = () => {
    const lines = input.split('\n');
    const newRows: { id: number; walletAddress: string; amount: number }[] = [];
    const invalidRows: number[] = [];

    lines.forEach((line, index) => {
      const parts = line.trim().split(/[\s,]+/);
      const walletAddress = parts[0];
      const amountStr = parts[1];
      const amount = amountStr ? parseFloat(amountStr.trim()) : defaultAmount;

      // eslint-disable-next-line no-restricted-globals
      if (isValidSolanaAddress(walletAddress) && !isNaN(amount)) {
        // Check for duplicates and merge
        const existingRow = newRows.find((row) => row.walletAddress === walletAddress);
        if (existingRow) {
          existingRow.amount += amount;
        } else {
          newRows.push({
            // eslint-disable-next-line no-plusplus
            id: nextId++,
            walletAddress,
            amount,
          });
        }
      } else {
        invalidRows.push(index + 1); // Store the line number (starting at 1)
      }
    });

    toast.success('Addresses and amounts added successfully!');

    // Merge with existing rows and handle duplicates
    const mergedRows = [...rows];
    newRows.forEach((newRow) => {
      const existingRow = mergedRows.find((row) => row.walletAddress === newRow.walletAddress);
      if (existingRow) {
        existingRow.amount += newRow.amount;
      } else {
        mergedRows.push(newRow);
      }
    });

    setRows(mergedRows);
    setInput('');
    drawer.onFalse();
  };
  // const handleRedirectSnapshot = () => {
  //   const externalUrl = paths.dashboard.snapshot.root;
  //   window.open(externalUrl, "_blank");
  // };

  const handleChangeAmount = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewAmount(parseFloat(event.target.value));
  };

  const handleSaveAmount = () => {
    // Update all rows with the new amount
    setRows((prevRows) => prevRows.map((row) => ({ ...row, amount: newAmount })));
    toast.success('Amounts updated successfully!');
    setNewAmount(0);
    dialog.onFalse();
  };

  // kano --- end

  const columns: GridColDef[] = [
    {
      field: 'walletAddress',
      type: 'string',
      headerName: 'Wallet Address',
      width: smUp ? 280 : 150,
      editable: true,
    },
    {
      field: 'amount',
      headerName: 'Amount',
      type: 'number',
      width: smUp ? 280 : 150,
      align: 'left',
      headerAlign: 'left',
      editable: true,
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: smUp ? 280 : 75,
      cellClassName: 'actions',
      getActions: ({ id }) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

        if (isInEditMode) {
          return [
            <GridActionsCellItem
              icon={<Iconify icon="material-symbols:save" width={24} />}
              label="Save"
              onClick={handleSaveClick(id)}
            />,
            <GridActionsCellItem
              icon={<Iconify icon="mdi:close-box" width={24} />}
              label="Cancel"
              onClick={handleCancelClick(id)}
            />,
          ];
        }

        return [
          <GridActionsCellItem
            icon={<Iconify icon="mdi:edit" width={24} />}
            label="Edit"
            onClick={handleEditClick(id)}
          />,
          <GridActionsCellItem
            icon={<Iconify icon="mdi:delete" width={24} />}
            label="Delete"
            onClick={handleDeleteClick(id)}
          />,
        ];
      },
    },
  ];

  // React.useEffect(() => {
  //   const selectedToken = tokens?.find((token: TokenInfo) => token.mintAddress === tokenAddress);
  //   if (selectedToken) {
  //     setValue('tokenName', selectedToken.metadata?.name);
  //     setValue('tokenSymbol', selectedToken.metadata?.symbol);
  //   }
  // }, [tokenAddress, tokens, setValue]);

  return (
    <m.div variants={varFade().inDown}>
      <Stack spacing={3}>
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
            bgcolor: 'background.paper',
            border: (theme) => `solid 1px ${alpha(theme.palette.grey[500], 0.08)}`,
          }}
        >
          {/* Header */}
          <Stack spacing={{ xs: 2, sm: 3 }}>
            {/* Token Selection */}
            <RHFSelect
              name="tokenMintAddress"
              label={connected ? 'Select Token' : 'Connect Wallet to Proceed'}
              disabled={!connected}
              onClick={() => {
                if (!connected) {
                  setModalVisible(true);
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: (theme) => alpha(theme.palette.background.neutral, 0.4),
                  '& fieldset': {
                    borderColor: (theme) => alpha(theme.palette.grey[500], 0.16),
                  },
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            >
              {isLoading ? (
                <MenuItem disabled>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ width: 20, height: 20 }}>
                      <CircularProgress size={16} />
                    </Box>
                    <Typography>Loading tokens...</Typography>
                  </Stack>
                </MenuItem>
              ) : (
                tokens
                  .filter((token: any) => token.balance > 0)
                  .map((token: any) => (
                    <MenuItem key={token.mintAddress} value={token.mintAddress}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar
                          src={token.metadataJson?.image || ''}
                          alt={token.metadataJson?.name || ''}
                          sx={{ width: 24, height: 24 }}
                        />
                        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                          <Typography variant="body2" noWrap>
                            {token.metadataJson?.name}
                            <Typography
                              component="span"
                              variant="caption"
                              sx={{ color: 'text.secondary', ml: 0.5 }}
                            >
                              ({token.metadataJson?.symbol})
                            </Typography>
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                            {token.mintAddress.slice(0, 4)}...{token.mintAddress.slice(-4)} •{' '}
                            {fShortenNumber(token.balance)} available
                          </Typography>
                        </Box>
                      </Stack>
                    </MenuItem>
                  ))
              )}
            </RHFSelect>

            {/* Action Buttons */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{
                '& > *': {
                  minHeight: { xs: 48, sm: 'auto' },
                },
              }}
            >
              <Button
                fullWidth
                size="large"
                variant="soft"
                color="primary"
                onClick={dialog.onTrue}
                startIcon={<Iconify icon="solar:pen-bold" />}
                sx={{
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.16),
                  },
                }}
              >
                Change Amount
              </Button>
              <Button
                fullWidth
                size="large"
                variant="soft"
                onClick={drawer.onTrue}
                startIcon={<Iconify icon="solar:clipboard-list-bold" />}
                sx={{
                  bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.grey[500], 0.16),
                  },
                }}
              >
                Bulk Paste
              </Button>
            </Stack>

            {/* DataGrid */}
            <Box
              sx={{
                height: { xs: 400, sm: 500 },
                maxWidth: { xs: '100%', sm: 500, md: 720 },
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: (theme) => alpha(theme.palette.background.neutral, 0.4),
                border: (theme) => `solid 1px ${alpha(theme.palette.grey[500], 0.08)}`,
                '& .actions': {
                  color: 'text.secondary',
                },
                '& .textPrimary': {
                  color: 'text.primary',
                },
              }}
            >
              <DataGrid
                rows={rows}
                columns={columns}
                editMode="row"
                rowModesModel={rowModesModel}
                onRowModesModelChange={handleRowModesModelChange}
                onRowEditStop={handleRowEditStop}
                processRowUpdate={processRowUpdate}
                slots={{
                  toolbar: EditToolbar as GridSlots['toolbar'],
                  noRowsOverlay: () => (
                    <Stack height="100%" alignItems="center" justifyContent="center" spacing={2}>
                      <Iconify
                        icon="qlementine-icons:empty-slot-16"
                        width={80}
                        height={80}
                        sx={{
                          color: (theme) => alpha(theme.palette.primary.main, 0.24),
                        }}
                      />
                      <Stack spacing={1} sx={{ textAlign: 'center', px: 3 }}>
                        <Typography variant="h6">No Wallet Addresses</Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Add addresses manually or use bulk paste to get started
                        </Typography>
                      </Stack>
                    </Stack>
                  ),
                }}
                slotProps={{
                  toolbar: { setRows, setRowModesModel },
                }}
                sx={{
                  border: 'none',
                  '& .MuiDataGrid-cell': {
                    borderColor: (theme) => alpha(theme.palette.grey[500], 0.08),
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    bgcolor: (theme) => alpha(theme.palette.background.neutral, 0.8),
                    borderBottom: (theme) => `solid 1px ${alpha(theme.palette.grey[500], 0.08)}`,
                  },
                  '& .MuiDataGrid-row': {
                    '&:hover': {
                      bgcolor: (theme) => alpha(theme.palette.background.neutral, 0.3),
                    },
                  },
                }}
              />
            </Box>

            {/* Action Footer */}
            <Stack spacing={{ xs: 1.5, sm: 2 }}>
              {connected ? (
                <LoadingButton
                  fullWidth
                  size="large"
                  variant="contained"
                  loading={isSubmitting}
                  disabled={rows.length === 0 || !tokenAddress}
                  onClick={onSubmit}
                  startIcon={<Iconify icon="streamline:mail-send-email-message" />}
                  sx={{
                    height: { xs: 48, sm: 48 },
                    boxShadow: 'none',
                    '&:hover': {
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.85),
                    },
                  }}
                >
                  Start Sending Tokens
                </LoadingButton>
              ) : (
                <Button
                  fullWidth
                  size="large"
                  variant="contained"
                  onClick={() => setModalVisible(true)}
                  startIcon={<Iconify icon="solar:wallet-bold-duotone" />}
                  sx={{
                    height: { xs: 48, sm: 48 },
                    boxShadow: 'none',
                    '&:hover': {
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.85),
                    },
                  }}
                >
                  Connect Wallet
                </Button>
              )}

              <Stack
                direction="row"
                alignItems="center"
                justifyContent="center"
                spacing={1}
                sx={{
                  py: 1.5,
                  px: 3,
                  borderRadius: 1.5,
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                }}
              >
                <Iconify
                  icon="solar:tag-horizontal-bold-duotone"
                  width={20}
                  sx={{ color: 'primary.main' }}
                />
                {/* {recipients?.length >= 10 ? ( */}
                <Stack spacing={1}>
                  <Typography variant="subtitle2">
                    Total Service Fee: <strong>{(totalFees / LAMPORTS_PER_SOL).toFixed(3)} SOL</strong>
                  </Typography>
                  </Stack>
                  {/* ) : (
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                      Add at least 10 recipients to calculate fees
                    </Typography>
                  )} */}
              </Stack>
            </Stack>
          </Stack>
        </Box>
      </Stack>

      <BulkPasteDrawer
        open={drawer.value}
        onClose={drawer.onFalse}
        input={input}
        handleInputChange={handleInputChange}
        handleAddRow={handleAddRow}
        inputErrors={inputErrors}
      />

      <ChangeAmountDrawer
        open={dialog.value}
        onClose={dialog.onFalse}
        newAmount={newAmount}
        handleChangeAmount={handleChangeAmount}
        handleSaveAmount={handleSaveAmount}
      />
    </m.div>
  );
}
