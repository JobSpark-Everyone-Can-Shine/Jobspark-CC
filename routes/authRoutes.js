const express = require("express");
const router = express.Router();
const {
  registerValidation,
  loginValidation,
  auth,
  registerAdminValidation,
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
router.get("/company/list", auth, authController.getCompanyList);
router.post("/superAdmin/registerAdmin", auth, registerAdminValidation, authController.registerCompany);
router.get("/superAdmin/company/detail/:id", auth, authController.detailCompanyAdmin)
router.put("/superAdmin/updateCompanyDetail/:id", auth, registerAdminValidation, authController.updateCompanyDetail);
router.delete("/superAdmin/deleteCompany/:id", auth, authController.deleteCompanyAdmin);

  
module.exports = router;
