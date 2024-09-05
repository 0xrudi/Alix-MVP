import React from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const AuthOnboarding = ({ onComplete }) => {
  const { login, ready, authenticated, user } = usePrivy();

  if (!ready) {
    return <div>Loading...</div>;
  }

  if (authenticated) {
    // User is authenticated, complete onboarding
    onComplete({
      email: user.email?.address,
      walletAddress: user.wallet?.address,
      name: user.name || ''
    });
    return null;
  }

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Welcome to NFT Viewer</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={login} className="w-full">
          Log in with Privy
        </Button>
      </CardContent>
    </Card>
  );
};

export default AuthOnboarding;
