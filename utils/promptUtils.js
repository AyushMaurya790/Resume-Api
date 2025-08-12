// utils/promptUtils.js

exports.resumePromptGenerator = (userData, jobDescription = '') => {
  // यह function userData और jobDescription को एक prompt string में convert करता है
  // तुम्हारे हिसाब से customize कर सकते हो

  let prompt = `Create a professional resume based on the following details:\n`;

  if (userData.name) prompt += `Name: ${userData.name}\n`;
  if (userData.content?.summary) prompt += `Summary: ${userData.content.summary}\n`;
  if (userData.content?.experience) prompt += `Experience: ${userData.content.experience}\n`;
  if (userData.content?.education) prompt += `Education: ${userData.content.education}\n`;
  if (userData.content?.skills) prompt += `Skills: ${userData.content.skills.join(', ')}\n`;
  if (jobDescription) prompt += `Job Description: ${jobDescription}\n`;

  prompt += `Please generate a well-structured resume content in JSON format.`;

  return prompt;
};

exports.coverLetterPromptGenerator = (resumeData, jobDescription = '') => {
  let prompt = `Write a compelling cover letter for the following resume details:\n`;

  if (resumeData.name) prompt += `Name: ${resumeData.name}\n`;
  if (resumeData.content?.summary) prompt += `Summary: ${resumeData.content.summary}\n`;
  if (jobDescription) prompt += `Job Description: ${jobDescription}\n`;

  prompt += `Make it professional and persuasive.`;

  return prompt;
};
