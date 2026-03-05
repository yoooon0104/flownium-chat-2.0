// HTTP 에러 응답 포맷을 공통으로 통일한다.
const sendError = (res, status, code, message, details) => {
  const payload = {
    error: {
      code,
      message,
    },
  };

  if (typeof details !== 'undefined') {
    payload.error.details = details;
  }

  return res.status(status).json(payload);
};

module.exports = {
  sendError,
};
