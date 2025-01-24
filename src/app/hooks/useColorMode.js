import { useColorModeValue } from "@chakra-ui/react";

export const useCustomColorMode = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return {
    bgColor,
    cardBg,
    textColor,
    borderColor
  };
};