import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const API_URL = 'http://localhost:3001/api';

const ProfileSetup = ({ onComplete }) => {
  const { user } = usePrivy();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [ensName, setEnsName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [additionalWallets, setAdditionalWallets] = useState([]);
  const [newWallet, setNewWallet] = useState('');
  const [signatureMessage, setSignatureMessage] = useState('');

  // ... (keep the existing useEffect for fetching user data)

  const verifyWalletOwnership = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const signature = await signer.signMessage(signatureMessage);
      const recoveredAddress = ethers.utils.verifyMessage(signatureMessage, signature);
      
      if (recoveredAddress.toLowerCase() === newWallet.toLowerCase()) {
        addWallet(newWallet);
      } else {
        alert("Signature verification failed. Make sure you're using the correct wallet.");
      }
    } catch (error) {
      console.error('Error verifying wallet ownership:', error);
      alert('Failed to verify wallet ownership. Please try again.');
    }
  };

  const searchENS = async () => {
    try {
      const provider = new ethers.providers.JsonRpcProvider(
        'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID'
      );
      const address = await provider.resolveName(newWallet);
      if (address) {
        addWallet(address);
      } else {
        alert('No address found for this ENS name.');
      }
    } catch (error) {
      console.error('Error resolving ENS name:', error);
      alert('Failed to resolve ENS name. Please try again.');
    }
  };

  const addWallet = (wallet) => {
    if (ethers.utils.isAddress(wallet) && !additionalWallets.includes(wallet)) {
      setAdditionalWallets([...additionalWallets, wallet]);
      setNewWallet('');
    } else {
      alert('Invalid address or wallet already added.');
    }
  };

  const removeWallet = (wallet) => {
    setAdditionalWallets(additionalWallets.filter(w => w !== wallet));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: user.wallet.address,
          username: name,
          bio,
          ensName,
          avatarUrl,
          additionalWallets,
        }),
      });

      if (response.ok) {
        const userData = await response.json();
        onComplete(userData);
      } else {
        throw new Error('Failed to save user data');
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Complete Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src={avatarUrl} alt={name} />
                <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="w-full space-y-2">
                <Label htmlFor="name" className="text-center block">Username</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Enter your username"
                  className="text-center"
                />
              </div>
            </div>
            {ensName && (
              <p className="text-sm text-gray-500 text-center">
                We've used your ENS name ({ensName}) as your default username. You can change it if you prefer.
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio (optional)</Label>
              <Input
                id="bio"
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself"
              />
            </div>
            <div className="space-y-4">
              <Label>Additional Wallets</Label>
              <Tabs defaultValue="address">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="address">Address</TabsTrigger>
                  <TabsTrigger value="ens">ENS</TabsTrigger>
                  <TabsTrigger value="signature">Signature</TabsTrigger>
                </TabsList>
                <TabsContent value="address">
                  <div className="flex space-x-2">
                    <Input
                      type="text"
                      value={newWallet}
                      onChange={(e) => setNewWallet(e.target.value)}
                      placeholder="Enter wallet address"
                    />
                    <Button onClick={() => addWallet(newWallet)} type="button">Add</Button>
                  </div>
                </TabsContent>
                <TabsContent value="ens">
                  <div className="flex space-x-2">
                    <Input
                      type="text"
                      value={newWallet}
                      onChange={(e) => setNewWallet(e.target.value)}
                      placeholder="Enter ENS name"
                    />
                    <Button onClick={searchENS} type="button">Search</Button>
                  </div>
                </TabsContent>
                <TabsContent value="signature">
                  <div className="space-y-2">
                    <Input
                      type="text"
                      value={newWallet}
                      onChange={(e) => setNewWallet(e.target.value)}
                      placeholder="Enter wallet address"
                    />
                    <Input
                      type="text"
                      value={signatureMessage}
                      onChange={(e) => setSignatureMessage(e.target.value)}
                      placeholder="Enter message to sign"
                    />
                    <Button onClick={verifyWalletOwnership} type="button" className="w-full">Verify Ownership</Button>
                  </div>
                </TabsContent>
              </Tabs>
              <div className="space-y-2">
                {additionalWallets.map((wallet, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="truncate flex-1">{wallet}</span>
                    <Button onClick={() => removeWallet(wallet)} type="button" variant="destructive" size="sm">Remove</Button>
                  </div>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full">
              Save Profile
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSetup;
