const express = require("express");
const router = express.Router();
const { auth } = require("../utils/helper");
const healthConController = require("../controllers/healthCon");

router.get("/", auth, healthConController.healthCon);

module.exports = router;


