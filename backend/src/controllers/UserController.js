const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createOrUpdateUser = async (req, res) => {
  const { username, email, primaryWalletAddress, ensNames, delegations } = req.body;

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: { username },
      create: { username, email },
    });

    // Handle wallet, ENS names, and delegations
    // ...

    res.json(user);
  } catch (error) {
    console.error('Error creating/updating user:', error);
    res.status(500).json({ error: 'Unable to create/update user' });
  }
};

exports.getUserData = async (req, res) => {
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
        artifactCatalogs: true,
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
};

// Add more controller functions as needed