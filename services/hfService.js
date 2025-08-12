const axios = require('axios');
require('dotenv').config();

const HF_API_KEY = process.env.HF_API_KEY;
const HF_MODEL = process.env.HF_MODEL;

if (!HF_API_KEY) {
  throw new Error('HF_API_KEY is not set in .env file.');
}
if (!HF_MODEL) {
  throw new Error('HF_MODEL is not set in .env file.');
}

console.log('Hugging Face Model:', HF_MODEL); // Debug model name

const HF_BASE = `https://api-inference.huggingface.co/models`;

async function callHF(prompt, options = {}) {
  try {
    const body = {
      inputs: prompt,
      parameters: {
        max_new_tokens: options.max_new_tokens || 200,
        temperature: options.temperature || 0.7,
        top_k: options.top_k || 50,
        return_full_text: false,
      },
      options: { wait_for_model: true },
    };

    console.log('Calling Hugging Face API with model:', HF_MODEL); // Debug API call

    const res = await axios.post(
      `${HF_BASE}/${HF_MODEL}`,
      body,
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    if (Array.isArray(res.data) && res.data[0]?.generated_text) {
      return res.data[0].generated_text;
    }

    throw new Error('Unexpected Hugging Face API response format.');
  } catch (err) {
    console.error('Hugging Face API Error:', {
      message: err.message,
      status: err.response?.status,
      response: err.response?.data,
      model: HF_MODEL,
    });
    if (err.response?.status === 401) {
      throw new Error('Invalid Hugging Face API key.');
    }
    if (err.response?.status === 404) {
      throw new Error(`Model "${HF_MODEL}" not found or inaccessible.`);
    }
    if (err.response?.status === 429) {
      throw new Error('Hugging Face API rate limit exceeded.');
    }
    throw new Error(`Hugging Face API Error: ${err.message}`);
  }
}

module.exports = { callHF };