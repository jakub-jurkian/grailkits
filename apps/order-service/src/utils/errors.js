const STATUS_TO_CODE = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE_ENTITY',
  500: 'INTERNAL_ERROR',
};

/**
 * Sends a unified error response: { error, code, details }
 * @param {import('express').Response} res
 * @param {Error & { statusCode?: number, details?: unknown }} error
 */
function errorResponse(res, error) {
  const status = error.statusCode || 500;
  const code = STATUS_TO_CODE[status] || 'INTERNAL_ERROR';
  return res.status(status).json({
    error: error.message || 'An unexpected error occurred',
    code,
    details: error.details || null,
  });
}

module.exports = { errorResponse };
