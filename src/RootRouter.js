// src/RootRouter.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import WebsiteLayout from './website/layouts/WebsiteLayout';
import AppLayout from './app/components/layouts/AppLayout';
import { useAuth } from './context/auth/AuthContext';
import { Box, Spinner } from '@chakra-ui/react';

// Website pages
import LandingPage from './website/pages/LandingPage';
import PrivacyPage from './website/pages/PrivacyPage';
import TermsPage from './website/pages/TermsPage';
import SignUpPage from './website/pages/SignUpPage';
import ContactPage from './website/pages/ContactPage';
import FeaturesPage from './website/pages/FeaturesPage';
import AboutPage from './website/pages/AboutPage';
import LoginPage from './website/pages/auth/LoginPage';
import RoadmapPage from './website/pages/RoadmapPage';

// App pages
import HomePage from './app/components/HomePage';
import AdminPage from './app/components/AdminPage';
import LibraryPage from './app/components/LibraryPage';
import ProfilePage from './app/components/ProfilePage';
import ArtifactDetailPage from './app/components/ArtifactDetailPage/ArtifactDetailPage';
import OrganizePage from './app/components/OrganizePage';
import ServiceTestComponent from './app/components/ServiceTestComponent';
import CatalogsPage from './app/components/CatalogsPage';
import { useServices, ServiceProvider } from './services/service-provider';
import CatalogViewPage from './app/components/CatalogViewPage';


const PrivateRoute = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { loading: serviceLoading } = useServices();
  
  const isLoading = authLoading || serviceLoading;
  
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Spinner size="xl" />
      </Box>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

const RootRouter = () => {
  return (
    <ServiceProvider>
      <Routes>
        {/* Website Routes */}
        <Route element={<WebsiteLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="signup" element={<SignUpPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="features" element={<FeaturesPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="roadmap" element={<RoadmapPage />} />
        </Route>

        {/* App Routes - Protected */}
        <Route path="app" element={<AppLayout />}>
          <Route index element={<PrivateRoute><HomePage /></PrivateRoute>} />
          <Route path="admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} />
          <Route path="library" element={<PrivateRoute><LibraryPage /></PrivateRoute>} />
          <Route path="profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="artifact" element={<PrivateRoute><ArtifactDetailPage /></PrivateRoute>} />
          <Route path="organize" element={<PrivateRoute><OrganizePage /></PrivateRoute>} />
          <Route path="service-test" element={<PrivateRoute><ServiceTestComponent/></PrivateRoute>} />
          <Route path="catalogs" element={<PrivateRoute><CatalogsPage /></PrivateRoute>} />
          <Route path="catalogs/:catalogId" element={<PrivateRoute><CatalogViewPage /></PrivateRoute>} />
        </Route>
      </Routes>
    </ServiceProvider>
  );
};

export default RootRouter;