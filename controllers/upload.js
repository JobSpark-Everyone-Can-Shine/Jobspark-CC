const fs = require("fs");
const path = require("path");
const { handleSuccess, handleFailed } = require("../utils/helper");
const axios = require("axios");

const baseURL = process.env.MODEL_URL;

// Membuat folder jika belum ada
const ensureDirectoryExistence = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const getIsDS = async (image) => {
  try {
    const formData = new FormData();
    const blob = new Blob([image.buffer], { type: image.mimetype });
    formData.append("file", blob, image.originalname);

    const response = await axios.post(`${baseURL}/predict`, formData);

    const isDs = response.data.predicted_label === "Syndrome";
    return { isDs };
  } catch (error) {
    console.error(error);
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

    
    
    const uploadsDir = path.join(__dirname, "../public/uploads/jobspark");
    ensureDirectoryExistence(uploadsDir);
    
    const filename = `${Date.now()}-${req.file.originalname}`;
    const filePath = path.join(uploadsDir, filename);
    
    fs.writeFileSync(filePath, req.file.buffer);
    
    const baseUrl = req.protocol + "://" + req.get("host");
    const publicUrl = `${baseUrl}/public/uploads/jobspark/${filename}`; // atau gunakan path relatif ke static folder
    return handleSuccess(res, { url: publicUrl });
  } catch (error) {
    console.error("Server error:", error);
    return handleFailed(res, "Unable to upload file", 500);
  }
};

const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return handleFailed(res, "No file uploaded", 400);
    }

    const resumesDir = path.join(__dirname, "../uploads/jobspark/resumes");
    ensureDirectoryExistence(resumesDir);

    const filename = `${Date.now()}-${req.file.originalname}`;
    const filePath = path.join(resumesDir, filename);

    fs.writeFileSync(filePath, req.file.buffer);

    const publicUrl = `/uploads/jobspark/resumes/${filename}`;
    return handleSuccess(res, { url: publicUrl });
  } catch (error) {
    console.error("Server error:", error);
    return handleFailed(res, "Unable to upload file", 500);
  }
};

module.exports = {
  uploadFile,
  uploadResume,
};
