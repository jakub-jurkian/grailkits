function mapPgErrorToHttpError(error) {
  if (error && error.code === '23505') {
    const mappedError = new Error(error.detail || 'Unique constraint violated');
    mappedError.statusCode = 409;
    mappedError.code = error.code;
    return mappedError;
  }

  if (error && error.code === '23503') {
    const mappedError = new Error(error.detail || 'Foreign key constraint violated');
    mappedError.statusCode = 400;
    mappedError.code = error.code;
    return mappedError;
  }

  return error;
}

async function queryWithPgErrorMapping(pool, text, params = []) {
  try {
    return await pool.query(text, params);
  } catch (error) {
    throw mapPgErrorToHttpError(error);
  }
}

module.exports = {
  queryWithPgErrorMapping,
  mapPgErrorToHttpError,
};