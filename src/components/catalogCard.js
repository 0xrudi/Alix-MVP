import React, { useMemo } from 'react';
import {
  VStack,
  Text,
  IconButton,
  Icon,
  Flex,
  useColorModeValue,
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
  const catalogColor = useColorModeValue('purple.400', 'purple.600');
  
  const nftCount = useMemo(() => {
    if (catalog.count !== undefined) return catalog.count;
    return catalog.nftIds?.length || 0;
  }, [catalog]);

  const handleEdit = (e) => {
    if (isSystem) return;
    e.stopPropagation();
    logger.log('Editing catalog:', { catalogId: catalog.id });
    onEdit();
  };

  const handleDelete = (e) => {
    if (isSystem) return;
    e.stopPropagation();
    logger.log('Deleting catalog:', { catalogId: catalog.id, nftCount });
    onDelete();
  };

  const handleView = () => {
    logger.log('Viewing catalog:', { catalogId: catalog.id });
    onView();
  };

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
    >
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
            colorScheme="blue"
            onClick={handleEdit}
            mr={1}
            padding={1}
            minW="auto"
            height="auto"
          />
          <IconButton
            icon={<FaTrash />}
            aria-label="Delete catalog"
            size="sm"
            variant="ghost"
            colorScheme="red"
            onClick={handleDelete}
            padding={1}
            minW="auto"
            height="auto"
          />
        </Flex>
      )}

      <VStack 
        spacing={cardSizes[cardSize].spacing} 
        align="center"
        my={cardSizes[cardSize].marginY}
      >
        <Icon 
          as={FaBook} 
          boxSize={cardSizes[cardSize].icon}
          color={catalogColor} 
        />
        <Text 
          fontSize={cardSizes[cardSize].fontSize}
          fontWeight="bold"
          textAlign="center"
          noOfLines={2}
        >
          {catalog.name}
        </Text>
        <Text fontSize="xs" color="gray.500">
          {nftCount} {nftCount === 1 ? 'Artifact' : 'Artifacts'}
        </Text>
      </VStack>
    </StyledCard>
  );
};

export default CatalogCard;