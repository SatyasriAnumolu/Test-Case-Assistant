/**
 * Error handling utilities for Azure DevOps API interactions
 * Specifically handles Entra Conditional Access policy errors and provides user-friendly guidance
 */

const CONDITIONAL_ACCESS_ERROR_INDICATORS = [
  'VS403463',
  'Conditional Access',
  'blocked',
  '403',
  'Forbidden',
  'AADSTS',
]

/**
 * Check if an error is related to Entra Conditional Access policy
 * @param {Error|string} error - Error object or message
 * @returns {boolean}
 */
export function isConditionalAccessError(error) {
  const errorText = typeof error === 'string' ? error : error?.message || ''
  return CONDITIONAL_ACCESS_ERROR_INDICATORS.some((indicator) =>
    errorText.toLowerCase().includes(indicator.toLowerCase())
  )
}

/**
 * Get user-friendly error message for Conditional Access policy errors
 * @returns {object} Error message object with title and text
 */
export function getConditionalAccessErrorMessage() {
  return {
    intent: 'error',
    title: 'Azure DevOps Access Blocked by Security Policy',
    text: 'Your organization has enabled Microsoft Entra Conditional Access (VS403463) which blocks PAT (Personal Access Token) authentication. Your options:\n\n1. Contact your Azure DevOps/Entra administrator to whitelist this application or IP address\n2. Request use of administrator-approved OAuth sign-in flow\n3. Use a compliant device with MFA enabled\n\nFor interactive authentication, ask your administrator to configure OAuth support in this application.',
  }
}

/**
 * Get standard error message for other API errors
 * @param {string} title - Error title
 * @param {Error|string} error - Error object or message
 * @param {string} fallback - Fallback message if error has no message
 * @returns {object} Error message object with title and text
 */
export function getStandardErrorMessage(title, error, fallback) {
  const text = typeof error === 'string' ? error : error?.message || fallback || 'An error occurred.'
  return {
    intent: 'error',
    title,
    text,
  }
}

/**
 * Process API error and return appropriate user message
 * @param {Error|string} error - Error from API call
 * @param {string} defaultTitle - Default error title
 * @param {string} defaultFallback - Default fallback message
 * @returns {object} Error message object with title and text
 */
export function handleApiError(error, defaultTitle = 'Error', defaultFallback = 'An error occurred') {
  if (isConditionalAccessError(error)) {
    return getConditionalAccessErrorMessage()
  }

  return getStandardErrorMessage(defaultTitle, error, defaultFallback)
}

/**
 * Format HTTP response error into user-friendly message
 * @param {Response} response - Fetch response object
 * @param {object} payload - Parsed response payload
 * @param {string} defaultTitle - Default error title
 * @param {string} defaultMessage - Default error message
 * @returns {object} Error message object with title and text
 */
export function formatHttpError(response, payload, defaultTitle, defaultMessage) {
  const errorMsg = payload?.message || payload?.title || defaultMessage

  if (response.status === 403 && isConditionalAccessError(errorMsg)) {
    return getConditionalAccessErrorMessage()
  }

  return {
    intent: 'error',
    title: defaultTitle || 'Request failed',
    text: errorMsg,
  }
}
