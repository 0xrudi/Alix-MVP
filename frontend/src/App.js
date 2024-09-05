import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import ProfileSetup from './components/ProfileSetup';
import ArtifactGallery from './components/ArtifactGallery';
import { fetchUserData } from './services/api';
import { initializeWeb3 } from './services/web3';

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

  if (!authenticated) {
    return (
      <div>
        <h1>Welcome to the Web3 Artifact Management Platform</h1>
        <button onClick={login}>Log In</button>
      </div>
    );
  }

  return (
    <div>
      <header>
        <h1>Web3 Artifact Management Platform</h1>
        <button onClick={logout}>Log Out</button>
      </header>
      <main>
        {userData ? (
          <ArtifactGallery userId={user.id} />
        ) : (
          <ProfileSetup userId={user.id} onComplete={setUserData} />
        )}
      </main>
    </div>
  );
}

export default App;