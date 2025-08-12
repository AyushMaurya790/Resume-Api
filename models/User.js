const { db } = require('../config/firebase');

class User {
  static async create(userData) {
    const userRef = db.collection('users').doc(userData.uid);
    await userRef.set({
      email: userData.email,
      role: userData.role || 'user',
      createdAt: new Date(),
      linkedInData: userData.linkedInData || null,
    });
    return userRef.get();
  }

  static async getById(uid) {
    const userRef = db.collection('users').doc(uid);
    return userRef.get();
  }

  static async update(uid, data) {
    const userRef = db.collection('users').doc(uid);
    await userRef.update(data);
    return userRef.get();
  }

  static async delete(uid) {
    const userRef = db.collection('users').doc(uid);
    await userRef.delete();
  }

  static async getAll() {
    const snapshot = await db.collection('users').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}

module.exports = User;