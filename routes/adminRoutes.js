const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticate = require('../middlewares/auth');
const isAdmin = require('../middlewares/admin');

router.get('/users', authenticate, isAdmin, adminController.getUsers);
router.post('/user/delete', authenticate, isAdmin, adminController.deleteUser);
router.post('/user/analyze', authenticate, isAdmin, adminController.analyzeUser);
router.get('/payments', authenticate, isAdmin, adminController.getPayments);
router.post('/template', authenticate, isAdmin, adminController.updateTemplate);

module.exports = router;