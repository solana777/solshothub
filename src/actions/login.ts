import axiosInstance, { setAuthHeader } from 'src/utils/axios';

const loginUser = async (
  walletAddress: string,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
) => {
  try {
    const message = `Login request to Solvaults.com: ${new Date().toISOString()}`;
    const encodedMessage = new TextEncoder().encode(message);
    const signature = await signMessage(encodedMessage);
    const signatureBase64 = Buffer.from(signature).toString('base64');

    const response = await axiosInstance.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/login`, {
      walletAddress,
      message,
      signature: signatureBase64,
    });

    const { accessToken } = response.data;

    localStorage.setItem('accessToken', accessToken);
    setAuthHeader(accessToken);
  } catch (error) {
    console.error('Error logging in:', error);
    // Handle login error here (e.g., show notification)
  }
};

export default loginUser;
