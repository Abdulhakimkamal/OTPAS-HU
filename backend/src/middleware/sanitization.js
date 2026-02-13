/**
 * Input Sanitization Middleware
 * Sanitizes all request inputs to prevent XSS and injection attacks
 */

import {
  sanitizeText,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeObject
} from '../utils/sanitization.js';

/**
 * Sanitize request body, query parameters, and URL parameters
 * Removes potentially dangerous characters and HTML/script tags
 */
export const sanitizeInput = (req, res, next) => {
  try {
    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body, false);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query, false);
    }

    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params, false);
    }

    next();
  } catch (error) {
    console.error('Error sanitizing input:', error);
    return res.status(400).json({
      success: false,
      message: 'Invalid input format'
    });
  }
};

/**
 * Sanitize specific fields in request body
 * Useful for endpoints that need custom sanitization
 */
export const sanitizeFields = (...fieldNames) => {
  return (req, res, next) => {
    try {
      if (!req.body) {
        return next();
      }

      for (const fieldName of fieldNames) {
        if (req.body[fieldName] && typeof req.body[fieldName] === 'string') {
          req.body[fieldName] = sanitizeText(req.body[fieldName]);
        }
      }

      next();
    } catch (error) {
      console.error('Error sanitizing fields:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid input format'
      });
    }
  };
};

/**
 * Sanitize email fields
 */
export const sanitizeEmailFields = (...fieldNames) => {
  return (req, res, next) => {
    try {
      if (!req.body) {
        return next();
      }

      for (const fieldName of fieldNames) {
        if (req.body[fieldName] && typeof req.body[fieldName] === 'string') {
          req.body[fieldName] = sanitizeEmail(req.body[fieldName]);
        }
      }

      next();
    } catch (error) {
      console.error('Error sanitizing email fields:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
  };
};

/**
 * Sanitize URL fields
 */
export const sanitizeUrlFields = (...fieldNames) => {
  return (req, res, next) => {
    try {
      if (!req.body) {
        return next();
      }

      for (const fieldName of fieldNames) {
        if (req.body[fieldName] && typeof req.body[fieldName] === 'string') {
          req.body[fieldName] = sanitizeUrl(req.body[fieldName]);
        }
      }

      next();
    } catch (error) {
      console.error('Error sanitizing URL fields:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid URL format'
      });
    }
  };
};

/**
 * Sanitize HTML content (escape HTML characters)
 * Used for fields that will be displayed as HTML
 */
export const sanitizeHtmlContent = (...fieldNames) => {
  return (req, res, next) => {
    try {
      if (!req.body) {
        return next();
      }

      for (const fieldName of fieldNames) {
        if (req.body[fieldName] && typeof req.body[fieldName] === 'string') {
          // First sanitize, then escape HTML
          let sanitized = sanitizeText(req.body[fieldName]);
          // Escape HTML special characters
          sanitized = sanitized.replace(/[&<>"']/g, (char) => {
            const escapeMap = {
              '&': '&amp;',
              '<': '&lt;',
              '>': '&gt;',
              '"': '&quot;',
              "'": '&#x27;'
            };
            return escapeMap[char];
          });
          req.body[fieldName] = sanitized;
        }
      }

      next();
    } catch (error) {
      console.error('Error sanitizing HTML content:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid content format'
      });
    }
  };
};

/**
 * Prevent common SQL injection patterns
 * Note: Primary defense is parameterized queries, this is defense in depth
 */
export const preventSqlInjection = (req, res, next) => {
  try {
    const sqlPatterns = [
      /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
      /(-{2}|\/\*|\*\/|;)/g,
      /(xp_|sp_)/gi
    ];

    const checkValue = (value) => {
      if (typeof value !== 'string') return false;
      return sqlPatterns.some(pattern => pattern.test(value));
    };

    // Check body
    if (req.body && typeof req.body === 'object') {
      for (const [key, value] of Object.entries(req.body)) {
        if (checkValue(value)) {
          console.warn(`Potential SQL injection detected in body.${key}`);
          // Log but don't block - parameterized queries provide primary defense
        }
      }
    }

    // Check query parameters
    if (req.query && typeof req.query === 'object') {
      for (const [key, value] of Object.entries(req.query)) {
        if (checkValue(value)) {
          console.warn(`Potential SQL injection detected in query.${key}`);
        }
      }
    }

    next();
  } catch (error) {
    console.error('Error checking SQL injection:', error);
    next();
  }
};

/**
 * Prevent common XSS patterns
 */
export const preventXss = (req, res, next) => {
  try {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
      /<img[^>]*on/gi
    ];

    const checkValue = (value) => {
      if (typeof value !== 'string') return false;
      return xssPatterns.some(pattern => pattern.test(value));
    };

    // Check body
    if (req.body && typeof req.body === 'object') {
      for (const [key, value] of Object.entries(req.body)) {
        if (checkValue(value)) {
          console.warn(`Potential XSS detected in body.${key}`);
          // Log but don't block - sanitization provides primary defense
        }
      }
    }

    // Check query parameters
    if (req.query && typeof req.query === 'object') {
      for (const [key, value] of Object.entries(req.query)) {
        if (checkValue(value)) {
          console.warn(`Potential XSS detected in query.${key}`);
        }
      }
    }

    next();
  } catch (error) {
    console.error('Error checking XSS:', error);
    next();
  }
};

export default {
  sanitizeInput,
  sanitizeFields,
  sanitizeEmailFields,
  sanitizeUrlFields,
  sanitizeHtmlContent,
  preventSqlInjection,
  preventXss
};
