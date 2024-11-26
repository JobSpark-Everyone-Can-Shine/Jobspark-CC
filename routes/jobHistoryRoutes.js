const express = require("express");
const router = express.Router();
const { auth } = require("../utils/helper");
const jobHistoryController = require("../controllers/jobHistory");

router.get("/", auth, jobHistoryController.getHJobHist);
router.get("/:id", auth, jobHistoryController.getJoHistbDetail);

module.exports = router;