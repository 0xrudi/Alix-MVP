import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { getDelegates } from '../services/delegateCash';
import { getENSName } from '../services/ens';

const NETWORKS = [
  { id: 'ethereum', name: 'Ethereum' },
  { id: 'polygon', name: 'Polygon' },
  { id: 'bsc', name: 'Binance Smart Chain' },
  { id: 'avalanche', name: 'Avalanche' },
  { id: 'solana', name: 'Solana' },
];

function ProfileSetup({ onComplete }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [wallets, setWallets] = useState([]);
  const [newAddress, setNewAddress] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAddWallet = async () => {
    const trimmedAddress = newAddress.trim();
    if (trimmedAddress && !wallets.some(wallet => wallet.address.toLowerCase() === trimmedAddress.toLowerCase())) {
      const isEVM = trimmedAddress.startsWith('0x');
      const isSolana = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmedAddress);
      
      let selectedNetworks;
      if (isEVM) {
        selectedNetworks = NETWORKS.filter(network => network.id !== 'solana').map(network => network.id);
      } else if (isSolana) {
        selectedNetworks = ['solana'];
      } else {
        selectedNetworks = NETWORKS.map(network => network.id);
      }
      
      let ensName = null;
      if (isEVM) {
        try {
          ensName = await getENSName(trimmedAddress);
        } catch (error) {
          console.error('Error fetching ENS name:', error);
        }
      }
      
      const newWallet = {
        address: trimmedAddress,
        networks: selectedNetworks,
        ensName: ensName,
        delegates: []
      };
      
      setWallets([...wallets, newWallet]);
      setNewAddress('');
      setError('');
    } else if (trimmedAddress) {
      setError('This address has already been added.');
    }
  };

  const toggleNetwork = (walletIndex, networkId) => {
    const updatedWallets = [...wallets];
    const wallet = updatedWallets[walletIndex];
    if (wallet.networks.includes(networkId)) {
      wallet.networks = wallet.networks.filter(id => id !== networkId);
    } else {
      wallet.networks.push(networkId);
    }
    setWallets(updatedWallets);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log({ username, email, wallets });
    onComplete({ username, email, wallets });
    navigate('/');
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Profile Setup</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700 mb-1">Add Wallet Address</label>
          <div className="flex">
            <input
              type="text"
              id="walletAddress"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="Enter wallet address"
              className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleAddWallet}
              className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
        {wallets.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Wallet Addresses</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left text-sm font-semibold text-gray-600">Address</th>
                    <th className="border border-gray-300 p-2 text-left text-sm font-semibold text-gray-600">Networks</th>
                    <th className="border border-gray-300 p-2 text-left text-sm font-semibold text-gray-600">ENS Name</th>
                    <th className="border border-gray-300 p-2 text-left text-sm font-semibold text-gray-600">Delegates</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.map((wallet, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-2 text-sm">{wallet.address}</td>
                      <td className="border border-gray-300 p-2">
                        <div className="flex flex-wrap gap-2">
                          {NETWORKS.map(network => (
                            <label key={network.id} className="inline-flex items-center">
                              <input
                                type="checkbox"
                                checked={wallet.networks.includes(network.id)}
                                onChange={() => toggleNetwork(index, network.id)}
                                className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                              />
                              <span className="ml-2 text-sm text-gray-700">{network.name}</span>
                            </label>
                          ))}
                        </div>
                      </td>
                      <td className="border border-gray-300 p-2 text-sm">{wallet.ensName || 'N/A'}</td>
                      <td className="border border-gray-300 p-2 text-sm">
                        {wallet.delegates && wallet.delegates.length > 0 
                          ? wallet.delegates.join(', ') 
                          : 'None'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <button 
          type="submit" 
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out"
        >
          Complete Setup
        </button>
      </form>
    </div>
  );
}

export default ProfileSetup;