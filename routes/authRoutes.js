const express = require("express");
const router = express.Router();
const {
  registerValidation,
  loginValidation,
  auth,
} = require("../utils/helper");
const authController = require("../controllers/auth");

// Auth routes
router.post("/register", registerValidation, authController.register);
router.post("/login", loginValidation, authController.login);
router.get("/logout", authController.logout);
router.get("/profile", auth, authController.getProfile);
router.put("/profile/about", auth, authController.updateAbout);
router.post("/profile/work-experience", auth, authController.insertUserWorkExperience);
router.put("/profile/password", auth, authController.updatePassword);

module.exports = router;

module.exports = router;
