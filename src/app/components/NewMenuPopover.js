import React, { useRef } from 'react';
import {
  Box,
  VStack,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Portal,
  Text,
  useBreakpointValue,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerBody,
  useDisclosure,
  Flex,
  HStack,
  useColorModeValue,
  IconButton
} from "@chakra-ui/react";
import { 
  FaFolderPlus, 
  FaLayerGroup, 
  FaPlus 
} from 'react-icons/fa';

const NewMenuPopover = ({ onNewFolder, onNewCatalog }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const buttonSize = useBreakpointValue({ base: "sm", md: "md" });
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('var(--shadow)', 'gray.700');

  // For mobile, we use a drawer that slides up from the bottom
  // For desktop, we use a popover near the button
  if (isMobile) {
    return (
      <>
        <Button
          leftIcon={<FaPlus />}
          onClick={onOpen}
          ref={btnRef}
          size={buttonSize}
          bg="var(--warm-brown)"
          color="white"
          _hover={{ bg: "var(--deep-brown)" }}
        >
          New
        </Button>

        <Drawer
          isOpen={isOpen}
          placement="bottom"
          onClose={onClose}
          finalFocusRef={btnRef}
        >
          <DrawerOverlay />
          <DrawerContent
            borderTopRadius="md"
            bg={bgColor}
            pb={2}
          >
            <DrawerBody px={4} pt={4} pb={2}>
              <VStack spacing={3} align="stretch">
                <Text fontWeight="bold" fontFamily="Space Grotesk" color="var(--rich-black)">
                  Create New
                </Text>
                <Flex justify="space-between" gap={3}>
                  <Button
                    leftIcon={<FaFolderPlus />}
                    onClick={() => {
                      onClose();
                      onNewFolder();
                    }}
                    colorScheme="gray"
                    variant="outline"
                    width="50%"
                    bg="var(--paper-white)"
                    borderColor={borderColor}
                    _hover={{ bg: "var(--highlight)" }}
                  >
                    New Folder
                  </Button>
                  <Button
                    leftIcon={<FaLayerGroup />}
                    onClick={() => {
                      onClose();
                      onNewCatalog();
                    }}
                    colorScheme="gray"
                    variant="outline"
                    width="50%"
                    bg="var(--paper-white)"
                    borderColor={borderColor}
                    _hover={{ bg: "var(--highlight)" }}
                  >
                    New Catalog
                  </Button>
                </Flex>
              </VStack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Desktop version with popover
  return (
    <Popover placement="bottom-end" closeOnBlur closeOnEsc>
      <PopoverTrigger>
        <Button
          leftIcon={<FaPlus />}
          size={buttonSize}
          bg="var(--warm-brown)"
          color="white"
          _hover={{ bg: "var(--deep-brown)" }}
        >
          New
        </Button>
      </PopoverTrigger>
      <Portal>
        <PopoverContent w="220px" bg={bgColor} borderColor={borderColor} boxShadow="md">
          <PopoverBody p={2}>
            <VStack spacing={2} align="stretch">
              <Button
                leftIcon={<FaLayerGroup />}
                variant="ghost"
                onClick={onNewCatalog}
                justifyContent="flex-start"
                _hover={{ bg: "var(--highlight)" }}
              >
                New Catalog
              </Button>
              <Button
                leftIcon={<FaFolderPlus />}
                variant="ghost"
                onClick={onNewFolder}
                justifyContent="flex-start"
                _hover={{ bg: "var(--highlight)" }}
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