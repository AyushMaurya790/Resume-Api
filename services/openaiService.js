const OpenAI = require('openai');
//const { resumePromptGenerator, coverLetterPromptGenerator } = require('../utils/promptUtils');
const { resumePromptGenerator, coverLetterPromptGenerator } = require('../utils/promptUtils');


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const DEFAULT_MODEL = "gpt-4o";
const DEFAULT_TEMPERATURE = 0.7;

/**
 * Generates professional resume content using AI
 * @param {Object} userData - User's resume data
 * @param {String} jobDescription - Target job description
 * @returns {Promise<Object>} - Generated resume content
 */
exports.generateResumeContent = async (userData, jobDescription = '') => {
  if (!userData || typeof userData !== 'object') {
    throw new Error('Invalid user data format');
  }

  try {
    const prompt = resumePromptGenerator(userData, jobDescription);
    
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a professional resume builder assistant. Generate well-structured, professional resume content in JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: DEFAULT_TEMPERATURE,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error(`Failed to generate resume content: ${error.message}`);
  }
};

/**
 * Generates a professional cover letter using AI
 * @param {Object} resumeData - User's resume data
 * @param {String} jobDescription - Target job description
 * @returns {Promise<String>} - Generated cover letter
 */
exports.generateCoverLetter = async (resumeData, jobDescription) => {
  if (!resumeData || typeof resumeData !== 'object') {
    throw new Error('Invalid resume data format');
  }

  try {
    const prompt = coverLetterPromptGenerator(resumeData, jobDescription);
    
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a professional career advisor. Write a compelling cover letter tailored to the job description."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.6, // Slightly more conservative for cover letters
      max_tokens: 1500
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error(`Failed to generate cover letter: ${error.message}`);
  }
};

/**
 * Enhances specific resume field using AI
 * @param {String} field - Field to enhance (e.g., 'summary', 'experience')
 * @param {String} text - Current field content
 * @returns {Promise<String>} - Enhanced content
 */
exports.enhanceResumeField = async (field, text) => {
  if (!field || !text) {
    throw new Error('Field and text are required');
  }

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: `You are a professional resume editor. Improve this ${field} section while maintaining its original meaning.`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.5, // More conservative for edits
      max_tokens: 500
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error(`Failed to enhance ${field}: ${error.message}`);
  }
};