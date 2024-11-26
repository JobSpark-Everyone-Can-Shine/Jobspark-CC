const express = require("express");
const router = express.Router();
const hobbyController = require("../controllers/hobby");

router.get("/", hobbyController.getHobby);

module.exports = router;