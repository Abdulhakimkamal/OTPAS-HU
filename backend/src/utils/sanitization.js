/**
 * Input Sanitization Utilities
 * Prevents XSS and other injection attacks
 */

/**
 * Escape HTML special characters to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped text safe for HTML
 */
export const escapeHtml = (text) => {
  if (typeof text !== 'string') return text;
  
  const htmlEscapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  
  return text.replace(/[&<>"'\/]/g, (char) => htmlEscapeMap[char]);
};

/**
 * Remove potentially dangerous characters from input
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
export const sanitizeText = (text) => {
  if (typeof text !== 'string') return text;
  
  // Remove null bytes
  let sanitized = text.replace(/\0/g, '');
  
  // Remove control characters (except newline, tab, carriage return)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
};

/**
 * Sanitize email address
 * @param {string} email - Email to sanitize
 * @returns {string} Sanitized email
 */
export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return email;
  
  // Convert to lowercase and trim
  let sanitized = email.toLowerCase().trim();
  
  // Remove any HTML/script tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Remove any SQL-like patterns (defense in depth)
  sanitized = sanitized.replace(/['";\\]/g, '');
  
  return sanitized;
};

/**
 * Sanitize URL to prevent javascript: and data: protocols
 * @param {string} url - URL to sanitize
 * @returns {string} Sanitized URL
 */
export const sanitizeUrl = (url) => {
  if (typeof url !== 'string') return url;
  
  const trimmed = url.trim().toLowerCase();
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  for (const protocol of dangerousProtocols) {
    if (trimmed.startsWith(protocol)) {
      return '';
    }
  }
  
  return url;
};

/**
 * Sanitize filename to prevent directory traversal
 * @param {string} filename - Filename to sanitize
 * @returns {string} Sanitized filename
 */
export const sanitizeFilename = (filename) => {
  if (typeof filename !== 'string') return filename;
  
  // Remove path separators and null bytes
  let sanitized = filename.replace(/[\/\\:\*\?"<>\|]/g, '');
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Remove leading dots and spaces
  sanitized = sanitized.replace(/^[\s.]+/, '');
  
  // Limit length
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 255);
  }
  
  return sanitized;
};

/**
 * Sanitize JSON string to prevent injection
 * @param {string} jsonString - JSON string to sanitize
 * @returns {string} Sanitized JSON string
 */
export const sanitizeJson = (jsonString) => {
  if (typeof jsonString !== 'string') return jsonString;
  
  try {
    // Parse and re-stringify to ensure valid JSON
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed);
  } catch (error) {
    // If not valid JSON, return empty object
    return '{}';
  }
};

/**
 * Sanitize object by recursively sanitizing all string values
 * @param {object} obj - Object to sanitize
 * @param {boolean} escapeHtmlChars - Whether to escape HTML characters
 * @returns {object} Sanitized object
 */
export const sanitizeObject = (obj, escapeHtmlChars = false) => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    let sanitized = sanitizeText(obj);
    if (escapeHtmlChars) {
      sanitized = escapeHtml(sanitized);
    }
    return sanitized;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, escapeHtmlChars));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value, escapeHtmlChars);
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * Validate and sanitize project title
 * @param {string} title - Project title
 * @returns {object} { isValid: boolean, sanitized: string, error: string }
 */
export const sanitizeProjectTitle = (title) => {
  if (typeof title !== 'string') {
    return { isValid: false, sanitized: '', error: 'Title must be a string' };
  }
  
  const sanitized = sanitizeText(title);
  
  if (sanitized.length === 0) {
    return { isValid: false, sanitized: '', error: 'Title cannot be empty' };
  }
  
  if (sanitized.length > 255) {
    return { isValid: false, sanitized: '', error: 'Title cannot exceed 255 characters' };
  }
  
  return { isValid: true, sanitized, error: null };
};

/**
 * Validate and sanitize project description
 * @param {string} description - Project description
 * @returns {object} { isValid: boolean, sanitized: string, error: string }
 */
export const sanitizeProjectDescription = (description) => {
  if (typeof description !== 'string') {
    return { isValid: false, sanitized: '', error: 'Description must be a string' };
  }
  
  const sanitized = sanitizeText(description);
  
  if (sanitized.length === 0) {
    return { isValid: false, sanitized: '', error: 'Description cannot be empty' };
  }
  
  if (sanitized.length < 20) {
    return { isValid: false, sanitized: '', error: 'Description must be at least 20 characters' };
  }
  
  if (sanitized.length > 5000) {
    return { isValid: false, sanitized: '', error: 'Description cannot exceed 5000 characters' };
  }
  
  return { isValid: true, sanitized, error: null };
};

/**
 * Validate and sanitize evaluation feedback
 * @param {string} feedback - Evaluation feedback
 * @returns {object} { isValid: boolean, sanitized: string, error: string }
 */
export const sanitizeEvaluationFeedback = (feedback) => {
  if (typeof feedback !== 'string') {
    return { isValid: false, sanitized: '', error: 'Feedback must be a string' };
  }
  
  const sanitized = sanitizeText(feedback);
  
  if (sanitized.length === 0) {
    return { isValid: false, sanitized: '', error: 'Feedback cannot be empty' };
  }
  
  if (sanitized.length < 10) {
    return { isValid: false, sanitized: '', error: 'Feedback must be at least 10 characters' };
  }
  
  if (sanitized.length > 5000) {
    return { isValid: false, sanitized: '', error: 'Feedback cannot exceed 5000 characters' };
  }
  
  return { isValid: true, sanitized, error: null };
};

/**
 * Validate and sanitize recommendation text
 * @param {string} recommendation - Recommendation text
 * @returns {object} { isValid: boolean, sanitized: string, error: string }
 */
export const sanitizeRecommendation = (recommendation) => {
  if (typeof recommendation !== 'string') {
    return { isValid: false, sanitized: '', error: 'Recommendation must be a string' };
  }
  
  const sanitized = sanitizeText(recommendation);
  
  if (sanitized.length === 0) {
    return { isValid: false, sanitized: '', error: 'Recommendation cannot be empty' };
  }
  
  if (sanitized.length > 1000) {
    return { isValid: false, sanitized: '', error: 'Recommendation cannot exceed 1000 characters' };
  }
  
  return { isValid: true, sanitized, error: null };
};

export default {
  escapeHtml,
  sanitizeText,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeFilename,
  sanitizeJson,
  sanitizeObject,
  sanitizeProjectTitle,
  sanitizeProjectDescription,
  sanitizeEvaluationFeedback,
  sanitizeRecommendation
};
