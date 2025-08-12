const pdf = require('html-pdf');
const { db } = require('../config/firebase'); // make sure file exists
const fs = require('fs');
const path = require('path');

const generatePDF = async (htmlContent, userId, resumeId) => {
  try {
    let isPaid = false;

    // Payment status check
    const paymentRef = await db
      .collection('payments')
      .where('userId', '==', userId)
      .where('resumeId', '==', resumeId)
      .get();

    if (!paymentRef.empty) {
      const paymentData = paymentRef.docs[0].data();
      isPaid = paymentData.status === 'completed';
    }

    // Add watermark if not paid
    if (!isPaid) {
      htmlContent += `
        <div style="position: fixed; top: 50%; left: 50%; 
          transform: translate(-50%, -50%); font-size: 24px; 
          color: rgba(150, 150, 150, 0.5); z-index: 9999;">
          Watermark - Pay to Remove
        </div>`;
    }

    const options = {
      format: 'Letter',
      orientation: 'portrait',
      border: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in',
      },
    };

    const outputPath = path.join(__dirname, `../pdfs/resume-${resumeId}.pdf`);

    // Ensure output folder exists
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    return new Promise((resolve, reject) => {
      pdf.create(htmlContent, options).toFile(outputPath, (err, res) => {
        if (err) {
          console.error('PDF generation error:', err);
          return reject('PDF creation failed');
        }
        resolve(res.filename); // Return path to generated file
      });
    });
  } catch (err) {
    console.error('generatePDF Error:', err);
    throw new Error('Failed to generate PDF');
  }
};

module.exports = { generatePDF };
