import React, { useState, useEffect } from 'react';
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
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Select,
  Skeleton,
} from "@chakra-ui/react";
import { FaArrowLeft, FaPlus, FaExternalLinkAlt } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { getImageUrl } from '../utils/web3Utils';
import { useAppContext } from '../context/AppContext';

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
  const isSearchResult = location.state?.isSearchResult;
  const toast = useToast();
  const { catalogs, updateCatalogs } = useAppContext();
  const [isAddToCatalogOpen, setIsAddToCatalogOpen] = useState(false);
  const [selectedCatalog, setSelectedCatalog] = useState('');
  const [imageUrl, setImageUrl] = useState('https://via.placeholder.com/400?text=Loading...');
  const [isLoading, setIsLoading] = useState(true);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    let mounted = true;

    const loadImage = async () => {
      if (!nft) return;

      try {
        setIsLoading(true);
        const url = await getImageUrl(nft);
        if (mounted) {
          setImageUrl(url || 'https://via.placeholder.com/400?text=No+Image');
        }
      } catch (error) {
        console.error('Error loading NFT image:', error);
        if (mounted) {
          setImageUrl('https://via.placeholder.com/400?text=Error+Loading+Image');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      mounted = false;
    };
  }, [nft]);

  if (!nft) {
    return <Box>No NFT data available</Box>;
  }

  const handleAddToCatalog = () => {
    setIsAddToCatalogOpen(true);
  };

  const handleConfirmAddToCatalog = () => {
    if (selectedCatalog) {
      const updatedCatalogs = catalogs.map(catalog => {
        if (catalog.id === selectedCatalog) {
          return {
            ...catalog,
            nfts: [...catalog.nfts, nft]
          };
        }
        return catalog;
      });
      updateCatalogs(updatedCatalogs);
      toast({
        title: "NFT Added to Catalog",
        description: `The NFT has been added to the selected catalog.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setIsAddToCatalogOpen(false);
    }
  };

  const renderImage = () => {
    if (isLoading) {
      return (
        <Skeleton
          height="400px"
          width="100%"
          margin="auto"
          mb={6}
        />
      );
    }

    if (typeof imageUrl === 'string' && imageUrl.startsWith('data:image/svg+xml,')) {
      return (
        <Box 
          dangerouslySetInnerHTML={{ __html: decodeURIComponent(imageUrl.split(',')[1]) }} 
          maxHeight="400px"
          width="100%"
          margin="auto"
          mb={6}
        />
      );
    }

    return (
      <Image
        src={imageUrl}
        alt={nft.title || 'NFT'}
        maxHeight="400px"
        objectFit="contain"
        margin="auto"
        mb={6}
        fallbackSrc="https://via.placeholder.com/400?text=Error+Loading+Image"
      />
    );
  };

  return (
    <Box maxWidth="container.xl" margin="auto" p={8}>
      <Button leftIcon={<FaArrowLeft />} onClick={() => navigate(-1)} mb={6}>
        Back
      </Button>

      <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="md" borderColor={borderColor} borderWidth={1}>
        <Heading as="h2" size="xl" mb={4}>
          {nft.title || `Token ID: ${nft.id?.tokenId}`}
        </Heading>

        {renderImage()}

        <Text mb={6}>{nft.description || 'No description available.'}</Text>

        <VStack align="start" spacing={4}>
          <HStack>
            <Badge colorScheme="purple">{nft.network || 'Unknown Network'}</Badge>
            {nft.isSpam && <Badge colorScheme="red">Spam</Badge>}
          </HStack>

          {isSearchResult && (
            <Button leftIcon={<FaPlus />} colorScheme="green" onClick={handleAddToCatalog}>
              Add to Catalog
            </Button>
          )}

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
                      <Td>{nft.contract?.name || 'N/A'}</Td>
                    </Tr>
                    <Tr>
                      <Th>Contract Address</Th>
                      <Td>{nft.contract?.address || 'N/A'}</Td>
                    </Tr>
                    <Tr>
                      <Th>Token ID</Th>
                      <Td>{nft.id?.tokenId || 'N/A'}</Td>
                    </Tr>
                    <Tr>
                      <Th>Creator/Artist</Th>
                      <Td>{nft.creator || nft.artist || 'N/A'}</Td>
                    </Tr>
                  </Tbody>
                </Table>
              </AccordionPanel>
            </AccordionItem>

            {nft.attributes && (
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
                      {nft.attributes.map((attr, index) => (
                        <Tr key={index}>
                          <Td>{attr.trait_type}</Td>
                          <Td>{attr.value}</Td>
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

          {nft.externalUrl && (
            <Link href={nft.externalUrl} isExternal color="blue.500">
              View on External Site <FaExternalLinkAlt />
            </Link>
          )}
        </VStack>
      </Box>

      <Modal isOpen={isAddToCatalogOpen} onClose={() => setIsAddToCatalogOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add to Catalog</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Select
              placeholder="Select catalog"
              value={selectedCatalog}
              onChange={(e) => setSelectedCatalog(e.target.value)}
            >
              {catalogs.map((catalog) => (
                <option key={catalog.id} value={catalog.id}>
                  {catalog.name}
                </option>
              ))}
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleConfirmAddToCatalog}>
              Add
            </Button>
            <Button variant="ghost" onClick={() => setIsAddToCatalogOpen(false)}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ArtifactDetailPage;