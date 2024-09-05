const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
require('dotenv').config();

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// Create or update user
app.post('/api/users', async (req, res) => {
  const { walletAddress, username, bio, ensName, avatarUrl, additionalWallets } = req.body;
  try {
    const user = await prisma.user.upsert({
      where: { walletAddress },
      update: { username, bio, ensName, avatarUrl, additionalWallets },
      create: { walletAddress, username, bio, ensName, avatarUrl, additionalWallets },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Unable to create or update user' });
  }
});

// Get user by wallet address
app.get('/api/users/:walletAddress', async (req, res) => {
  const { walletAddress } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { walletAddress } });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Unable to fetch user' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
