import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { 
  FaArrowLeft, 
  FaBook, 
  FaTrash, 
  FaExternalLinkAlt,
} from 'react-icons/fa';

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
  useBreakpointValue,
  Container,
  Spacer,
  Wrap,
  WrapItem
} from "@chakra-ui/react";

import { getImageUrl } from '../../../utils/web3Utils.js';
import { parseContent } from '../../../utils/contentUtils.js';
import { useAppContext } from '../../../context/app/AppContext.js';
import { updateNFT } from '../../redux/slices/nftSlice.js';
import MediaTabPanel from './MediaTabPanel.js';
import { supabase } from '../../../utils/supabase';
import AttributesPanel from './AttributesPanel';


const MetadataDisplay = ({ data, level = 0 }) => {
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const fontSize = useBreakpointValue({ base: "sm", md: "md" });
  const padding = useBreakpointValue({ base: 2, md: 4 });
  const tableSize = useBreakpointValue({ base: "sm", md: "md" });

  const renderValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return <MetadataDisplay data={value} level={level + 1} />;
    return String(value);
  };

  return (
    <Table variant="simple" size={tableSize}>
      <Tbody>
        {Object.entries(data).map(([key, value]) => (
          <React.Fragment key={key}>
            {typeof value === 'object' && value !== null ? (
              <Tr>
                <Td colSpan={2} p={0}>
                  <Accordion allowToggle>
                    <AccordionItem border="none">
                      <AccordionButton bg={bgColor} _hover={{ bg: bgColor }}>
                        <Box flex="1" textAlign="left" fontWeight="bold" fontSize={fontSize}>
                          {key}
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                      <AccordionPanel pb={padding}>
                        {renderValue(value)}
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                </Td>
              </Tr>
            ) : (
              <Tr>
                <Th fontSize={fontSize} px={padding}>{key}</Th>
                <Td fontSize={fontSize} px={padding}>{renderValue(value)}</Td>
              </Tr>
            )}
          </React.Fragment>
        ))}
      </Tbody>
    </Table>
  );
};

// Design system colors
const designTokens = {
  warmWhite: "#F8F7F4",
  softCharcoal: "#2F2F2F",
  libraryBrown: "#8C7355",
  paperWhite: "#EFEDE8",
  inkGrey: "#575757",
  shadow: "#D8D3CC"
};

