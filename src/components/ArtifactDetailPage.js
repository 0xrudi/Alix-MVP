import React from 'react';
import {
  Box,
  Heading,
  Image,
  Text,
  VStack,
  HStack,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Link,
  Button,
  useColorModeValue,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from "@chakra-ui/react";
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

const MetadataDisplay = ({ data, level = 0 }) => {
  const bgColor = useColorModeValue('gray.50', 'gray.700');

  const renderValue = (value) => {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    if (typeof value === 'object') {
      return <MetadataDisplay data={value} level={level + 1} />;
    }
    return String(value);
  };

  return (
    <Table variant="simple" size="sm">
      <Tbody>
        {Object.entries(data).map(([key, value]) => (
          <React.Fragment key={key}>
            {typeof value === 'object' && value !== null ? (
              <Tr>
                <Td colSpan={2} p={0}>
                  <Accordion allowToggle>
                    <AccordionItem border="none">
                      <AccordionButton bg={bgColor} _hover={{ bg: bgColor }}>
                        <Box flex="1" textAlign="left" fontWeight="bold">
                          {key}
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                      <AccordionPanel pb={4}>
                        {renderValue(value)}
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                </Td>
              </Tr>
            ) : (
              <Tr>
                <Th>{key}</Th>
                <Td>{renderValue(value)}</Td>
              </Tr>
            )}
          </React.Fragment>
        ))}
      </Tbody>
    </Table>
  );
};

const ArtifactDetailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const nft = location.state?.nft;

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const getImageUrl = (nft) => {
    const possibleSources = [
      nft.metadata?.image_url,
      nft.metadata?.image,
      nft.media?.[0]?.gateway,
      nft.imageUrl,
      nft.metadata?.external_url
    ];
  
    for (let source of possibleSources) {
      if (source) {
        // Check if the source is an SVG string
        if (source.startsWith('data:image/svg+xml,')) {
          return source;
        }
        // Check if it's already a valid URL (including IPFS gateways)
        if (source.startsWith('http://') || source.startsWith('https://')) {
          return source;
        }
        // Handle IPFS protocol
        if (source.startsWith('ipfs://')) {
          const hash = source.replace('ipfs://', '');
          return `https://ipfs.io/ipfs/${hash}`;
        }
        // Handle Arweave protocol
        if (source.startsWith('ar://')) {
          const hash = source.replace('ar://', '');
          return `https://arweave.net/${hash}`;
        }
      }
    }
  
    return 'https://via.placeholder.com/400?text=No+Image';
  };

  const renderValue = (value) => {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  if (!nft) {
    return <Box>No NFT data available</Box>;
  }

  const imageUrl = getImageUrl(nft);

  return (
    <Box maxWidth="container.xl" margin="auto" p={8}>
      <Button leftIcon={<FaArrowLeft />} onClick={() => navigate(-1)} mb={6}>
        Back
      </Button>

      <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="md" borderColor={borderColor} borderWidth={1}>
        <Heading as="h2" size="xl" mb={4}>
          {renderValue(nft.title) || `Token ID: ${renderValue(nft.id?.tokenId)}`}
        </Heading>

        {imageUrl.startsWith('data:image/svg+xml,') ? (
            <Box 
                dangerouslySetInnerHTML={{ __html: decodeURIComponent(imageUrl.split(',')[1]) }} 
                maxHeight="400px"
                width="100%"
                margin="auto"
                mb={6}
            />
        ) : (
            <Image
                src={imageUrl}
                alt={renderValue(nft.title) || 'NFT'}
                maxHeight="400px"
                objectFit="contain"
                margin="auto"
                mb={6}
            />
        )}

        <Text mb={6}>{renderValue(nft.metadata?.description)}</Text>

        <VStack align="start" spacing={4}>
          <HStack>
            <Badge colorScheme="purple">{renderValue(nft.network).toUpperCase()}</Badge>
            {nft.isSpam && <Badge colorScheme="red">Spam</Badge>}
          </HStack>

          <Accordion allowMultiple width="100%">
            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    Details
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                <Table variant="simple" size="sm">
                  <Tbody>
                    <Tr>
                      <Th>Contract Name</Th>
                      <Td>{renderValue(nft.name)}</Td>
                    </Tr>
                    <Tr>
                      <Th>Contract Address</Th>
                      <Td>{renderValue(nft.contract?.address?._value || nft.contract?.address)}</Td>
                    </Tr>
                    <Tr>
                      <Th>Token ID</Th>
                      <Td>{renderValue(nft.id?.tokenId)}</Td>
                    </Tr>
                    <Tr>
                      <Th>Creator/Artist</Th>
                      <Td>{renderValue(nft.metadata?.created_by || nft.metadata?.artist)}</Td>
                    </Tr>
                  </Tbody>
                </Table>
              </AccordionPanel>
            </AccordionItem>

            {nft.metadata?.attributes && (
              <AccordionItem>
                <h2>
                  <AccordionButton>
                    <Box flex="1" textAlign="left">
                      Traits
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Trait Type</Th>
                        <Th>Value</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {nft.metadata.attributes.map((attr, index) => (
                        <Tr key={index}>
                          <Td>{renderValue(attr.trait_type)}</Td>
                          <Td>{renderValue(attr.value)}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </AccordionPanel>
              </AccordionItem>
            )}

            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    Technical Information (Metadata)
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                <MetadataDisplay data={nft.metadata || {}} />
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    Media Source
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                <Text fontSize="sm" wordBreak="break-all">
                  {imageUrl}
                </Text>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>

          {nft.metadata?.external_url && (
            <Link href={nft.metadata.external_url} isExternal color="blue.500">
              View on External Site
            </Link>
          )}
        </VStack>
      </Box>
    </Box>
  );
};

export default ArtifactDetailPage;