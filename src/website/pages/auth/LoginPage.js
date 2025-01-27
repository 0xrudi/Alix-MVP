// src/website/pages/auth/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { useAuth } from '../../../context/auth/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email);
      
      toast({
        title: 'Check your email',
        description: 'We sent you a magic link to sign in',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="md" py={{ base: 12, md: 24 }}>
      <VStack spacing={8} align="stretch">
        <VStack spacing={3} textAlign="center">
          <Heading>Welcome to Alix</Heading>
          <Text color="gray.600">
            Enter your email to receive a magic link for signing in
          </Text>
        </VStack>

        <Box
          as="form"
          onSubmit={handleLogin}
          p={8}
          bg="white"
          borderRadius="lg"
          boxShadow="md"
          spacing={4}
        >
          <VStack spacing={6}>
            <FormControl isRequired>
              <FormLabel>Email address</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                size="lg"
              />
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              width="full"
              isLoading={isLoading}
              loadingText="Sending magic link..."
            >
              Sign In
            </Button>
          </VStack>
        </Box>

        <Text textAlign="center" fontSize="sm" color="gray.600">
          You'll receive a magic link to sign in to your account.
          <br />
          No password required!
        </Text>
      </VStack>
    </Container>
  );
};

export default LoginPage;