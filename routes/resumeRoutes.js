const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resumeController');
const authenticate = require('../middlewares/auth');
const { validateResumeData } = require('../utils/validation');

// Existing routes
router.post('/', authenticate, resumeController.createResume);
router.get('/', authenticate, resumeController.getResumes);
router.put('/:resumeId', authenticate, resumeController.updateResume);
router.delete('/:resumeId', authenticate, resumeController.deleteResume);
router.post('/enhance', authenticate, resumeController.enhanceResumeField);
router.post('/pdf', authenticate, resumeController.generateResumePDF);

// Either remove this duplicate route (since POST / already does this)
// router.post('/generate', createResume);

// OR if you really need a /generate endpoint, use the controller method:
router.post('/generate', authenticate, resumeController.createResume);

module.exports = router;