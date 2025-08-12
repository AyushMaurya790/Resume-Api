const { db } = require('../config/firebase');

class Payment {
  static async create(paymentData) {
    const paymentRef = db.collection('payments').doc();
    await paymentRef.set({
      userId: paymentData.userId,
      amount: paymentData.amount,
      status: paymentData.status,
      provider: paymentData.provider,
      createdAt: new Date(),
    });
    return paymentRef.get();
  }

  static async getByUserId(userId) {
    const snapshot = await db.collection('payments').where('userId', '==', userId).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}

module.exports = Payment;