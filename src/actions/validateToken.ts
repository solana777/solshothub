import axiosInstance from 'src/utils/axios';

interface ValidateTokenResponse {
  isValid: boolean;
}

const validateToken = async (token: string): Promise<boolean> => {
  try {
    const response = await axiosInstance.post<ValidateTokenResponse>(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/validate-token`,
      { token }
    );
    return response.data.isValid;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};

export default validateToken;
