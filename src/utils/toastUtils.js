// src/utils/toastUtils.js
import { useToast } from "@chakra-ui/react";

export const useCustomToast = () => {
  const toast = useToast();

  const customToastConfig = {
    position: 'right',
    duration: 3000,
    isClosable: true,
    containerStyle: {
      marginRight: '20px', // Provide some spacing from the right edge
      width: '300px',
      maxWidth: '300px'
    }
  };

  const showSuccessToast = (title, description) => {
    toast({
      title,
      description,
      status: "success",
      ...customToastConfig
    });
  };

  const showErrorToast = (title, description) => {
    toast({
      title,
      description,
      status: "error",
      duration: 5000,
      ...customToastConfig
    });
  };

  const showInfoToast = (title, description) => {
    toast({
      title,
      description,
      status: "info",
      ...customToastConfig
    });
  };

  const showWarningToast = (title, description) => {
    toast({
      title,
      description,
      status: "warning",
      duration: 4000,
      ...customToastConfig
    });
  };

  return {
    showSuccessToast,
    showErrorToast,
    showInfoToast,
    showWarningToast,
  };
};