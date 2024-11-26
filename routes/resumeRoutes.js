const express = require("express");
const router = express.Router();
const { uploadPdf } = require("../config/multer");
const {
  handleUploadResumeError,
} = require("../middlewares/uploadErrorHandler");
const resumeController = require("../controllers/resume");
const { auth } = require("../utils/helper");

router.post(
  "/upload",
  auth,
  uploadPdf.single("file"),
  handleUploadResumeError,
  resumeController.uploadResume
);

// kalau ada kebutuhan bisa dinyalakan
// router.get("/", auth, resumeController.getResumes);
// router.get("/:id", auth, resumeController.getResumeById);
// router.delete("/:id", auth, resumeController.deleteResume);

module.exports = router;
