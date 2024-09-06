import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import ProfileSetup from './components/ProfileSetup';
import ArtifactGallery from './components/ArtifactGallery';
import { fetchUserData } from './services/api';
import { initializeWeb3 } from './services/web3';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';

function LandingPage() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Welcome to the Web3 Artifact Management Platform</h1>
      <div className="space-y-4">
        <button 
          onClick={login}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Log In with Privy
        </button>
        {/* NEW: Button to go to account setup without authentication */}
        <Link 
          to="/setup"
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 inline-block"
        >
          Go to Account Setup
        </Link>
      </div>
    </div>
  );
}

function App() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeWeb3();
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      if (authenticated && user) {
        try {
          const data = await fetchUserData(user.id);
          setUserData(data);
        } catch (error) {
          console.error('Error loading user data:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [authenticated, user]);

  if (!ready || isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          authenticated ? (
            <div>
              <h1>Welcome, {user.email || user.wallet.address}</h1>
              {/* Add your authenticated user content here */}
            </div>
          ) : (
            <LandingPage />
          )
        } />
        <Route path="/setup" element={<ProfileSetup onComplete={() => {/* Handle completion */}} />} />
      </Routes>
    </Router>
  );
}

export default App;