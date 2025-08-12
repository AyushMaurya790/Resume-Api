const axios = require('axios');

const getAccessToken = async (code) => {
  try {
    const response = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      null,
      {
        params: {
          grant_type: 'authorization_code',
          code,
          redirect_uri: 'http://localhost:5000/api/auth/linkedin/callback',
          client_id: process.env.LINKEDIN_CLIENT_ID,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        },
      }
    );
    return response.data.access_token;
  } catch (err) {
    throw new Error('Failed to get LinkedIn access token');
  }
};

const getProfileData = async (accessToken) => {
  try {
    const response = await axios.get('https://api.linkedin.com/v2/me?projection=(id,firstName,lastName,profilePicture,positions,educations,skills)', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return {
      name: `${response.data.firstName.localized.en_US} ${response.data.lastName.localized.en_US}`,
      jobTitle: response.data.positions?.elements[0]?.title || '',
      education: response.data.educations?.elements[0]?.degreeName || '',
      skills: response.data.skills?.elements.map(skill => skill.name).join(', ') || '',
    };
  } catch (err) {
    throw new Error('Failed to fetch LinkedIn profile data');
  }
};

module.exports = { getAccessToken, getProfileData };