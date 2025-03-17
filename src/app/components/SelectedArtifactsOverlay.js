import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  VStack,
  IconButton,
  Button,
  Collapse,
  CloseButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useBreakpointValue,
  HStack,
  Spinner
} from "@chakra-ui/react";
import { FaChevronUp, FaChevronDown, FaTrash, FaBook, FaFolderPlus, FaTimes } from 'react-icons/fa';
import { supabase } from '../../utils/supabase';
import { logger } from '../../utils/logger';
import { useCustomToast } from '../../utils/toastUtils';

const SelectedArtifactsOverlay = ({ 
  selectedArtifacts,
  onRemoveArtifact,
  onAddToSpam,
  onCreateCatalog,
  onAddToExistingCatalog,
  catalogs,
  onClearSelections,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useBreakpointValue({ base: true, md: false });
  const touchStartY = useRef(null);
  const touchStartTime = useRef(null);
  const headerRef = useRef(null);
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const [isAddingToCatalog, setIsAddingToCatalog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mobile-specific styles
  const mobileStyles = {
    overlay: {
      width: "100%",
      right: 0,
      bottom: "60px", // Height of mobile menu
      borderTopRadius: 0,
    },
    expanded: {
      height: "calc(100vh - 60px)", // Full height minus mobile menu
      bottom: "60px",
    }
  };

  // Desktop styles
  const desktopStyles = {
    overlay: {
      width: "300px",
      right: 4,
      bottom: 0,
      borderTopRadius: "md",
    },
    expanded: {
      maxHeight: "80vh",
    }
  };

  const styles = isMobile ? mobileStyles : desktopStyles;

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
  };

  const handleTouchMove = (e) => {
    if (!touchStartY.current) return;

    const touchEndY = e.touches[0].clientY;
    const deltaY = touchEndY - touchStartY.current;
    const timeDelta = Date.now() - touchStartTime.current;

    // Require minimum movement and maximum time for swipe
    if (Math.abs(deltaY) > 30 && timeDelta < 300) {
      if (deltaY > 0 && isExpanded) {
        // Swipe down to collapse
        setIsExpanded(false);
      } else if (deltaY < 0 && !isExpanded) {
        // Swipe up to expand
        setIsExpanded(true);
      }
      touchStartY.current = null;
    }
  };

  const handleTouchEnd = () => {
    touchStartY.current = null;
    touchStartTime.current = null;
  };

  const handleHeaderClick = (e) => {
    // Only toggle if clicking the header itself, not its children
    if (e.target === headerRef.current || e.target.closest('.header-content')) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleAddToSpam = async () => {
    setIsProcessing(true);
    try {
      // Call the parent's onAddToSpam first (which should update Redux)
      if (onAddToSpam) {
        await onAddToSpam();
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Process each selected artifact in Supabase
      const processPromises = selectedArtifacts.map(async (nft) => {
        try {
          // First check if the artifact exists in Supabase
          const { data: existingArtifact, error: findError } = await supabase
            .from('artifacts')
            .select('id')
            .eq('token_id', nft.id.tokenId)
            .eq('contract_address', nft.contract.address)
            .eq('wallet_id', nft.walletId)
            .maybeSingle();
            
          if (findError) {
            logger.error('Error finding artifact:', findError);
            return;
          }
          
          if (existingArtifact) {
            // Update existing artifact
            const { error: updateError } = await supabase
              .from('artifacts')
              .update({ is_spam: true })
              .eq('id', existingArtifact.id);
              
            if (updateError) {
              logger.error('Error updating artifact spam status:', updateError);
            }
          } else {
            // Create new artifact record
            const { error: insertError } = await supabase
              .from('artifacts')
              .insert([{
                token_id: nft.id.tokenId,
                contract_address: nft.contract.address,
                wallet_id: nft.walletId,
                network: nft.network || 'unknown',
                is_spam: true,
                title: nft.title || '',
                description: nft.description || '',
                metadata: nft.metadata || {}
              }]);
              
            if (insertError) {
              logger.error('Error creating artifact:', insertError);
            }
          }
        } catch (error) {
          logger.error('Error processing artifact for spam:', error);
        }
      });
      
      await Promise.all(processPromises);
      showSuccessToast(
        "Artifacts Marked as Spam",
        `${selectedArtifacts.length} artifact(s) marked as spam`
      );
      
      onClearSelections();
    } catch (error) {
      logger.error('Error adding artifacts to spam:', error);
      showErrorToast(
        "Action Failed",
        "Failed to mark artifacts as spam. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddToCatalog = async (catalogId) => {
    if (!catalogId) return;
    
    setIsAddingToCatalog(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');
      
      // Process each selected artifact
      const processPromises = selectedArtifacts.map(async (nft) => {
        try {
          // First, check if the artifact exists in Supabase
          const { data: existingArtifact, error: findError } = await supabase
            .from('artifacts')
            .select('id')
            .eq('token_id', nft.id.tokenId)
            .eq('contract_address', nft.contract.address)
            .eq('wallet_id', nft.walletId)
            .maybeSingle();
            
          if (findError) {
            logger.error('Error finding artifact:', findError);
            return;
          }
          
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
              
            if (insertError) {
              logger.error('Error creating artifact:', insertError);
              return;
            }
            
            artifactId = newArtifact.id;
          }
          
          // Check if this artifact is already in the catalog
          const { data: existingRelation, error: relationCheckError } = await supabase
            .from('catalog_artifacts')
            .select('*')
            .eq('catalog_id', catalogId)
            .eq('artifact_id', artifactId)
            .maybeSingle();
            
          if (relationCheckError) {
            logger.error('Error checking catalog artifact relation:', relationCheckError);
            return;
          }
          
          if (existingRelation) {
            // Already exists, no need to add
            return;
          }
          
          // Add to catalog_artifacts junction table
          const { error: relationError } = await supabase
            .from('catalog_artifacts')
            .insert([{
              catalog_id: catalogId,
              artifact_id: artifactId
            }]);
            
          if (relationError) {
            logger.error('Error creating catalog-artifact relationship:', relationError);
          }
        } catch (error) {
          logger.error('Error processing artifact for catalog:', error);
        }
      });
      
      await Promise.all(processPromises);

      // Call parent component handler after Supabase update is complete
      if (onAddToExistingCatalog) {
        onAddToExistingCatalog(catalogId);
      }
      
      // Find catalog name for the toast
      const catalogName = catalogs.find(c => c.id === catalogId)?.name || "catalog";
      
      showSuccessToast(
        "Added to Catalog",
        `${selectedArtifacts.length} artifacts added to ${catalogName}`
      );
      
      onClearSelections();
    } catch (error) {
      logger.error('Error adding artifacts to catalog:', error);
      showErrorToast(
        "Action Failed",
        "Failed to add artifacts to catalog. Please try again."
      );
    } finally {
      setIsAddingToCatalog(false);
    }
  };

  return (
    <Box
      position="fixed"
      {...styles.overlay}
      bg="var(--paper-white)"
      boxShadow="lg"
      zIndex={1000}
      display="flex"
      flexDirection="column"
      borderTop="1px solid"
      borderColor="var(--shadow)"
    >
      {/* Header */}
      <Flex
        ref={headerRef}
        justify="space-between"
        align="center"
        p={3}
        borderBottom="1px solid"
        borderColor="var(--shadow)"
        bg="var(--warm-white)"
        onClick={handleHeaderClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        cursor="pointer"
        className="header-content"
      >
        <Text 
          fontWeight="medium"
          fontFamily="Space Grotesk"
          color="var(--rich-black)"
        >
          Selected Artifacts: {selectedArtifacts.length}
        </Text>
        <HStack spacing={2}>
          <IconButton
            icon={<FaTimes />}
            variant="ghost"
            size="sm"
            aria-label="Clear selections"
            onClick={(e) => {
              e.stopPropagation();
              if (typeof onClearSelections === 'function') {
                onClearSelections();
              }
            }}
            color="var(--ink-grey)"
            _hover={{ color: "var(--warm-brown)" }}
            isDisabled={isProcessing || isAddingToCatalog}
          />
          <IconButton
            icon={isExpanded ? <FaChevronDown /> : <FaChevronUp />}
            variant="ghost"
            size="sm"
            aria-label={isExpanded ? "Collapse" : "Expand"}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            color="var(--ink-grey)"
            _hover={{ color: "var(--warm-brown)" }}
          />
        </HStack>
      </Flex>

      <Collapse 
        in={isExpanded} 
        style={{ 
          display: 'flex', 
          flexDirection: 'column',
          ...(isMobile && isExpanded ? styles.expanded : {})
        }}
      >
        {/* Action Buttons */}
        <VStack 
          p={3} 
          spacing={2} 
          borderBottom="1px solid" 
          borderColor="var(--shadow)"
          bg="var(--warm-white)"
        >
          <Button
            leftIcon={isProcessing ? <Spinner size="sm" /> : <FaTrash />}
            size="sm"
            width="100%"
            onClick={handleAddToSpam}
            bg="red.500"
            color="white"
            _hover={{ bg: "red.600" }}
            fontFamily="Inter"
            isDisabled={isProcessing || isAddingToCatalog}
          >
            {isProcessing ? "Processing..." : "Add to Spam"}
          </Button>

          <Button
            leftIcon={<FaBook />}
            size="sm"
            width="100%"
            onClick={onCreateCatalog}
            bg="var(--warm-brown)"
            color="white"
            _hover={{ bg: "var(--deep-brown)" }}
            fontFamily="Inter"
            isDisabled={isProcessing || isAddingToCatalog}
          >
            Create New Catalog
          </Button>

          <Menu>
            <MenuButton
              as={Button}
              size="sm"
              width="100%"
              bg="var(--deep-brown)"
              color="white"
              _hover={{ bg: "var(--warm-brown)" }}
              fontFamily="Inter"
              display="flex"
              alignItems="center"
              justifyContent="center"
              isDisabled={isProcessing || isAddingToCatalog}
            >
              <HStack spacing={2} justify="center">
                {isAddingToCatalog ? (
                  <Spinner size="sm" />
                ) : (
                  <FaFolderPlus />
                )}
                <Text>{isAddingToCatalog ? "Adding..." : "Add to Existing Catalog"}</Text>
              </HStack>
            </MenuButton>
            <MenuList>
              {catalogs?.map(catalog => (
                <MenuItem
                  key={catalog.id}
                  onClick={() => handleAddToCatalog(catalog.id)}
                  fontFamily="Inter"
                  isDisabled={isAddingToCatalog}
                >
                  {catalog.name}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        </VStack>

        {/* Selected Items */}
        <Box 
          overflowY="auto" 
          p={3} 
          flex={isMobile ? 1 : "none"}
          maxHeight={isMobile ? "none" : "300px"}
        >
          <VStack spacing={1}>
            {selectedArtifacts.map((artifact) => (
              <Flex
                key={`${artifact.contract?.address}-${artifact.id?.tokenId}`}
                align="center"
                bg="var(--highlight)"
                p={2}
                borderRadius="md"
                width="100%"
              >
                <Text 
                  fontSize="sm" 
                  flex={1} 
                  noOfLines={1}
                  fontFamily="Fraunces"
                  color="var(--rich-black)"
                >
                  {artifact.title || `Token ID: ${artifact.id?.tokenId}`}
                </Text>
                <CloseButton
                  size="sm"
                  onClick={() => onRemoveArtifact(artifact)}
                  color="var(--ink-grey)"
                  _hover={{ color: "var(--warm-brown)" }}
                  isDisabled={isProcessing || isAddingToCatalog}
                />
              </Flex>
            ))}
          </VStack>
        </Box>
      </Collapse>
    </Box>
  );
};

export default SelectedArtifactsOverlay;