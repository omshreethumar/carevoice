const fs = require('fs');
const { extractReceiptWithVision, getClient } = require('./aiService');
const { categorizeDescription } = require('../utils/constants');

async function processReceiptFile(file) {
  const configured = Boolean(getClient());
  if (!configured) {
    return {
      status: 'unavailable',
      errorMessage:
        'Receipt scanning is not configured. Add OPENAI_API_KEY on the server to enable AI extraction, or enter the details manually.',
      extraction: null,
    };
  }
  try {
    const buffer = fs.readFileSync(file.path);
    if (file.mimetype === 'application/pdf') {
      return {
        status: 'unavailable',
        errorMessage:
          'PDF receipt extraction requires an OCR/document parser which is not configured. Upload a JPG or PNG, or enter details manually.',
        extraction: null,
      };
    }
    const extraction = await extractReceiptWithVision(buffer, file.mimetype);
    if (!extraction?.amount && !extraction?.merchantName) {
      return {
        status: 'failed',
        errorMessage: 'Could not extract receipt details. Please enter them manually.',
        extraction,
      };
    }
    if (!extraction.suggestedCategory && extraction.merchantName) {
      extraction.suggestedCategory = categorizeDescription(extraction.merchantName, 'EXPENSE');
    }
    return { status: 'extracted', errorMessage: null, extraction };
  } catch (err) {
    console.error('Receipt extraction failed', err?.message);
    return {
      status: 'failed',
      errorMessage: 'Receipt extraction failed. Please enter the details manually.',
      extraction: null,
    };
  }
}

module.exports = { processReceiptFile };
