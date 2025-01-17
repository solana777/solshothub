import { setAuthHeader } from 'src/utils/axios';

const deleteAccessToken = () => {
  localStorage.removeItem("accessToken");
  setAuthHeader(null);
};

export default deleteAccessToken;
