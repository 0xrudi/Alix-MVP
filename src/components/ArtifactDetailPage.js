// External library imports
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { 
  FaArrowLeft, 
  FaPlus, 
  FaExternalLinkAlt, 
  FaTrash, 
  FaBook, 
  FaExpand, 
  FaCompress 
} from 'react-icons/fa';

// Chakra UI imports
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
  Skeleton,
  Flex,
  Tooltip,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Tab,
} from "@chakra-ui/react";

// Local imports
import { getImageUrl } from '../utils/web3Utils';
import { useAppContext } from '../context/AppContext';
import { updateNFT } from '../redux/slices/nftSlice';

const DEBUG = true;  // We can toggle this when needed

const debugLog = (label, data) => {
  if (DEBUG) {
    console.group(`🔍 ${label}`);
    if (typeof data === 'object') {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(data);
    }
    console.groupEnd();
  }
};

/**
 * Component for rendering markdown content with consistent styling
 */
const MarkdownRenderer = ({ content }) => {
  return (
    <Box 
      className="markdown-content"
      p={6}
      bg="white"
      borderRadius="md"
      overflow="auto"
      maxH="800px"
      sx={{
        'h1, h2, h3, h4, h5, h6': {
          fontWeight: 'bold',
          my: 4,
        },
        'h1': { fontSize: '2xl' },
        'h2': { fontSize: 'xl' },
        'h3': { fontSize: 'lg' },
        'p': { my: 3 },
        'a': { 
          color: 'blue.500',
          textDecoration: 'none',
          _hover: { textDecoration: 'underline' }
        },
        'blockquote': {
          borderLeftWidth: '4px',
          borderLeftColor: 'gray.200',
          pl: 4,
          my: 4,
        },
        'ul, ol': {
          pl: 6,
          my: 4,
        },
        'li': {
          my: 1,
        },
        'pre': {
          bg: 'gray.50',
          p: 4,
          borderRadius: 'md',
          overflow: 'auto',
        },
        'code': {
          bg: 'gray.50',
          px: 2,
          py: 1,
          borderRadius: 'sm',
          fontSize: 'sm',
        },
        'img': {
          maxWidth: '100%',
          height: 'auto',
        }
      }}
    >
      {content}
    </Box>
  );
};

/**
 * Component for displaying content in fullscreen mode
 */
const FullscreenOverlay = ({ isOpen, onClose, children, content, isMarkdown }) => {
  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(0, 0, 0, 0.9)"
      zIndex={9999}
      display="flex"
      alignItems="center"
      justifyContent="center"
      onClick={onClose}
    >
      <IconButton
        icon={<FaCompress />}
        position="absolute"
        top={4}
        right={4}
        onClick={onClose}
        aria-label="Exit fullscreen"
        colorScheme="whiteAlpha"
      />
      <Box 
        onClick={e => e.stopPropagation()} 
        maxH="90vh" 
        maxW="90vw" 
        overflow="auto"
        bg={content ? "white" : "transparent"}
        borderRadius="md"
      >
        {content ? (
          isMarkdown ? (
            <Box p={8} maxW="1200px">
              <MarkdownRenderer content={content} />
            </Box>
          ) : typeof content === 'string' && content.startsWith('http') ? (
            <iframe
              src={content}
              width="100%"
              height="90vh"
              style={{ border: 'none' }}
              title="Fullscreen Content"
            />
          ) : (
            <Box p={8} maxW="1200px">
              <Text whiteSpace="pre-wrap" fontFamily="monospace">
                {content}
              </Text>
            </Box>
          )
        ) : (
          children
        )}
      </Box>
    </Box>
  );
};

/**
 * Component for displaying table-formatted metadata
 */
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

/**
 * Main component for displaying detailed artifact information
 */
