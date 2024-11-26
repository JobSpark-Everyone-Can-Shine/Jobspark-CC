const { handleSuccess, handleFailed } = require("../utils/helper");
const pool = require("../models/db");

async function getSavedJobsList(_req, res) {
  try {
    const savedJobs = await pool.query(`SELECT a.id, a.jobs_id, 
      b.job_name, b.image, b.company_name, b.location, b.position, b.job_type, b.salary 
      FROM saved_jobs a inner join jobs b on a.jobs_id = b.id`);

    if (savedJobs.rows.length === 0) {
      return handleFailed(res, "No saved jobs found", 404, []);
    }

    handleSuccess(res, savedJobs.rows);
  } catch (err) {
    console.error(err.message);
    return handleFailed(res);
  }
}


async function postSavedJobs(req, res) {
  try {
    const user_id = req.user.id;
    const { jobs_id } = req.body;



    const jobExists = await pool.query("SELECT * FROM jobs WHERE id = $1", [
      jobs_id,
    ]);

    if (jobExists.rows.length === 0) {
      return handleFailed(res, "Job not found", 404);
    }


    const existingApplication = await pool.query(
      "SELECT * FROM saved_jobs WHERE user_id = $1 AND jobs_id = $2",
      [user_id, jobs_id]
    );

    if (existingApplication.rows.length > 0) {
      return handleFailed(res, "You have already Saved to this job", 400);
    }



    await pool.query(
      `INSERT INTO saved_jobs (jobs_id, user_id)  
      VALUES ($1, $2);`,
      [jobs_id, user_id]
    );

    console.log(3)

    handleSuccess(res);
  } catch (err) {
    console.error(err.message);
    return handleFailed(res);
  }
}



const deleteSavedJobs = async (req, res) => {
  try {
    const { id } = req.body;

    const savedJobs = await pool.query(
      `SELECT * FROM saved_jobs
       WHERE id = $1`,
      [id]
    );

    if (savedJobs.rows.length === 0) {
      return handleFailed(res, "Job not found", 404);
    }


    await pool.query(
      `DELETE FROM saved_jobs
       WHERE id = $1`,
      [id]
    );

    handleSuccess(res, { message: "Job deleted successfully" });
  } catch (error) {
    console.error("Error deleting job:", error);
    return handleFailed(res, "Internal server error", 500);
  }
};


module.exports = {
  getSavedJobsList,
  postSavedJobs,
  deleteSavedJobs
}