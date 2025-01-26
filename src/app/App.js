import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ChakraProvider, Box } from "@chakra-ui/react";
import WelcomePage from './components/WelcomePage';
import ProfilePage from './components/ProfilePage';
import LibraryPage from './components/LibraryPage';
import HomePage from './components/HomePage';
import MenuModal from './components/MenuModal';
import theme from './styles';
import ErrorBoundary from './components/ErrorBoundary';
import AdminPage from './components/AdminPage';
import './global.css';
import ArtifactDetailPage from './components/ArtifactDetailPage';
import { AppProvider } from './context/AppContext';
import { Provider } from 'react-redux';
import store from './redux/store';
import { Analytics } from "@vercel/analytics/react";

function AppContent() {
  const location = useLocation();
  const showMenu = location.pathname !== '/';

  return (
    <ChakraProvider theme={theme}>
      <ErrorBoundary>
        {showMenu && <MenuModal />}
        <Box 
          marginLeft={{ base: 0, md: showMenu ? "200px" : 0 }}
          marginBottom={{ base: "60px", md: 0 }}
        >
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/artifact" element={<ArtifactDetailPage />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </Box>
      </ErrorBoundary>
    </ChakraProvider>
  );
}

function App() {
  return (
    <Provider store={store}>
      <Router>
        <ChakraProvider theme={theme}>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </ChakraProvider>
      </Router>
    </Provider>
  );
}

export default App;