const multer = require("multer");
const { handleFailed } = require("../utils/helper");

const handleUploadError = (error, _, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return handleFailed(res, "File size limit exceeded", 400);
    }
    return handleFailed(res, "File upload error: " + error.message, 400);
  }

  if (error.message === "Invalid file type. Only image files are allowed.") {
    return handleFailed(res, error.message, 400, {
      allowedTypes: ["jpeg", "jpg", "png", "gif", "webp"],
    });
  }

  next(error);
};

const handleUploadResumeError = (error, _, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return handleFailed(res, "File size limit exceeded", 400);
    }
    return handleFailed(res, "File upload error: " + error.message, 400);
  }

  if (error.message === "Invalid file type. Only PDF files are allowed.") {
    return handleFailed(res, error.message, 400, {
      allowedTypes: ["PDF"],
    });
  }

  next(error);
};

module.exports = { handleUploadError, handleUploadResumeError };
