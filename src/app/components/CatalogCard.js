import React from 'react';
import {
  VStack,
  Text,
  IconButton,
  Icon,
  Flex,
  Badge,
} from "@chakra-ui/react";
import { FaBook, FaEdit, FaTrash } from 'react-icons/fa';
import { StyledCard } from '../styles/commonStyles';
import { cardSizes } from '../constants/sizes';
import { logger } from '../utils/logger';

const CatalogCard = ({ 
  catalog, 
  onView, 
  onEdit, 
  onDelete, 
  cardSize = "md",
  isSystem = false 
}) => {
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
    if (onView && typeof onView === 'function') {
      logger.log('Viewing catalog:', { catalogId: catalog.id });
      onView(catalog);
    }
  };

  const nftCount = catalog.nftIds?.length || 0;

  return (
    <StyledCard 
      onClick={handleView}
      role="button"
      cursor="pointer"
      transition="transform 0.2s"
      _hover={{ 
        transform: 'translateY(-4px)',
        '& .action-buttons': { opacity: 1 }
      }}
      position="relative"
      p={cardSizes[cardSize].padding}
      width={cardSizes[cardSize].width}
      maxW="100%"
      bg="white"
      boxShadow="0 2px 4px rgba(47, 47, 47, 0.05)"
      borderColor="var(--shadow)"
    >
      {/* Action Buttons */}
      {!isSystem && (
        <Flex 
          position="absolute"
          top={1}
          right={1}
          className="action-buttons"
          opacity={0}
          transition="opacity 0.2s"
          zIndex={2}
        >
          <IconButton
            icon={<FaEdit />}
            aria-label="Edit catalog"
            size="sm"
            variant="ghost"
            color="var(--ink-grey)"
            onClick={handleEdit}
            mr={1}
            padding={1}
            minW="auto"
            height="auto"
            _hover={{ color: "var(--warm-brown)" }}
          />
          <IconButton
            icon={<FaTrash />}
            aria-label="Delete catalog"
            size="sm"
            variant="ghost"
            color="var(--ink-grey)"
            onClick={handleDelete}
            padding={1}
            minW="auto"
            height="auto"
            _hover={{ color: "red.500" }}
          />
        </Flex>
      )}

      {/* System Badge */}
      {isSystem && (
        <Badge
          position="absolute"
          top={2}
          right={2}
          bg="var(--warm-brown)"
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
  
      <VStack 
        spacing={cardSizes[cardSize].spacing} 
        align="center"
        my={cardSizes[cardSize].marginY}
      >
        <Icon 
          as={FaBook} 
          boxSize={cardSizes[cardSize].icon}
          color="var(--warm-brown)"
        />
        <Text 
          fontSize={cardSizes[cardSize].fontSize}
          fontFamily="Space Grotesk"
          color="var(--rich-black)"
          textAlign="center"
          noOfLines={2}
        >
          {catalog.name}
        </Text>
        <Text 
          fontSize="sm"
          fontFamily="Fraunces"
          color="var(--ink-grey)"
        >
          {nftCount} {nftCount === 1 ? 'Item' : 'Items'}
        </Text>
      </VStack>
    </StyledCard>
  );
};

export default CatalogCard;