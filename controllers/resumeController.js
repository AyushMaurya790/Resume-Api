const Resume = require('../models/Resume');
const { 
  generateResumeContent,
  generateCoverLetter,
  enhanceResumeField 
} = require('../services/openaiService');
const { generatePDF } = require('../services/pdfService');
const { validateResumeData } = require('../utils/validation');

/**
 * Create a new resume with optional AI generation
 */
exports.createResume = async (req, res) => {
  try {
    const resumeData = req.body;
    const userId = req.user.uid;

    // Validate input
    const validation = validateResumeData(resumeData);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errors });
    }

    // Generate AI content if requested
    if (resumeData.generateWithAI) {
      const aiContent = await generateResumeContent(
        resumeData, 
        resumeData.jobDescription
      );
      resumeData.content = { ...resumeData.content, ...aiContent };
    }

    const resume = await Resume.create(userId, resumeData);
    res.status(201).json({
      id: resume.id,
      ...resume.data(),
      message: resumeData.generateWithAI ? 
        'Resume created with AI assistance' : 'Resume created successfully'
    });
  } catch (err) {
    console.error('Create resume error:', err);
    res.status(500).json({ 
      error: err.message || 'Failed to create resume' 
    });
  }
};

/**
 * Get all resumes for current user
 */
exports.getResumes = async (req, res) => {
  try {
    const resumes = await Resume.getByUserId(req.user.uid);
    res.status(200).json({
      count: resumes.length,
      resumes
    });
  } catch (err) {
    console.error('Get resumes error:', err);
    res.status(500).json({ 
      error: err.message || 'Failed to fetch resumes' 
    });
  }
};

/**
 * Update existing resume
 */
exports.updateResume = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const resumeData = req.body;
    const userId = req.user.uid;

    // Validate input
    const validation = validateResumeData(resumeData, true);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errors });
    }

    const updatedResume = await Resume.update(resumeId, userId, resumeData);
    res.status(200).json({
      id: updatedResume.id,
      ...updatedResume.data(),
      message: 'Resume updated successfully'
    });
  } catch (err) {
    console.error('Update resume error:', err);
    res.status(500).json({ 
      error: err.message || 'Failed to update resume' 
    });
  }
};

/**
 * Delete a resume
 */
exports.deleteResume = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const userId = req.user.uid;

    await Resume.delete(resumeId, userId);
    res.status(200).json({ 
      message: 'Resume deleted successfully',
      deletedId: resumeId
    });
  } catch (err) {
    console.error('Delete resume error:', err);
    res.status(500).json({ 
      error: err.message || 'Failed to delete resume' 
    });
  }
};

/**
 * Enhance specific resume field with AI
 */
exports.enhanceResumeField = async (req, res) => {
  try {
    const { field, text, resumeId } = req.body;
    const userId = req.user.uid;

    if (!field || !text) {
      return res.status(400).json({ error: 'Field and text are required' });
    }

    // Optional: Verify user owns the resume
    if (resumeId) {
      const resume = await Resume.getById(resumeId);
      if (resume.userId !== userId) {
        return res.status(403).json({ error: 'Unauthorized access' });
      }
    }

    const enhancedContent = await enhanceResumeField(field, text);
    res.status(200).json({ 
      field,
      original: text,
      enhanced: enhancedContent
    });
  } catch (err) {
    console.error('Enhance field error:', err);
    res.status(500).json({ 
      error: err.message || 'Failed to enhance resume field' 
    });
  }
};

/**
 * Generate PDF from resume content
 */
exports.generateResumePDF = async (req, res) => {
  try {
    const { resumeId, htmlContent } = req.body;
    const userId = req.user.uid;

    // Verify user owns the resume
    const resume = await Resume.getById(resumeId);
    if (resume.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const pdfBuffer = await generatePDF(htmlContent);
    
    // Save PDF to database/storage if needed
    await Resume.update(resumeId, userId, { 
      lastGeneratedPDF: new Date() 
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${resumeId}.pdf`
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Generate PDF error:', err);
    res.status(500).json({ 
      error: err.message || 'Failed to generate PDF' 
    });
  }
};

/**
 * Generate cover letter for resume
 */
exports.generateCoverLetter = async (req, res) => {
  try {
    const { resumeId, jobDescription } = req.body;
    const userId = req.user.uid;

    // Get resume data
    const resume = await Resume.getById(resumeId);
    if (resume.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const coverLetter = await generateCoverLetter(
      resume.data(), 
      jobDescription
    );

    // Save to database if needed
    await Resume.update(resumeId, userId, { 
      lastCoverLetter: coverLetter,
      lastCoverLetterGenerated: new Date()
    });

    res.status(200).json({ coverLetter });
  } catch (err) {
    console.error('Generate cover letter error:', err);
    res.status(500).json({ 
      error: err.message || 'Failed to generate cover letter' 
    });
  }
};