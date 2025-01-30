import React from 'react';
import { Box, Button, Card, CardBody, CardHeader, Heading } from "@chakra-ui/react";
import { useCustomColorMode } from '../hooks/useColorMode';

export const StyledCard = ({ children, title, ...props }) => {
  const { cardBg, borderColor } = useCustomColorMode();
  return (
    <Card bg={cardBg} borderColor={borderColor} borderWidth={1} {...props}>
      {title && <CardHeader><Heading size="md">{title}</Heading></CardHeader>}
      <CardBody>{children}</CardBody>
    </Card>
  );
};

export const StyledButton = ({ children, ...props }) => {
  return (
    <Button colorScheme="blue" {...props}>
      {children}
    </Button>
  );
};

export const StyledContainer = ({ children, ...props }) => {
  const { bgColor } = useCustomColorMode();
  return (
    <Box 
      bg={bgColor}
      width="100%"
      maxWidth="100%"
      mx="auto"
      px={{ base: 3, md: 4 }}
      py={{ base: 3, md: 4 }}
      {...props}
    >
      {children}
    </Box>
  );
};