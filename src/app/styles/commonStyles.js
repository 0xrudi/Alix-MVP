import React from 'react';
import { Box, Button, Card, CardBody, CardHeader, Heading, Input, Tab } from "@chakra-ui/react";
import { useCustomColorMode } from '../hooks/useColorMode';

export const StyledCard = ({ children, title, ...props }) => {
  const { cardBg, borderColor } = useCustomColorMode();
  return (
    <Card 
      bg={cardBg} 
      borderColor={borderColor} 
      borderWidth={1} 
      borderRadius="12px"
      transition="all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)"
      _hover={{ 
        transform: props.interactive ? "translateY(-2px)" : "none",
        boxShadow: props.interactive ? "0 4px 12px rgba(139, 115, 90, 0.1)" : "none"
      }}
      {...props}
    >
      {title && (
        <CardHeader>
          <Heading size="md" fontFamily="Space Grotesk">
            {title}
          </Heading>
        </CardHeader>
      )}
      <CardBody>{children}</CardBody>
    </Card>
  );
};

export const StyledButton = ({ children, variant = "solid", ...props }) => {
  const { cardBg, borderColor } = useCustomColorMode();
  return (
    <Button
      bg={variant === "solid" ? "var(--warm-brown)" : cardBg}
      color={variant === "solid" ? "white" : "var(--ink-grey)"}
      border={variant === "outline" ? "1px solid" : "none"}
      borderColor={variant === "outline" ? borderColor : "transparent"}
      borderRadius="8px"
      fontFamily="Inter"
      fontWeight="500"
      _hover={{
        bg: variant === "solid" ? "var(--deep-brown)" : "var(--highlight)",
        borderColor: variant === "outline" ? "var(--warm-brown)" : "transparent",
        color: variant === "outline" ? "var(--warm-brown)" : undefined,
        transform: "translateY(-1px)"
      }}
      transition="all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)"
      {...props}
    >
      {children}
    </Button>
  );
};

export const StyledInput = ({ ...props }) => {
  const { cardBg, borderColor } = useCustomColorMode();
  return (
    <Input
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="8px"
      fontFamily="Inter"
      fontSize="14px"
      _hover={{
        borderColor: "var(--warm-brown)"
      }}
      _focus={{
        borderColor: "var(--warm-brown)",
        boxShadow: "0 0 0 1px var(--warm-brown)"
      }}
      {...props}
    />
  );
};

export const StyledTab = ({ children, ...props }) => {
  const { borderColor } = useCustomColorMode();
  return (
    <Tab
      fontFamily="Inter"
      fontSize="14px"
      _selected={{
        color: "var(--warm-brown)",
        borderColor: borderColor,
        borderBottomColor: "transparent"
      }}
      {...props}
    >
      {children}
    </Tab>
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