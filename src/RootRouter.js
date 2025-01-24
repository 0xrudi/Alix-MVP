// src/RootRouter.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import WebsiteLayout from './website/layouts/WebsiteLayout';
import AppLayout from './app/layouts/AppLayout';
import LandingPage from './website/pages/LandingPage';
import PrivacyPage from './website/pages/PrivacyPage';
import TermsPage from './website/pages/TermsPage';
import SignupPage from './website/pages/SignupPage';
import ContactPage from './website/pages/ContactPage';

// Import existing app components
import WelcomePage from './app/components/WelcomePage';
import HomePage from './app/components/HomePage';
import AdminPage from './app/components/AdminPage';
import LibraryPage from './app/components/LibraryPage';
import ProfilePage from './app/components/ProfilePage';
import ArtifactDetailPage from './app/components/ArtifactDetailPage/ArtifactDetailPage';

const RootRouter = () => {
  return (
    <Routes>
      {/* Website Routes */}
      <Route element={<WebsiteLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route path="contact" element={<ContactPage />} />
      </Route>

      {/* App Routes */}
      // src/RootRouter.js - Update app routes
      <Route path="app" element={<AppLayout />}>
        <Route index element={<WelcomePage />} />
        <Route path="home" element={<HomePage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="library" element={<LibraryPage />} /> 
        <Route path="profile" element={<ProfilePage />} />
        <Route path="artifact" element={<ArtifactDetailPage />} />
      </Route>
    </Routes>
  );
};

export default RootRouter;