import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ChakraProvider, Box } from "@chakra-ui/react";
import MenuModal from '../components/MenuModal';
import { AppProvider } from '../context/AppContext';
import theme from '../styles';

const AppLayout = () => {
  const location = useLocation();
  const showMenu = location.pathname !== '/app';

  return (
    <ChakraProvider theme={theme}>
      <AppProvider>
        <Box>
          {showMenu && <MenuModal />}
          <Box marginLeft={showMenu ? { base: "60px", md: "200px" } : "0"} padding={8}>
            <Outlet />
          </Box>
        </Box>
      </AppProvider>
    </ChakraProvider>
  );
};

export default AppLayout;