const express = require("express");
const router = express.Router();
const { upload } = require("../config/multer");
const { handleUploadError } = require("../middlewares/uploadErrorHandler");
const { uploadFile } = require("../controllers/upload");

router.post("/", upload.single("file"), handleUploadError, uploadFile);

module.exports = router;
