import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Text,
  IconButton,
  Tooltip,
  useBreakpointValue,
} from "@chakra-ui/react";
import { FaBookOpen, FaUser, FaTools, FaSitemap, FaLayerGroup } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

const MenuModal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Responsive styles
  const buttonSize = useBreakpointValue({ base: "sm", md: "md" });
  const iconSpacing = useBreakpointValue({ base: 1, md: 2 });
  const contentPadding = useBreakpointValue({ base: 2, md: 4 });
  const isMobile = useBreakpointValue({ base: true, md: false });

  const menuItems = [
    { name: 'Library', icon: FaBookOpen, path: '/app/library' },
    { name: 'Catalogs', icon: FaLayerGroup, path: '/app/catalogs' },
    { name: 'Organize', icon: FaSitemap, path: '/app/organize' },
    { name: 'Profile', icon: FaUser, path: '/app/profile' },
    { name: 'Service Test', icon: FaTools, path: '/app/service-test' },
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
      bg="rgba(248, 247, 244, 0.95)"
      backdropFilter="blur(8px)"
      p={contentPadding}
      zIndex={1000}
      color="var(--rich-black)"
      display={{ base: "none", md: "block" }}
      borderRight="1px solid"
      borderColor="var(--shadow)"
      transition="all 0.2s"
      height="100vh"
      overflowY="auto"
      boxShadow="0 4px 12px rgba(0, 0, 0, 0.05)"
    >
      <Text 
        fontSize="2xl" 
        fontFamily="Space Grotesk"
        fontWeight="bold"
        mb={8}
        cursor="pointer"
        onClick={() => navigate('/')}
        transition="color 0.2s"
        color="var(--rich-black)"
        _hover={{ color: "var(--warm-brown)" }}
      >
        Alix
      </Text>
      <VStack spacing={iconSpacing} align="stretch">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          return (
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
                color={isActive ? "var(--warm-brown)" : "var(--ink-grey)"}
                bg={isActive ? "var(--highlight)" : "transparent"}
                fontFamily="Inter"
                fontSize="14px"
                _hover={{ 
                  bg: "var(--highlight)",
                  color: "var(--warm-brown)"
                }}
                _active={{ 
                  bg: "var(--highlight)", 
                  color: "var(--warm-brown)"
                }}
                w="100%"
                borderRadius="md"
                py={3}
                transition="all 0.2s"
                position="relative"
                overflow="hidden"
                sx={{
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: '0',
                    top: '0',
                    bottom: '0',
                    width: '3px',
                    bg: isActive ? "var(--warm-brown)" : "transparent",
                    transition: "all 0.2s"
                  }
                }}
              >
                {item.name}
              </Button>
            </Tooltip>
          );
        })}
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
      bg="rgba(248, 247, 244, 0.95)"
      backdropFilter="blur(8px)"
      display={{ base: "block", md: "none" }}
      zIndex={1000}
      borderTop="1px solid"
      borderColor="var(--shadow)"
      transition="all 0.2s"
      boxShadow="0 -4px 12px rgba(0, 0, 0, 0.05)"
    >
      <HStack 
        spacing={0} 
        height="100%" 
        justify="space-around" 
        align="center"
        px={2}
      >
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          return (
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
                color={isActive ? "var(--warm-brown)" : "var(--ink-grey)"}
                flex={1}
                role="button"
                aria-label={`Navigate to ${item.name}`}
                transition="all 0.2s"
                _hover={{ color: "var(--warm-brown)" }}
                _active={{ transform: 'scale(0.95)' }}
                position="relative"
                bg={isActive ? "var(--highlight)" : "transparent"}
                py={2}
                borderRadius="md"
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
                  fontFamily="Inter"
                  fontWeight={isActive ? "bold" : "normal"}
                  display={isMobile ? "block" : "none"}
                >
                  {item.name}
                </Text>
              </VStack>
            </Tooltip>
          );
        })}
      </HStack>
    </Box>
  );

  return (
    <>
      <DesktopMenu />
      <MobileMenu />
    </>
  );
};

export default MenuModal;