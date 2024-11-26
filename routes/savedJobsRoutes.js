const express = require("express");
const router = express.Router();
const { auth } = require("../utils/helper");
const savedJobsController = require("../controllers/savedJobs");

router.get("/", auth, savedJobsController.getSavedJobsList);
router.post(
    "/",
    auth,
    savedJobsController.postSavedJobs
  );
  router.delete("/", auth, savedJobsController.deleteSavedJobs);


module.exports = router;