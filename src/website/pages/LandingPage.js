// src/website/pages/LandingPage.js
import React from 'react';
import { 
  Box, 
  Button, 
  Container, 
  Heading, 
  Text, 
  SimpleGrid, 
  VStack,
  HStack,
  Flex,
  Icon
} from "@chakra-ui/react";
import { 
  BookOpen,
  Library,
  Shield,
  ArrowRight,
  Wallet
} from 'lucide-react';

const FeatureCard = ({ icon, title, description }) => (
  <Box p={6} borderWidth="1px" borderRadius="lg" bg="white">
    <VStack spacing={4} align="start">
      <Icon as={icon} boxSize={12} color="blue.600" />
      <Heading size="md">{title}</Heading>
      <Text color="gray.600">{description}</Text>
    </VStack>
  </Box>
);

const LandingPage = () => {
  const scrollToFeatures = () => {
    document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Box minH="100vh">
      {/* Hero Section */}
      <Box as="header" py={24} px={4} textAlign="center">
        <Container maxW="7xl">
          <Heading 
            mb={6} 
            size="2xl"
            bgGradient="linear(to-r, blue.600, purple.600)"
            bgClip="text"
          >
            Welcome to Alix
          </Heading>
          <Text fontSize="xl" color="gray.600" maxW="2xl" mx="auto" mb={8}>
            Your personal Web3 organizing application for managing NFTs and digital assets
            across multiple blockchain networks.
          </Text>
          <HStack spacing={4} justify="center">
            <Button 
              size="lg" 
              colorScheme="blue"
              onClick={() => window.location.href = '/app'}
              rightIcon={<ArrowRight size={16} />}
            >
              Launch App
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => window.location.href = '/signup'}
            >
              Sign Up for Access
            </Button>
          </HStack>
        </Container>
      </Box>

      {/* Features Section */}
      <Box id="features" py={20} px={4} bg="white">
        <Container maxW="7xl">
          <Heading textAlign="center" mb={16}>Core Features</Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
            <FeatureCard
              icon={Wallet}
              title="Multi-Chain Support"
              description="Manage assets across Ethereum, Polygon, Base, and other major networks from a single interface."
            />
            <FeatureCard
              icon={Library}
              title="Smart Organization"
              description="Create custom catalogs and folders to organize your digital assets in a way that makes sense for you."
            />
            <FeatureCard
              icon={Shield}
              title="Enhanced Security"
              description="Built with security-first principles to protect your assets and personal information."
            />
          </SimpleGrid>
        </Container>
      </Box>

      {/* About Section */}
      <Box py={20} px={4} bg="gray.50">
        <Container maxW="3xl" textAlign="center">
          <Heading mb={8}>Our Story</Heading>
          <Text color="gray.600" mb={8}>
            Alix was born from a vision to simplify the management of digital assets
            in the increasingly complex Web3 ecosystem. Our team of blockchain
            enthusiasts and UX experts came together to create a solution that makes
            Web3 asset management accessible to everyone.
          </Text>
          <Button variant="outline" onClick={scrollToFeatures}>
            Explore Features
          </Button>
        </Container>
      </Box>

      {/* Call to Action */}
      <Box py={20} px={4} bg="blue.600" color="white">
        <Container maxW="7xl" textAlign="center">
          <Heading mb={6}>Ready to Get Started?</Heading>
          <Text fontSize="xl" mb={8} opacity={0.9}>
            Join us in shaping the future of digital asset management.
          </Text>
          <Button 
            size="lg" 
            colorScheme="whiteAlpha"
            onClick={() => window.location.href = '/signup'}
          >
            Sign Up Now
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box as="footer" py={12} px={4} bg="gray.900" color="gray.400">
        <Container maxW="7xl">
          <Flex 
            direction={{ base: "column", md: "row" }} 
            justify="space-between" 
            align="center"
          >
            <Box mb={{ base: 8, md: 0 }}>
              <Heading size="md" color="white" mb={2}>Alix</Heading>
              <Text>Simplifying Web3 Asset Management</Text>
            </Box>
            <HStack spacing={8}>
              <Text as="a" href="/privacy" _hover={{ color: "white" }}>Privacy Policy</Text>
              <Text as="a" href="/terms" _hover={{ color: "white" }}>Terms of Service</Text>
              <Text as="a" href="/contact" _hover={{ color: "white" }}>Contact</Text>
            </HStack>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;