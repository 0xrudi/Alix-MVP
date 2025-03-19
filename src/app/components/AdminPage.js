import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Flex,
  Spacer,
  Button,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup
} from "@chakra-ui/react";
import { FaSync, FaTrash, FaDownload } from 'react-icons/fa';
import { addLogListener, removeLogListener, downloadLogs, logger } from '../../utils/logger';

const AdminPage = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalNFTs: 0,
    totalWallets: 0,
  });

  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');

  useEffect(() => {
    const logHandler = (logEntry) => {
      if (logEntry.type === 'clear') {
        setLogs([]);
      } else {
        setLogs(prevLogs => {
          const newLogs = [logEntry, ...prevLogs];
          return newLogs.slice(0, 100); // Keep only last 100 logs
        });
      }
    };

    // Initialize with existing logs
    setLogs(logger.getLogHistory().slice(-100).reverse());

    addLogListener(logHandler);

    // Simulating stats update
    const statsInterval = setInterval(() => {
      setStats(prevStats => ({
        totalUsers: prevStats.totalUsers + Math.floor(Math.random() * 10),
        activeUsers: Math.floor(prevStats.totalUsers * (0.1 + Math.random() * 0.5)),
        totalNFTs: prevStats.totalNFTs + Math.floor(Math.random() * 100),
        totalWallets: prevStats.totalWallets + Math.floor(Math.random() * 5),
      }));
    }, 10000);

    return () => {
      removeLogListener(logHandler);
      clearInterval(statsInterval);
    };
  }, []);

  const handleClearLogs = () => {
    logger.clearLogs();
    setLogs([]);
  };

  const handleDownloadLogs = () => {
    downloadLogs();
  };

  const handleRefreshStats = () => {
    // In a real application, you would fetch the latest stats from your backend here
    setStats(prevStats => ({
      totalUsers: prevStats.totalUsers + Math.floor(Math.random() * 100),
      activeUsers: Math.floor(prevStats.totalUsers * (0.1 + Math.random() * 0.5)),
      totalNFTs: prevStats.totalNFTs + Math.floor(Math.random() * 1000),
      totalWallets: prevStats.totalWallets + Math.floor(Math.random() * 50),
    }));
  };

  const getBadgeColor = (level) => {
    switch(level) {
      case 'ERROR': return 'red';
      case 'WARN': return 'yellow';
      case 'INFO': return 'blue';
      case 'DEBUG': return 'purple';
      case 'LOG': return 'green';
      default: return 'gray';
    }
  };

  // Function to format log details
  const renderLogDetails = (details) => {
    if (!details) return '';
    try {
      // Try to pretty print if it's JSON
      const parsed = JSON.parse(details);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return details;
    }
  };

  return (
    <Box p={5} bg={bgColor} color={textColor}>
      <VStack spacing={8} align="stretch">
        <Flex align="center">
          <Heading as="h1" size="xl">Admin Dashboard</Heading>
          <Spacer />
          <Button leftIcon={<FaSync />} onClick={handleRefreshStats}>Refresh Stats</Button>
        </Flex>

        <StatGroup>
          <Stat>
            <StatLabel>Total Users</StatLabel>
            <StatNumber>{stats.totalUsers}</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              23.36%
            </StatHelpText>
          </Stat>

          <Stat>
            <StatLabel>Active Users</StatLabel>
            <StatNumber>{stats.activeUsers}</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              9.05%
            </StatHelpText>
          </Stat>

          <Stat>
            <StatLabel>Total NFTs</StatLabel>
            <StatNumber>{stats.totalNFTs}</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              15.4%
            </StatHelpText>
          </Stat>

          <Stat>
            <StatLabel>Total Wallets</StatLabel>
            <StatNumber>{stats.totalWallets}</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              7.2%
            </StatHelpText>
          </Stat>
        </StatGroup>

        <Box>
          <Flex align="center" mb={4}>
            <Heading as="h2" size="lg">System Logs</Heading>
            <Spacer />
            <Button onClick={handleDownloadLogs} leftIcon={<FaDownload />}>
              Download Logs
            </Button>
            <Button 
              ml={2} 
              leftIcon={<FaTrash />} 
              onClick={handleClearLogs}
            >
              Clear Logs
            </Button>
          </Flex>
          <Box overflowY="auto" maxHeight="400px">
            <Table variant="simple">
              <Thead position="sticky" top={0} bg={bgColor} zIndex={1}>
                <Tr>
                  <Th>Timestamp</Th>
                  <Th>Level</Th>
                  <Th>Message</Th>
                  <Th>Details</Th>
                </Tr>
              </Thead>
              <Tbody>
                {logs.map((log, index) => (
                  <Tr key={`${log.timestamp}-${index}`}>
                    <Td width="200px">{new Date(log.timestamp).toLocaleString()}</Td>
                    <Td width="100px">
                      <Badge colorScheme={getBadgeColor(log.level)}>
                        {log.level}
                      </Badge>
                    </Td>
                    <Td style={{ whiteSpace: 'pre-wrap', maxWidth: '300px', overflow: 'auto' }}>
                      {log.message}
                    </Td>
                    <Td style={{ whiteSpace: 'pre-wrap', maxWidth: '400px', overflow: 'auto' }}>
                      {renderLogDetails(log.details)}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </Box>
      </VStack>
    </Box>
  );
};

export default AdminPage;