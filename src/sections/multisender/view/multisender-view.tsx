'use client';

import { useState, useEffect } from 'react';

import { Box, Card, Stack, Skeleton, Container } from '@mui/material';

import { MultiFAQs } from '../faq';
import MultisenderForm from '../solana-multisender-form';

export default function MultisenderView() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <Container maxWidth={isLoading ? 'md' : 'xl'} sx={{ my: 5 }}>
        <Card sx={{ p: 3, bgcolor: 'background.neutral', boxShadow: 'none' }}>
          {/* Header */}
          <Stack spacing={3} sx={{ mb: 3 }}>
            <Skeleton
              variant="text"
              sx={{
                bgcolor: 'background.paper',
                opacity: 0.2,
                width: 120,
                height: 32,
              }}
            />
          </Stack>

          {/* Main Content */}
          <Stack spacing={3}>
            {/* Token Select & Buttons */}
            <Stack spacing={2}>
              <Skeleton
                variant="rounded"
                height={56}
                sx={{
                  bgcolor: 'background.paper',
                  opacity: 0.1,
                  borderRadius: 2,
                }}
              />
              <Stack direction="row" spacing={2}>
                <Skeleton
                  variant="rounded"
                  height={40}
                  sx={{
                    flex: 1,
                    bgcolor: 'background.paper',
                    opacity: 0.1,
                    borderRadius: 2,
                  }}
                />
                <Skeleton
                  variant="rounded"
                  height={40}
                  sx={{
                    flex: 1,
                    bgcolor: 'background.paper',
                    opacity: 0.1,
                    borderRadius: 2,
                  }}
                />
              </Stack>
            </Stack>

            {/* DataGrid Header */}
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Skeleton
                  variant="rounded"
                  width={150}
                  height={32}
                  sx={{
                    bgcolor: 'background.paper',
                    opacity: 0.1,
                    borderRadius: 1,
                  }}
                />
                <Stack direction="row" spacing={1}>
                  {[1, 2, 3].map((item) => (
                    <Skeleton
                      key={item}
                      variant="rounded"
                      width={40}
                      height={32}
                      sx={{
                        bgcolor: 'background.paper',
                        opacity: 0.1,
                        borderRadius: 1,
                      }}
                    />
                  ))}
                </Stack>
              </Stack>

              {/* DataGrid Content */}
              <Box
                sx={{
                  height: 400,
                  bgcolor: 'background.paper',
                  opacity: 0.1,
                  borderRadius: 2,
                  p: 2,
                }}
              >
                {[1, 2, 3].map((row) => (
                  <Stack
                    key={row}
                    direction="row"
                    spacing={2}
                    sx={{
                      mb: 1,
                      p: 1,
                      borderRadius: 1,
                      bgcolor: 'background.default',
                      opacity: 0.2,
                    }}
                  >
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="20%" />
                    <Skeleton variant="text" width="20%" />
                  </Stack>
                ))}
              </Box>
            </Stack>

            {/* Submit Button */}
            <Skeleton
              variant="rounded"
              height={48}
              sx={{
                bgcolor: 'background.paper',
                opacity: 0.1,
                borderRadius: 3,
              }}
            />

            {/* Service Fee Box */}
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'background.paper',
                opacity: 0.1,
              }}
            >
              <Skeleton variant="text" width={150} height={24} />
            </Stack>
          </Stack>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ my: 5 }}>
      <MultisenderForm />
      <MultiFAQs />
    </Container>
  );
}
