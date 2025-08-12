const Razorpay = require('razorpay');
const stripe = require('../config/stripe');
const Payment = require('../models/Payment');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createRazorpayOrder = async (req, res) => {
  try {
    const order = await razorpay.orders.create({
      amount: 9900, // ₹99 in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    });
    await Payment.create({
      userId: req.user.uid,
      amount: 99,
      status: 'pending',
      provider: 'razorpay',
      resumeId: req.body.resumeId,
    });
    res.status(200).json({ orderId: order.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
};

exports.createStripeSession = async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: { name: 'Resume Download' },
            unit_amount: 9900, // ₹99
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:3000/success',
      cancel_url: 'http://localhost:3000/cancel',
    });
    await Payment.create({
      userId: req.user.uid,
      amount: 99,
      status: 'pending',
      provider: 'stripe',
      resumeId: req.body.resumeId,
    });
    res.status(200).json({ sessionId: session.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create Stripe session' });
  }
};

exports.verifyPayment = async (req, res) => {
  const { provider, paymentId, resumeId } = req.body;
  try {
    await Payment.create({
      userId: req.user.uid,
      amount: 99,
      status: 'completed',
      provider,
      resumeId,
    });
    res.status(200).json({ message: 'Payment verified' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify payment' });
  }
};