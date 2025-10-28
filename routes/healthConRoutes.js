const express = require("express");
const router = express.Router();
const { auth } = require("../utils/helper");
const healthConController = require("../controllers/healthCon");

router.get("/", auth, healthConController.healthCon);
router.get("/getChat", healthConController.getChat);
router.post("/postChat", healthConController.postChat);

module.exports = router;


