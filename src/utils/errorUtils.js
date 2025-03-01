import { logger } from './logger';
import { useCustomToast } from './toastUtils';

export const useErrorHandler = () => {
  const { showErrorToast } = useCustomToast();

  const handleError = (error, context) => {
    logger.error(`Error in ${context}:`, error);
    showErrorToast("Error", `An error occurred: ${error.message}`);
  };

  const handleAPIError = (error, context) => {
    logger.error(`API Error in ${context}:`, error);
    const errorMessage = error.response?.data?.message || error.message || "An unknown error occurred";
    showErrorToast("API Error", `Failed to fetch data: ${errorMessage}`);
  };

  return {
    handleError,
    handleAPIError
  };
};