// routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const { generateResume, atsCheck } = require('../controllers/aiController');

router.post('/generate-resume', generateResume);
router.post('/ats-check', atsCheck);

module.exports = router;
