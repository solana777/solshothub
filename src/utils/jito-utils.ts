import axios from 'axios';

const JITO_API_URL = 'https://mainnet.block-engine.jito.wtf/api/v1/bundles';

export async function sendBundle(transactions: string[]): Promise<any> {
  const response = await axios.post(
    JITO_API_URL,
    {
      jsonrpc: '2.0',
      id: 1,
      method: 'sendBundle',
      params: [transactions],
    },
    {
      headers: {
        'Content-Type': 'application/json',
        // 'x-jito-auth': 'YOUR_API_KEY', // Uncomment and add your API key if needed
      },
    }
  );
  return response.data.result;
}

export async function getTipAccounts(): Promise<string[]> {
  const response = await axios.post(
    JITO_API_URL,
    {
      jsonrpc: '2.0',
      id: 1,
      method: 'getTipAccounts',
      params: [],
    },
    {
      headers: {
        'Content-Type': 'application/json',
        // 'x-jito-auth': 'YOUR_API_KEY', // Uncomment and add your API key if needed
      },
    }
  );
  return response.data.result;
}
