import type { Metadata } from 'next';

import MultisenderView from 'src/sections/multisender/view/multisender-view';

export const metadata: Metadata = {
  title: 'SolshotHub - Solana Multisender Tool',
  description: 'Send SPL tokens to multiple addresses in a single transaction on Solana using SolshotHub.',
};

export default function Page() {
  return <MultisenderView />;
}
