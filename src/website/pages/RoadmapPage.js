// src/website/pages/RoadmapPage.js
import React from 'react';
import { 
  Box, 
  Container, 
  Heading, 
  Text,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  VStack,
  HStack,
  Icon,
  Badge,
} from "@chakra-ui/react";
import { FaHammer, FaCheckCircle } from 'react-icons/fa';

const RoadmapSection = ({ title, subtitle, icon, status, children }) => (
  <AccordionItem 
    border="1px solid"
    borderColor="var(--shadow)"
    borderRadius="md"
    mb={4}
    bg="white"
  >
    <AccordionButton
      py={4}
      _hover={{
        bg: 'var(--highlight)'
      }}
    >
      <HStack flex="1" spacing={4}>
        <Icon 
          as={icon} 
          boxSize={6} 
          color="var(--warm-brown)"
        />
        <Box flex="1">
          <HStack justify="space-between" align="center">
            <Heading 
              size="md" 
              fontFamily="Space Grotesk"
              color="var(--rich-black)"
            >
              {title}
            </Heading>
            {status && (
              <Badge
                colorScheme="blue"
                fontSize="sm"
                px={3}
                py={1}
                borderRadius="full"
                bg="var(--warm-brown)"
                color="white"
              >
                {status}
              </Badge>
            )}
          </HStack>
          <Text 
            fontSize="sm" 
            color="var(--ink-grey)"
            fontFamily="Fraunces"
            mt={1}
            textAlign="left"
          >
            {subtitle}
          </Text>
        </Box>
      </HStack>
      <AccordionIcon />
    </AccordionButton>
    <AccordionPanel p={0}>
      {children}
    </AccordionPanel>
  </AccordionItem>
);

const RoadmapPage = () => {
  return (
    <Box minH="100vh" bg="var(--warm-white)" pt={32} pb={16}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          {/* Header Section */}
          <Box>
            <Heading 
              as="h1" 
              size="2xl" 
              mb={4}
              color="var(--rich-black)"
              fontWeight="light"
              fontFamily="Space Grotesk"
            >
              Product Roadmap
            </Heading>
            <Text 
              fontSize="xl" 
              color="var(--ink-grey)"
              fontFamily="Fraunces"
              maxW="3xl"
            >
              Follow our journey as we build the future of Web3 artifact management. 
              Track our progress, see completed features, and get a glimpse of what's coming next.
            </Text>
          </Box>

          {/* Roadmap Sections */}
          <Accordion 
            allowMultiple 
            defaultIndex={[0]} // Open the first section by default
          >
            {/* MVP Roadmap Section */}
            <RoadmapSection
              title="MVP Development Roadmap"
              subtitle="Track our progress towards the initial release"
              icon={FaHammer}
              status="IN PROGRESS"
            >
              <Box 
                borderTop="1px solid"
                borderColor="var(--shadow)"
                height="800px"
              >
                <iframe 
                  src="https://phdservices.notion.site/ebd/1a0620729bb7803fa184c91310fc2a3f?v=1a0620729bb7805bb8da000cf1cd86be" 
                  width="100%" 
                  height="100%" 
                  frameBorder="0" 
                  allowFullScreen
                  sandbox="allow-scripts allow-same-origin allow-popups"
                  referrerPolicy="no-referrer"
                  title="MVP Roadmap"
                  style={{
                    backgroundColor: 'white'
                  }}
                />
              </Box>
            </RoadmapSection>

            {/* Completed Development Section */}
            <RoadmapSection
              title="Completed Development"
              subtitle="Features and components already implemented"
              icon={FaCheckCircle}
              status="LIVE"
            >
              <Box 
                borderTop="1px solid"
                borderColor="var(--shadow)"
                height="800px"
              >
                <iframe 
                  src="https://phdservices.notion.site/ebd/1a0620729bb7809ebc47cdefcf15b260?v=1a0620729bb7800bb76f000ce97f9b02" 
                  width="100%" 
                  height="100%" 
                  frameBorder="0" 
                  allowFullScreen
                  sandbox="allow-scripts allow-same-origin allow-popups"
                  referrerPolicy="no-referrer"
                  title="Completed Features"
                  style={{
                    backgroundColor: 'white'
                  }}
                />
              </Box>
            </RoadmapSection>
          </Accordion>
        </VStack>
      </Container>
    </Box>
  );
};

export default RoadmapPage;