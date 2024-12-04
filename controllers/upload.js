const axios = require("axios");
const { bucket, bucketName } = require("../config/storage");
const { handleSuccess, handleFailed } = require("../utils/helper");

const baseURL = process.env.MODEL_URL;

const getIsDS = async (image) => {
  try {
    const formData = new FormData();
    const blob = new Blob([image.buffer], { type: image.mimetype });
    formData.append("file", blob, image.originalname);

    const response = await axios.post(`${baseURL}/predict`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    let isDs = false;

    if (response.data.predicted_label == "Syndrome") {
      isDs = true;
    }

    return {
      isDs,
    };
  } catch (error) {
    console.log(error);
    return error;
  }
};

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return handleFailed(res, "No file uploaded", 400);
    }

    const data = await getIsDS(req.file);

    if (!data.isDs) {
      return handleFailed(res, "You are not down syndrome", 400);
    }

    const filename = `${Date.now()}-${req.file.originalname}`;
    const destinationPath = `jobspark/${filename}`;
    const blob = bucket.file(destinationPath);

    return new Promise((resolve, reject) => {
      const blobStream = blob.createWriteStream({
        resumable: false,
        metadata: {
          contentType: req.file.mimetype,
        },
      });

      blobStream.on("error", (error) => {
        console.error("Upload error:", error);
        blobStream.end();
        reject(error);
      });

      blobStream.on("finish", () => {
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${destinationPath}`;
        handleSuccess(res, { url: publicUrl });
        resolve();
      });

      // Handle stream errors
      blobStream.on("pipe", () => {
        if (blobStream.destroyed) {
          reject(new Error("Stream was destroyed"));
          return;
        }
      });

      blobStream.end(req.file.buffer);
    }).catch((error) => {
      console.error("Server error:", error);
      handleFailed(res, "Unable to upload file", 500);
    });
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
  uploadResume,
};
