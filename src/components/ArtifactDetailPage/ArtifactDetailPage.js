import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { 
  FaArrowLeft, 
  FaBook, 
  FaTrash, 
  FaExternalLinkAlt,
} from 'react-icons/fa';

// Chakra UI imports
import {
  Box,
  Heading,
  Text,
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
  IconButton,
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
  Flex,
  Tooltip,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Tab,
  VStack,
} from "@chakra-ui/react";

// Local imports
import { getImageUrl } from '../../utils/web3Utils.js';
import { useAppContext } from '../../context/AppContext.js';
import { updateNFT } from '../../redux/slices/nftSlice.js';
import MediaTabPanel from './MediaTabPanel.js';
import { parseContent } from '../../utils/contentUtils.js';

// Component for displaying table-formatted metadata
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
  // Hooks
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const toast = useToast();
  const { catalogs, updateCatalogs } = useAppContext();

  // Get NFT data from location state
  const nft = location.state?.nft;

  // State management
  const [isAddToCatalogOpen, setIsAddToCatalogOpen] = useState(false);
  const [selectedCatalog, setSelectedCatalog] = useState('');
  const [imageUrl, setImageUrl] = useState('https://via.placeholder.com/400?text=Loading...');
  const [isLoading, setIsLoading] = useState(true);
  const [parsedMarkdownContent, setParsedMarkdownContent] = useState(null);
  const [isParsingContent, setIsParsingContent] = useState(false);

  // Theme colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Load and parse content
  useEffect(() => {
    if (nft?.metadata?.content) {
      setIsParsingContent(true);
      parseContent(nft.metadata.content)
        .then(parsed => {
          setParsedMarkdownContent(parsed);
        })
        .catch(error => {
          console.error('Error parsing content:', error);
          setParsedMarkdownContent(null);
        })
        .finally(() => {
          setIsParsingContent(false);
        });
    }
  }, [nft?.metadata?.content]);

  // Load image data
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
    return () => { mounted = false; };
  }, [nft]);

  // Early return if no NFT data
  if (!nft) {
    return <Box p={8}>No NFT data available</Box>;
  }

  // Handlers
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

  const handleMarkAsSpam = () => {
    dispatch(updateNFT({
      walletId: nft.walletId,
      nft: { ...nft, isSpam: !nft.isSpam }
    }));
    toast({
      title: nft.isSpam ? "Removed from Spam" : "Marked as Spam",
      description: nft.isSpam 
        ? "The artifact has been removed from your spam folder."
        : "The artifact has been moved to your spam folder.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
    navigate(-1);
  };

  return (
    <Box maxWidth="container.xl" margin="auto" p={8}>
      {/* Header Section */}
      <Flex justify="space-between" align="center" mb={6} width="100%">
        <Button leftIcon={<FaArrowLeft />} onClick={() => navigate(-1)}>
          Back
        </Button>
        
        <HStack spacing={2}>
          <Tooltip label="Mark as Spam" placement="top">
            <IconButton
              icon={<FaTrash />}
              aria-label="Mark as spam"
              variant="ghost"
              colorScheme="red"
              onClick={handleMarkAsSpam}
            />
          </Tooltip>

          <Tooltip label="Add to Catalog" placement="top">
            <IconButton
              icon={<FaBook />}
              aria-label="Add to catalog"
              variant="ghost"
              colorScheme="blue"
              onClick={handleAddToCatalog}
            />
          </Tooltip>
        </HStack>
      </Flex>

      <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="md" borderColor={borderColor} borderWidth={1}>
        {/* Title and Network Badge Section */}
        <Box mb={6}>
          <Heading as="h2" size="xl" mb={2}>
            {nft.title || `Token ID: ${nft.id?.tokenId}`}
          </Heading>
          <HStack spacing={2}>
            <Badge colorScheme="purple">{nft.network || 'Unknown Network'}</Badge>
            {nft.isSpam && <Badge colorScheme="red">Spam</Badge>}
          </HStack>
        </Box>

        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>Media</Tab>
            <Tab>Description</Tab>
            <Tab>Information</Tab>
          </TabList>

          <TabPanels>
            {/* Media Tab Panel */}
            <TabPanel>
              <MediaTabPanel
                nft={nft}
                imageUrl={imageUrl}
                isLoading={isLoading}
                parsedMarkdownContent={parsedMarkdownContent}
                isParsingContent={isParsingContent}
                // onFullscreenContent={handleFullscreenContent}
                borderColor={borderColor}
              />
            </TabPanel>

            {/* Description Tab Panel */}
            <TabPanel>
              <Box maxWidth="800px" mx="auto">
                <Text
                  fontSize="lg"
                  lineHeight="1.8"
                  whiteSpace="pre-wrap"
                  sx={{
                    '& p': {
                      marginBottom: '1em',
                    }
                  }}
                >
                  {(nft.description || 'No description available.')
                    .replace(/&nbsp;/g, ' ')
                    .split(/\n\s*\n/)
                    .filter(paragraph => paragraph.trim().length > 0)
                    .join('\n\n')
                    .trim()}
                </Text>
              </Box>
            </TabPanel>

            {/* Information Tab Panel */}
            <TabPanel>
              <VStack align="stretch" spacing={4}>
                <Accordion allowMultiple width="100%">
                  {/* Details Section */}
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

                  {/* Traits Section */}
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

                  {/* Metadata Section */}
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
                </Accordion>

                {/* External Link */}
                {nft.externalUrl && (
                  <Link href={nft.externalUrl} isExternal color="blue.500">
                    View on External Site <FaExternalLinkAlt />
                  </Link>
                )}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>

      {/* Add to Catalog Modal */}
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
            <Button variant="ghost" onClick={() => setIsAddToCatalogOpen(false)}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ArtifactDetailPage