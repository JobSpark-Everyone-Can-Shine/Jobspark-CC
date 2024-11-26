const multer = require("multer");

const multerConfig = {
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, callback) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(
        new Error("Invalid file type. Only image files are allowed."),
        false
      );
    }
  },
};

const upload = multer(multerConfig);

const multerConfigPdf = {
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, callback) => {
    const allowedMimeTypes = ["application/pdf"];

    if (allowedMimeTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(
        new Error("Invalid file type. Only PDF files are allowed."),
        false
      );
    }
  },
};

const uploadPdf = multer(multerConfigPdf);

module.exports = { upload, uploadPdf };
