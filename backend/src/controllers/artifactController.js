const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getArtifacts = async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = process.env.DEFAULT_PAGINATION_LIMIT } = req.query;

  try {
    const artifacts = await prisma.artifact.findMany({
      where: { userId },
      include: {
        catalogAssignments: {
          include: { catalog: true }
        }
      },
      skip: (page - 1) * limit,
      take: Number(limit),
    });

    res.json(artifacts);
  } catch (error) {
    console.error('Error fetching artifacts:', error);
    res.status(500).json({ error: 'Unable to fetch artifacts' });
  }
};

exports.createCatalog = async (req, res) => {
  const { userId, name } = req.body;

  try {
    const catalog = await prisma.artifactCatalog.create({
      data: { userId, name },
    });

    res.json(catalog);
  } catch (error) {
    console.error('Error creating catalog:', error);
    res.status(500).json({ error: 'Unable to create catalog' });
  }
};

exports.addArtifactToCatalog = async (req, res) => {
  const { artifactId, catalogId } = req.body;

  try {
    const assignment = await prisma.artifactCatalogAssignment.create({
      data: { artifactId, catalogId },
    });

    res.json(assignment);
  } catch (error) {
    console.error('Error adding artifact to catalog:', error);
    res.status(500).json({ error: 'Unable to add artifact to catalog' });
  }
};

exports.removeArtifactFromCatalog = async (req, res) => {
  const { artifactId, catalogId } = req.body;

  try {
    await prisma.artifactCatalogAssignment.deleteMany({
      where: { artifactId, catalogId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing artifact from catalog:', error);
    res.status(500).json({ error: 'Unable to remove artifact from catalog' });
  }
};

// Add more controller functions as needed