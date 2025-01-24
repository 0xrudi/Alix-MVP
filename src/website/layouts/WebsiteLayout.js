import React from 'react';
import { Outlet } from 'react-router-dom';
import { ChakraProvider } from "@chakra-ui/react";
import theme from '../../app/styles';

const WebsiteLayout = () => {
  return (
    <ChakraProvider theme={theme}>
      <Outlet />
    </ChakraProvider>
  );
};

export default WebsiteLayout;