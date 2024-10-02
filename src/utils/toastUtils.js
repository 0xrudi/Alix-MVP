import { useToast } from "@chakra-ui/react";

export const useCustomToast = () => {
  const toast = useToast();

  const showSuccessToast = (title, description) => {
    toast({
      title,
      description,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const showErrorToast = (title, description) => {
    toast({
      title,
      description,
      status: "error",
      duration: 5000,
      isClosable: true,
    });
  };

  const showInfoToast = (title, description) => {
    toast({
      title,
      description,
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  const showWarningToast = (title, description) => {
    toast({
      title,
      description,
      status: "warning",
      duration: 4000,
      isClosable: true,
    });
  };

  return {
    showSuccessToast,
    showErrorToast,
    showInfoToast,
    showWarningToast,
  };
};