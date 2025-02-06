// src/components/CatalogView/CatalogCard.jsx
import React from 'react';
import {
  Box,
  VStack,
  Text,
  IconButton,
  Flex,
  Icon,
  HStack,
  Tooltip,
} from "@chakra-ui/react";
import { FaBook, FaEdit, FaTrash } from 'react-icons/fa';
import { motion } from 'framer-motion';


const MotionBox = motion(Box);

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
    if (!isSystem && onEdit) {
      onEdit(catalog);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (!isSystem && onDelete) {
      onDelete(catalog.id);
    }
  };

  const sizes = {
    sm: {
      padding: 4,
      iconSize: 8,
      titleSize: "md",
      statSize: "sm",
    },
    md: {
      padding: 6,
      iconSize: 12,
      titleSize: "lg",
      statSize: "md",
    },
    lg: {
      padding: 8,
      iconSize: 16,
      titleSize: "xl",
      statSize: "lg",
    }
  };

  const currentSize = sizes[cardSize];

  return (
    <MotionBox
      as="article"
      position="relative"
      cursor="pointer"
      onClick={() => onView(catalog)}
      whileHover={{ 
        y: -4,
        transition: { duration: 0.2 }
      }}
      bg="var(--paper-white)"
      borderRadius="md"
      borderWidth="1px"
      borderColor="var(--shadow)"
      p={currentSize.padding}
      role="button"
      aria-label={`View ${catalog.name} catalog`}
      _hover={{
        borderColor: "var(--warm-brown)",
        boxShadow: "lg",
        "& .action-buttons": {
          opacity: 1
        }
      }}
      transition="all 0.2s"
    >
      {/* Action Buttons */}
      {!isSystem && (
        <Flex 
          position="absolute"
          top={2}
          right={2}
          opacity={0}
          className="action-buttons"
          transition="opacity 0.2s"
          zIndex={2}
          gap={1}
        >
          <Tooltip label="Edit catalog" placement="top">
            <IconButton
              icon={<FaEdit />}
              aria-label="Edit catalog"
              size="sm"
              variant="ghost"
              color="var(--ink-grey)"
              onClick={handleEdit}
              _hover={{
                color: "var(--warm-brown)",
                bg: "var(--highlight)"
              }}
            />
          </Tooltip>
          <Tooltip label="Delete catalog" placement="top">
            <IconButton
              icon={<FaTrash />}
              aria-label="Delete catalog"
              size="sm"
              variant="ghost"
              color="var(--ink-grey)"
              onClick={handleDelete}
              _hover={{
                color: "red.500",
                bg: "red.50"
              }}
            />
          </Tooltip>
        </Flex>
      )}

      {/* Main Content */}
      <VStack spacing={4} align="center">
        <Icon 
          as={FaBook} 
          boxSize={currentSize.iconSize} 
          color="var(--warm-brown)"
        />
        
        <VStack spacing={1}>
          <Text
            fontSize={currentSize.titleSize}
            fontWeight="medium"
            fontFamily="Space Grotesk"
            color="var(--rich-black)"
            textAlign="center"
            noOfLines={2}
          >
            {catalog.name}
          </Text>
          
          {catalog.description && (
            <Text
              fontSize={currentSize.statSize}
              fontFamily="Fraunces"
              color="var(--ink-grey)"
              textAlign="center"
              noOfLines={2}
            >
              {catalog.description}
            </Text>
          )}
        </VStack>

        <VStack spacing={1}>
          <HStack 
            spacing={2}
            justify="center"
            fontSize={currentSize.statSize}
          >
            <Text 
              fontFamily="Space Grotesk"
              color="var(--rich-black)"
            >
              {catalog.nftIds?.length || 0}
            </Text>
            <Text
              fontFamily="Fraunces"
              color="var(--ink-grey)"
            >
              {catalog.nftIds?.length === 1 ? 'Item' : 'Items'}
            </Text>
          </HStack>

          <Text
            fontSize="xs"
            fontFamily="Inter"
            color="var(--ink-grey)"
          >
            Updated {new Date(catalog.updatedAt).toLocaleDateString()}
          </Text>
        </VStack>

        {/* System Badge */}
        {isSystem && (
          <Box
            position="absolute"
            top={2}
            right={2}
            bg="var(--warm-brown)"
            color="white"
            px={2}
            py={1}
            borderRadius="md"
            fontSize="xs"
            fontFamily="Inter"
          >
            System
          </Box>
        )}
      </VStack>
    </MotionBox>
  );
};

export default CatalogCard;