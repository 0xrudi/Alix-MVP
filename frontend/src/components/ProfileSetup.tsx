import React, { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toast } from '@/components/ui/toast';

const API_URL = process.env.REACT_APP_API_URL;
const INFURA_URL = `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_PROJECT_ID}`;

const DELEGATE_CASH_ADDRESS = '0x00000000000076A84feF008CDAbe6409d2FE638B';
const DELEGATE_CASH_ABI = [
  'function getDelegationsByDelegate(address delegate, uint256 offset, uint256 limit) external view returns (tuple(address vault, address delegate, uint256 type)[] memory)',
];

const MULTICALL_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11';
const MULTICALL_ABI = [
  'function aggregate(tuple(address target, bytes callData)[] calls) external view returns (uint256 blockNumber, bytes[] returnData)',
];

const ProfileSetup = ({ onComplete }) => {
  const { user } = usePrivy();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [ensName, setEnsName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [additionalWallets, setAdditionalWallets] = useState([]);
  const [delegations, setDelegations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const ITEMS_PER_PAGE = 10;

  const fetchDelegations = useCallback(async (address, page = 1) => {
    setError(null);
    try {
      const provider = new ethers.providers.JsonRpcProvider(INFURA_URL);
      const delegateCashContract = new ethers.Contract(DELEGATE_CASH_ADDRESS, DELEGATE_CASH_ABI, provider);
      const multicallContract = new ethers.Contract(MULTICALL_ADDRESS, MULTICALL_ABI, provider);

      const offset = (page - 1) * ITEMS_PER_PAGE;
      const callData = delegateCashContract.interface.encodeFunctionData('getDelegationsByDelegate', [address, offset, ITEMS_PER_PAGE]);

      const { returnData } = await multicallContract.aggregate([
        { target: DELEGATE_CASH_ADDRESS, callData }
      ]);

      const [delegationsData] = delegateCashContract.interface.decodeFunctionResult('getDelegationsByDelegate', returnData[0]);

      const formattedDelegations = await Promise.all(delegationsData.map(async delegation => ({
        vault: delegation.vault,
        type: delegation.type.toNumber(),
        ensName: await provider.lookupAddress(delegation.vault) || null
      })));

      if (page === 1) {
        setDelegations(formattedDelegations);
      } else {
        setDelegations(prev => [...prev, ...formattedDelegations]);
      }

      setHasMore(formattedDelegations.length === ITEMS_PER_PAGE);
      setPage(page);
    } catch (error) {
      console.error('Error fetching delegations:', error);
      setError('Failed to fetch delegations. Please try again later.');
    }
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user.wallet?.address) {
        try {
          // Fetch user data from backend
          const response = await fetch(`${API_URL}/users/${user.wallet.address}`);
          if (response.ok) {
            const userData = await response.json();
            setName(userData.username);
            setBio(userData.bio || '');
            setEnsName(userData.ensName || '');
            setAvatarUrl(userData.avatarUrl || '');
            setAdditionalWallets(userData.additionalWallets || []);
          } else {
            // If user doesn't exist, fetch ENS data
            const provider = new ethers.providers.JsonRpcProvider(INFURA_URL);
            const fetchedEnsName = await provider.lookupAddress(user.wallet.address);
            if (fetchedEnsName) {
              setEnsName(fetchedEnsName);
              setName(fetchedEnsName);

              // Fetch ENS avatar
              const resolver = await provider.getResolver(fetchedEnsName);
              const avatarText = await resolver.getText('avatar');
              if (avatarText) {
                setAvatarUrl(avatarText);
              }
            }
          }

          // Fetch initial delegations
          await fetchDelegations(user.wallet.address);
        } catch (error) {
          console.error('Error fetching user data:', error);
          setError('Failed to fetch user data. Please try again later.');
        }
      }
      setIsLoading(false);
    };

    fetchUserData();
  }, [user.wallet?.address, fetchDelegations]);

  const loadMoreDelegations = () => {
    if (hasMore && !isLoading) {
      fetchDelegations(user.wallet.address, page + 1);
    }
  };

  // ... (keep the existing handleSubmit and other functions)

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
            {/* ... (keep existing form fields) */}
            
            {/* Delegations Section */}
            <div className="space-y-4">
              <Label>Delegations (via delegate.cash)</Label>
              {error && <Toast variant="destructive">{error}</Toast>}
              {delegations.length > 0 ? (
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                  {delegations.map((delegation, index) => (
                    <li key={index} className="text-sm text-gray-600">
                      Vault: {delegation.ensName || delegation.vault}<br />
                      Type: {delegation.type === 1 ? 'Contract' : 'EOA'}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No delegations found.</p>
              )}
              {hasMore && (
                <Button onClick={loadMoreDelegations} disabled={isLoading}>
                  Load More
                </Button>
              )}
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