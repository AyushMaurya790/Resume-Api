const User = require('../models/User');
const Resume = require('../models/Resume');
const Payment = require('../models/Payment');
const { enhanceResumeField } = require('../services/openaiService');

exports.getUsers = async (req, res) => {
  try {
    const users = await User.getAll();
    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.delete(req.body.userId);
    res.status(200).json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

exports.analyzeUser = async (req, res) => {
  try {
    const userId = req.body.userId;
    const resumes = await Resume.getByUserId(userId);
    const analysis = await enhanceResumeField('userAnalysis', JSON.stringify(resumes));
    res.status(200).json({ analysis });
  } catch (err) {
    res.status(500).json({ error: 'Failed to analyze user' });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment.getByUserId(req.user.uid);
    res.status(200).json({ payments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const { templateId, templateData } = req.body;
    await db.collection('templates').doc(templateId).set(templateData, { merge: true });
    res.status(200).json({ message: 'Template updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update template' });
  }
};