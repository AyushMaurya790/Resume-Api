const { db } = require('../config/firebase');

class Resume {
  static async create(userId, resumeData) {
    const resumeRef = db.collection('resumes').doc();
    await resumeRef.set({
      userId,
      ...resumeData,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      tags: resumeData.tags || [],
    });
    return resumeRef.get();
  }

  static async getByUserId(userId) {
    const snapshot = await db.collection('resumes').where('userId', '==', userId).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  static async update(resumeId, data) {
    const resumeRef = db.collection('resumes').doc(resumeId);
    await resumeRef.update({
      ...data,
      updatedAt: new Date(),
      version: admin.firestore.FieldValue.increment(1),
    });
    return resumeRef.get();
  }

  static async delete(resumeId) {
    const resumeRef = db.collection('resumes').doc(resumeId);
    await resumeRef.delete();
  }
}

module.exports = Resume;