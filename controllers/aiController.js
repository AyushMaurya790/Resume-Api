// controllers/aiController.js
const { callHF } = require('../services/hfService');

/**
 * POST /api/ai/generate-resume
 * body: {
 *   name: string,
 *   title: string,
 *   experience: [{ company, title, start, end, bullets[] }] (optional)
 *   skills: [string] (optional)
 *   education: [{ degree, institute, year }] (optional)
 *   targetRole: string (optional) - job title to optimize for
 * }
 */
const generateResume = async (req, res) => {
  try {
    const payload = req.body || {};
    const {
      name = 'John Doe',
      title = 'Software Engineer',
      experience = [],
      skills = [],
      education = [],
      targetRole = title,
    } = payload;

    const prompt = `
You are a resume writer. Create an ATS-friendly resume in JSON format.
Return ONLY valid JSON (no text, comments, or markdown). Schema:

{
  "name": string,
  "title": string,
  "summary": string,
  "experiences": [
    { "company": string, "title": string, "start": string, "end": string, "bullets": [string] }
  ],
  "skills": [string],
  "education": [
    { "degree": string, "institute": string, "year": string }
  ],
  "keywords": [string]
}

Candidate:
Name: ${name}
Title: ${title}
Target role: ${targetRole}
Skills: ${skills.length ? skills.join(', ') : 'None'}
Education: ${education.length ? JSON.stringify(education) : 'None'}
Experience: ${experience.length ? JSON.stringify(experience) : 'None'}

Instructions:
- Summary: 2-3 sentences with achievements.
- Keywords: ATS-relevant terms as array.
- Bullets: Short, action-oriented.
- Output: Valid JSON only.
    `.trim();

    console.log('Prompt sent to callHF:', prompt);
    const modelOutput = await callHF(prompt, { max_new_tokens: 300, temperature: 0.2 });
    console.log('Raw model output:', modelOutput);

    let parsed;
    try {
      parsed = JSON.parse(modelOutput);
    } catch (e) {
      const jsonMatch = modelOutput.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (innerErr) {
          console.error('JSON parsing error:', innerErr.message, 'Raw output:', modelOutput);
          return res.status(200).json({
            ok: false,
            raw: modelOutput,
            message: 'Model output is not valid JSON',
          });
        }
      } else {
        console.error('No JSON block found in output:', modelOutput);
        return res.status(200).json({
          ok: false,
          raw: modelOutput,
          message: 'Model output is not valid JSON',
        });
      }
    }

    return res.status(200).json({ ok: true, resume: parsed });
  } catch (err) {
    console.error('generateResume error:', {
      message: err.message,
      stack: err.stack,
    });
    let errorMessage = 'Failed to generate resume';
    if (err.message.includes('Model not found') || err.message.includes('All models failed')) {
      errorMessage = 'Hugging Face model not found or inaccessible. Check HF_MODEL in .env or your access permissions.';
    } else if (err.message.includes('API key')) {
      errorMessage = 'Invalid Hugging Face API key. Verify HF_API_KEY in .env.';
    } else if (err.message.includes('rate limit')) {
      errorMessage = 'Hugging Face API rate limit exceeded. Try again later.';
    } else {
      errorMessage = `Failed to generate resume: ${err.message || 'Unknown error'}`;
    }
    return res.status(500).json({ ok: false, error: errorMessage });
  }
};

/**
 * POST /api/ai/ats-check
 * body: {
 *   resumeText: string OR resumeFields: {...},
 *   jobDescription: string
 * }
 * returns {score: number 0-100, missingKeywords: [string], suggestions: [string]}
 */
const atsCheck = async (req, res) => {
  try {
    const { resumeText = '', resumeFields = null, jobDescription = '' } = req.body;
    if (!jobDescription) return res.status(400).json({ ok: false, error: 'jobDescription required' });

    const resumeForPrompt = resumeFields ? JSON.stringify(resumeFields) : resumeText;

    const prompt = `
You are an ATS consultant. Compare the resume with the Job Description.
Return ONLY valid JSON (no text or markdown):

{
  "score": number,
  "matchPercentage": number,
  "missingKeywords": [string],
  "topMatchedKeywords": [string],
  "suggestions": [string]
}

Job Description:
${jobDescription}

Resume:
${resumeForPrompt}

Instructions:
- Score: 0-100 based on keyword match and role fit.
- Missing keywords: Terms in JD but not in resume.
- Suggestions: 3-6 actionable improvements.
- Output: Valid JSON only.
    `.trim();

    console.log('Prompt sent to callHF:', prompt);
    const modelOutput = await callHF(prompt, { max_new_tokens: 300, temperature: 0.2 });
    console.log('Raw model output:', modelOutput);

    let parsed;
    try {
      parsed = JSON.parse(modelOutput);
    } catch (e) {
      const jsonMatch = modelOutput.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (innerErr) {
          console.error('JSON parsing error:', innerErr.message, 'Raw output:', modelOutput);
          return res.status(200).json({
            ok: false,
            raw: modelOutput,
            message: 'Model output is not valid JSON',
          });
        }
      } else {
        console.error('No JSON block found in output:', modelOutput);
        return res.status(200).json({
          ok: false,
          raw: modelOutput,
          message: 'Model output is not valid JSON',
        });
      }
    }

    return res.status(200).json({ ok: true, result: parsed });
  } catch (err) {
    console.error('atsCheck error:', {
      message: err.message,
      stack: err.stack,
    });
    let errorMessage = 'Failed to run ATS check';
    if (err.message.includes('Model not found') || err.message.includes('All models failed')) {
      errorMessage = 'Hugging Face model not found or inaccessible. Check HF_MODEL in .env or your access permissions.';
    } else if (err.message.includes('API key')) {
      errorMessage = 'Invalid Hugging Face API key. Verify HF_API_KEY in .env.';
    } else if (err.message.includes('rate limit')) {
      errorMessage = 'Hugging Face API rate limit exceeded. Try again later.';
    } else {
      errorMessage = `Failed to run ATS check: ${err.message || 'Unknown error'}`;
    }
    return res.status(500).json({ ok: false, error: errorMessage });
  }
};

module.exports = { generateResume, atsCheck };