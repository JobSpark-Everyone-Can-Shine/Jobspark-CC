// controllers/resumeController.js
const { handleSuccess, handleFailed, formatBytes } = require("../utils/helper");
const pool = require("../models/db");
const { bucket, bucketName } = require("../config/storage");


const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return handleFailed(res, "No file uploaded", 400);
    }

    if (req.file.mimetype !== "application/pdf") {
      return handleFailed(res, "Only PDF files are allowed", 400);
    }

    const formattedSize = formatBytes(req.file.size);

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
      return handleFailed(res, "Unable to upload file", 500);
    });

    blobStream.on("finish", async () => {
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${destinationPath}`;

      try {
        const newResume = await pool.query(
          `INSERT INTO resume (
            file_size, 
            file_path, 
            resume_name
          ) 
          VALUES ($1, $2, $3) 
          RETURNING *`,
          [formattedSize, publicUrl, req.file.originalname]
        );

        handleSuccess(res, {
          id: newResume.rows[0].id,
          url: publicUrl,
          fileName: req.file.originalname,
          fileSize: formattedSize,
          createdAt: newResume.rows[0].created_at,
        });
      } catch (dbError) {
        console.error("Database error:", dbError);
        try {
          await blob.delete();
        } catch (deleteError) {
          console.error(
            "Error deleting file after failed db insert:",
            deleteError
          );
        }

        return handleFailed(res, "Failed to save resume information", 500);
      }
    });

    blobStream.end(req.file.buffer);
  } catch (error) {
    console.error("Server error:", error);
    handleFailed(res);
  }
};

const getResumes = async (req, res) => {
  try {
    const resumes = await pool.query(
      `SELECT * FROM resume 
       ORDER BY created_at DESC`
    );

    if (resumes.rows.length === 0) {
      return handleFailed(res, "No resumes found", 404);
    }

    handleSuccess(res, resumes.rows);
  } catch (error) {
    console.error("Error fetching resumes:", error);
    handleFailed(res);
  }
};

const getResumeById = async (req, res) => {
  try {
    const { id } = req.params;

    const resume = await pool.query(
      `SELECT * FROM resume 
       WHERE id = $1`,
      [id]
    );

    if (resume.rows.length === 0) {
      return handleFailed(res, "Resume not found", 404);
    }

    handleSuccess(res, resume.rows[0]);
  } catch (error) {
    console.error("Error fetching resume:", error);
    handleFailed(res);
  }
};

const deleteResume = async (req, res) => {
  try {
    const { id } = req.params;

    const resume = await pool.query(
      `SELECT * FROM resume 
       WHERE id = $1`,
      [id]
    );

    if (resume.rows.length === 0) {
      return handleFailed(res, "Resume not found", 404);
    }

    const filePath = resume.rows[0].file_path;
    const fileName = filePath.split("/").pop();
    const file = bucket.file(`jobspark/resumes/${fileName}`);

    try {
      await file.delete();
    } catch (deleteError) {
      console.error("Error deleting file from storage:", deleteError);
    }

    await pool.query(
      `DELETE FROM resume 
       WHERE id = $1`,
      [id]
    );

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
