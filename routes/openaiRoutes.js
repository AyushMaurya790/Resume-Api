const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /api/openai/responses
// body: { model?: string, input: string, store?: boolean }
router.post('/responses', async (req, res) => {
  try {
    const { model = 'gpt-4o-mini', input, store = false } = req.body;

    if (!input || typeof input !== 'string') {
      return res.status(400).json({ error: 'Missing `input` in request body' });
    }

    // call OpenAI Responses API
    const response = await client.responses.create({
      model,
      input,
      store, // optional: whether to store response on OpenAI (follow your privacy policy)
    });

    // response object contains structured fields; adapt as needed
    return res.status(200).json({
      ok: true,
      id: response.id,
      output: response.output ?? response.output_text ?? null, // convenience
      raw: response,
    });
  } catch (err) {
    console.error('OpenAI error:', err);
    // Send back useful error message but don't leak internal secrets
    return res.status(500).json({
      ok: false,
      error: err.message || 'OpenAI request failed',
      details: err?.response?.data || null,
    });
  }
});

module.exports = router;
