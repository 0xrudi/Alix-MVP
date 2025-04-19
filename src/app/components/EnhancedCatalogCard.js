import React, { useState } from 'react';
import {
  VStack,
  Text,
  IconButton,
  Icon,
  Flex,
  Badge,
  Box,
  HStack,
  useColorModeValue,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Skeleton,
} from "@chakra-ui/react";
import { FaBook, FaEdit, FaTrash, FaEllipsisV, FaEye, FaLayerGroup } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { cardSizes } from './constants/sizes';
import { logger } from '../../utils/logger';
import { useNavigate } from 'react-router-dom';

// Motion-enhanced Box component
const MotionBox = motion(Box);

/**
 * Enhanced CatalogCard component for displaying catalogs in grid or list view
 * 
 * @param {Object} catalog - The catalog data to display
 * @param {Function} onEdit - Function to call when editing the catalog
 * @param {Function} onDelete - Function to call when deleting the catalog
 * @param {string} cardSize - Size of the card (sm, md, lg)
 * @param {boolean} isSystem - Whether this is a system catalog
 * @param {string} viewMode - Display mode (grid or list)
 */
const EnhancedCatalogCard = ({ 
  catalog, 
  onEdit, 
  onDelete, 
  cardSize = "md",
  isSystem = false,
  viewMode = "grid"
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Chakra UI color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const highlightBg = useColorModeValue('gray.50', 'gray.700');
  const badgeBg = useColorModeValue('blue.500', 'blue.400');
  const systemBadgeBg = useColorModeValue('purple.500', 'purple.400');

  // Event handlers
  const handleEdit = (e) => {
    e.stopPropagation();
    if (!isSystem && onEdit && typeof onEdit === 'function') {
      logger.log('Editing catalog:', { catalogId: catalog.id });
      onEdit(catalog);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (!isSystem && onDelete && typeof onDelete === 'function') {
      logger.log('Deleting catalog:', { catalogId: catalog.id });
      onDelete(catalog.id);
    }
  };

  const handleView = () => {
    logger.log('Viewing catalog:', { catalogId: catalog.id });
    setIsLoading(true);
    
    // Navigate to the new catalog view page with the catalog ID
    navigate(`/app/catalogs/${catalog.id}`);
    
    // In a real implementation, you might want to cancel this if the component unmounts
    setTimeout(() => setIsLoading(false), 300);
  };

  // Determine the correct counts
  const nftCount = catalog.nftCount || catalog.nftIds?.length || 0;

  // Render in grid mode (default)
  if (viewMode === "grid") {
    return (
      <MotionBox
        onClick={handleView}
        role="button"
        cursor="pointer"
        transition="all 0.2s"
        whileHover={{ y: -4, boxShadow: "0 6px 16px rgba(0, 0, 0, 0.1)" }}
        position="relative"
        p={cardSizes[cardSize]?.padding || 4}
        width={cardSizes[cardSize]?.width || "100%"}
        maxW="100%"
        bg={cardBg}
        boxShadow="0 2px 4px rgba(0, 0, 0, 0.05)"
        borderRadius="lg"
        borderWidth="1px"
        borderColor="var(--shadow)"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        opacity={isLoading ? 0.7 : 1}
      >
        {/* System Badge */}
        {isSystem && (
          <Badge
            position="absolute"
            top={2}
            right={2}
            bg={systemBadgeBg}
            color="white"
            fontSize="xs"
            px={2}
            py={0.5}
            borderRadius="full"
            fontFamily="Inter"
          >
            System
          </Badge>
        )}

        {/* Action Buttons - Only show on hover for non-system catalogs */}
        {!isSystem && (
          <Flex 
            position="absolute"
            top={2}
            right={2}
            opacity={isHovered ? 1 : 0}
            transition="opacity 0.2s"
            zIndex={2}
          >
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<FaEllipsisV />}
                variant="ghost"
                aria-label="Options"
                size="sm"
                color="gray.500"
                _hover={{ bg: 'gray.100', color: 'gray.800' }}
              />
              <MenuList>
                <MenuItem icon={<FaEye />} onClick={handleView}>
                  View
                </MenuItem>
                <MenuItem icon={<FaEdit />} onClick={handleEdit}>
                  Edit
                </MenuItem>
                <MenuItem icon={<FaTrash />} onClick={handleDelete} color="red.500">
                  Delete
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        )}

        <VStack 
          spacing={cardSizes[cardSize]?.spacing || 3} 
          align="center"
          my={cardSizes[cardSize]?.marginY || 0}
        >
          <Skeleton isLoaded={!isLoading} borderRadius="full" padding={1}>
            <Icon 
              as={FaLayerGroup} 
              boxSize={cardSizes[cardSize]?.icon || 8}
              color="var(--warm-brown)"
            />
          </Skeleton>
          
          <Skeleton isLoaded={!isLoading}>
            <Text 
              fontSize={cardSizes[cardSize]?.fontSize || "lg"}
              fontFamily="Space Grotesk"
              color="var(--rich-black)"
              textAlign="center"
              noOfLines={2}
              fontWeight="medium"
            >
              {catalog.name}
            </Text>
          </Skeleton>
          
          <Skeleton isLoaded={!isLoading}>
            <Text 
              fontSize="sm"
              fontFamily="Inter"
              color="var(--ink-grey)"
            >
              {nftCount} {nftCount === 1 ? 'Item' : 'Items'}
            </Text>
          </Skeleton>
          
          {catalog.updatedAt && (
            <Skeleton isLoaded={!isLoading}>
              <Text 
                fontSize="xs"
                fontFamily="Inter"
                color="gray.500"
              >
                Updated {catalog.updatedAt ? new Date(catalog.updatedAt).toLocaleDateString() : ''}
              </Text>
            </Skeleton>
          )}
        </VStack>
      </MotionBox>
    );
  }
  
  // Render in list mode
  return (
    <MotionBox
      onClick={handleView}
      role="button"
      cursor="pointer"
      transition="all 0.2s"
      whileHover={{ bg: highlightBg }}
      position="relative"
      width="100%"
      bg={isHovered ? highlightBg : cardBg}
      borderRadius="md"
      borderWidth="1px"
      borderColor="var(--shadow)"
      mb={2}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      opacity={isLoading ? 0.7 : 1}
    >
      <Flex 
        align="center" 
        p={3} 
        justify="space-between"
      >
        <HStack spacing={4}>
          <Skeleton isLoaded={!isLoading} borderRadius="full" padding={1}>
            <Icon 
              as={FaLayerGroup} 
              boxSize={6}
              color="var(--warm-brown)"
            />
          </Skeleton>
          
          <VStack align="flex-start" spacing={0}>
            <Skeleton isLoaded={!isLoading} width={isLoading ? "150px" : "auto"}>
              <Text 
                fontSize="md"
                fontFamily="Space Grotesk"
                color="var(--rich-black)"
                fontWeight="medium"
              >
                {catalog.name}
              </Text>
            </Skeleton>
            
            <Skeleton isLoaded={!isLoading} width={isLoading ? "100px" : "auto"}>
              <Text 
                fontSize="sm"
                fontFamily="Inter"
                color="var(--ink-grey)"
              >
                {nftCount} {nftCount === 1 ? 'Item' : 'Items'}
              </Text>
            </Skeleton>
          </VStack>
        </HStack>
        
        <HStack>
          {isSystem && (
            <Badge
              bg={systemBadgeBg}
              color="white"
              fontSize="xs"
              px={2}
              py={0.5}
              borderRadius="full"
              fontFamily="Inter"
              mr={2}
            >
              System
            </Badge>
          )}
          
          {!isSystem && (
            <HStack spacing={1} opacity={isHovered ? 1 : 0.5} transition="opacity 0.2s">
              <Tooltip label="View Catalog" placement="top">
                <IconButton
                  icon={<FaEye />}
                  aria-label="View catalog"
                  size="sm"
                  variant="ghost"
                  onClick={handleView}
                />
              </Tooltip>
              <Tooltip label="Edit Catalog" placement="top">
                <IconButton
                  icon={<FaEdit />}
                  aria-label="Edit catalog"
                  size="sm"
                  variant="ghost"
                  onClick={handleEdit}
                />
              </Tooltip>
              <Tooltip label="Delete Catalog" placement="top">
                <IconButton
                  icon={<FaTrash />}
                  aria-label="Delete catalog"
                  size="sm"
                  variant="ghost"
                  color="red.400"
                  onClick={handleDelete}
                />
              </Tooltip>
            </HStack>
          )}
        </HStack>
      </Flex>
    </MotionBox>
  );
};

export default EnhancedCatalogCard;