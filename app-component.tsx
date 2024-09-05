import React, { useState } from 'react';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import NFTViewer from './NFTViewer';
import AuthOnboarding from './AuthOnboarding';
import ProfileSetup from './ProfileSetup';

const PRIVY_APP_ID = 'your-privy-app-id';

function AppContent() {
  const { ready, authenticated, user } = usePrivy();
  const [profileComplete, setProfileComplete] = useState(false);

  if (!ready) {
    return <div>Loading...</div>;
  }

  if (!authenticated) {
    return <AuthOnboarding />;
  }

  if (!profileComplete && !user.name) {
    return <ProfileSetup onComplete={() => setProfileComplete(true)} />;
  }

  return <NFTViewer />;
}

function App() {
  return (
    <PrivyProvider appId={PRIVY_APP_ID}>
      <div className="App">
        <AppContent />
      </div>
    </PrivyProvider>
  );
}

export default App;