const ArtifactDetailPage = () => {
  // Existing hooks and state remain the same
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const toast = useToast();
  const { catalogs, updateCatalogs } = useAppContext();
  const nft = location.state?.nft;

  // Existing state declarations remain the same
  const [isAddToCatalogOpen, setIsAddToCatalogOpen] = useState(false);
  const [selectedCatalog, setSelectedCatalog] = useState('');
  const [imageUrl, setImageUrl] = useState('https://via.placeholder.com/400?text=Loading...');
  const [isLoading, setIsLoading] = useState(true);
  const [parsedMarkdownContent, setParsedMarkdownContent] = useState(null);
  const [isParsingContent, setIsParsingContent] = useState(false);

  // All breakpoint values defined before conditional return
  const buttonSize = useBreakpointValue({ base: "sm", md: "md" });
  const spacing = useBreakpointValue({ base: 2, md: 4 });
  const padding = useBreakpointValue({ base: 2, md: 4 });
  const headerSize = useBreakpointValue({ base: "lg", md: "xl" });
  const tabSize = useBreakpointValue({ base: "sm", md: "md" });
  const isMobile = useBreakpointValue({ base: true, md: false });
  const tabPanelPadding = useBreakpointValue({ base: 2, md: 4 });
  const contentFontSize = useBreakpointValue({ base: "md", md: "lg" });
  const tableSize = useBreakpointValue({ base: "sm", md: "md" });

  // All existing useEffects remain the same
  useEffect(() => {
    if (nft?.metadata?.content) {
      setIsParsingContent(true);
      parseContent(nft.metadata.content)
        .then(parsed => setParsedMarkdownContent(parsed))
        .catch(error => {
          console.error('Error parsing content:', error);
          setParsedMarkdownContent(null);
        })
        .finally(() => setIsParsingContent(false));
    }
  }, [nft?.metadata?.content]);

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
        if (mounted) setIsLoading(false);
      }
    };
    loadImage();
    return () => { mounted = false; };
  }, [nft]);

  // All existing handlers remain the same
  const handleAddToCatalog = () => setIsAddToCatalogOpen(true);

  const handleConfirmAddToCatalog = async () => {
    if (selectedCatalog) {
      try {
        // Update Redux state (optimistic update)
        const updatedCatalogs = catalogs.map(catalog => 
          catalog.id === selectedCatalog 
            ? { ...catalog, nfts: [...catalog.nfts, nft] }
            : catalog
        );
        updateCatalogs(updatedCatalogs);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No authenticated user');
        
        // Check if artifact exists in Supabase
        const { data: existingArtifact, error: findError } = await supabase
          .from('artifacts')
          .select('id')
          .eq('token_id', nft.id.tokenId)
          .eq('contract_address', nft.contract.address)
          .eq('wallet_id', nft.walletId)
          .maybeSingle();
          
        if (findError) throw findError;
        
        let artifactId;
        
        if (existingArtifact) {
          artifactId = existingArtifact.id;
        } else {
          // Create new artifact record
          const { data: newArtifact, error: insertError } = await supabase
            .from('artifacts')
            .insert([{
              token_id: nft.id.tokenId,
              contract_address: nft.contract.address,
              wallet_id: nft.walletId,
              network: nft.network || 'unknown',
              is_spam: nft.isSpam || false,
              title: nft.title || '',
              description: nft.description || '',
              metadata: nft.metadata || {}
            }])
            .select('id')
            .single();
            
          if (insertError) throw insertError;
          
          artifactId = newArtifact.id;
        }
        
        // Create catalog-artifact relationship
        const { error: relError } = await supabase
          .from('catalog_artifacts')
          .insert([{
            catalog_id: selectedCatalog,
            artifact_id: artifactId
          }]);
          
        if (relError) throw relError;
        
        toast({
          title: "NFT Added to Catalog",
          description: "The NFT has been added to the selected catalog.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        setIsAddToCatalogOpen(false);
      } catch (error) {
        console.error('Error adding NFT to catalog:', error);
        toast({
          title: "Error",
          description: "Failed to add NFT to catalog. Please try again.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const handleMarkAsSpam = async () => {
    try {
      // Update Redux state (optimistic update)
      dispatch(updateNFT({
        walletId: nft.walletId,
        nft: { ...nft, isSpam: !nft.isSpam }
      }));
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');
      
      // Find the artifact in Supabase
      const { data: existingArtifact, error: findError } = await supabase
        .from('artifacts')
        .select('id')
        .eq('token_id', nft.id.tokenId)
        .eq('contract_address', nft.contract.address)
        .eq('wallet_id', nft.walletId)
        .maybeSingle();
      
      if (findError) throw findError;
      
      if (existingArtifact) {
        // Update existing artifact
        const { error: updateError } = await supabase
          .from('artifacts')
          .update({ is_spam: !nft.isSpam })
          .eq('id', existingArtifact.id);
          
        if (updateError) throw updateError;
      } else {
        // Insert new artifact record with spam status
        const { error: insertError } = await supabase
          .from('artifacts')
          .insert([{
            token_id: nft.id.tokenId,
            contract_address: nft.contract.address,
            wallet_id: nft.walletId,
            network: nft.network || 'unknown',
            is_spam: !nft.isSpam,
            title: nft.title || '',
            description: nft.description || '',
            metadata: nft.metadata || {}
          }]);
          
        if (insertError) throw insertError;
      }
      
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
    } catch (error) {
      console.error('Error toggling spam status:', error);
      toast({
        title: "Error",
        description: "Failed to update spam status. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (!nft) {
    return <Box p={padding}><Text>No NFT data available</Text></Box>;
  }

  return (
    <Box maxW="container.xl" mx="auto" p={padding} bg={designTokens.warmWhite}>
      <Flex 
        direction={{ base: "column", md: "row" }} 
        gap={spacing} 
        mb={6}
        align={{ base: "stretch", md: "center" }}
      >
        <Button
          leftIcon={<FaArrowLeft />}
          onClick={() => navigate(-1)}
          size={buttonSize}
          width={{ base: "full", md: "auto" }}
          variant="ghost"
          color={designTokens.softCharcoal}
          _hover={{ color: designTokens.libraryBrown }}
        >
          Back
        </Button>
        
        <Spacer display={{ base: "none", md: "block" }} />
        
        <HStack spacing={spacing} width={{ base: "full", md: "auto" }}>
          <Tooltip label="Mark as Spam" placement="top">
            <IconButton
              icon={<FaTrash />}
              aria-label="Mark as spam"
              variant="ghost"
              color={designTokens.softCharcoal}
              _hover={{ color: designTokens.libraryBrown }}
              onClick={handleMarkAsSpam}
              size={buttonSize}
              flex={{ base: 1, md: "auto" }}
            />
          </Tooltip>

          <Tooltip label="Add to Catalog" placement="top">
            <IconButton
              icon={<FaBook />}
              aria-label="Add to catalog"
              variant="ghost"
              color={designTokens.softCharcoal}
              _hover={{ color: designTokens.libraryBrown }}
              onClick={handleAddToCatalog}
              size={buttonSize}
              flex={{ base: 1, md: "auto" }}
            />
          </Tooltip>
        </HStack>
      </Flex>

      <Box 
        bg={designTokens.paperWhite} 
        p={padding} 
        borderRadius="lg" 
        boxShadow="md" 
        borderColor={designTokens.shadow} 
        borderWidth={1}
      >
        <Box mb={6}>
          <Heading 
            as="h2" 
            size={headerSize} 
            mb={2}
            color={designTokens.softCharcoal}
            fontWeight="light"
            fontFamily="Studio Feixen Sans"
          >
            {nft.title || `Token ID: ${nft.id?.tokenId}`}
          </Heading>
          <HStack spacing={2}>
            <Badge bg={designTokens.libraryBrown} color={designTokens.warmWhite}>
              {nft.network || 'Unknown Network'}
            </Badge>
            {nft.isSpam && (
              <Badge colorScheme="red">Spam</Badge>
            )}
          </HStack>
        </Box>

        <Tabs 
          variant="enclosed" 
          colorScheme="gray"
          size={tabSize}
          isFitted={isMobile}
        >
          <TabList borderBottomColor={designTokens.shadow}>
            <Tab 
              _selected={{ 
                color: designTokens.libraryBrown,
                borderBottomColor: designTokens.libraryBrown 
              }}
            >
              Media
            </Tab>
            <Tab 
              _selected={{ 
                color: designTokens.libraryBrown,
                borderBottomColor: designTokens.libraryBrown 
              }}
            >
              Description
            </Tab>
            <Tab 
              _selected={{ 
                color: designTokens.libraryBrown,
                borderBottomColor: designTokens.libraryBrown 
              }}
            >
              Information
            </Tab>
            {/* Add this new Tab */}
            <Tab 
              _selected={{ 
                color: designTokens.libraryBrown,
                borderBottomColor: designTokens.libraryBrown 
              }}
            >
              Attributes
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel p={tabPanelPadding}>
              <MediaTabPanel
                nft={nft}
                imageUrl={imageUrl}
                isLoading={isLoading}
                parsedMarkdownContent={parsedMarkdownContent}
                isParsingContent={isParsingContent}
                borderColor={designTokens.shadow}
              />
            </TabPanel>

            <TabPanel>
              <Box maxWidth="800px" mx="auto">
                <Text
                  fontSize={contentFontSize}
                  lineHeight="1.8"
                  whiteSpace="pre-wrap"
                  fontFamily="Fraunces"
                  color={designTokens.softCharcoal}
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

            <TabPanel>
              <VStack align="stretch" spacing={4}>
                <Accordion allowMultiple>
                  {/* Existing accordion items */}
                </Accordion>

                {nft.externalUrl && (
                  <Link 
                    href={nft.externalUrl} 
                    isExternal 
                    color={designTokens.libraryBrown}
                    _hover={{ color: designTokens.softCharcoal }}
                  >
                    View on External Site <FaExternalLinkAlt style={{ display: 'inline', marginLeft: '0.5rem' }} />
                  </Link>
                )}
              </VStack>
            </TabPanel>

            {/* Add this new TabPanel for Attributes */}
            <TabPanel>
              <AttributesPanel
                nft={nft}
                designTokens={designTokens}
              />
            </TabPanel>
          </TabPanels>

        </Tabs>
      </Box>

      <Modal isOpen={isAddToCatalogOpen} onClose={() => setIsAddToCatalogOpen(false)}>
        <ModalOverlay />
        <ModalContent margin={4} bg={designTokens.warmWhite}>
          <ModalHeader color={designTokens.softCharcoal}>Add to Catalog</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Select
              placeholder="Select catalog"
              value={selectedCatalog}
              onChange={(e) => setSelectedCatalog(e.target.value)}
              bg={designTokens.paperWhite}
              _hover={{ borderColor: designTokens.libraryBrown }}
            >
              {catalogs.map((catalog) => (
                <option key={catalog.id} value={catalog.id}>
                  {catalog.name}
                </option>
              ))}
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button 
              colorScheme="gray" 
              mr={3} 
              onClick={handleConfirmAddToCatalog}
              bg={designTokens.libraryBrown}
              color={designTokens.warmWhite}
              _hover={{ bg: designTokens.softCharcoal }}
            >
              Add
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setIsAddToCatalogOpen(false)}
              color={designTokens.softCharcoal}
              _hover={{ color: designTokens.libraryBrown }}
            >
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ArtifactDetailPage;