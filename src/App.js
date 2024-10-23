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

function AppContent() {
  const location = useLocation();
  const showMenu = location.pathname !== '/';

  return (
    <ChakraProvider theme={theme}>
      <Box>
        {showMenu && <MenuModal />}
        <Box marginLeft={showMenu ? { base: "60px", md: "200px" } : "0"} padding={8}>
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
      </Box>
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