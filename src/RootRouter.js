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

// App pages
import HomePage from './app/components/HomePage';
import AdminPage from './app/components/AdminPage';
import LibraryPage from './app/components/LibraryPage';
import ProfilePage from './app/components/ProfilePage';
import ArtifactDetailPage from './app/components/ArtifactDetailPage/ArtifactDetailPage';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
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
      </Route>

      {/* App Routes - No longer protected */}
      <Route path="app" element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="artifact" element={<ArtifactDetailPage />} />
      </Route>
    </Routes>
  );
};

export default RootRouter;