const ArtifactDetailPage = () => {
  // Hooks
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const toast = useToast();
  const { catalogs, updateCatalogs } = useAppContext();

  // Get NFT data from location state
  const nft = location.state?.nft;
  const isSearchResult = location.state?.isSearchResult;

  // State management
  const [isAddToCatalogOpen, setIsAddToCatalogOpen] = useState(false);
  const [selectedCatalog, setSelectedCatalog] = useState('');
  const [imageUrl, setImageUrl] = useState('https://via.placeholder.com/400?text=Loading...');
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenContent, setFullscreenContent] = useState(null);
  const [isContentMarkdown, setIsContentMarkdown] = useState(false);
  const [parsedMarkdownContent, setParsedMarkdownContent] = useState(null);
  const [isParsingContent, setIsParsingContent] = useState(false);

  // Theme colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    const loadContent = async () => {
      if (nft.metadata?.content) {
        setIsParsingContent(true);
        try {
          const parsed = await parseContent(nft.metadata.content);
          debugLog('Content parsing result:', {
            hasContent: !!parsed,
            contentLength: parsed?.length
          });
          setParsedMarkdownContent(parsed);
        } catch (error) {
          console.error('Error parsing content:', error);
          setParsedMarkdownContent(null);
        } finally {
          setIsParsingContent(false);
        }
      }
    };
  
    loadContent();
  }, [nft.metadata?.content]); // Dependency on content changes

    /**
     * Helper function to parse content and detect markdown
     */
  /**
   * Parses and processes different types of content to determine if and how it should be rendered
   * as markdown. Handles direct content, Arweave URIs, Mirror.xyz content structures, and raw markdown.
   * 
   * @param {string|object} content - The content to parse
   * @returns {Promise<string|null>} The processed content ready for markdown rendering, or null if not markdown
   */
  const parseContent = async (content) => {
    debugLog('parseContent: Initial Input', {
      type: typeof content,
      value: content,
      isArweave: typeof content === 'string' && content.startsWith('ar://'),
      isObject: typeof content === 'object' && content !== null
    });

    try {
      // Early return if no content provided
      if (!content) {
        debugLog('parseContent: No content provided', null);
        return null;
      }

      // Handle Arweave URI content
      if (typeof content === 'string' && content.startsWith('ar://')) {
        debugLog('parseContent: Processing Arweave URI', content);
        const arweaveId = content.replace('ar://', '');
        const arweaveUrl = `https://arweave.net/${arweaveId}`;
        
        try {
          const response = await fetch(arweaveUrl);
          if (!response.ok) {
            throw new Error(`Arweave fetch failed: ${response.status}`);
          }
          
          const arweaveContent = await response.json();
          debugLog('parseContent: Retrieved Arweave content', arweaveContent);

          // Handle Mirror.xyz style content structure
          if (arweaveContent.content?.body) {
            debugLog('parseContent: Found Mirror.xyz content body', arweaveContent.content.body);
            return arweaveContent.content.body;
          }
          
          // Handle direct content in Arweave response
          if (arweaveContent.body) {
            debugLog('parseContent: Found direct content body', arweaveContent.body);
            return arweaveContent.body;
          }

          // Handle content field variations
          if (arweaveContent.text || arweaveContent.content) {
            const textContent = arweaveContent.text || arweaveContent.content;
            debugLog('parseContent: Found text/content field', textContent);
            return textContent;
          }

          // If no recognizable structure, return the whole content
          return JSON.stringify(arweaveContent, null, 2);
        } catch (error) {
          console.error('Error fetching Arweave content:', error);
          debugLog('parseContent: Arweave fetch error', error.message);
          return null;
        }
      }

      // Handle object content (non-Arweave)
      if (typeof content === 'object' && content !== null) {
        debugLog('parseContent: Processing object content', {
          hasBody: !!content.body,
          hasContentBody: !!content.content?.body,
          hasText: !!content.text,
          hasContent: !!content.content,
          keys: Object.keys(content)
        });

        // Check various content structures
        if (content.content?.body) {
          return content.content.body;
        }
        if (content.body) {
          return content.body;
        }
        if (content.text || content.content) {
          return content.text || content.content;
        }

        // If no recognized structure, stringify the object
        return JSON.stringify(content, null, 2);
      }

      // Handle string content (non-Arweave)
      if (typeof content === 'string') {
        // Common markdown indicators
        const markdownIndicators = [
          '#',        // Headers
          '-',        // Lists or horizontal rules
          '*',        // Emphasis or lists
          '```',      // Code blocks
          '>',        // Blockquotes
          '[',        // Links
          '|',        // Tables
          '1.',       // Numbered lists
          '<http',    // HTML-style links
          '![',       // Images
          '**',       // Bold text
          '_',        // Italic text
          '- [ ]',    // Task lists
          '```js',    // Code blocks with language
          '~~~'       // Alternative code blocks
        ];

        const foundIndicators = markdownIndicators.filter(indicator => 
          content.includes(indicator)
        );

        debugLog('parseContent: String content analysis', {
          length: content.length,
          foundMarkdownIndicators: foundIndicators,
          firstChars: content.slice(0, 100) + '...'
        });

        // If any markdown indicators are found, treat as markdown
        if (foundIndicators.length > 0) {
          debugLog('parseContent: Identified as markdown', {
            indicators: foundIndicators
          });
          return content;
        }
      }

      // If no markdown content detected
      debugLog('parseContent: No markdown content detected', null);
      return null;
    } catch (error) {
      console.error('Error parsing content:', error);
      debugLog('parseContent: Error occurred', {
        error: error.message,
        stack: error.stack
      });
      return null;
    }
  };

  /**
   * Handler for fullscreen content display
   */
  const handleFullscreenContent = (content, isMarkdown = false) => {
    setFullscreenContent(content);
    setIsContentMarkdown(isMarkdown);
    setIsFullscreen(true);
  };

  /**
   * Handlers for catalog management
   */
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

  /**
   * Effect for loading image data
   */
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

  // Early return if no NFT data
  if (!nft) {
    return <Box>No NFT data available</Box>;
  }

  /**
   * Helper function to render the image component
   */
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

  // Component render
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
              onClick={() => {
                if (nft) {
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
                }
              }}
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

      {/* Main Content Section */}
      <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="md" borderColor={borderColor} borderWidth={1}>
        {/* Title Section */}
        <Heading as="h2" size="xl" mb={4}>
          {nft.title || `Token ID: ${nft.id?.tokenId}`}
        </Heading>

        {/* Main Tab Navigation */}
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>Media</Tab>
            <Tab>Description</Tab>
            <Tab>Information</Tab>
          </TabList>

          <TabPanels>
            {/* Media Tab Panel */}
            <TabPanel>
              <Box>
                {/* Media Type Selection */}
                <Tabs size="sm" variant="soft-rounded" mb={4} isLazy>
                <TabList>
                  <Tab>Cover Image</Tab>
                  {nft.metadata?.animation_url && <Tab>Hosted View</Tab>}
                  {nft.metadata?.content && <Tab>Raw Content</Tab>}
                  {parsedMarkdownContent && <Tab>Rendered Content</Tab>}
                </TabList>

                  <TabPanels>
                    {/* Cover Image Display */}
                    <TabPanel p={0} pt={4}>
                      <Box position="relative">
                        {renderImage()}
                        <IconButton
                          icon={<FaExpand />}
                          position="absolute"
                          top={2}
                          right={2}
                          onClick={() => setIsFullscreen(true)}
                          aria-label="View fullscreen"
                          colorScheme="blackAlpha"
                        />
                      </Box>
                    </TabPanel>

                    {/* Hosted Content Display */}
                    {nft.metadata?.animation_url && (
                      <TabPanel p={0} pt={4}>
                        <Box 
                          position="relative" 
                          height="600px" 
                          border="1px solid" 
                          borderColor={borderColor}
                          borderRadius="md"
                          overflow="hidden"
                        >
                          <iframe
                            src={nft.metadata.animation_url}
                            width="100%"
                            height="100%"
                            style={{ border: 'none' }}
                            title="Hosted Content"
                          />
                          <IconButton
                            icon={<FaExpand />}
                            position="absolute"
                            top={2}
                            right={2}
                            onClick={() => handleFullscreenContent(nft.metadata.animation_url)}
                            aria-label="View fullscreen"
                            colorScheme="blackAlpha"
                          />
                        </Box>
                      </TabPanel>
                    )}

                    {/* Raw Content Display */}
                    {nft.metadata?.content && (
                      <TabPanel p={0} pt={4}>
                        <Box 
                          position="relative"
                          border="1px solid"
                          borderColor={borderColor}
                          borderRadius="md"
                          p={4}
                          maxH="800px"
                          overflow="auto"
                        >
                          <Text whiteSpace="pre-wrap" fontFamily="monospace" fontSize="sm">
                            {typeof nft.metadata.content === 'object' 
                              ? JSON.stringify(nft.metadata.content, null, 2)
                              : nft.metadata.content}
                          </Text>
                          <IconButton
                            icon={<FaExpand />}
                            position="absolute"
                            top={2}
                            right={2}
                            onClick={() => handleFullscreenContent(nft.metadata.content)}
                            aria-label="View fullscreen"
                            colorScheme="blackAlpha"
                          />
                        </Box>
                      </TabPanel>
                    )}

                    {/* Rendered Content Display */}
                    {(() => {
                      debugLog('Rendered Content Section', {
                        hasRawContent: !!nft.metadata?.content,
                        parsedContentResult: parsedMarkdownContent,
                        isLoading: isParsingContent,
                        willRender: !!parsedMarkdownContent
                      });

                      return parsedMarkdownContent ? (
                        <TabPanel p={0} pt={4}>
                          <Box position="relative">
                            {isParsingContent ? (
                              <Skeleton height="200px" />
                            ) : (
                              <>
                                <MarkdownRenderer content={parsedMarkdownContent} />
                                <IconButton
                                  icon={<FaExpand />}
                                  position="absolute"
                                  top={2}
                                  right={2}
                                  onClick={() => handleFullscreenContent(parsedMarkdownContent, true)}
                                  aria-label="View fullscreen"
                                  colorScheme="blackAlpha"
                                />
                              </>
                            )}
                          </Box>
                        </TabPanel>
                      ) : null;
                    })()}
                  </TabPanels>
                </Tabs>

                {/* Available Media Sources Section */}
                <Accordion allowToggle size="sm">
                  <AccordionItem>
                    <h3>
                      <AccordionButton>
                        <Box flex="1" textAlign="left" fontSize="sm">
                          Available Media Sources
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h3>
                    <AccordionPanel pb={4}>
                      <VStack align="stretch" spacing={2}>
                        <Box>
                          <Text fontWeight="bold" fontSize="sm">Cover Image:</Text>
                          <Text fontSize="sm" color="gray.600">{imageUrl}</Text>
                        </Box>
                        {nft.metadata?.animation_url && (
                          <Box>
                            <Text fontWeight="bold" fontSize="sm">Content URL:</Text>
                            <Text fontSize="sm" color="gray.600">{nft.metadata.animation_url}</Text>
                          </Box>
                        )}
                        {nft.metadata?.content && (
                          <Box>
                            <Text fontWeight="bold" fontSize="sm">Raw Content:</Text>
                            <Text fontSize="sm" color="gray.600">Available (encoded content)</Text>
                          </Box>
                        )}
                      </VStack>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              </Box>
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

        {/* Network and Spam Badges */}
        <HStack mt={4}>
          <Badge colorScheme="purple">{nft.network || 'Unknown Network'}</Badge>
          {nft.isSpam && <Badge colorScheme="red">Spam</Badge>}
        </HStack>
      </Box>

      {/* Fullscreen Overlay */}
      <FullscreenOverlay 
        isOpen={isFullscreen} 
        onClose={() => {
          setIsFullscreen(false);
          setFullscreenContent(null);
          setIsContentMarkdown(false);
        }}
        content={fullscreenContent}
        isMarkdown={isContentMarkdown}
      >
        {renderImage()}
      </FullscreenOverlay>

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
  )
};

export default ArtifactDetailPage;