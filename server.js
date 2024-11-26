const express = require('express');
const cors = require('cors');
const auth = require("./routes/authRoutes");
const upload = require("./routes/uploadRoutes");
const hobby = require("./routes/hobbyRoutes");
const specialAbility = require("./routes/specialAbilityRoutes");
const healthCon = require("./routes/healthConRoutes");
const jobs = require("./routes/jobsRoutes");
const resume = require("./routes/resumeRoutes");
const savedJobs = require("./routes/savedJobsRoutes");
const jobHistory = require("./routes/jobHistoryRoutes");


const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const apiRouter = express.Router();

// list route
apiRouter.use("/auth", auth);
apiRouter.use("/upload", upload);
apiRouter.use("/resume", resume);
apiRouter.use("/hobby", hobby);
apiRouter.use("/specialAbility", specialAbility);
apiRouter.use("/healthCon", healthCon);
apiRouter.use("/jobs", jobs);
apiRouter.use("/savedJobs", savedJobs);
apiRouter.use("/jobHistory", jobHistory);
// list route



app.use("/api", apiRouter);



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});