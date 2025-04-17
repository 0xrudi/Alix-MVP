// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ChakraProvider, Box, Spinner } from "@chakra-ui/react";
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
import ServiceTestComponent from './components/ServiceTestComponent';
import { AppProvider } from './context/AppContext';
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider, useAuth } from './context/auth/AuthContext';
import LoginPage from './website/pages/auth/LoginPage';
import { ServiceProvider, useServices } from './services/service-provider'; // Import the ServiceProvider and hook
import ReduxStoreProvider from './redux/ReduxStoreProvider';
import CatalogsPage from './components/CatalogsPage';
import CatalogViewPage from './components/CatalogViewPage';

// Create a PrivateRoute component
const PrivateRoute = ({ children }) => {
  const { user: authUser, loading: authLoading } = useAuth();
  const { loading: serviceLoading } = useServices();
  
  const isLoading = authLoading || serviceLoading;
  
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Spinner size="xl" />
      </Box>
    );
  }
  
  if (!authUser) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Update AppContent to include protected routes
function AppContent() {
  const location = useLocation();
  const showMenu = location.pathname !== '/' && location.pathname !== '/login';

  return (
    <ChakraProvider theme={theme}>
      <ErrorBoundary>
        {showMenu && <MenuModal />}
        <Box 
          marginLeft={{ base: 0, md: showMenu ? "200px" : 0 }}
          marginBottom={{ base: "60px", md: 0 }}
        >
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<WelcomePage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes */}
            <Route path="/home" element={<PrivateRoute><HomePage /></PrivateRoute>} />
            <Route path="/admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} />
            <Route path="/library" element={<PrivateRoute><LibraryPage /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/artifact" element={<PrivateRoute><ArtifactDetailPage /></PrivateRoute>} />
            <Route path="/service-test" element={<PrivateRoute><ServiceTestComponent /></PrivateRoute>} />
            
            {/* Catalog routes */}
            <Route path="/app/catalogs" element={<PrivateRoute><CatalogsPage /></PrivateRoute>} />
            <Route path="/app/catalogs/:catalogId" element={<PrivateRoute><CatalogViewPage /></PrivateRoute>} />
            
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </Box>
      </ErrorBoundary>
    </ChakraProvider>
  );
}

function App() {
  return (
    <Router>
      <ChakraProvider theme={theme}>
        <AuthProvider>
          <ServiceProvider>
            {/* Use ReduxStoreProvider to get services and update the store */}
            <ReduxStoreProvider>
              <AppProvider>
                <AppContent />
                <Analytics />
              </AppProvider>
            </ReduxStoreProvider>
          </ServiceProvider>
        </AuthProvider>
      </ChakraProvider>
    </Router>
  );
}

export default App;