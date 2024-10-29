import React from 'react';
import {
  Box,
  VStack,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Portal,
  Text
} from "@chakra-ui/react";
import { FaFolderPlus, FaLayerGroup, FaPlus } from 'react-icons/fa';

const NewMenuPopover = ({ onNewFolder, onNewCatalog }) => {
  return (
    <Popover placement="right-start">
      <PopoverTrigger>
        <Button
          leftIcon={<FaPlus />}
          variant="ghost"
          justifyContent={{ base: "center", md: "flex-start" }}
          w="100%"
          py={3}
          borderRadius="md"
        >
          <Text display={{ base: "none", md: "block" }}>New</Text>
        </Button>
      </PopoverTrigger>
      <Portal>
        <PopoverContent w="200px">
          <PopoverBody p={2}>
            <VStack spacing={2} align="stretch">
              <Button
                leftIcon={<FaLayerGroup />}
                variant="ghost"
                onClick={onNewCatalog}
                justifyContent="flex-start"
              >
                New Catalog
              </Button>
              <Button
                leftIcon={<FaFolderPlus />}
                variant="ghost"
                onClick={onNewFolder}
                justifyContent="flex-start"
              >
                New Folder
              </Button>
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Portal>
    </Popover>
  );
};

export default NewMenuPopover;