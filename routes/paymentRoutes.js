const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authenticate = require('../middlewares/auth');

router.post('/razorpay', authenticate, paymentController.createRazorpayOrder);
router.post('/stripe', authenticate, paymentController.createStripeSession);
router.post('/verify', authenticate, paymentController.verifyPayment);

module.exports = router;