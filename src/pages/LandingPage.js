import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { ethers } from 'ethers';

const networks = [
  { id: 'eth', name: 'Ethereum' },
  { id: 'btc', name: 'Bitcoin' },
  { id: 'sol', name: 'Solana' },
  { id: 'arb', name: 'Arbitrum' },
  { id: 'opti', name: 'Optimism' },
  { id: 'poly', name: 'Polygon' },
];

const LandingPage = () => {
  const [wallets, setWallets] = useState([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const storedWallets = localStorage.getItem('wallets');
    if (storedWallets) {
      setWallets(JSON.parse(storedWallets));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('wallets', JSON.stringify(wallets));
  }, [wallets]);

  const isValidAddress = (address) => {
    return ethers.utils.isAddress(address);
  };

  const resolveENS = async (ensName) => {
    const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID');
    try {
      const address = await provider.resolveName(ensName);
      return address;
    } catch (error) {
      console.error('Error resolving ENS:', error);
      return null;
    }
  };

  const handleAddWallet = async () => {
    setError('');
    let address = input;

    if (input.endsWith('.eth')) {
      address = await resolveENS(input);
      if (!address) {
        setError('Unable to resolve ENS name');
        return;
      }
    } else if (!isValidAddress(input)) {
      setError('Invalid address format');
      return;
    }

    const newWallet = {
      address,
      nickname: '',
      networks: networks.reduce((acc, network) => ({ ...acc, [network.id]: false }), {}),
    };

    setWallets([...wallets, newWallet]);
    setInput('');
  };

  const handleNicknameChange = (index, nickname) => {
    const updatedWallets = [...wallets];
    updatedWallets[index].nickname = nickname;
    setWallets(updatedWallets);
  };

  const handleNetworkToggle = (index, networkId) => {
    const updatedWallets = [...wallets];
    updatedWallets[index].networks[networkId] = !updatedWallets[index].networks[networkId];
    setWallets(updatedWallets);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Manage Your Web3 Wallets</h1>
      <div className="mb-6">
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter wallet address or ENS name"
          className="mb-2"
        />
        <Button onClick={handleAddWallet}>Add Wallet</Button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Address</TableHead>
            <TableHead>Nickname</TableHead>
            {networks.map((network) => (
              <TableHead key={network.id}>{network.name}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {wallets.map((wallet, index) => (
            <TableRow key={wallet.address}>
              <TableCell>{wallet.address}</TableCell>
              <TableCell>
                <Input
                  type="text"
                  value={wallet.nickname}
                  onChange={(e) => handleNicknameChange(index, e.target.value)}
                  placeholder="Add nickname"
                />
              </TableCell>
              {networks.map((network) => (
                <TableCell key={network.id}>
                  <Switch
                    checked={wallet.networks[network.id]}
                    onCheckedChange={() => handleNetworkToggle(index, network.id)}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default LandingPage;