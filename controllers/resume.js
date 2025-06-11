const fs = require("fs");
const path = require("path");
const { handleSuccess, handleFailed, formatBytes } = require("../utils/helper");
const pool = require("../models/db");

const UPLOAD_DIR = path.join(__dirname, "../public/uploads/jobspark/resumes");

const ensureDirectoryExistence = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const uploadResume = async (req, res) => {
  try {
    const baseUrl = req.protocol + "://" + req.get("host");
    if (!req.file) {
      return handleFailed(res, "No file uploaded", 400);
    }

    if (req.file.mimetype !== "application/pdf") {
      return handleFailed(res, "Only PDF files are allowed", 400);
    }

    ensureDirectoryExistence(UPLOAD_DIR);

    const formattedSize = formatBytes(req.file.size);
    const filename = `${Date.now()}-${req.file.originalname}`;
    const filePath = path.join(UPLOAD_DIR, filename);
    const publicUrl = `${baseUrl}/public/uploads/jobspark/resumes/${filename}`; // relative URL for client access

    fs.writeFileSync(filePath, req.file.buffer);

    const [result] = await pool.query(
      `INSERT INTO resume (
        file_size, 
        file_path, 
        resume_name
      ) VALUES (?, ?, ?)`,
      [formattedSize, publicUrl, req.file.originalname]
    );

    const [newResumeRows] = await pool.query(
      `SELECT * FROM resume WHERE id = ?`,
      [result.insertId]
    );

    const newResume = newResumeRows[0];

    handleSuccess(res, {
      id: newResume.id,
      url: newResume.file_path,
      fileName: newResume.resume_name,
      fileSize: newResume.file_size,
      createdAt: newResume.created_at,
    });
  } catch (error) {
    console.error("Server error:", error);
    handleFailed(res, "Unable to upload resume", 500);
  }
};

const getResumes = async (req, res) => {
  try {
    const [resumes] = await pool.query(
      `SELECT * FROM resume ORDER BY created_at DESC`
    );

    if (resumes.length === 0) {
      return handleFailed(res, "No resumes found", 404);
    }

    handleSuccess(res, resumes);
  } catch (error) {
    console.error("Error fetching resumes:", error);
    handleFailed(res);
  }
};

const getResumeById = async (req, res) => {
  try {
    const { id } = req.params;
    const [resumeRows] = await pool.query(`SELECT * FROM resume WHERE id = ?`, [
      id,
    ]);

    if (resumeRows.length === 0) {
      return handleFailed(res, "Resume not found", 404);
    }

    handleSuccess(res, resumeRows[0]);
  } catch (error) {
    console.error("Error fetching resume:", error);
    handleFailed(res);
  }
};

const deleteResume = async (req, res) => {
  try {
    const { id } = req.params;

    const [resumeRows] = await pool.query(`SELECT * FROM resume WHERE id = ?`, [
      id,
    ]);

    if (resumeRows.length === 0) {
      return handleFailed(res, "Resume not found", 404);
    }

    const filePath = path.join(__dirname, "../", resumeRows[0].file_path);
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error("Error deleting local file:", err);
    }

    await pool.query(`DELETE FROM resume WHERE id = ?`, [id]);

    handleSuccess(res, { message: "Resume deleted successfully" });
  } catch (error) {
    console.error("Error deleting resume:", error);
    handleFailed(res);
  }
};

module.exports = {
  uploadResume,
  getResumes,
  getResumeById,
  deleteResume,
};
