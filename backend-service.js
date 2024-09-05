const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { ethers } = require('ethers');
const cors = require('cors');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// Create or update user
app.post('/api/users', async (req, res) => {
  const { username, email, primaryWalletAddress, ensNames, delegations } = req.body;

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: { username },
      create: { username, email },
    });

    const primaryWallet = await prisma.wallet.upsert({
      where: { address: primaryWalletAddress },
      update: { userId: user.id, isPrimary: true },
      create: { address: primaryWalletAddress, userId: user.id, isPrimary: true },
    });

    // Handle ENS names
    for (const ensName of ensNames) {
      await prisma.ensName.upsert({
        where: { name: ensName },
        update: { walletId: primaryWallet.id },
        create: { name: ensName, walletId: primaryWallet.id },
      });
    }

    // Handle delegations
    for (const delegation of delegations) {
      const delegateWallet = await prisma.wallet.upsert({
        where: { address: delegation.address },
        update: { userId: user.id },
        create: { address: delegation.address, userId: user.id },
      });

      await prisma.delegation.create({
        data: {
          delegatorWalletId: primaryWallet.id,
          delegateWalletId: delegateWallet.id,
          type: delegation.type,
        },
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Error creating/updating user:', error);
    res.status(500).json({ error: 'Unable to create/update user' });
  }
});

// Get user data
app.get('/api/users/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallets: {
          include: {
            ensNames: true,
            delegationsAsDelegator: {
              include: {
                delegateWallet: true,
              },
            },
          },
        },
        nftFolders: true,
      },
    });

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'Unable to fetch user data' });
  }
});

// Create NFT folder
app.post('/api/nft-folders', async (req, res) => {
  const { userId, folderName } = req.body;

  try {
    const folder = await prisma.nftFolder.create({
      data: {
        userId,
        name: folderName,
      },
    });

    res.json(folder);
  } catch (error) {
    console.error('Error creating NFT folder:', error);
    res.status(500).json({ error: 'Unable to create NFT folder' });
  }
});

// Add NFT to folder
app.post('/api/nft-folder-assignments', async (req, res) => {
  const { nftId, folderId } = req.body;

  try {
    const assignment = await prisma.nftFolderAssignment.create({
      data: {
        nftId,
        folderId,
      },
    });

    res.json(assignment);
  } catch (error) {
    console.error('Error adding NFT to folder:', error);
    res.status(500).json({ error: 'Unable to add NFT to folder' });
  }
});

// Remove NFT from folder
app.delete('/api/nft-folder-assignments', async (req, res) => {
  const { nftId, folderId } = req.body;

  try {
    await prisma.nftFolderAssignment.deleteMany({
      where: {
        nftId,
        folderId,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing NFT from folder:', error);
    res.status(500).json({ error: 'Unable to remove NFT from folder' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
