const express = require("express");
const router = express.Router();
const { auth } = require("../utils/helper");
const jobsController = require("../controllers/jobs");

router.get("/", jobsController.getJobs);
router.get("/:id", auth, jobsController.getJobDetail);
router.post("/apply", auth, jobsController.applyJob);


module.exports = router;