const express = require("express");
const router = express.Router();
const { auth } = require("../utils/helper");
const jobsController = require("../controllers/jobs");

router.get("/", jobsController.getJobs);
router.get("/:id", auth, jobsController.getJobDetail);
router.post("/apply", auth, jobsController.applyJob);

// admin
router.get("/admin/list", auth, jobsController.getJobAdmin);
router.get("/admin/detail/:id", auth, jobsController.getJobDetailAdmin);
router.post("/admin/insert", auth, jobsController.insertJobAdmin);
router.delete("/admin/delete/:id", auth, jobsController.deleteJobAdmin);
router.put("/admin/application/status", auth, jobsController.setStatusJobApplicationAdmin);
// admin

module.exports = router;