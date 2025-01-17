import type { StackProps } from '@mui/material/Stack';

import { useState } from 'react';
import { m } from 'framer-motion';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Accordion, { accordionClasses } from '@mui/material/Accordion';
import AccordionDetails, { accordionDetailsClasses } from '@mui/material/AccordionDetails';
import AccordionSummary, { accordionSummaryClasses } from '@mui/material/AccordionSummary';

import { varAlpha } from 'src/theme/styles';

import { Iconify } from 'src/components/iconify';
import { varFade, MotionViewport } from 'src/components/animate';

import { SectionTitle } from './components/section-title';

// ----------------------------------------------------------------------

const FAQs = [
  {
    question: 'What is the Solana Multisender Tool, and how does it work?',
    answer: (
      <Typography>
        The
        <Link href="#" sx={{ mx: 0.5 }}>
          <strong>Solana Multisender Tool</strong>
        </Link>
        by SolshotHub allows you to efficiently distribute SPL tokens to multiple addresses in a single
        transaction. It&apos;s perfect for airdrops, bulk token distributions, and other mass token
        transfers. Simply connect your wallet, upload the list of recipient addresses, and send your
        tokens—all in just a few clicks.
      </Typography>
    ),
  },
  {
    question: 'How can I use the Multisender App by SolshotHub?',
    answer: (
      <Box component="ul" sx={{ pl: 3, listStyleType: 'disc' }}>
        <li>
          Connect Your Wallet: Link your Solana-compatible wallet like Phantom, Solflare, or Sollet.
        </li>
        <li>
          Upload Recipient Addresses: Provide a list of wallet addresses you want to send tokens to.
        </li>
        <li>Set Token Amounts: Specify the amount of SPL tokens to be sent to each address.</li>
        <li>Execute the Transaction: Confirm and send the tokens in a single bulk transaction.</li>
        <Typography sx={{ mt: 2 }}>
          The Multisender tool simplifies the distribution process, making it ideal for airdrops and
          bulk transfers.
        </Typography>
      </Box>
    ),
  },
  {
    question: 'What is an Airdrop?',
    answer: (
      <Typography>
        An Airdrop is a method used to distribute tokens to multiple wallet addresses, usually for
        promotional purposes, community rewards, or to incentivize participation in a blockchain
        project.
      </Typography>
    ),
  },
  {
    question: 'How to make an Airdrop on Solana?',
    answer: (
      <Typography>
        To execute an Airdrop on Solana, use the <strong>Solana Multisender Tool,</strong> connect
        your wallet, upload the recipient addresses, set the token amounts, and initiate the airdrop
        in a single transaction.
      </Typography>
    ),
  },
  {
    question: 'How can I send SPL tokens to multiple addresses on Solana?',
    answer: (
      <Typography>
        With the <strong>Solana Multisender Tool</strong>, you can easily send SPL tokens to
        multiple addresses by connecting your wallet, uploading a list of recipient addresses,
        setting token amounts, and sending them all in one transaction.
      </Typography>
    ),
  },
  {
    question: 'How much does it cost to use the Solana Multisender Tool?',
    answer: (
      <Typography>
        The cost to use the <strong>Solana Multisender Tool</strong> is <strong>0.01 SOL</strong>{' '}
        per transaction. This includes the transaction fee and access to the multisender service.
      </Typography>
    ),
  },
  {
    question: 'Can I use the Solana Multisender Tool for airdrops?',
    answer: (
      <Typography>
        Yes, the <strong>Solana Multisender</strong> is specifically designed to make airdrops,
        allowing you to efficiently distribute tokens to large groups of recipients.
      </Typography>
    ),
  },
  {
    question: 'Which wallets are compatible with the Solana Multisender Tool?',
    answer: (
      <Typography>
        The <strong>Solana Multisender Tool</strong> supports popular Solana wallets like Phantom,
        Solflare, and Sollet, making it easy to connect and distribute tokens.
      </Typography>
    ),
  },
  {
    question: 'What types of tokens can I send with the Solana Multisender Tool?',
    answer: (
      <Typography>
        The <strong>Solana Multisender Tool</strong> supports sending any SPL tokens, making it
        versatile for various token distribution needs on the Solana blockchain.
      </Typography>
    ),
  },
  {
    question: `What are the key features of SolshotHub's Bulk Sender?`,
    answer: (
      <Typography>
        SolshotHub&apos;s Bulk Sender allows you to distribute SPL tokens to multiple recipients
        simultaneously, offers compatibility with popular Solana wallets like Phantom, and provides
        detailed transaction tracking on the blockchain.
      </Typography>
    ),
  },
  {
    question: `How to execute a Solana Airdrop?`,
    answer: (
      <Typography>
        Execute a Solana Airdrop by leveraging SolshotHub&apos;s Multisender Tool. It allows you to send
        tokens to multiple addresses quickly, ensuring a smooth and efficient distribution process.
      </Typography>
    ),
  },
];

// ----------------------------------------------------------------------

export function MultiFAQs({ sx, ...other }: StackProps) {
  const [expanded, setExpanded] = useState<string | false>(FAQs[0].question);

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const renderDescription = (
    <SectionTitle
      caption="FAQs"
      title="We’ve got the"
      txtGradient="answers"
      sx={{ textAlign: 'center' }}
    />
  );

  const renderContent = (
    <Stack
      spacing={1}
      sx={{
        mt: 8,
        mx: 'auto',
        maxWidth: 720,
        mb: { xs: 5, md: 8 },
      }}
    >
      {FAQs.map((item, index) => (
        <Accordion
          key={item.question}
          component={m.div}
          variants={varFade({ distance: 24 }).inUp}
          expanded={expanded === item.question}
          onChange={handleChange(item.question)}
          sx={{
            borderRadius: 2,
            transition: (theme) =>
              theme.transitions.create(['background-color'], {
                duration: theme.transitions.duration.short,
              }),
            '&::before': { display: 'none' },
            '&:hover': {
              bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.16),
            },
            '&:first-of-type, &:last-of-type': { borderRadius: 2 },
            [`&.${accordionClasses.expanded}`]: {
              m: 0,
              borderRadius: 2,
              boxShadow: 'none',
              bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
            },
            [`& .${accordionSummaryClasses.root}`]: {
              py: 3,
              px: 2.5,
              minHeight: 'auto',
              [`& .${accordionSummaryClasses.content}`]: {
                m: 0,
                [`&.${accordionSummaryClasses.expanded}`]: { m: 0 },
              },
            },
            [`& .${accordionDetailsClasses.root}`]: { px: 2.5, pt: 0, pb: 3 },
          }}
        >
          <AccordionSummary
            expandIcon={
              <Iconify
                width={20}
                icon={expanded === item.question ? 'mingcute:minimize-line' : 'mingcute:add-line'}
              />
            }
            aria-controls={`panel${index}bh-content`}
            id={`panel${index}bh-header`}
          >
            <Typography variant="h6"> {item.question}</Typography>
          </AccordionSummary>
          <AccordionDetails>{item.answer}</AccordionDetails>
        </Accordion>
      ))}
    </Stack>
  );

  return (
    <Stack component="section" sx={{ ...sx }} {...other}>
      <MotionViewport sx={{ py: 10, position: 'relative' }}>
        <Container>
          {renderDescription}
          {renderContent}
        </Container>
      </MotionViewport>
    </Stack>
  );
}
