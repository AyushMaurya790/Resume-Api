/**
 * Validates resume data
 * @param {Object} data - Resume data to validate
 * @param {Boolean} isUpdate - Whether this is for update operation
 * @returns {Object} Validation result
 */
const validateResumeData = (data, isUpdate = false) => {
  const errors = [];
  
  if (!isUpdate) {
    if (!data?.name) {
      errors.push('Resume name is required');
    }
    if (!data?.content) {
      errors.push('Resume content is required');
    }
  }

  if (data?.content) {
    if (!data.content.summary && !isUpdate) {
      errors.push('Summary field is required');
    }
    if (!data.content.experience?.length && !isUpdate) {
      errors.push('At least one experience entry is required');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateResumeData
};