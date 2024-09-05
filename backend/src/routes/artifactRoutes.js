const express = require('express');
const { getArtifacts, createCatalog, addArtifactToCatalog, removeArtifactFromCatalog } = require('../controllers/artifactController');

const router = express.Router();

router.get('/:userId', getArtifacts);
router.post('/catalogs', createCatalog);
router.post('/catalog-assignments', addArtifactToCatalog);
router.delete('/catalog-assignments', removeArtifactFromCatalog);

// Add more routes as needed

module.exports = router;