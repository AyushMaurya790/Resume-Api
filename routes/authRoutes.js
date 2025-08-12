const express = require('express');
const router = express.Router();
const {
  signupUser,
  getAllUsers,
  sendOTP,
  verifyOTP,
  googleLogin,
  linkedinCallback,
  getLinkedInData,
  getUserProfile,
  updateUserProfile,
  changePassword,
  deleteUserAccount,
  logoutUser
} = require('../controllers/authController');

// Public Routes
router.post('/signup', signupUser);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/google-login', googleLogin);
router.get('/linkedin/callback', linkedinCallback);

// Protected Routes (JWT Middleware की ज़रूरत)
router.get('/users', getAllUsers);
router.get('/linkedin-data', getLinkedInData);
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.put('/change-password', changePassword);
router.delete('/delete-account', deleteUserAccount);
router.post('/logout', logoutUser);

module.exports = router;
