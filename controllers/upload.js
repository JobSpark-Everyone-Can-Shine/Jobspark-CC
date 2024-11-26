const { bucket, bucketName } = require("../config/storage");
const { handleSuccess, handleFailed } = require("../utils/helper");

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return handleFailed(res, "No file uploaded", 400);
    }

    const filename = `${Date.now()}-${req.file.originalname}`;
    const destinationPath = `jobspark/${filename}`;

    const blob = bucket.file(destinationPath);
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    blobStream.on("error", (error) => {
      console.error("Upload error:", error);
      handleFailed(res, "Unable to upload file", 500);
    });

    blobStream.on("finish", () => {
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${destinationPath}`;
      handleSuccess(res, {
        url: publicUrl,
      });
    });

    blobStream.end(req.file.buffer);
  } catch (error) {
    console.error("Server error:", error);
    handleFailed(res);
  }
};

const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return handleFailed(res, "No file uploaded", 400);
    }

    const filename = `${Date.now()}-${req.file.originalname}`;
    const destinationPath = `jobspark/resumes/${filename}`;

    const blob = bucket.file(destinationPath);
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    blobStream.on("error", (error) => {
      console.error("Upload error:", error);
      handleFailed(res, "Unable to upload file", 500);
    });

    blobStream.on("finish", () => {
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${destinationPath}`;
      handleSuccess(res, {
        url: publicUrl,
      });
    });

    blobStream.end(req.file.buffer);
  } catch (error) {
    console.error("Server error:", error);
    handleFailed(res);
  }
};

module.exports = {
  uploadFile,
  uploadResume
};