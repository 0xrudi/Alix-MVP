import React, { useState, useEffect } from 'react';
import Moralis from 'moralis';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

const TransactionHistory = ({ connectedWallets }) => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await Moralis.start({ apiKey: process.env.REACT_APP_MORALIS_API_KEY });

        const allTransactions = await Promise.all(connectedWallets.map(async (wallet) => {
          const response = await Moralis.EvmApi.transaction.getWalletTransactions({
            address: wallet.address,
            chain: 'eth', // You can expand this to include multiple chains
            limit: 20,
          });
          return response.result.map(tx => ({
            ...tx,
            walletAddress: wallet.address
          }));
        }));

        const flattenedTransactions = allTransactions.flat().sort((a, b) => b.blockTimestamp - a.blockTimestamp);
        setTransactions(flattenedTransactions);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Failed to fetch transactions. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [connectedWallets]);

  const formatAddress = (address) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  if (isLoading) return <div>Loading transactions...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Transaction History</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transaction Hash</TableHead>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Value (ETH)</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.hash}>
              <TableCell>{formatAddress(tx.hash)}</TableCell>
              <TableCell>{formatAddress(tx.fromAddress)}</TableCell>
              <TableCell>{formatAddress(tx.toAddress)}</TableCell>
              <TableCell>{Moralis.Units.FromWei(tx.value)} ETH</TableCell>
              <TableCell>{new Date(tx.blockTimestamp).toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TransactionHistory;
