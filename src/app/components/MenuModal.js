import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Text,
  useColorModeValue,
  IconButton,
  Tooltip,
  useBreakpointValue,
  Flex,
  Divider
} from "@chakra-ui/react";
import { FaHome, FaBookOpen, FaUser, FaCog } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

const MenuModal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Responsive styles
  const display = useBreakpointValue({ base: "block", md: "none" });
  const desktopDisplay = useBreakpointValue({ base: "none", md: "block" });
  const buttonSize = useBreakpointValue({ base: "sm", md: "md" });
  const iconSpacing = useBreakpointValue({ base: 1, md: 2 });
  const contentPadding = useBreakpointValue({ base: 2, md: 4 });
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  // Theme colors
  const bgColor = useColorModeValue('gray.100', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const hoverColor = useColorModeValue('gray.200', 'gray.700');
  const activeColor = useColorModeValue('blue.500', 'blue.300');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const menuItems = [
    // { name: 'Home', icon: FaHome, path: '/app/home' },
    { name: 'Library', icon: FaBookOpen, path: '/app/library' },
    { name: 'Profile', icon: FaUser, path: '/app/profile' },
    // { name: 'Admin', icon: FaCog, path: '/app/admin' },
  ];

  const handleNavigate = (path) => {
    navigate(path);
  };

  // Desktop Menu Component
  const DesktopMenu = () => (
    <Box
      position="fixed"
      left={0}
      top={0}
      bottom={0}
      width="200px"
      bg={bgColor}
      p={contentPadding}
      zIndex={1000}
      color={textColor}
      display={desktopDisplay}
      borderRight="1px solid"
      borderColor={borderColor}
      transition="all 0.2s"
    >
      <Text 
        fontSize="2xl" 
        fontWeight="bold" 
        mb={8}
        cursor="pointer"
        onClick={() => navigate('/')}
        transition="color 0.2s"
        _hover={{ color: activeColor }}
      >
        Alix
      </Text>
      <VStack spacing={iconSpacing} align="stretch">
        {menuItems.map((item) => (
          <Tooltip
            key={item.path}
            label={item.name}
            placement="right"
            hasArrow
            isDisabled={!isMobile}
          >
            <Button
              onClick={() => handleNavigate(item.path)}
              variant="ghost"
              justifyContent="flex-start"
              leftIcon={<item.icon />}
              color={location.pathname === item.path ? activeColor : textColor}
              bg={location.pathname === item.path ? hoverColor : 'transparent'}
              _hover={{ bg: hoverColor }}
              _active={{ bg: hoverColor, color: activeColor }}
              w="100%"
              borderRadius="md"
              py={3}
              transition="all 0.2s"
            >
              {item.name}
            </Button>
          </Tooltip>
        ))}
      </VStack>
    </Box>
  );

  // Mobile Menu Component
  const MobileMenu = () => (
    <Box
      position="fixed"
      left={0}
      right={0}
      bottom={0}
      height="60px"
      bg={bgColor}
      display={display}
      zIndex={1000}
      borderTop="1px solid"
      borderColor={borderColor}
      transition="all 0.2s"
    >
      <HStack 
        spacing={0} 
        height="100%" 
        justify="space-around" 
        align="center"
        px={2}
      >
        {menuItems.map((item) => (
          <Tooltip 
            key={item.path} 
            label={item.name}
            placement="top"
            hasArrow
          >
            <VStack 
              spacing={0.5}
              cursor="pointer"
              onClick={() => handleNavigate(item.path)}
              color={location.pathname === item.path ? activeColor : textColor}
              flex={1}
              role="button"
              aria-label={`Navigate to ${item.name}`}
              transition="all 0.2s"
              _hover={{ color: activeColor }}
              _active={{ transform: 'scale(0.95)' }}
            >
              <IconButton
                icon={<item.icon />}
                variant="ghost"
                aria-label={item.name}
                size={buttonSize}
                color="inherit"
                _hover={{ bg: 'transparent' }}
                _active={{ bg: 'transparent' }}
              />
              <Text 
                fontSize="xs" 
                fontWeight={location.pathname === item.path ? "bold" : "normal"}
                display={isMobile ? "block" : "none"}
              >
                {item.name}
              </Text>
            </VStack>
          </Tooltip>
        ))}
      </HStack>
    </Box>
  );

  return (
    <>
      <DesktopMenu />
      <MobileMenu />
      {/* Adjust main content spacing */}
      <Box
        marginLeft={{ base: 0, md: "200px" }}
        marginBottom={{ base: "60px", md: 0 }}
        padding={{ base: 2, md: contentPadding }}
        transition="all 0.2s"
      >
      </Box>
    </>
  );
};

export default MenuModal;